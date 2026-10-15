# -*- coding: utf-8 -*-
"""Prove the plugin contracts against an unmodified, governed host."""
# pylint: disable=protected-access,redefined-outer-name,not-callable

import asyncio
import copy
import importlib.util
import json
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import httpx
import jsonschema
import pytest
from agentscope.agent import Agent, ContextConfig, ReActConfig
from agentscope.formatter import OpenAIChatFormatter
from agentscope.message import (
    TextBlock,
    ToolCallBlock,
    ToolResultBlock,
    ToolResultState,
    UserMsg,
)
from agentscope.model import ChatModelBase, ChatResponse
from agentscope.permission import PermissionBehavior, PermissionDecision
from agentscope.tool import (
    AskUser,
    AskUserParams,
    FunctionTool,
    ToolChunk,
    Toolkit,
)
from fastapi import FastAPI

from qwenpaw.app.approvals import ApprovalService
from qwenpaw.governance import (
    GovernanceAction,
    GovernanceDecision,
    PolicyGuardedTool,
    tool_adapter,
)
from qwenpaw.governance.tool_registry import DEFAULT_REGISTRY
from qwenpaw.plugins import api as plugin_api_module
from qwenpaw.plugins.api import PluginApi
from qwenpaw.plugins.registry import PluginRegistry
from qwenpaw.runtime.hooks import HookRegistry
from qwenpaw.runtime.phases import Phase
from qwenpaw.runtime.tool_registry import ToolRegistry
from qwenpaw.security.tool_guard.approval import ApprovalDecision
from qwenpaw.tool_calls import (
    ToolCallContext,
    reset_call_context,
    set_call_context,
)


QUESTIONS = [
    {
        "question": "Which route should we take?",
        "header": "Route",
        "context": "Compare the two routes before continuing.",
        "multi_select": False,
        "options": [
            {"label": "Short", "description": "Less time", "preview": "A"},
            {"label": "Scenic", "description": "More views", "preview": "B"},
        ],
    },
]


class RecordingModel(ChatModelBase):
    """Deterministic model boundary; no provider or network is contacted."""

    def __init__(self, tool_name=None, questions=None):
        super().__init__(
            credential=None,
            model="plugin-contract-proof",
            parameters=self.Parameters(),
            stream=False,
            max_retries=0,
        )
        self.tool_name = tool_name
        self.formatter = OpenAIChatFormatter()
        self.questions = questions
        self.requests = []

    async def _call_api(self, model_name, messages, tools=None, **kwargs):
        del model_name, kwargs
        self.requests.append(
            copy.deepcopy({"messages": messages, "tools": tools}),
        )
        if self.tool_name and len(self.requests) == 1:
            return ChatResponse(
                content=[
                    ToolCallBlock(
                        id="preview-call",
                        name=self.tool_name,
                        input=json.dumps({"questions": self.questions}),
                    ),
                ],
                is_last=True,
            )
        return ChatResponse(
            content=[TextBlock(text="Continued in the same reply.")],
            is_last=True,
        )


