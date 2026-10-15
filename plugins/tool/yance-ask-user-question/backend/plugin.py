# -*- coding: utf-8 -*-
"""Preview using public plugin hooks and the unmodified host approvals."""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Any, Literal

from agentscope.message import TextBlock, ToolResultState
from agentscope.middleware import MiddlewareBase
from agentscope.tool import (
    AskUser,
    AskUserAnswer,
    AskUserMetadata,
    AskUserParams,
    ToolChunk,
    ToolResponse,
)
from fastapi import APIRouter, HTTPException, Request
from pydantic import Field, ValidationError

from qwenpaw.app.approvals import (
    ApprovalActor,
    ApprovalIdentityPolicy,
    ApprovalRequestSummary,
    get_approval_service,
)
from qwenpaw.constant import TOOL_GUARD_APPROVAL_TIMEOUT_SECONDS
from qwenpaw.runtime.hooks import HookBase, HookResult
from qwenpaw.runtime.phases import Phase
from qwenpaw.security.tool_guard.approval import ApprovalDecision
from qwenpaw.tool_calls import get_call_context

PLUGIN_ID = "yance-ask-user-question"
TOOL_NAME = "yance_ask_user_question"
SOURCE_TYPE = "yance_ask_user_question"
API_PREFIX = "/yance-ask-user-question"
UI_MARKER_KEY = "yance_ask_user_question_ui"
DEFAULT_DESCRIPTION = "在控制台对话中提出结构化问题，等待用户回答后继续同一轮任务。"


def _chunk(state: ToolResultState, text: str, metadata=None) -> ToolChunk:
    return ToolChunk(
        content=[TextBlock(type="text", text=text)],
        state=state,
        is_last=True,
        metadata=metadata or {},
    )


async def yance_ask_user_question(
    questions: list[dict[str, Any]] | str,
) -> ToolChunk:
    """Ask 1-4 structured questions and wait for their answers.

    Args:
        questions: Framework AskUser questions, including descriptions.
    """
    del questions
    return _chunk(
        ToolResultState.ERROR,
        "The preview middleware was not installed; no question was queued.",
    )


class AnswerRequest(AskUserMetadata):
    """Framework answers plus the host's request/root-session identities."""

    request_id: str = Field(min_length=1)
    session_id: str = Field(min_length=1)
    decision: Literal["answer", "deny"] = "answer"


@dataclass
class _QuestionRecord:
    params: AskUserParams
    pending: Any
    answers: list[AskUserAnswer] | None = None


class PreviewSchemaHook(HookBase):
    """Configure only the already governed preview tool instance."""

    phase = Phase.POST_AGENT_BUILD
    name = "yance_ask_user_question_schema"
    priority = 90

    async def run(self, ctx) -> HookResult:
        if ctx.agent is not None:
            tool = await ctx.agent.toolkit.get_tool(TOOL_NAME)
            if tool is not None:
                tool.input_schema = AskUserParams.model_json_schema()
                tool.description = AskUser.description
        return HookResult()


class PreviewMiddleware(MiddlewareBase):
    """Handle the one preview tool after framework permission checking."""

    def __init__(self, preview, ctx) -> None:
        self.preview = preview
        self.ctx = ctx

    async def on_acting(self, agent, input_kwargs, next_handler):
        del agent
        tool_call = input_kwargs["tool_call"]
        if getattr(tool_call, "name", "") != TOOL_NAME:
            async for item in next_handler():
                yield item
            return

        arguments = getattr(tool_call, "input", {})
        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments)
            except json.JSONDecodeError:
                arguments = {}
        questions = (
            arguments.get("questions") if isinstance(arguments, dict) else None
        )
        result = await self.preview.ask(questions, self.ctx)
        # AgentScope's outer _execute_tool_call still stores the response,
        # and the outer host Coordinator still owns cancellation and IDs.
        # The host's FunctionTool.__call__ is intentionally not invoked:
        # base 4e7 otherwise mistakes a legitimate DENIED for sandbox denial.
        yield ToolResponse(
            id=tool_call.id,
            content=result.content,
            state=result.state,
            metadata=result.metadata,
        )


