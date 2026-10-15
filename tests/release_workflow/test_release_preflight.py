# -*- coding: utf-8 -*-
"""Offline release checks using synthetic acceptance, never real approval."""
# pylint: disable=redefined-outer-name

import datetime
import json
from types import SimpleNamespace
from zipfile import ZIP_STORED, ZipFile

import pytest

from scripts import _collection, release_preflight


@pytest.fixture
def release_case(tmp_path, monkeypatch):
    """Build a disposable plugin and bind evidence to its exact source/ZIP."""
    root = tmp_path / "collection"
    plugin_id = "fixture-question"
    plugin = root / "plugins" / "tool" / plugin_id
    plugin.mkdir(parents=True)
    manifest = {
        "id": plugin_id,
        "version": "1.2.3",
        "name": "Test fixture only",
        "entry": {"backend": "backend/plugin.py"},
    }
    files = {
        "plugin.json": json.dumps(manifest),
        "LICENSE": "Fixture license\n",
        "README.md": "Fixture documentation\n",
        "README_zh.md": "Fixture translated documentation\n",
        "CHANGELOG.md": "Fixture changes\n",
        "backend/plugin.py": '"""Synthetic fixture, never loaded."""\n',
    }
    for name, content in files.items():
        path = plugin / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    tooling = root / "scripts" / "fixture_tooling.py"
    tooling.parent.mkdir()
    tooling.write_text('"""Fixture tooling."""\n', encoding="utf-8")
    monkeypatch.setattr(_collection, "ROOT", root)
    archive = tmp_path / "fixture.zip"
    with ZipFile(archive, "w", compression=ZIP_STORED) as package:
        for name in files:
            package.writestr(
                f"{plugin_id}/{name}",
                (plugin / name).read_bytes(),
            )
    now = datetime.datetime.now(datetime.timezone.utc)
    validation = {
        "plugin_id": plugin_id,
        "version": manifest["version"],
        "status": "passed",
        "checked_at": (now - datetime.timedelta(hours=2)).isoformat(),
        "archive": str(archive),
        "archive_sha256": _collection.digest(archive),
        "source_hashes": _collection.source_hashes(plugin_id),
    }
    acceptance = {
        "plugin_id": plugin_id,
        "version": manifest["version"],
        "result": "passed",
        "archive_sha256": validation["archive_sha256"],
        "tested_by": "Synthetic pytest fixture only",
        "tested_at": (now - datetime.timedelta(hours=1)).isoformat(),
    }
    return SimpleNamespace(
        root=root,
        plugin_id=plugin_id,
        plugin=plugin,
        tooling=tooling,
        archive=archive,
        validation=validation,
        acceptance=acceptance,
    )


def check(case):
    return release_preflight.check_release(
        case.plugin_id,
        case.validation,
        case.acceptance,
    )


def test_pending_human_acceptance_cannot_prepare_release(release_case):
    release_case.acceptance["result"] = "pending"
    with pytest.raises(ValueError, match="Human acceptance is pending"):
        check(release_case)


def test_acceptance_for_another_sha_is_rejected(release_case):
    release_case.acceptance["archive_sha256"] = "0" * 64
    with pytest.raises(ValueError, match="different archive"):
        check(release_case)


@pytest.mark.parametrize("target", ["plugin", "tooling"])
def test_source_changes_invalidate_automated_evidence(release_case, target):
    path = (
        release_case.plugin / "backend/plugin.py"
        if target == "plugin"
        else release_case.tooling
    )
    path.write_text('"""Changed after validation."""\n', encoding="utf-8")
    with pytest.raises(ValueError, match="Source changed after validation"):
        check(release_case)


def test_archive_changes_invalidate_automated_evidence(release_case):
    with release_case.archive.open("ab") as archive:
        archive.write(b"changed-after-validation")
    with pytest.raises(ValueError, match="Archive changed"):
        check(release_case)