@pytest.fixture
def preview(monkeypatch, tmp_path, request):
    path = (
        Path(__file__).resolve().parents[2]
        / "plugins/tool/yance-ask-user-question/backend/plugin.py"
    )
    name = "ask_user_preview_unit"
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    monkeypatch.setitem(sys.modules, name, module)
    spec.loader.exec_module(module)
    monkeypatch.setattr(PluginRegistry, "_instance", None)
    registry = PluginRegistry()
    hooks = HookRegistry()
    workspace = SimpleNamespace(
        agent_id="preview-agent",
        plugins=SimpleNamespace(
            hook_registry=hooks,
            tool_registry=ToolRegistry(),
        ),
    )
    registry.set_workspace_manager(
        SimpleNamespace(agents={workspace.agent_id: workspace}),
    )
    app = FastAPI()

    @app.middleware("http")
    async def trusted_console_fixture(request, call_next):
        # HTTP authentication is independently exercised in the integration
        # suite; here the fixture represents its already-authenticated result.
        request.state.user = {"username": "tester"}
        return await call_next(request)

    registry.set_plugin_http_app(app)
    service = ApprovalService()
    plugin = module.YanceAskUserQuestionPlugin(service, timeout_seconds=3)
    api = PluginApi(
        module.PLUGIN_ID,
        config={},
        manifest=getattr(request, "param", None),
    )
    api.set_registry(registry)
    # Do not write real agent configuration. The real tool/governance/runtime
    # registration, hook registry, middleware factory and router still run.
    monkeypatch.setattr(
        "qwenpaw.app.agent_context.get_current_agent_id",
        lambda: None,
    )
    plugin.register(api)
    for hook in registry.get_startup_hooks():
        hook.callback()
    context = SimpleNamespace(
        agent=None,
        extras={},
        session_id="preview-root",
        root_session_id="preview-root",
        agent_id="preview-agent",
        root_agent_id="preview-agent",
        request=SimpleNamespace(
            channel="console",
            user_id="tester",
            request_context={module.UI_MARKER_KEY: "1"},
        ),
    )
    yield SimpleNamespace(
        module=module,
        plugin=plugin,
        service=service,
        registry=registry,
        workspace=workspace,
        hooks=hooks,
        context=context,
        app=app,
        tmp_path=tmp_path,
    )
    plugin_api_module._unbridge_from_runtime(
        module.TOOL_NAME,
        module.yance_ask_user_question,
        registry,
    )
    plugin_api_module.release_tool_ownership_for_plugin(module.PLUGIN_ID)
    from qwenpaw.agents import tools

    if hasattr(tools, module.TOOL_NAME):
        delattr(tools, module.TOOL_NAME)
    if module.TOOL_NAME in tools.__all__:
        tools.__all__.remove(module.TOOL_NAME)


async def build_agent(
    preview,
    model,
    action=GovernanceAction.ALLOW,
    host_agent=False,
):
    governor = SimpleNamespace(
        policy=SimpleNamespace(execution_level="auto"),
        assert_policy=Mock(
            return_value=GovernanceDecision(action, "Proof policy"),
        ),
        audit=Mock(),
        add_approved_rule=AsyncMock(),
        workspace_dir=str(preview.tmp_path),
    )
    tool = PolicyGuardedTool(
        preview.module.yance_ask_user_question,
        governor=governor,
        request_context={
            "agent_id": "preview-agent",
            "session_id": "preview-root",
            "approval_level": "auto",
        },
    )
    middleware = [
        item.factory(preview.context, None)
        for item in preview.registry.get_middleware_factories()
    ]
    arguments = {
        "name": "Plugin proof",
        "system_prompt": "Use the preview tool if requested, then continue.",
        "model": model,
        "toolkit": Toolkit(tools=[tool]),
        "middlewares": middleware,
        "context_config": ContextConfig(compression_tool_enabled=False),
        "react_config": ReActConfig(max_iters=3),
    }
    if host_agent:
        from qwenpaw.agents.react_agent import QwenPawAgent
        from qwenpaw.config.config import AgentProfileConfig

        agent = QwenPawAgent(
            **arguments,
            agent_config=AgentProfileConfig(
                id="preview-agent",
                name="Plugin proof",
                language="en",
            ),
            workspace_dir=preview.tmp_path,
            governor=governor,
        )
    else:
        agent = Agent(**arguments)
    preview.context.agent = agent
    await preview.hooks.run(Phase.POST_AGENT_BUILD, preview.context)
    return agent, tool, governor


def model_results(model):
    return [
        block
        for message in model.requests[-1]["messages"]
        for block in message.get_content_blocks()
        if isinstance(block, ToolResultBlock)
    ]


async def test_framework_schema_reaches_the_actual_model_boundary(preview):
    model = RecordingModel()
    agent, tool, _ = await build_agent(preview, model)

    async def unrelated(value: str):
        return value

    sibling = FunctionTool(unrelated)
    sibling_schema = copy.deepcopy(sibling.input_schema)
    await agent.toolkit.add_tool(sibling)
    await preview.hooks.run(Phase.POST_AGENT_BUILD, preview.context)
    await agent.reply(UserMsg(name="tester", content="Show available tools."))
    function = next(
        item["function"]
        for item in model.requests[0]["tools"]
        if item["function"]["name"] == preview.module.TOOL_NAME
    )
    emitted = function["parameters"]
    expected = FunctionTool(
        preview.module.yance_ask_user_question,
        input_schema=AskUserParams,
    ).input_schema
    # Framework export removes presentation-only titles. Compare against its
    # own normalizer rather than maintaining a competing question schema.
    assert emitted == expected
    assert function["description"] == AskUser.description
    assert "(Recommended)" in function["description"]
    assert "place it first" in function["description"]
    assert tool.input_schema == AskUserParams.model_json_schema()
    assert emitted["properties"]["questions"]["minItems"] == 1
    assert emitted["properties"]["questions"]["maxItems"] == 4
    jsonschema.validate({"questions": QUESTIONS}, emitted)
    assert sibling.input_schema == sibling_schema
    assert tool.is_external_tool is False


