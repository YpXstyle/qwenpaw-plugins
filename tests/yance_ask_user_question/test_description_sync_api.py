# -*- coding: utf-8 -*-
"""Prove description synchronization uses the public host transaction API.

Real FastAPI authentication, PluginApi route registration, configuration
models, locks and durable writes run against temporary agent profiles. The
workspace manager only resolves identities; no agent or model is started.
"""
# pylint: disable=protected-access,redefined-outer-name

from __future__ import annotations

import asyncio
import copy
import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest
from agentscope.message import ToolResultState
from fastapi import FastAPI

from qwenpaw.app import agent_context, auth
from qwenpaw.app.approvals import ApprovalService
from qwenpaw.app import utils as app_utils
from qwenpaw.config import config as host_config
from qwenpaw.config import utils as config_utils
from qwenpaw.config.config import (
    AgentProfileConfig,
    AgentProfileRef,
    BuiltinToolConfig,
    ToolsConfig,
    load_agent_config_async,
    save_agent_config,
    update_agent_config_async,
)
from qwenpaw.exceptions import AgentConfigConflictError
from qwenpaw.plugins.api import PluginApi
from qwenpaw.plugins.registry import PluginRegistry
from qwenpaw.runtime.hooks import HookContext

pytestmark = [pytest.mark.integration, pytest.mark.p1]

TOOL_NAME = "yance_ask_user_question"
OTHER_TOOL = "description_sync_sentinel"
CHINESE_DESCRIPTION = "在控制台对话中提出结构化问题，等待用户回答后继续当前任务。"
SECRET_SENTINEL = "synthetic-description-sync-secret-not-a-real-credential"
PREFIX = "/api/yance-ask-user-question"
QUESTIONS = [
    {
        "question": "Which scope?",
        "header": "Scope",
        "options": [
            {"label": "Code", "description": "Update the code."},
            {"label": "Docs", "description": "Update documentation."},
        ],
        "multi_select": False,
    },
]


@pytest.fixture
def plugin_module(monkeypatch):
    entry = (
        Path(__file__).resolve().parents[2]
        / "plugins/tool/yance-ask-user-question/backend/plugin.py"
    )
    name = "yance_description_sync_fixture"
    spec = importlib.util.spec_from_file_location(name, entry)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    monkeypatch.setitem(sys.modules, name, module)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
async def description_api(monkeypatch, tmp_path, plugin_module):
    references = {
        agent_id: AgentProfileRef(
            id=agent_id,
            workspace_dir=str(tmp_path / agent_id),
        )
        for agent_id in ("sync-alpha", "sync-beta")
    }
    root = SimpleNamespace(
        agents=SimpleNamespace(
            profiles=references,
            active_agent="sync-alpha",
        ),
    )
    monkeypatch.setattr(config_utils, "load_config", lambda: root)
    monkeypatch.setattr(agent_context, "load_config", lambda: root)
    monkeypatch.setattr(config_utils, "_agent_config_cache", {})
    for agent_id, enabled in (("sync-alpha", False), ("sync-beta", True)):
        workspace = Path(references[agent_id].workspace_dir)
        workspace.mkdir()
        profile = AgentProfileConfig(
            id=agent_id,
            name=f"Agent {agent_id}",
            description="Unrelated agent description",
            workspace_dir=str(workspace),
            tools=ToolsConfig(
                builtin_tools={
                    TOOL_NAME: BuiltinToolConfig(
                        name=TOOL_NAME,
                        enabled=enabled,
                        description="Previous English tool description",
                        async_execution=True,
                        icon="❓",
                        config={
                            "password": SECRET_SENTINEL,
                            "nested": {"preserve": [agent_id, 1, False]},
                        },
                    ),
                    OTHER_TOOL: BuiltinToolConfig(
                        name=OTHER_TOOL,
                        enabled=not enabled,
                        description="Preserve the other tool",
                        config={"token": SECRET_SENTINEL},
                    ),
                },
            ),
        )
        save_agent_config(agent_id, profile)

    monkeypatch.setenv("QWENPAW_AUTH_ENABLED", "true")
    monkeypatch.setattr(
        auth,
        "_load_auth_data",
        lambda: {
            "jwt_secret": "description-sync-test-only-signing-secret",
            "user": {"username": "description-sync-test-user"},
            "revoked_tokens_meta": {},
        },
    )
    monkeypatch.setattr(
        auth,
        "_get_config_cached",
        lambda: (
            SimpleNamespace(
                security=SimpleNamespace(allow_no_auth_hosts=[]),
            ),
            [],
        ),
    )
    reloads = []
    monkeypatch.setattr(
        app_utils,
        "schedule_agent_reload",
        lambda *_args, **_kwargs: reloads.append(True),
    )

    async def get_workspace(agent_id):
        return SimpleNamespace(agent_id=agent_id)

    app = FastAPI()
    app.state.multi_agent_manager = SimpleNamespace(get_agent=get_workspace)
    app.add_middleware(auth.AuthMiddleware)
    monkeypatch.setattr(PluginRegistry, "_instance", None)
    registry = PluginRegistry()
    registry.set_plugin_http_app(app)
    api = PluginApi(
        "yance-ask-user-question",
        config={},
        manifest={"description": CHINESE_DESCRIPTION},
    )
    api.set_registry(registry)
    service = ApprovalService()
    plugin = plugin_module.YanceAskUserQuestionPlugin(
        service=service,
        timeout_seconds=60,
    )
    plugin.register(api)
    token = auth.create_token("description-sync-test-user")
    transport = httpx.ASGITransport(app=app, client=("198.51.100.23", 30414))
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://description-sync-test.invalid",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Agent-Id": "sync-alpha",
        },
    ) as client:
        yield SimpleNamespace(
            client=client,
            references=references,
            module=plugin_module,
            plugin=plugin,
            service=service,
            reloads=reloads,
            directory=tmp_path,
        )
    await plugin.close()


