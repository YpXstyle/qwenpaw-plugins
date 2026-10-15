# -*- coding: utf-8 -*-
"""Exercise the built preview ZIP through the unmodified host lifecycle.

Build the plugin frontend first, or set QWENPAW_PLUGIN_PACKAGE to the final
archive. These acceptance tests never install into a user's plugin directory.
QWENPAW_HOST_SOURCE selects the host checkout and its official packager;
the plugin repository's own packager is not used as an official reference.
"""
# pylint: disable=protected-access,redefined-outer-name

from __future__ import annotations

import asyncio
import importlib.util
import inspect
import json
import os
from pathlib import Path
from types import SimpleNamespace
from zipfile import ZipFile

import httpx
import pytest
from agentscope.message import ToolResultState
from click.testing import CliRunner
from fastapi import FastAPI

from qwenpaw.app import approvals, auth
from qwenpaw.app.routers import frontend_plugin, plugins
from qwenpaw.cli import plugin_commands
from qwenpaw.config.config import (
    AgentProfileConfig,
    BuiltinToolConfig,
    ToolsConfig,
)
from qwenpaw.governance.tool_registry import DEFAULT_REGISTRY
from qwenpaw.governance.policy import (
    GovernanceAction,
    GovernancePolicy,
    ToolCallSpec,
)
from qwenpaw.plugins.loader import PluginLoader
from qwenpaw.plugins.registry import PluginRegistry
from qwenpaw.runtime.hooks import HookRegistry
from qwenpaw.runtime.tool_registry import ToolRegistry

pytestmark = [pytest.mark.integration, pytest.mark.p1]

PLUGIN_ID = "yance-ask-user-question"
TOOL_NAME = "yance_ask_user_question"
PLUGIN_ROOT = (
    Path(__file__).resolve().parents[2]
    / "plugins/tool/yance-ask-user-question"
)
QUESTIONS = [
    {
        "header": "Route",
        "question": "Which route should continue?",
        "options": [
            {"label": "Short (Recommended)", "description": "Less time."},
            {"label": "Scenic", "description": "More scenery."},
        ],
        "multi_select": False,
    },
]


def runtime_members(archive_path):
    """Normalize both official root ZIPs and one-directory release ZIPs."""
    with ZipFile(archive_path) as package:
        prefix = "" if "plugin.json" in package.namelist() else f"{PLUGIN_ID}/"
        return {
            name.removeprefix(prefix): package.read(name)
            for name in package.namelist()
            if not name.endswith("/")
        }


@pytest.fixture
def archive(tmp_path):
    """Use the release archive itself when supplied by the release runner."""
    supplied = os.environ.get("QWENPAW_PLUGIN_PACKAGE")
    if supplied:
        result = Path(supplied).resolve()
        assert result.is_file(), "Requested acceptance archive is missing"
        return result
    if not (PLUGIN_ROOT / "frontend/dist/index.js").is_file():
        pytest.skip("Build the preview frontend before ZIP acceptance")
    spec = importlib.util.spec_from_file_location(
        "preview_package_acceptance",
        PLUGIN_ROOT / "package_plugin.py",
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.build_archive(PLUGIN_ROOT, tmp_path / "preview.zip")


@pytest.fixture
async def host(monkeypatch, tmp_path, archive):
    """Use real upload, loader, startup hooks, routing and unload machinery."""
    monkeypatch.setenv("QWENPAW_AUTH_ENABLED", "false")
    monkeypatch.setattr(PluginRegistry, "_instance", None)
    monkeypatch.setattr(
        "qwenpaw.config.utils.get_plugins_dir",
        lambda: tmp_path / "installed",
    )
    # No agent profiles exist in this isolated host; registration still
    # bridges to a real workspace registry without writing agent settings.
    monkeypatch.setattr(
        "qwenpaw.config.utils.load_config",
        lambda: SimpleNamespace(agents=SimpleNamespace(profiles={})),
    )
    monkeypatch.setattr(
        "qwenpaw.app.agent_context.get_current_agent_id",
        lambda: None,
    )
    service = approvals.ApprovalService()
    monkeypatch.setattr(approvals, "get_approval_service", lambda: service)
    workspace = SimpleNamespace(
        agent_id="package-agent",
        plugins=SimpleNamespace(
            hook_registry=HookRegistry(),
            tool_registry=ToolRegistry(),
        ),
    )
    registry = PluginRegistry()
    registry.set_workspace_manager(
        SimpleNamespace(agents={workspace.agent_id: workspace}),
    )
    app = FastAPI()
    app.add_middleware(auth.AuthMiddleware)
    registry.set_plugin_http_app(app)
    loader = PluginLoader([tmp_path / "installed"])
    app.state.plugin_loader = loader
    app.include_router(plugins.router, prefix="/api")
    app.include_router(frontend_plugin.router, prefix="/api")
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://isolated-preview-host",
    ) as client:
        yield SimpleNamespace(
            client=client,
            loader=loader,
            registry=registry,
            service=service,
            workspace=workspace,
            archive=archive,
        )
    if loader.get_loaded_plugin(PLUGIN_ID) is not None:
        await loader.unload_plugin(PLUGIN_ID, delete_files=True)