@pytest.mark.parametrize(
    "preview,expected",
    [
        (
            {"description": "Structured questions for direct Console Chat."},
            "Structured questions for direct Console Chat.",
        ),
        (
            {"description": "提出结构化问题，等待用户回答后继续当前任务。"},
            "提出结构化问题，等待用户回答后继续当前任务。",
        ),
        (None, None),
        ({"description": "  "}, None),
        ({"description": {"en": "Not a normalized manifest"}}, None),
    ],
    indirect=["preview"],
)
async def test_registered_ui_description_does_not_replace_model_rules(
    preview,
    expected,
):
    descriptor = preview.module.yance_ask_user_question._tool_descriptor
    assert descriptor.description == (
        expected or preview.module.DEFAULT_DESCRIPTION
    )
    _, tool, _ = await build_agent(preview, RecordingModel())
    assert tool.description == AskUser.description
    assert tool.description != descriptor.description


@pytest.mark.parametrize("marker", [None, True, 1, "true", "", "0"])
async def test_missing_or_inexact_ui_readiness_never_queues(
    preview,
    monkeypatch,
    marker,
):
    """The readiness hint must be the frontend's exact string value."""
    route = preview.context.request.request_context
    if marker is None:
        route.pop(preview.module.UI_MARKER_KEY)
    else:
        route[preview.module.UI_MARKER_KEY] = marker
    pending = AsyncMock(wraps=preview.service.create_pending_summary)
    monkeypatch.setattr(preview.service, "create_pending_summary", pending)
    result = await asyncio.wait_for(
        preview.plugin.ask(QUESTIONS, preview.context),
        1,
    )
    assert result.state == ToolResultState.ERROR
    assert result.metadata == {}
    pending.assert_not_awaited()


@pytest.mark.parametrize("origin", ["agent-chat", "spawn"])
async def test_real_delegation_builders_cannot_inherit_ui_readiness(
    preview,
    monkeypatch,
    origin,
):
    """Even matching agent/session IDs cannot copy a parent's UI hint."""
    from qwenpaw.agents.tools import agent_management
    from qwenpaw.app import agent_context

    context = preview.context
    if origin == "agent-chat":
        _, payload, _ = agent_management.build_agent_chat_request(
            to_agent=context.agent_id,
            text="Ask a question on the target host.",
            session_id=context.session_id,
            from_agent=context.agent_id,
            root_session_id=context.session_id,
        )
        route = payload["request_context"]
    else:
        inherited = {
            **context.request.request_context,
            "root_session_id": context.session_id,
            "root_agent_id": context.agent_id,
            "user_id": "tester",
            "channel": "console",
        }
        monkeypatch.setattr(
            agent_context,
            "get_current_approval_route",
            lambda: inherited,
        )
        monkeypatch.setattr(
            agent_context,
            "get_current_session_id",
            lambda: context.session_id,
        )
        route = agent_management._build_spawn_request_context(context.agent_id)
    assert preview.module.UI_MARKER_KEY not in route
    context.request.request_context = route
    pending = AsyncMock(wraps=preview.service.create_pending_summary)
    monkeypatch.setattr(preview.service, "create_pending_summary", pending)
    result = await asyncio.wait_for(
        preview.plugin.ask(QUESTIONS, context),
        1,
    )
    assert result.state == ToolResultState.ERROR
    assert result.metadata == {}
    pending.assert_not_awaited()