class YanceAskUserQuestionPlugin:
    """Small proof, not a published or remote-capable implementation."""

    def __init__(self, service=None, timeout_seconds=None) -> None:
        self._service = service
        self.timeout_seconds = (
            TOOL_GUARD_APPROVAL_TIMEOUT_SECONDS
            if timeout_seconds is None
            else timeout_seconds
        )
        self._lock = asyncio.Lock()
        self._records: dict[str, _QuestionRecord] = {}
        self._closed = False

    @property
    def service(self):
        return self._service or get_approval_service()

    def middleware_factory(self, ctx, agent_config):
        del agent_config
        return PreviewMiddleware(self, ctx)

    def register(self, api) -> None:
        description = api.manifest.get("description")
        if not isinstance(description, str) or not description.strip():
            description = DEFAULT_DESCRIPTION
        api.register_tool(
            tool_name=TOOL_NAME,
            tool_func=yance_ask_user_question,
            description=description,
            icon="❓",
            enabled=False,
            tool_type="internal",
        )
        api.register_runtime_hook(PreviewSchemaHook())
        api.register_middleware(self.middleware_factory)
        api.register_http_router(self.build_router(), prefix=API_PREFIX)
        api.register_shutdown_hook(PLUGIN_ID, self.close)
        api.register_uninstall_hook(PLUGIN_ID, self.uninstall)

    async def uninstall(self, plugin_id: str, delete_files: bool) -> None:
        """Accept the host uninstall callback's keyword arguments."""
        del delete_files
        if plugin_id == PLUGIN_ID:
            await self.close()

    async def close(self) -> None:
        async with self._lock:
            self._closed = True
            for request_id in list(self._records):
                await self.service.resolve_request(
                    request_id,
                    ApprovalDecision.TIMEOUT,
                )

    @staticmethod
    def _supported_context(ctx) -> bool:
        request = ctx.request
        route = getattr(request, "request_context", None) or {}
        return bool(
            ctx.session_id
            and (ctx.root_session_id or ctx.session_id) == ctx.session_id
            and (ctx.root_agent_id or ctx.agent_id) == ctx.agent_id
            and getattr(request, "channel", "") == "console"
            and (getattr(request, "source", "") or "") in ("", "console")
            # Readiness only: authentication remains the host's boundary.
            and route.get(UI_MARKER_KEY) == "1"
            and not route.get("_spawn_subagent")
            and not route.get("_agent_delegation")
            and "_headless_tool_guard" not in route
            and route.get("source", "") in ("", "console"),
        )

    async def ask(self, questions, ctx) -> ToolChunk:
        try:
            if isinstance(questions, str):
                questions = json.loads(questions)
            params = AskUserParams.model_validate({"questions": questions})
        except (ValidationError, json.JSONDecodeError) as exc:
            return _chunk(ToolResultState.ERROR, f"Invalid questions: {exc}")
        if not self._supported_context(ctx):
            return _chunk(
                ToolResultState.ERROR,
                "This preview requires its question UI in a direct Console "
                "main-agent turn.",
            )

        call = get_call_context()
        record = await self._start_question(params, ctx, call)
        if isinstance(record, str):
            return _chunk(ToolResultState.ERROR, record)
        pending = record.pending
        try:
            decision = await self._wait(pending, call)
            async with self._lock:
                answers = record.answers
            return self._outcome(pending, decision, answers)
        except asyncio.CancelledError:
            await asyncio.shield(
                self.service.resolve_request(
                    pending.request_id,
                    ApprovalDecision.TIMEOUT,
                ),
            )
            raise
        finally:
            async with self._lock:
                self._records.pop(pending.request_id, None)

    def _admission_error(self, ctx, call) -> str | None:
        if self._closed:
            return "The question plugin is closed; no question was queued."
        identity = (ctx.agent_id, ctx.session_id)
        if any(
            (record.pending.agent_id, record.pending.session_id) == identity
            for record in self._records.values()
        ):
            return "Another question is still active in this Console session."
        if call is not None and call.tool_call_id:
            # HookContext.extras ends with this turn. Do not retain global call
            # IDs or infer request identity from Python object IDs.
            extras = getattr(ctx, "extras", None)
            if not isinstance(extras, dict):
                return "The host did not supply a per-turn plugin context."
            seen = extras.setdefault(f"{PLUGIN_ID}:tool_calls", set())
            if call.tool_call_id in seen:
                return "This tool call already asked a question in this turn."
            seen.add(call.tool_call_id)
        return None

    async def _start_question(self, params, ctx, call):
        # Keep admission, host creation and sidecar registration atomic against
        # other calls and close(). The host never calls back into this plugin.
        async with self._lock:
            error = self._admission_error(ctx, call)
            if error:
                return error
            return await self._create_record(params, ctx, call)

    async def _create_record(self, params, ctx, call):
        pending = await self.service.create_pending_summary(
            session_id=ctx.session_id,
            root_session_id=ctx.root_session_id or ctx.session_id,
            owner_agent_id=ctx.agent_id,
            user_id=getattr(ctx.request, "user_id", "") or "",
            channel="console",
            agent_id=ctx.agent_id,
            summary=ApprovalRequestSummary(
                source_type=SOURCE_TYPE,
                name=TOOL_NAME,
                severity="low",
                findings_count=0,
                result_summary="\n".join(q.question for q in params.questions),
                payload={},
            ),
            timeout_seconds=self.timeout_seconds,
            identity_policy=ApprovalIdentityPolicy.AGENT,
            extra={
                "plugin_id": PLUGIN_ID,
                "tool_call": {
                    "id": call.tool_call_id if call is not None else "",
                    "name": TOOL_NAME,
                    "input": params.model_dump(),
                },
            },
        )
        record = _QuestionRecord(params=params, pending=pending)
        self._records[pending.request_id] = record
        return record

    @staticmethod
    def _outcome(pending, decision, answers) -> ToolChunk:
        if pending.status == "cancelled":
            return _chunk(ToolResultState.INTERRUPTED, "The run stopped.")
        if decision == ApprovalDecision.DENIED:
            return _chunk(ToolResultState.DENIED, "The user declined.")
        if decision == ApprovalDecision.APPROVED and answers is not None:
            metadata = AskUserMetadata(answers=answers).model_dump()
            return _chunk(
                ToolResultState.SUCCESS,
                "The user answered: " + json.dumps(metadata),
                metadata,
            )
        message = (
            "Approved without answers; no information was collected."
            if decision == ApprovalDecision.APPROVED
            else "No answer arrived in time."
        )
        return _chunk(ToolResultState.ERROR, message)

    async def _wait(self, pending, call):
        if call is None:
            return await self.service.wait_for_approval(
                pending,
                self.timeout_seconds,
            )
        waiter = asyncio.create_task(
            self.service.wait_for_approval(pending, self.timeout_seconds),
        )
        cancelled = asyncio.create_task(call.cancel_event.wait())
        try:
            done, _ = await asyncio.wait(
                (waiter, cancelled),
                return_when=asyncio.FIRST_COMPLETED,
            )
            if cancelled in done:
                raise asyncio.CancelledError
            return await waiter
        finally:
            for task in (waiter, cancelled):
                if not task.done():
                    task.cancel()
            await asyncio.gather(waiter, cancelled, return_exceptions=True)

    @staticmethod
    def _normalize_answers(params, submitted):
        by_question = {answer.question: answer for answer in submitted}
        expected = {question.question for question in params.questions}
        if len(by_question) != len(submitted) or set(by_question) != expected:
            raise HTTPException(422, "Answer every original question once.")
        normalized = []
        for question in params.questions:
            answer = by_question[question.question]
            offered = {option.label for option in question.options}
            selected = list(
                dict.fromkeys(x for x in answer.selected if x in offered),
            )
            if not question.multi_select:
                selected = selected[:1]
            other = (answer.other or "").strip() or None
            if not selected and not other:
                raise HTTPException(422, "A question has no valid answer.")
            normalized.append(
                AskUserAnswer(
                    question=question.question,
                    selected=selected,
                    other=other,
                ),
            )
        return normalized

    def build_router(self) -> APIRouter:
        router = APIRouter()

        @router.post("/answer")
        async def answer(body: AnswerRequest, request: Request):
            user = getattr(request.state, "user", None)
            username = user.get("username") if isinstance(user, dict) else user
            if not isinstance(username, str) or not username:
                # The host also permits local/disabled-auth Console access.
                # Its middleware owns that boundary, as for native approvals.
                username = "console"
            agent_id = request.headers.get("X-Agent-Id", "")
            async with self._lock:
                record = self._records.get(body.request_id)
                if record is None:
                    raise HTTPException(404, "Preview request not found.")
                pending = await self.service.get_request(body.request_id)
                if pending is None:
                    raise HTTPException(409, "Request already resolved.")
                actual_identity = (
                    pending.extra.get("source_type"),
                    pending.extra.get("plugin_id"),
                    pending.tool_name,
                    pending.root_session_id,
                    pending.session_id,
                    pending.agent_id,
                    pending.owner_agent_id,
                )
                expected_identity = (
                    SOURCE_TYPE,
                    PLUGIN_ID,
                    TOOL_NAME,
                    body.session_id,
                    body.session_id,
                    agent_id,
                    agent_id,
                )
                if actual_identity != expected_identity:
                    raise HTTPException(403, "Request identity mismatch.")
                decision = (
                    ApprovalDecision.DENIED
                    if body.decision == "deny"
                    else ApprovalDecision.APPROVED
                )
                answers = (
                    None
                    if body.decision == "deny"
                    else self._normalize_answers(record.params, body.answers)
                )
                # The tool takes this same lock after its host wait. A native
                # approval can win, but cannot expose an uncommitted answer.
                record.answers = answers
                try:
                    resolved = await self.service.resolve_request(
                        pending.request_id,
                        decision,
                        actor=ApprovalActor(
                            session_id=body.session_id,
                            root_session_id=body.session_id,
                            user_id=username,
                            channel="console",
                            agent_id=agent_id,
                            is_admin=True,
                        ),
                    )
                except BaseException:
                    record.answers = None
                    raise
                if resolved is None:
                    record.answers = None
                    raise HTTPException(
                        409,
                        "Another resolver won or expired.",
                    )
            return {
                "resolved": True,
                "request_id": body.request_id,
                "decision": decision.value,
            }

        return router


plugin = YanceAskUserQuestionPlugin()