async def upload(host, force=False):
    response = await host.client.post(
        "/api/plugins/upload",
        params={"force": str(force).lower()},
        files={"file": ("preview.zip", host.archive.read_bytes())},
    )
    assert response.status_code == 200, response.text
    return host.loader.get_loaded_plugin(PLUGIN_ID)


async def start_question(host, record, monkeypatch):
    created = asyncio.Event()
    seen = []
    original = host.service.create_pending_summary

    async def observe(**kwargs):
        pending = await original(**kwargs)
        seen.append(pending)
        created.set()
        return pending

    monkeypatch.setattr(host.service, "create_pending_summary", observe)
    context = SimpleNamespace(
        session_id="package-session",
        root_session_id="package-session",
        agent_id="package-agent",
        root_agent_id="package-agent",
        request=SimpleNamespace(
            channel="console",
            user_id="console-user",
            request_context={"yance_ask_user_question_ui": "1"},
        ),
    )
    task = asyncio.create_task(record.instance.ask(QUESTIONS, context))
    try:
        await asyncio.wait_for(created.wait(), 2)
    except BaseException:
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)
        raise
    return task, seen[0]


async def test_final_zip_installs_serves_frontend_and_returns_answers(
    host,
    monkeypatch,
):
    """No native feature patches or fabricated loader registration."""
    record = await upload(host)
    assert record.enabled
    assert record.source_path != PLUGIN_ROOT
    descriptor = host.workspace.plugins.tool_registry.get(TOOL_NAME)
    assert descriptor is not None
    assert descriptor.enabled_by_default is False
    assert DEFAULT_REGISTRY.get_owner(TOOL_NAME) == PLUGIN_ID
    assert str(record.source_path) in inspect.getfile(type(record.instance))

    listed = await host.client.get("/api/frontend_plugin")
    metadata = next(x for x in listed.json() if x["id"] == PLUGIN_ID)
    assert metadata["frontend_entry"] == "frontend/dist/index.js"
    response = await host.client.get(
        f"/api/frontend_plugin/{PLUGIN_ID}/files/frontend/dist/index.js",
    )
    assert response.status_code == 200
    assert (
        response.content
        == runtime_members(host.archive)["frontend/dist/index.js"]
    )
    assert (await host.client.get("/api/plugins")).status_code == 200

    task, pending = await start_question(host, record, monkeypatch)
    try:
        answer = await host.client.post(
            "/api/yance-ask-user-question/answer",
            headers={"X-Agent-Id": "package-agent"},
            json={
                "request_id": pending.request_id,
                "session_id": "package-session",
                "answers": [
                    {
                        "question": QUESTIONS[0]["question"],
                        "selected": ["Short (Recommended)"],
                        "other": None,
                    },
                ],
            },
        )
        assert answer.status_code == 200, answer.text
        result = await asyncio.wait_for(task, 2)
        assert result.state == ToolResultState.SUCCESS
        assert result.metadata["answers"][0]["selected"] == [
            "Short (Recommended)",
        ]
    finally:
        if not task.done():
            task.cancel()
        await asyncio.gather(task, return_exceptions=True)


async def test_localized_manifest_survives_official_loader_and_packaging(
    host,
    host_source,
    tmp_path,
):
    """Use supported metadata through the actual host and CDN packager."""
    record = await upload(host)
    members = runtime_members(host.archive)
    raw = json.loads(members["plugin.json"])
    translations = raw["description_i18n"]
    assert set(translations) == {"en", "zh", "id", "ja", "pt-BR", "ru", "vi"}
    assert record.manifest.description_i18n == translations
    assert record.manifest.author == "Yance"
    registered = host.registry.get_plugin_manifest(PLUGIN_ID)
    assert registered["description_i18n"] == translations
    assert registered["description"] == raw["description"]
    # This baseline management endpoint has no localized description field.
    listed = (await host.client.get("/api/plugins")).json()
    entry = next(item for item in listed if item["id"] == PLUGIN_ID)
    assert entry["description"] == raw["description"]
    assert entry["author"] == raw["author"]
    assert "description_i18n" not in entry

    script = host_source / "scripts/pack/generate_plugin_metadata.py"
    assert script.is_file(), f"Official host packager is missing: {script}"
    spec = importlib.util.spec_from_file_location(
        "official_preview_pack",
        script,
    )
    packager = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(packager)
    assert not packager._missing_required_files(PLUGIN_ROOT, raw)
    assert set(packager._iter_tree_relpaths(PLUGIN_ROOT, raw)) == set(members)
    official_zip = tmp_path / "official.zip"
    packager._zip_plugin(PLUGIN_ROOT, official_zip, raw)
    assert runtime_members(official_zip) == members
    metadata = packager._build_metadata(
        raw,
        file_id=PLUGIN_ID,
        plugin_id=PLUGIN_ID,
        version=raw["version"],
        kind="tool",
        zip_path=official_zip,
        cdn_path=f"plugins/tool/{PLUGIN_ID}/{official_zip.name}",
    )
    assert metadata["author"] == raw["author"]
    assert metadata["description"] == {
        "en-US": translations["en"],
        "zh-CN": translations["zh"],
    }