async def _current_description(bridge, agent_id="sync-alpha"):
    response = await bridge.client.get(
        PREFIX + "/description-sync",
        params={"agent_id": agent_id},
        headers={"X-Agent-Id": agent_id},
    )
    assert response.status_code == 200
    return response.json()


@pytest.mark.parametrize("agent_id", ["sync-alpha", "sync-beta"])
async def test_sync_preserves_switches_secrets_other_tools_and_agents(
    description_api,
    agent_id,
):
    before = {
        key: (await load_agent_config_async(key)).model_dump()
        for key in description_api.references
    }
    info = await _current_description(description_api, agent_id)
    assert set(info) == {
        "agent_id",
        "current_description",
        "target_description",
    }
    assert SECRET_SENTINEL not in str(info)
    assert info["target_description"] == CHINESE_DESCRIPTION
    response = await description_api.client.post(
        PREFIX + "/description-sync",
        headers={"X-Agent-Id": agent_id},
        json={
            "agent_id": agent_id,
            "expected_description": info["current_description"],
        },
    )
    assert response.status_code == 200
    assert response.json() == {
        "agent_id": agent_id,
        "current_description": CHINESE_DESCRIPTION,
        "target_description": CHINESE_DESCRIPTION,
    }
    for key in before:
        expected = copy.deepcopy(before[key])
        if key == agent_id:
            expected["tools"]["builtin_tools"][TOOL_NAME][
                "description"
            ] = CHINESE_DESCRIPTION
        actual = await load_agent_config_async(key)
        assert actual.model_dump() == expected
    assert description_api.reloads == []


async def test_atomic_sync_preserves_a_concurrent_configuration_update(
    description_api,
):
    info = await _current_description(description_api)

    def edit_other_fields(profile):
        own = profile.tools.builtin_tools[TOOL_NAME]
        own.enabled = True
        own.config["concurrent"] = {"value": SECRET_SENTINEL}
        profile.tools.builtin_tools[OTHER_TOOL].description = "Concurrent edit"
        profile.description = "A concurrently edited agent description"

    response, _ = await asyncio.gather(
        description_api.client.post(
            PREFIX + "/description-sync",
            json={
                "agent_id": "sync-alpha",
                "expected_description": info["current_description"],
            },
        ),
        update_agent_config_async("sync-alpha", edit_other_fields),
    )
    assert response.status_code == 200
    actual = await load_agent_config_async("sync-alpha")
    own = actual.tools.builtin_tools[TOOL_NAME]
    assert own.description == CHINESE_DESCRIPTION
    assert own.enabled is True
    assert own.config["password"] == SECRET_SENTINEL
    assert own.config["concurrent"] == {"value": SECRET_SENTINEL}
    assert (
        actual.tools.builtin_tools[OTHER_TOOL].description == "Concurrent edit"
    )
    assert actual.description == "A concurrently edited agent description"
    assert description_api.reloads == []


async def test_description_drift_returns_conflict_without_overwriting(
    description_api,
):
    info = await _current_description(description_api)

    def change_description(profile):
        profile.tools.builtin_tools[TOOL_NAME].description = "Another edit"

    await update_agent_config_async("sync-alpha", change_description)
    before = (await load_agent_config_async("sync-alpha")).model_dump()
    response = await description_api.client.post(
        PREFIX + "/description-sync",
        json={
            "agent_id": "sync-alpha",
            "expected_description": info["current_description"],
        },
    )
    assert response.status_code == 409
    assert (await load_agent_config_async("sync-alpha")).model_dump() == before
    assert description_api.reloads == []


@pytest.mark.parametrize("method", ["GET", "POST"])
async def test_agent_scope_mismatch_cannot_update_another_agent(
    description_api,
    method,
):
    before = (await load_agent_config_async("sync-beta")).model_dump()
    kwargs = (
        {"params": {"agent_id": "sync-beta"}}
        if method == "GET"
        else {
            "json": {
                "agent_id": "sync-beta",
                "expected_description": "Previous English tool description",
            },
        }
    )
    response = await description_api.client.request(
        method,
        PREFIX + "/description-sync",
        **kwargs,
    )
    assert response.status_code == 403
    assert (await load_agent_config_async("sync-beta")).model_dump() == before


