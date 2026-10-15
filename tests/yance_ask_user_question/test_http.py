# -*- coding: utf-8 -*-
"""Prove plugin-owned HTTP answers resume the original approval wait."""
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
from agentscope.tool import AskUserMetadata
from fastapi import FastAPI

from qwenpaw.app import auth
from qwenpaw.app.approvals import ApprovalIdentityPolicy, ApprovalService
from qwenpaw.app.routers import approval as native_approval
from qwenpaw.plugins.api import PluginApi
from qwenpaw.plugins.registry import PluginRegistry
from qwenpaw.runtime.hooks import HookContext

pytestmark = [pytest.mark.integration, pytest.mark.p1]

AGENT_ID = "preview-http-agent"
ROOT_SESSION_ID = "preview-http-root"
USER_ID = "preview-http-user"
QUESTIONS = [
    {
        "question": "Which scope?",
        "header": "Scope",
        "context": "Choose the work to perform before continuing.",
        "options": [
            {"label": "Auth", "description": "Update authentication."},
            {"label": "Session", "description": "Update session handling."},
        ],
        "multi_select": True,
    },
    {
        "question": "Which documentation?",
        "header": "Docs",
        "options": [
            {
                "label": "English",
                "description": "Update English documentation.",
                "preview": "An English documentation preview.",
            },
            {"label": "Chinese", "description": "Update Chinese docs."},
        ],
        "multi_select": False,
    },
]


def _answers():
    """Send answers out of order to prove association by question text."""
    return [
        {
            "question": QUESTIONS[1]["question"],
            "selected": ["English"],
            "other": None,
        },
        {
            "question": QUESTIONS[0]["question"],
            "selected": ["Auth", "Session"],
            "other": None,
        },
    ]


@pytest.fixture
def preview_module(monkeypatch):
    """Load the real backend plugin from this independent plugin repository."""
    entry = (
        Path(__file__).resolve().parents[2]
        / "plugins/tool/yance-ask-user-question/backend/plugin.py"
    )
    name = "yance_ask_user_question_http_fixture"
    spec = importlib.util.spec_from_file_location(
        name,
        entry,
        submodule_search_locations=[str(entry.parent)],
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    monkeypatch.setitem(sys.modules, name, module)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
async def bridge(monkeypatch, tmp_path, preview_module):
    """Mount through PluginApi and authenticate through real middleware."""
    monkeypatch.setenv("QWENPAW_AUTH_ENABLED", "true")
    monkeypatch.setattr(
        auth,
        "_load_auth_data",
        lambda: {
            "jwt_secret": "preview-test-only-signing-secret",
            "user": {"username": USER_ID},
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
    token = auth.create_token(USER_ID)
    assert auth.verify_token(token) == USER_ID

    service = ApprovalService()
    created = asyncio.Event()
    pending_requests = []
    original_create = service.create_pending_summary

    async def create_and_signal(**kwargs):
        # pylint: disable-next=missing-kwoa
        pending = await original_create(**kwargs)
        pending_requests.append(pending)
        created.set()
        return pending

    monkeypatch.setattr(service, "create_pending_summary", create_and_signal)
    monkeypatch.setattr(
        native_approval,
        "get_approval_service",
        lambda: service,
    )

    app = FastAPI()
    app.add_middleware(auth.AuthMiddleware)
    monkeypatch.setattr(PluginRegistry, "_instance", None)
    registry = PluginRegistry()
    registry.set_plugin_http_app(app)
    api = PluginApi("yance-ask-user-question", config={})
    api.set_registry(registry)
    preview = preview_module.YanceAskUserQuestionPlugin(
        service=service,
        timeout_seconds=60,
    )
    preview.register(api)
    app.include_router(native_approval.router, prefix="/api")

    context = HookContext(
        request=SimpleNamespace(
            user_id=USER_ID,
            channel="console",
            source="console",
            request_context={
                "approval_level": "strict",
                preview_module.UI_MARKER_KEY: "1",
            },
        ),
        session_id=ROOT_SESSION_ID,
        agent_id=AGENT_ID,
        root_session_id=ROOT_SESSION_ID,
        root_agent_id=AGENT_ID,
        workspace_dir=tmp_path,
        workspace=None,
        app_services=None,
    )
    tasks = []

    async def start():
        task = asyncio.create_task(
            preview.ask(copy.deepcopy(QUESTIONS), context),
        )
        tasks.append(task)
        await asyncio.wait_for(created.wait(), 2)
        assert len(pending_requests) == 1
        pending = pending_requests[0]
        assert pending.identity_policy == ApprovalIdentityPolicy.AGENT
        assert not task.done()
        return task, pending

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(
            app=app,
            client=("198.51.100.23", 12345),
        ),
        base_url="http://preview.test",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Agent-Id": AGENT_ID,
        },
    ) as client:
        try:
            yield SimpleNamespace(
                client=client,
                service=service,
                app=app,
                start=start,
                endpoint=f"/api{preview_module.API_PREFIX}/answer",
            )
        finally:
            await service.cancel_all_pending_by_root_session(ROOT_SESSION_ID)
            for task in tasks:
                if not task.done():
                    task.cancel()
            if tasks:
                await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=True),
                    2,
                )