@pytest.mark.parametrize("field", ["request", "request_context"])
@pytest.mark.parametrize("source", ["cron", "heartbeat"])
async def test_unattended_sources_never_queue_even_with_ui_hint(
    preview,
    monkeypatch,
    field,
    source,
):
    if field == "request":
        preview.context.request.source = source
    else:
        preview.context.request.request_context["source"] = source
    pending = AsyncMock(wraps=preview.service.create_pending_summary)
    monkeypatch.setattr(preview.service, "create_pending_summary", pending)
    result = await asyncio.wait_for(
        preview.plugin.ask(QUESTIONS, preview.context),
        1,
    )
    assert result.state == ToolResultState.ERROR
    assert result.metadata == {}
    pending.assert_not_awaited()


async def test_parallel_questions_in_one_session_only_create_one_pending(
    preview,
    monkeypatch,
):
    created = asyncio.Event()
    resume = asyncio.Event()
    second_started = asyncio.Event()
    pending_records = []
    original = preview.service.create_pending_summary

    async def paused_creation(**kwargs):
        pending = await original(**kwargs)
        pending_records.append(pending)
        created.set()
        await resume.wait()
        return pending

    async def second_question():
        second_started.set()
        return await preview.plugin.ask(QUESTIONS, preview.context)

    monkeypatch.setattr(
        preview.service,
        "create_pending_summary",
        paused_creation,
    )
    first = asyncio.create_task(
        preview.plugin.ask(QUESTIONS, preview.context),
    )
    second = None
    try:
        await asyncio.wait_for(created.wait(), 2)
        second = asyncio.create_task(second_question())
        await asyncio.wait_for(second_started.wait(), 2)
        resume.set()
        result = await asyncio.wait_for(second, 2)
        assert result.state == ToolResultState.ERROR
        assert result.metadata == {}
        assert len(pending_records) == 1
        assert not first.done()
        await preview.service.resolve_request(
            pending_records[0].request_id,
            ApprovalDecision.DENIED,
        )
        assert (
            await asyncio.wait_for(first, 2)
        ).state == ToolResultState.DENIED
    finally:
        resume.set()
        for task in (first, second):
            if task is not None and not task.done():
                task.cancel()
        await asyncio.gather(
            *(task for task in (first, second) if task is not None),
            return_exceptions=True,
        )
    assert not preview.plugin._records
    assert (
        await preview.service.get_all_pending_by_agent("preview-agent")
    ) == []


@pytest.mark.parametrize("lifecycle", ["close", "uninstall"])
async def test_shutdown_during_creation_cannot_leave_a_pending_question(
    preview,
    monkeypatch,
    lifecycle,
):
    created = asyncio.Event()
    resume = asyncio.Event()
    closing = asyncio.Event()
    pending_records = []
    original = preview.service.create_pending_summary

    async def paused_creation(**kwargs):
        pending = await original(**kwargs)
        pending_records.append(pending)
        created.set()
        await resume.wait()
        return pending

    async def stop_plugin():
        closing.set()
        if lifecycle == "uninstall":
            await preview.plugin.uninstall(preview.module.PLUGIN_ID, False)
        else:
            await preview.plugin.close()

    monkeypatch.setattr(
        preview.service,
        "create_pending_summary",
        paused_creation,
    )
    question = asyncio.create_task(
        preview.plugin.ask(QUESTIONS, preview.context),
    )
    shutdown = None
    try:
        await asyncio.wait_for(created.wait(), 2)
        shutdown = asyncio.create_task(stop_plugin())
        await asyncio.wait_for(closing.wait(), 2)
        resume.set()
        result, _ = await asyncio.wait_for(
            asyncio.gather(question, shutdown),
            2,
        )
        assert result.state == ToolResultState.ERROR
        assert result.metadata == {}
        retry = await asyncio.wait_for(
            preview.plugin.ask(QUESTIONS, preview.context),
            1,
        )
        assert retry.state == ToolResultState.ERROR
        assert len(pending_records) == 1
    finally:
        resume.set()
        for task in (question, shutdown):
            if task is not None and not task.done():
                task.cancel()
        await asyncio.gather(
            *(task for task in (question, shutdown) if task is not None),
            return_exceptions=True,
        )
    assert not preview.plugin._records
    assert (
        await preview.service.get_all_pending_by_agent("preview-agent")
    ) == []