@pytest.mark.parametrize("invalid", ["no-timezone", "before", "future"])
def test_human_acceptance_requires_timezone_and_valid_order(
    release_case,
    invalid,
):
    checked = datetime.datetime.fromisoformat(
        release_case.validation["checked_at"],
    )
    if invalid == "no-timezone":
        tested = checked + datetime.timedelta(hours=1)
        release_case.acceptance["tested_at"] = tested.replace(
            tzinfo=None,
        ).isoformat()
        message = "must include a timezone"
    elif invalid == "before":
        release_case.acceptance["tested_at"] = (
            checked - datetime.timedelta(seconds=1)
        ).isoformat()
        message = "must follow validation"
    else:
        release_case.acceptance["tested_at"] = (
            datetime.datetime.now(datetime.timezone.utc)
            + datetime.timedelta(days=1)
        ).isoformat()
        message = "cannot be in the future"
    with pytest.raises(ValueError, match=message):
        check(release_case)


@pytest.mark.parametrize("style", ["utc-z", "offset"])
def test_valid_acceptance_prepares_only_an_unpublished_local_record(
    release_case,
    style,
):
    tested = datetime.datetime.fromisoformat(
        release_case.acceptance["tested_at"],
    )
    if style == "utc-z":
        release_case.acceptance["tested_at"] = tested.isoformat().replace(
            "+00:00",
            "Z",
        )
    else:
        release_case.acceptance["tested_at"] = tested.astimezone(
            datetime.timezone(datetime.timedelta(hours=8)),
        ).isoformat()
    record = check(release_case)
    assert record["status"] == "local-release-prepared"
    assert record["published"] is False
    assert record["archive_sha256"] == _collection.digest(release_case.archive)
    assert record["tag"] == f"{release_case.plugin_id}-v1.2.3"
    assert record["tested_by"] == release_case.acceptance["tested_by"]
    assert datetime.datetime.fromisoformat(record["tested_at"]) == tested
    assert not (release_case.root / "dist").exists()


@pytest.mark.parametrize("status", ["pending", "failed"])
def test_unpassed_automation_cannot_use_human_acceptance(release_case, status):
    release_case.validation["status"] = status
    with pytest.raises(
        ValueError,
        match="Automated validation has not passed",
    ):
        check(release_case)


@pytest.mark.parametrize("tester", ["", " ", "REPLACE_WITH_TESTER"])
def test_blank_or_template_tester_is_not_human_acceptance(
    release_case,
    tester,
):
    release_case.acceptance["tested_by"] = tester
    with pytest.raises(ValueError, match="Human tester identity is required"):
        check(release_case)


def test_cli_writes_local_notes_with_no_publication_claim(
    release_case,
    tmp_path,
    monkeypatch,
    capsys,
):
    validation = tmp_path / "synthetic-validation.json"
    acceptance = tmp_path / "synthetic-acceptance.json"
    output = tmp_path / "local-output"
    validation.write_text(
        json.dumps(release_case.validation),
        encoding="utf-8",
    )
    acceptance.write_text(
        json.dumps(release_case.acceptance),
        encoding="utf-8",
    )
    monkeypatch.setattr(
        "sys.argv",
        [
            "release_preflight.py",
            "--plugin",
            release_case.plugin_id,
            "--validation",
            str(validation),
            "--acceptance",
            str(acceptance),
            "--output-dir",
            str(output),
        ],
    )
    release_preflight.main()
    record = json.loads(capsys.readouterr().out)
    directory = output / release_case.plugin_id / "1.2.3"
    saved = json.loads(
        (directory / "RELEASE.json").read_text(encoding="utf-8"),
    )
    assert saved == record
    assert saved["status"] == "local-release-prepared"
    assert saved["published"] is False
    assert saved["archive_sha256"] == _collection.digest(release_case.archive)
    notes = (directory / "RELEASE-CANDIDATE.md").read_text(encoding="utf-8")
    assert "not published" in notes
    assert saved["archive_sha256"] in notes


def test_validation_ignores_external_pytest_selection(tmp_path, monkeypatch):
    """Caller flags must not turn full plugin acceptance into one test."""
    from scripts import validate_plugin

    monkeypatch.setenv("PYTEST_ADDOPTS", "-k one_node_only")
    monkeypatch.setenv("PYTEST_PLUGINS", "external_test_plugin")
    environment = validate_plugin.isolated_environment(
        tmp_path / "host",
        tmp_path / "isolated",
    )
    assert "PYTEST_ADDOPTS" not in environment
    assert "PYTEST_PLUGINS" not in environment