def _payload(pending, answers=None, **overrides):
    payload = {
        "request_id": pending.request_id,
        "session_id": ROOT_SESSION_ID,
        "answers": _answers() if answers is None else answers,
    }
    payload.update(overrides)
    return payload


async def _finish_with_answer(bridge, task, pending, answers=None):
    response = await bridge.client.post(
        bridge.endpoint,
        json=_payload(pending, answers),
    )
    assert response.status_code == 200, response.text
    result = await asyncio.wait_for(task, 2)
    assert result.state == ToolResultState.SUCCESS, result
    return result


async def test_registered_http_answer_resumes_original_call(bridge):
    """A real plugin route releases exactly the existing native wait."""
    task, pending = await bridge.start()
    inputs = pending.extra["tool_call"]["input"]["questions"]
    assert inputs[0]["context"] == QUESTIONS[0]["context"]
    assert inputs[1]["options"][0]["preview"] == (
        QUESTIONS[1]["options"][0]["preview"]
    )
    result = await _finish_with_answer(bridge, task, pending)
    metadata = AskUserMetadata.model_validate(result.metadata)
    assert metadata.model_dump(mode="json") == {
        "answers": [
            {
                "question": QUESTIONS[0]["question"],
                "selected": ["Auth", "Session"],
                "other": None,
            },
            {
                "question": QUESTIONS[1]["question"],
                "selected": ["English"],
                "other": None,
            },
        ],
    }
    assert await bridge.service.get_request(pending.request_id) is None
    duplicate = await bridge.client.post(
        bridge.endpoint,
        json=_payload(pending),
    )
    assert duplicate.status_code in {404, 409}


async def test_answer_normalization_preserves_framework_contract(bridge):
    """Filter unknowns, deduplicate multi-select, keep first valid single."""
    task, pending = await bridge.start()
    answers = _answers()
    answers[0]["selected"] = ["unknown", "Chinese", "English"]
    answers[1]["selected"] = ["unknown", "Session", "Auth", "Session"]
    result = await _finish_with_answer(bridge, task, pending, answers)
    assert result.metadata["answers"] == [
        {
            "question": QUESTIONS[0]["question"],
            "selected": ["Session", "Auth"],
            "other": None,
        },
        {
            "question": QUESTIONS[1]["question"],
            "selected": ["Chinese"],
            "other": None,
        },
    ]


@pytest.mark.parametrize(
    "invalid",
    ["missing-question", "unknown-question", "duplicate-question", "empty"],
)
async def test_invalid_answers_leave_original_wait_pending(bridge, invalid):
    """Bad batches cannot resolve, borrow another answer, or poison retry."""
    task, pending = await bridge.start()
    answers = _answers()
    if invalid == "missing-question":
        answers.pop()
    elif invalid == "unknown-question":
        answers[0]["question"] = "A question the agent never asked"
    elif invalid == "duplicate-question":
        answers[0]["question"] = answers[1]["question"]
    else:
        answers[0]["selected"] = ["unknown-option"]
        answers[0]["other"] = "   "
    response = await bridge.client.post(
        bridge.endpoint,
        json=_payload(pending, answers),
    )
    assert response.status_code == 422, response.text
    assert await bridge.service.get_request(pending.request_id) is pending
    assert not pending.future.done()
    assert not task.done()
    await _finish_with_answer(bridge, task, pending)


@pytest.mark.parametrize("authorization", ["", "Bearer invalid-token"])
async def test_answer_endpoint_requires_valid_bearer(bridge, authorization):
    """Missing and invalid credentials fail before the plugin can resolve."""
    task, pending = await bridge.start()
    response = await bridge.client.post(
        bridge.endpoint,
        headers={"Authorization": authorization},
        json=_payload(pending),
    )
    assert response.status_code == 401, response.text
    assert not task.done()
    await _finish_with_answer(bridge, task, pending)