async def test_tool_call_replay_is_rejected_within_its_turn(
    preview,
    monkeypatch,
):
    created = asyncio.Event()
    pending_records = []
    original = preview.service.create_pending_summary

    async def observe_creation(**kwargs):
        pending = await original(**kwargs)
        pending_records.append(pending)
        created.set()
        return pending

    monkeypatch.setattr(
        preview.service,
        "create_pending_summary",
        observe_creation,
    )
    call = ToolCallContext(
        tool_call_id="same-question-call",
        tool_name=preview.module.TOOL_NAME,
        session_id="preview-root",
        root_session_id="preview-root",
        agent_id="preview-agent",
        started_at=asyncio.get_running_loop().time(),
        offload_deadline=None,
        cancel_event=asyncio.Event(),
    )
    token = set_call_context(call)
    question = asyncio.create_task(
        preview.plugin.ask(QUESTIONS, preview.context),
    )
    try:
        await asyncio.wait_for(created.wait(), 2)
        await preview.service.resolve_request(
            pending_records[0].request_id,
            ApprovalDecision.DENIED,
        )
        assert (
            await asyncio.wait_for(question, 2)
        ).state == ToolResultState.DENIED
        replay = await asyncio.wait_for(
            preview.plugin.ask(QUESTIONS, preview.context),
            1,
        )
        assert replay.state == ToolResultState.ERROR
        assert replay.metadata == {}
        assert len(pending_records) == 1
    finally:
        reset_call_context(token)
        if not question.done():
            question.cancel()
        await asyncio.gather(question, return_exceptions=True)
    assert not preview.plugin._records


@pytest.mark.parametrize(
    "invalid",
    ["header", "description", "options", "batch"],
)
async def test_invalid_model_arguments_fail_before_execution(preview, invalid):
    questions = copy.deepcopy(QUESTIONS)
    if invalid == "header":
        questions[0]["header"] = "x" * 13
    elif invalid == "description":
        del questions[0]["options"][0]["description"]
    elif invalid == "options":
        questions[0]["options"] = questions[0]["options"][:1]
    else:
        questions *= 5
    model = RecordingModel(preview.module.TOOL_NAME, questions)
    agent, _, governor = await build_agent(preview, model)
    spy = Mock(wraps=preview.service.create_pending_summary)
    preview.service.create_pending_summary = spy
    await asyncio.wait_for(
        agent.reply(UserMsg(name="tester", content="Ask me.")),
        timeout=5,
    )
    assert model_results(model)[0].state == ToolResultState.ERROR
    governor.assert_policy.assert_not_called()
    spy.assert_not_called()


@pytest.mark.parametrize("duplicate", ["question", "option"])
async def test_framework_uniqueness_validation_is_preserved(
    preview,
    monkeypatch,
    duplicate,
):
    questions = copy.deepcopy(QUESTIONS)
    if duplicate == "question":
        questions.append(copy.deepcopy(questions[0]))
    else:
        questions[0]["options"][1]["label"] = "Short"
    model = RecordingModel(preview.module.TOOL_NAME, questions)
    agent, _, _ = await build_agent(preview, model)
    pending = AsyncMock(wraps=preview.service.create_pending_summary)
    monkeypatch.setattr(preview.service, "create_pending_summary", pending)
    await asyncio.wait_for(
        agent.reply(UserMsg(name="tester", content="Ask me.")),
        timeout=5,
    )
    assert model_results(model)[0].state == ToolResultState.ERROR
    pending.assert_not_awaited()


