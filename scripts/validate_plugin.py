# -*- coding: utf-8 -*-
"""Validate one plugin locally against an explicitly selected host checkout.

The runner never installs into a user's profile, alters the host checkout,
commits, pushes, publishes a release or records human acceptance.
"""

from __future__ import annotations

import argparse
from importlib import import_module
import datetime
import json
import os
import shutil
import subprocess
import sys
import tempfile
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path

collection = import_module(
    f"{__package__}._collection" if __package__ else "_collection",
)
ROOT = collection.ROOT
build_package = collection.build_package
digest = collection.digest
find_plugin = collection.find_plugin
source_hashes = collection.source_hashes


def run_step(name, command, cwd, environment, output):
    """Keep complete logs and stop immediately when a required check fails."""
    log = output / f"{name}.log"
    print(f"Running {name}; log: {log}", flush=True)
    with log.open("w", encoding="utf-8") as stream:
        result = subprocess.run(
            command,
            cwd=cwd,
            env=environment,
            stdout=stream,
            stderr=subprocess.STDOUT,
            check=False,
        )
    record = {
        "name": name,
        "command": command,
        "cwd": str(cwd),
        "exit_code": result.returncode,
        "log": str(log),
    }
    if result.returncode:
        print(log.read_text(encoding="utf-8", errors="replace")[-12000:])
        raise RuntimeError(f"{name} failed; see {log}")
    return record


def isolated_environment(host, temporary):
    """Redirect runtime identity, secrets and generated files to scratch."""
    environment = dict(os.environ)
    for name in ("PYTEST_ADDOPTS", "PYTEST_PLUGINS"):
        environment.pop(name, None)
    for name in ("home", "working", "secret", "temporary", "npm-cache"):
        (temporary / name).mkdir(parents=True, exist_ok=True)
    environment.update(
        {
            "HOME": str(temporary / "home"),
            "USERPROFILE": str(temporary / "home"),
            "QWENPAW_WORKING_DIR": str(temporary / "working"),
            "QWENPAW_SECRET_DIR": str(temporary / "secret"),
            "QWENPAW_HOST_SOURCE": str(host),
            "QWENPAW_AUTH_ENABLED": "false",
            "TEMP": str(temporary / "temporary"),
            "TMP": str(temporary / "temporary"),
            "TMPDIR": str(temporary / "temporary"),
            "PYTHONPATH": os.pathsep.join(
                (
                    str(host / "src"),
                    str(host / "packages/qwenpawmail-mcp/src"),
                ),
            ),
            "PYTHONIOENCODING": "utf-8",
            "PYTHONDONTWRITEBYTECODE": "1",
            "NPM_CONFIG_CACHE": str(temporary / "npm-cache"),
            "PRE_COMMIT_HOME": os.environ.get(
                "PRE_COMMIT_HOME",
                str(ROOT / ".cache/pre-commit"),
            ),
        },
    )
    return environment