@pytest.mark.parametrize(
    "mode",
    ["authenticated", "disabled", "unregistered", "localhost"],
)
async def test_answers_follow_the_host_console_auth_boundary(
    bridge,
    monkeypatch,
    mode,
):
    """Accept the same authenticated or local Console as native approvals."""
    task, pending = await bridge.start()
    if mode == "disabled":
        monkeypatch.delenv("QWENPAW_AUTH_ENABLED", raising=False)
    elif mode == "unregistered":
        monkeypatch.setattr(auth, "_load_auth_data", lambda: {})
    elif mode == "localhost":
        monkeypatch.setattr(
            auth,
            "_get_config_cached",
            lambda: (
                SimpleNamespace(
                    security=SimpleNamespace(
                        allow_no_auth_hosts=["127.0.0.1"],
                    ),
                ),
                [],
            ),
        )
    original_resolve = bridge.service.resolve_request
    actors = []

    async def capture_actor(*args, **kwargs):
        actors.append(kwargs.get("actor"))
        return await original_resolve(*args, **kwargs)

    monkeypatch.setattr(bridge.service, "resolve_request", capture_actor)
    payload = _payload(pending, user_id="untrusted-body-user")
    headers = {"X-Agent-Id": AGENT_ID}
    if mode == "authenticated":
        headers["Authorization"] = bridge.client.headers["Authorization"]
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(
            app=bridge.app,
            client=("127.0.0.1", 12345),
        ),
        base_url="http://preview.test",
    ) as client:
        response = await client.post(
            bridge.endpoint,
            headers=headers,
            json=payload,
        )
    assert response.status_code == 200, response.text
    result = await asyncio.wait_for(task, 2)
    assert result.state == ToolResultState.SUCCESS
    assert actors[0].user_id == (
        USER_ID if mode == "authenticated" else "console"
    )
    assert actors[0].is_admin is True
    assert pending.identity_policy == ApprovalIdentityPolicy.AGENT


@pytest.mark.parametrize("foreign", ["root", "agent", "request"])
async def test_answers_cannot_cross_pending_identity(bridge, foreign):
    """An authenticated user must still address the original agent/root."""
    task, pending = await bridge.start()
    payload = _payload(pending)
    headers = {}
    if foreign == "root":
        payload["session_id"] = "unrelated-root"
    elif foreign == "agent":
        headers["X-Agent-Id"] = "unrelated-agent"
    else:
        payload["request_id"] = "00000000-0000-4000-8000-000000000000"
    response = await bridge.client.post(
        bridge.endpoint,
        headers=headers,
        json=payload,
    )
    assert response.status_code == (404 if foreign == "request" else 403)
    assert not task.done()
    assert pending.identity_policy == ApprovalIdentityPolicy.AGENT
    await _finish_with_answer(bridge, task, pending)


async def test_expired_answer_cannot_resume_with_success(bridge):
    """Expire the deadline without racing short wall-clock waits."""
    task, pending = await bridge.start()
    pending.created_at -= pending.timeout_seconds + 1
    response = await bridge.client.post(
        bridge.endpoint,
        json=_payload(pending),
    )
    assert response.status_code in {404, 409}, response.text
    result = await asyncio.wait_for(task, 2)
    assert result.state == ToolResultState.ERROR
    assert not any(
        answer["selected"] or answer["other"]
        for answer in result.metadata.get("answers", [])
    )
    assert await bridge.service.get_request(pending.request_id) is None


async def test_native_approval_without_plugin_answer_is_not_an_answer(bridge):
    """The unchanged native approve endpoint cannot invent sidecar answers."""
    task, pending = await bridge.start()
    response = await bridge.client.post(
        "/api/approval/approve",
        json={
            "request_id": pending.request_id,
            "session_id": ROOT_SESSION_ID,
        },
    )
    assert response.status_code == 200, response.text
    result = await asyncio.wait_for(task, 2)
    assert result.state == ToolResultState.ERROR
    assert not any(
        answer["selected"] or answer["other"]
        for answer in result.metadata.get("answers", [])
    )
    assert await bridge.service.get_request(pending.request_id) is None