@pytest.mark.parametrize("denied", [False, True])
@pytest.mark.parametrize("host_agent", [False, True])
async def test_reply_waits_for_http_answer_then_continues(
    preview,
    monkeypatch,
    denied,
    host_agent,
):
    model = RecordingModel(preview.module.TOOL_NAME, QUESTIONS)
    agent, _, governor = await build_agent(
        preview,
        model,
        host_agent=host_agent,
    )
    secondary_approval = AsyncMock()
    monkeypatch.setattr(tool_adapter, "_ask_user_approval", secondary_approval)
    created = asyncio.Event()
    pending_records = []
    original = preview.service.create_pending_summary

    async def observe_pending(**kwargs):
        pending = await original(**kwargs)
        pending_records.append(pending)
        created.set()
        return pending

    monkeypatch.setattr(
        preview.service,
        "create_pending_summary",
        observe_pending,
    )
    task = asyncio.create_task(
        agent.reply(UserMsg(name="tester", content="Ask before continuing.")),
    )
    try:
        await asyncio.wait_for(created.wait(), timeout=5)
        assert not task.done()
        assert len(model.requests) == 1
        pending = pending_records[0]
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=preview.app),
            base_url="http://plugin-proof",
        ) as client:
            response = await client.post(
                "/api/yance-ask-user-question/answer",
                headers={"X-Agent-Id": "preview-agent"},
                json={
                    "request_id": pending.request_id,
                    "session_id": "preview-root",
                    "decision": "deny" if denied else "answer",
                    "answers": []
                    if denied
                    else [
                        {
                            "question": QUESTIONS[0]["question"],
                            "selected": ["Scenic"],
                            "other": None,
                        },
                    ],
                },
            )
        assert response.status_code == 200, response.text
        await asyncio.wait_for(task, timeout=5)
    finally:
        if not task.done():
            task.cancel()
        await asyncio.gather(task, return_exceptions=True)
    assert len(model.requests) == 2
    result = model_results(model)[0]
    assert result.state == (
        ToolResultState.DENIED if denied else ToolResultState.SUCCESS
    )
    assert result.metadata == (
        {}
        if denied
        else {
            "answers": [
                {
                    "question": QUESTIONS[0]["question"],
                    "selected": ["Scenic"],
                    "other": None,
                },
            ],
        }
    )
    governor.assert_policy.assert_called_once()
    secondary_approval.assert_not_awaited()
    governor.add_approved_rule.assert_not_awaited()
    assert not hasattr(pending, "answer")


async def test_plugin_cannot_execute_when_governance_denies(
    preview,
    monkeypatch,
):
    model = RecordingModel(preview.module.TOOL_NAME, QUESTIONS)
    agent, _, governor = await build_agent(
        preview,
        model,
        GovernanceAction.DENY,
    )
    ask = AsyncMock()
    monkeypatch.setattr(preview.plugin, "ask", ask)
    await asyncio.wait_for(
        agent.reply(UserMsg(name="tester", content="Ask me.")),
        5,
    )
    governor.assert_policy.assert_called_once()
    ask.assert_not_awaited()
    assert model_results(model)[0].state == ToolResultState.DENIED


async def test_other_tools_still_execute_their_original_handler(preview):
    model = RecordingModel("unrelated", QUESTIONS)
    agent, _, _ = await build_agent(preview, model)
    calls = []

    async def unrelated(questions: list[dict]):
        calls.append(questions)
        return ToolChunk(
            content=[TextBlock(text="Original handler ran.")],
            state=ToolResultState.SUCCESS,
        )

    await agent.toolkit.add_tool(
        FunctionTool(
            unrelated,
            permission=PermissionDecision(
                behavior=PermissionBehavior.ALLOW,
                message="Allow this independent control tool.",
            ),
        ),
    )
    await asyncio.wait_for(
        agent.reply(UserMsg(name="tester", content="Run it.")),
        5,
    )
    assert calls == [QUESTIONS]
    assert model_results(model)[0].state == ToolResultState.SUCCESS