@pytest.mark.parametrize("level", ["off", "auto", "smart", "strict"])
async def test_installed_tool_uses_real_internal_policy_without_approval(
    host,
    level,
):
    """The enabled question is an internal tool, without ask-to-ask rules."""
    await upload(host)
    policy = GovernancePolicy(execution_level=level)
    policy_name = DEFAULT_REGISTRY.python_to_policy_name(TOOL_NAME)
    decision = policy.evaluate(
        ToolCallSpec(policy_name, "", "package-agent", "package-session"),
    )
    assert decision.action == GovernanceAction.ALLOW
    assert decision.reason == "internal"
    unknown = policy.evaluate(
        ToolCallSpec(
            "UnregisteredPreviewControl",
            "",
            "package-agent",
            "package-session",
        ),
    )
    assert unknown.action == GovernanceAction.DENY


async def test_offline_cli_directory_install_syncs_disabled_tool_to_agents(
    host,
    tmp_path,
    monkeypatch,
):
    """The baseline offline CLI reads the legacy single-tool metadata key."""
    extracted = tmp_path / "offline-source"
    extracted.mkdir()
    source = plugins._extract_plugin_zip_bytes(
        host.archive.read_bytes(),
        extracted,
    )
    profiles = {
        name: AgentProfileConfig(id=name, name=name, tools=ToolsConfig())
        for name in ("first", "second")
    }
    for profile in profiles.values():
        profile.tools.builtin_tools["unrelated"] = BuiltinToolConfig(
            name="unrelated",
            enabled=True,
        )
    saved = []
    monkeypatch.delenv("QWENPAW_RUNTIME_ID", raising=False)
    monkeypatch.setattr(plugin_commands, "_is_running", lambda: False)
    monkeypatch.setattr(
        "qwenpaw.config.utils.load_config",
        lambda: SimpleNamespace(agents=SimpleNamespace(profiles=profiles)),
    )
    monkeypatch.setattr(
        "qwenpaw.config.config.load_agent_config",
        lambda agent_id: profiles[agent_id],
    )
    monkeypatch.setattr(
        "qwenpaw.config.config.save_agent_config",
        lambda agent_id, config: saved.append((agent_id, config)),
    )
    result = CliRunner().invoke(
        plugin_commands.plugin,
        ["install", str(source)],
    )
    assert result.exit_code == 0, result.output
    assert "Synced tool to 2 agent(s)" in result.output
    assert {agent_id for agent_id, _ in saved} == set(profiles)
    for _, profile in saved:
        assert profile.tools.builtin_tools[TOOL_NAME].enabled is False
        assert profile.tools.builtin_tools["unrelated"].enabled is True


async def test_reinstall_and_uninstall_release_wait_and_remove_routes(
    host,
    monkeypatch,
):
    """An old question cannot survive an unload or accept a stale answer."""
    first = await upload(host)
    task, pending = await start_question(host, first, monkeypatch)
    try:
        second = await upload(host, force=True)
        result = await asyncio.wait_for(task, 2)
        assert result.state == ToolResultState.ERROR
        assert result.metadata == {}
        assert second.instance is not first.instance
        assert len(host.registry.get_middleware_factories()) == 1
        stale = await host.client.post(
            "/api/yance-ask-user-question/answer",
            headers={"X-Agent-Id": "package-agent"},
            json={
                "request_id": pending.request_id,
                "session_id": "package-session",
                "decision": "deny",
                "answers": [],
            },
        )
        assert stale.status_code == 404
        removed = await host.client.delete(f"/api/plugins/{PLUGIN_ID}")
        assert removed.status_code == 200, removed.text
        assert not second.source_path.exists()
        assert host.loader.get_loaded_plugin(PLUGIN_ID) is None
        assert not host.registry.get_middleware_factories()
        assert DEFAULT_REGISTRY.get_owner(TOOL_NAME) is None
        assert host.workspace.plugins.tool_registry.get(TOOL_NAME) is None
        assert (await host.client.get("/api/frontend_plugin")).json() == []
        missing = await host.client.post(
            "/api/yance-ask-user-question/answer",
            json={},
        )
        assert missing.status_code == 404
    finally:
        if not task.done():
            task.cancel()
        await asyncio.gather(task, return_exceptions=True)