async def test_http_denial_is_a_denied_tool_result(bridge):
    """Explicit refusal releases the wait without human-answer metadata."""
    task, pending = await bridge.start()
    response = await bridge.client.post(
        bridge.endpoint,
        json=_payload(pending, [], decision="deny"),
    )
    assert response.status_code == 200, response.text
    result = await asyncio.wait_for(task, 2)
    assert result.state == ToolResultState.DENIED
    assert result.metadata == {}
    assert await bridge.service.get_request(pending.request_id) is None


async def test_concurrent_answers_only_commit_winner_metadata(
    bridge,
    monkeypatch,
):
    """Overlap two real HTTP answers and preserve only the winning batch."""
    task, pending = await bridge.start()
    answers = [_answers(), _answers()]
    answers[1][0]["selected"] = ["Chinese"]
    answers[1][1]["selected"] = ["Session"]
    events = SimpleNamespace(
        staged=asyncio.Event(),
        resume=asyncio.Event(),
        both_dispatched=asyncio.Event(),
        requests=0,
    )
    original_resolve = bridge.service.resolve_request

    async def pause_first_resolution(*args, **kwargs):
        if not events.staged.is_set():
            events.staged.set()
            await events.resume.wait()
        return await original_resolve(*args, **kwargs)

    async def observe_dispatch(request):
        if request.url.path == bridge.endpoint:
            events.requests += 1
            if events.requests == 2:
                events.both_dispatched.set()

    monkeypatch.setattr(
        bridge.service,
        "resolve_request",
        pause_first_resolution,
    )
    bridge.client.event_hooks["request"].append(observe_dispatch)
    posts = [
        asyncio.create_task(
            bridge.client.post(
                bridge.endpoint,
                json=_payload(pending, submitted),
            ),
        )
        for submitted in answers
    ]
    try:
        await asyncio.wait_for(events.staged.wait(), 2)
        await asyncio.wait_for(events.both_dispatched.wait(), 2)
        assert not pending.future.done()
        assert not task.done()
        events.resume.set()
        responses = await asyncio.wait_for(asyncio.gather(*posts), 2)
    finally:
        events.resume.set()
        bridge.client.event_hooks["request"].remove(observe_dispatch)
        for post in posts:
            if not post.done():
                post.cancel()
        await asyncio.wait_for(
            asyncio.gather(*posts, return_exceptions=True),
            2,
        )
    assert sum(response.status_code == 200 for response in responses) == 1
    assert all(
        response.status_code in {200, 404, 409} for response in responses
    )
    winner = next(
        index
        for index, response in enumerate(responses)
        if response.status_code == 200
    )
    result = await asyncio.wait_for(task, 2)
    assert result.state == ToolResultState.SUCCESS
    by_question = {answer["question"]: answer for answer in answers[winner]}
    assert result.metadata == {
        "answers": [
            by_question[question["question"]] for question in QUESTIONS
        ],
    }
    assert await bridge.service.get_request(pending.request_id) is None


async def test_native_approval_wins_over_staged_plugin_answers(
    bridge,
    monkeypatch,
):
    """Uncommitted sidecar answers cannot escape when native approve wins."""
    task, pending = await bridge.start()
    staged = asyncio.Event()
    resume = asyncio.Event()
    original_resolve = bridge.service.resolve_request

    async def pause_first_resolution(*args, **kwargs):
        if not staged.is_set():
            staged.set()
            await resume.wait()
        return await original_resolve(*args, **kwargs)

    monkeypatch.setattr(
        bridge.service,
        "resolve_request",
        pause_first_resolution,
    )
    post = asyncio.create_task(
        bridge.client.post(bridge.endpoint, json=_payload(pending)),
    )
    try:
        await asyncio.wait_for(staged.wait(), 2)
        assert not pending.future.done()
        native = await asyncio.wait_for(
            bridge.client.post(
                "/api/approval/approve",
                json={
                    "request_id": pending.request_id,
                    "session_id": ROOT_SESSION_ID,
                },
            ),
            2,
        )
        assert native.status_code == 200, native.text
        assert pending.future.done()
        assert not task.done()
        resume.set()
        response = await asyncio.wait_for(post, 2)
    finally:
        resume.set()
        if not post.done():
            post.cancel()
        await asyncio.wait_for(
            asyncio.gather(post, return_exceptions=True),
            2,
        )
    assert response.status_code == 409, response.text
    result = await asyncio.wait_for(task, 2)
    assert result.state == ToolResultState.ERROR
    assert result.metadata == {}
    assert await bridge.service.get_request(pending.request_id) is None
