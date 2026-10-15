# -*- coding: utf-8 -*-
"""Shared, offline helpers for independently versioned plugin artifacts."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import re
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
IGNORED_DIRS = {
    ".git",
    ".venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".cache",
    "dist",
    "coverage",
    "reports",
    "output",
}


def digest(path: Path) -> str:
    """Hash exact bytes, including platform-sensitive source newlines."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path: Path) -> dict:
    """Read a UTF-8 JSON object without silently accepting other shapes."""
    value = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected a JSON object: {path}")
    return value


def find_plugin(plugin_id: str) -> tuple[Path, dict]:
    """Resolve one stable ID; reject ambiguous directories and unsafe IDs."""
    if re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", plugin_id) is None:
        raise ValueError("Plugin ID must use lowercase letters/digits/hyphens")
    matches = []
    for path in sorted((ROOT / "plugins").glob("*/*/plugin.json")):
        manifest = read_json(path)
        if manifest.get("id") == plugin_id:
            matches.append((path.parent, manifest))
    if len(matches) != 1:
        raise ValueError(f"Expected exactly one manifest for {plugin_id}")
    directory, manifest = matches[0]
    if directory.name != plugin_id:
        raise ValueError("Plugin directory must match its manifest ID")
    version = manifest.get("version", "")
    if (
        re.fullmatch(
            r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?",
            version,
        )
        is None
    ):
        raise ValueError("Plugin version must be a semantic version")
    return directory, manifest


def source_hashes(plugin_id: str) -> dict[str, str]:
    """Bind this plugin, its tests and shared release tooling to evidence."""
    directory, _ = find_plugin(plugin_id)
    roots = [
        directory,
        ROOT / "tests" / plugin_id.replace("-", "_"),
        ROOT / "scripts",
        ROOT / ".github",
        ROOT / "tests/release_workflow",
    ]
    files = [
        ROOT / name
        for name in (
            ".pre-commit-config.yaml",
            ".flake8",
            ".gitattributes",
            "pytest.ini",
        )
    ]
    for start in roots:
        for current, dirs, names in os.walk(start, followlinks=False):
            dirs[:] = [name for name in dirs if name not in IGNORED_DIRS]
            for name in names:
                path = Path(current) / name
                if path.is_symlink():
                    raise ValueError(
                        f"Source symlinks are not supported: {path}",
                    )
                if not name.endswith((".pyc", ".log")):
                    files.append(path)
    return {
        path.relative_to(ROOT).as_posix(): digest(path)
        for path in sorted(set(files))
        if path.is_file()
    }


def build_package(plugin_id: str, output_dir: Path) -> tuple[Path, dict]:
    """Use the plugin's checked-in packaging recipe, then check its bytes."""
    directory, manifest = find_plugin(plugin_id)
    recipe = directory / "package_plugin.py"
    spec = importlib.util.spec_from_file_location(
        "collection_package_recipe",
        recipe,
    )
    if spec is None or spec.loader is None:
        raise ValueError(f"Missing packaging recipe: {recipe}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    archive = (
        output_dir.resolve()
        / plugin_id
        / manifest["version"]
        / f"{plugin_id}-{manifest['version']}.zip"
    )
    module.build_archive(directory, archive)
    evidence = module.write_evidence(archive)
    verify_archive(plugin_id, archive)
    return archive, evidence


def verify_archive(plugin_id: str, archive: Path) -> None:
    """Reject missing, duplicated, foreign or stale runtime ZIP members."""
    directory, _ = find_plugin(plugin_id)
    required = {
        "plugin.json",
        "LICENSE",
        "README.md",
        "README_zh.md",
        "CHANGELOG.md",
    }
    with ZipFile(archive) as package:
        names = package.namelist()
        if len(names) != len(set(names)):
            raise ValueError("Archive contains duplicate members")
        members = set()
        for name in names:
            prefix = f"{plugin_id}/"
            if not name.startswith(prefix) or name.endswith("/"):
                raise ValueError(f"Unexpected archive member: {name}")
            relative = Path(name[len(prefix) :])
            if relative.is_absolute() or ".." in relative.parts:
                raise ValueError(f"Unsafe archive member: {name}")
            path = (directory / relative).resolve()
            if not path.is_relative_to(directory.resolve()):
                raise ValueError(f"Archive member escapes plugin: {name}")
            if not path.is_file() or package.read(name) != path.read_bytes():
                raise ValueError(
                    f"Archive does not match current source: {name}",
                )
            members.add(relative.as_posix())
        if not required.issubset(members):
            raise ValueError(
                "Archive must include manifest, license "
                "and bilingual documentation",
            )