def check_host(host, environment, output):
    """Prove imports use the specified host and record its actual revision."""
    probe = (
        "import importlib.metadata,json,qwenpaw; "
        "print(json.dumps({'source':qwenpaw.__file__,"
        "'agentscope':importlib.metadata.version('agentscope')}))"
    )
    result = subprocess.run(
        [sys.executable, "-c", probe],
        cwd=ROOT,
        env=environment,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    record = json.loads(result.stdout)
    expected = (host / "src/qwenpaw/__init__.py").resolve()
    if Path(record["source"]).resolve() != expected:
        raise ValueError("Python did not import the explicitly selected host")
    record["head"] = subprocess.check_output(
        ["git", "-C", str(host), "rev-parse", "HEAD"],
        encoding="utf-8",
    ).strip()
    record["tracked_changes"] = subprocess.check_output(
        [
            "git",
            "-C",
            str(host),
            "status",
            "--porcelain",
            "--untracked-files=no",
        ],
        encoding="utf-8",
    ).strip()
    if record["tracked_changes"]:
        raise ValueError("Use a host checkout with no tracked source changes")
    (output / "host.json").write_text(
        json.dumps(record, indent=2) + "\n",
        encoding="utf-8",
    )
    return record


def check_junit(path):
    """A skipped or empty backend suite is not successful acceptance."""
    root = ET.parse(path).getroot()
    counts = {
        name: sum(int(suite.get(name, 0)) for suite in root.iter("testsuite"))
        for name in ("tests", "failures", "errors", "skipped")
    }
    if counts["tests"] == 0 or any(
        counts[name] for name in ("failures", "errors", "skipped")
    ):
        raise ValueError(f"Backend suite is incomplete: {counts}")
    return counts


def validate(args, report, output):
    """Run formatting, frontend, artifact and governed host acceptance."""
    directory, manifest = find_plugin(args.plugin)
    before = source_hashes(args.plugin)
    temporary = Path(tempfile.mkdtemp(prefix="qwenpaw-plugin-check-"))
    environment = isolated_environment(args.host_source.resolve(), temporary)
    report.update(
        {
            "source_hashes": before,
            "isolated_runtime": str(temporary),
            "host": check_host(
                args.host_source.resolve(),
                environment,
                output,
            ),
            "checks": [],
        },
    )
    steps = report["checks"]
    files = sorted(before)
    steps.append(
        run_step(
            "precommit",
            [sys.executable, "-m", "pre_commit", "run", "--files", *files],
            ROOT,
            environment,
            output,
        ),
    )
    if before != source_hashes(args.plugin):
        raise ValueError("Pre-commit modified source; review it and rerun")
    frontend = directory / "frontend"
    if (frontend / "package.json").is_file():
        npm = shutil.which("npm")
        if npm is None:
            raise ValueError("Node.js/npm is required for frontend validation")
        for name, command in (
            ("npm-ci", [npm, "ci"]),
            (
                "frontend-tests",
                [
                    npm,
                    "test",
                    "--",
                    "--maxWorkers=2",
                    "--reporter=json",
                    f"--outputFile={output / 'frontend-tests.json'}",
                ],
            ),
            ("frontend-build", [npm, "run", "build"]),
            ("frontend-format", [npm, "run", "format:check"]),
        ):
            steps.append(
                run_step(name, command, frontend, environment, output),
            )
        frontend_result = json.loads(
            (output / "frontend-tests.json").read_text(encoding="utf-8"),
        )
        if (
            not frontend_result.get("success")
            or frontend_result.get("numPendingTests", 0)
            or frontend_result.get("numTotalTests", 0) == 0
        ):
            raise ValueError("Frontend tests are incomplete")
        report["frontend_tests"] = frontend_result["numPassedTests"]
    archive, evidence = build_package(args.plugin, args.output_dir)
    report.update(
        {
            "archive": str(archive),
            "archive_sha256": digest(archive),
            "archive_members": evidence["files"],
        },
    )
    environment["QWENPAW_PLUGIN_PACKAGE"] = str(archive)
    junit = output / "backend.xml"
    tests = ROOT / "tests" / args.plugin.replace("-", "_")
    steps.append(
        run_step(
            "backend-tests",
            [
                sys.executable,
                "-m",
                "pytest",
                str(tests),
                str(ROOT / "tests/release_workflow"),
                "-q",
                "--tb=short",
                "--timeout=30",
                "-p",
                "no:cacheprovider",
                "--basetemp",
                str(temporary / "pytest"),
                "--junitxml",
                str(junit),
            ],
            ROOT,
            environment,
            output,
        ),
    )
    report["backend_tests"] = check_junit(junit)
    current_host = check_host(
        args.host_source.resolve(),
        environment,
        output,
    )
    if current_host != report["host"]:
        raise ValueError("Host checkout changed during validation")
    if before != source_hashes(args.plugin):
        raise ValueError("Source changed during validation; validate again")
    report.update(
        {
            "plugin_id": args.plugin,
            "version": manifest["version"],
            "status": "passed",
            "scope": (
                "Selected plugin and collection release tooling; "
                "not the full QwenPaw test suite"
            ),
            "human_acceptance": "pending",
            "published": False,
        },
    )


def main() -> None:
    """Save failed runs too, so an interrupted gate cannot look successful."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plugin", required=True)
    parser.add_argument("--host-source", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "dist")
    args = parser.parse_args()
    _, manifest = find_plugin(args.plugin)
    run_id = (
        datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        + "-"
        + uuid.uuid4().hex[:8]
    )
    output = ROOT / "reports" / args.plugin / manifest["version"] / run_id
    output.mkdir(parents=True)
    report = {
        "status": "failed",
        "plugin_id": args.plugin,
        "version": manifest["version"],
        "python": sys.version,
        "human_acceptance": "pending",
        "published": False,
    }
    try:
        validate(args, report, output)
    except (
        OSError,
        ValueError,
        RuntimeError,
        subprocess.CalledProcessError,
    ) as error:
        report["error"] = str(error)
        raise
    finally:
        report["checked_at"] = datetime.datetime.now(
            datetime.timezone.utc,
        ).isoformat()
        destination = output / "validation-report.json"
        destination.write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Validation report: {destination}", flush=True)


if __name__ == "__main__":
    main()