@pytest.mark.parametrize("authorization", ["", "Bearer invalid-token"])
@pytest.mark.parametrize("method", ["GET", "POST"])
async def test_sync_uses_host_authentication(
    description_api,
    authorization,
    method,
):
    before = (await load_agent_config_async("sync-alpha")).model_dump()
    kwargs = (
        {"params": {"agent_id": "sync-alpha"}}
        if method == "GET"
        else {
            "json": {
                "agent_id": "sync-alpha",
                "expected_description": "Previous English tool description",
            },
        }
    )
    response = await description_api.client.request(
        method,
        PREFIX + "/description-sync",
        headers={"Authorization": authorization},
        **kwargs,
    )
    assert response.status_code == 401
    assert (await load_agent_config_async("sync-alpha")).model_dump() == before


@pytest.mark.parametrize("method", ["GET", "POST"])
async def test_host_configuration_conflict_maps_to_409(
    description_api,
    monkeypatch,
    method,
):
    async def conflict(*_args):
        raise AgentConfigConflictError("sync-alpha")

    monkeypatch.setattr(
        description_api.module,
        (
            "load_agent_config_async"
            if method == "GET"
            else "update_agent_config_async"
        ),
        conflict,
    )
    kwargs = (
        {"params": {"agent_id": "sync-alpha"}}
        if method == "GET"
        else {
            "json": {
                "agent_id": "sync-alpha",
                "expected_description": "Previous English tool description",
            },
        }
    )
    response = await description_api.client.request(
        method,
        PREFIX + "/description-sync",
        **kwargs,
    )
    assert response.status_code == 409
    assert description_api.reloads == []


@pytest.mark.parametrize("method", ["GET", "POST"])
async def test_missing_tool_returns_404(description_api, monkeypatch, method):
    # Model defaults must not re-add the deliberately absent test tool.
    monkeypatch.setattr(host_config, "_default_builtin_tools", dict)

    def remove_tool(profile):
        profile.tools.builtin_tools.pop(TOOL_NAME)

    await update_agent_config_async("sync-alpha", remove_tool)
    kwargs = (
        {"params": {"agent_id": "sync-alpha"}}
        if method == "GET"
        else {
            "json": {
                "agent_id": "sync-alpha",
                "expected_description": "Previous English tool description",
            },
        }
    )
    response = await description_api.client.request(
        method,
        PREFIX + "/description-sync",
        **kwargs,
    )
    assert response.status_code == 404


async def test_client_cannot_choose_the_tool_or_target_description(
    description_api,
):
    before = (await load_agent_config_async("sync-alpha")).model_dump()
    response = await description_api.client.post(
        PREFIX + "/description-sync",
        json={
            "agent_id": "sync-alpha",
            "expected_description": "Previous English tool description",
            "tool_name": OTHER_TOOL,
            "target_description": "Untrusted replacement",
        },
    )
    assert response.status_code == 422
    assert (await load_agent_config_async("sync-alpha")).model_dump() == before


async def test_sync_does_not_interrupt_an_existing_question(
    description_api,
    monkeypatch,
):
    created = asyncio.Event()
    original_create = description_api.service.create_pending_summary
    pending_requests = []

    async def create_and_signal(**kwargs):
        pending = await original_create(**kwargs)
        pending_requests.append(pending)
        created.set()
        return pending

    monkeypatch.setattr(
        description_api.service,
        "create_pending_summary",
        create_and_signal,
    )
    context = HookContext(
        request=SimpleNamespace(
            user_id="description-sync-test-user",
            channel="console",
            source="console",
            request_context={description_api.module.UI_MARKER_KEY: "1"},
        ),
        session_id="description-sync-session",
        root_session_id="description-sync-session",
        agent_id="sync-alpha",
        root_agent_id="sync-alpha",
        workspace_dir=description_api.directory,
        workspace=None,
        app_services=None,
    )
    task = asyncio.create_task(
        description_api.plugin.ask(copy.deepcopy(QUESTIONS), context),
    )
    try:
        await asyncio.wait_for(created.wait(), 2)
        pending = pending_requests[0]
        info = await _current_description(description_api)
        response = await description_api.client.post(
            PREFIX + "/description-sync",
            json={
                "agent_id": "sync-alpha",
                "expected_description": info["current_description"],
            },
        )
        assert response.status_code == 200
        assert not task.done()
        assert await description_api.service.get_request(pending.request_id)
        answer = await description_api.client.post(
            PREFIX + "/answer",
            json={
                "request_id": pending.request_id,
                "session_id": context.session_id,
                "answers": [
                    {
                        "question": QUESTIONS[0]["question"],
                        "selected": ["Code"],
                        "other": None,
                    },
                ],
            },
        )
        assert answer.status_code == 200
        result = await asyncio.wait_for(task, 2)
        assert result.state == ToolResultState.SUCCESS
        assert result.metadata["answers"][0]["selected"] == ["Code"]
        assert description_api.reloads == []
    finally:
        await description_api.plugin.close()
        if not task.done():
            task.cancel()
        await asyncio.gather(task, return_exceptions=True)