@pytest.mark.parametrize("conflicting_registration", [False, True])
async def test_namespaced_tool_coexists_with_existing_ask_user_question(
    preview,
    monkeypatch,
    conflicting_registration,
):
    """Keep an unrelated AskUser contract intact in the same real registry."""
    from qwenpaw.agents import tools

    owner = "fixture-existing-question"
    calls = []

    async def ask_user_question(questions: str):
        """Keep the sentinel's own contract independent of AskUserParams."""
        calls.append(questions)
        return ToolChunk(
            content=[TextBlock(text="Existing question implementation ran.")],
            state=ToolResultState.SUCCESS,
            metadata={"existing_contract": True},
        )

    async def conflicting_tool(questions: str):
        return questions

    api = PluginApi(owner, config={})
    api.set_registry(preview.registry)
    api.register_tool(
        "ask_user_question",
        ask_user_question,
        tool_type="internal",
    )
    try:
        for hook in preview.registry.get_startup_hooks():
            if hook.plugin_id == owner:
                hook.callback()
        registry = preview.workspace.plugins.tool_registry
        existing = registry.get("ask_user_question")
        namespaced = registry.get(preview.module.TOOL_NAME)
        assert existing.func is ask_user_question
        assert namespaced.func is preview.module.yance_ask_user_question
        if conflicting_registration:
            collision = PluginApi("fixture-conflicting-question", config={})
            collision.set_registry(preview.registry)
            collision.register_tool(
                preview.module.TOOL_NAME,
                conflicting_tool,
                tool_type="internal",
            )
            for hook in preview.registry.get_startup_hooks():
                if hook.plugin_id == collision.plugin_id:
                    hook.callback()
            assert registry.get(preview.module.TOOL_NAME) is namespaced
            assert not hasattr(conflicting_tool, "_tool_descriptor")
        assert DEFAULT_REGISTRY.get_owner("ask_user_question") == owner
        assert (
            DEFAULT_REGISTRY.get_owner(preview.module.TOOL_NAME)
            == preview.module.PLUGIN_ID
        )
        assert getattr(tools, "ask_user_question") is ask_user_question
        assert (
            getattr(tools, preview.module.TOOL_NAME)
            is preview.module.yance_ask_user_question
        )
        model = RecordingModel("ask_user_question", "sentinel-only input")
        agent, own_tool, governor = await build_agent(preview, model)
        existing_tool = PolicyGuardedTool(existing.func, governor=governor)
        await agent.toolkit.add_tool(existing_tool)
        assert (
            await agent.toolkit.get_tool("ask_user_question")
        ) is existing_tool
        assert (
            await agent.toolkit.get_tool(preview.module.TOOL_NAME)
        ) is own_tool
        ask = AsyncMock(wraps=preview.plugin.ask)
        monkeypatch.setattr(preview.plugin, "ask", ask)
        await asyncio.wait_for(
            agent.reply(
                UserMsg(name="tester", content="Use the existing tool."),
            ),
            5,
        )
        assert calls == ["sentinel-only input"]
        assert model_results(model)[0].state == ToolResultState.SUCCESS
        assert model_results(model)[0].metadata == {"existing_contract": True}
        ask.assert_not_awaited()
    finally:
        plugin_api_module._unbridge_from_runtime(
            "ask_user_question",
            ask_user_question,
            preview.registry,
        )
        plugin_api_module.release_tool_ownership_for_plugin(owner)
        if getattr(tools, "ask_user_question", None) is ask_user_question:
            delattr(tools, "ask_user_question")
        if "ask_user_question" in tools.__all__:
            tools.__all__.remove("ask_user_question")


async def test_baseline_guard_would_escalate_a_plain_denied(monkeypatch):
    """Negative control: the result must not depend on the native PR fix."""
    secondary = AsyncMock(
        return_value=PermissionDecision(
            behavior=PermissionBehavior.DENY,
            message="Proof: no second permission may be granted.",
        ),
    )
    monkeypatch.setattr(tool_adapter, "_ask_user_approval", secondary)

    async def refuse():
        return ToolChunk(
            content=[TextBlock(text="The person declined.")],
            state=ToolResultState.DENIED,
        )

    governor = SimpleNamespace(audit=Mock())
    await PolicyGuardedTool(refuse, governor=governor)()
    secondary.assert_awaited_once()


async def test_registered_uninstall_callback_releases_pending_wait(
    preview,
    monkeypatch,
):
    created = asyncio.Event()
    pending_records = []
    original = preview.service.create_pending_summary

    async def observe_pending(**kwargs):
        pending = await original(**kwargs)
        pending_records.append(pending)
        created.set()
        return pending

    monkeypatch.setattr(
        preview.service,
        "create_pending_summary",
        observe_pending,
    )
    task = asyncio.create_task(preview.plugin.ask(QUESTIONS, preview.context))
    try:
        await asyncio.wait_for(created.wait(), timeout=5)
        callback = next(
            hook.callback
            for hook in preview.registry.get_uninstall_hooks()
            if hook.plugin_id == preview.module.PLUGIN_ID
        )
        await callback(plugin_id=preview.module.PLUGIN_ID, delete_files=True)
        result = await asyncio.wait_for(task, timeout=5)
    finally:
        if not task.done():
            task.cancel()
        await asyncio.gather(task, return_exceptions=True)
    assert result.state == ToolResultState.ERROR
    assert result.metadata == {}
    assert (
        await preview.service.get_request(pending_records[0].request_id)
        is None
    )
