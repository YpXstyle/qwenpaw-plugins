# -*- coding: utf-8 -*-
"""Build a deterministic, self-contained local preview ZIP using stdlib."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

PLUGIN_ID = "yance-ask-user-question"
MAX_ARCHIVE_BYTES = 10 * 1024 * 1024
FRONTEND_ENTRY = "frontend/dist/index.js"
REQUIRED_FILES = (
    "plugin.json",
    "LICENSE",
    "README.md",
    "README_zh.md",
    "CHANGELOG.md",
    "backend/__init__.py",
    "backend/plugin.py",
    FRONTEND_ENTRY,
)
REGEX_PREFIX_WORDS = {"return", "throw", "case", "yield", "typeof", "void"}
IGNORED_JS = re.compile(r"\s+|//[^\n]*|/\*.*?\*/", re.DOTALL)


def _quoted_end(source: str, start: int, quote: str) -> int:
    index = start + 1
    while index < len(source):
        if source[index] == "\\":
            index += 2
        elif source[index] == quote:
            return index + 1
        else:
            index += 1
    raise ValueError("Unterminated frontend string or regular expression")


def _regex_end(source: str, start: int) -> int:
    index = start + 1
    in_class = False
    while index < len(source):
        char = source[index]
        if char == "\\":
            index += 2
            continue
        if char == "[":
            in_class = True
        elif char == "]":
            in_class = False
        elif char == "/" and not in_class:
            return index + 1
        elif char in "\r\n":
            break
        index += 1
    raise ValueError("Unterminated frontend regular expression")


class _JavaScriptScanner:
    """Separate code from comments/prose, including template expressions.

    This conservative check is for this bundle, not a JS syntax/security tool.
    """

    def __init__(self, source: str):
        self.source = source
        self.tokens: list[tuple[str, str]] = []

    def template(self, start: int) -> int:
        index = start + 1
        literal_start = index
        while index < len(self.source):
            if self.source[index] == "\\":
                index += 2
                continue
            if self.source[index] == "`":
                self.tokens.append(
                    ("string", self.source[literal_start:index]),
                )
                return index + 1
            if self.source.startswith("${", index):
                self.tokens.append(
                    ("string", self.source[literal_start:index]),
                )
                self.tokens.append(("punct", "("))
                index = self.scan(index + 2, nested=True)
                self.tokens.append(("punct", ")"))
                literal_start = index
            else:
                index += 1
        raise ValueError("Unterminated frontend template")

    def next_token(self, index: int) -> tuple[int, tuple[str, str] | None]:
        char = self.source[index]
        ignored = IGNORED_JS.match(self.source, index)
        if ignored is not None:
            return ignored.end(), None
        if self.source.startswith("/*", index):
            raise ValueError("Unterminated frontend comment")
        if char in "\"'":
            end = _quoted_end(self.source, index, char)
            return end, ("string", self.source[index + 1 : end - 1])
        if char == "`":
            return self.template(index), None
        previous = self.tokens[-1] if self.tokens else ("punct", "")
        if char == "/" and (
            previous[1] in REGEX_PREFIX_WORDS
            or (
                previous[0] == "punct"
                and previous[1] not in (")", "]", "}", ".")
            )
        ):
            return _regex_end(self.source, index), ("literal", "/regex/")
        if char.isalnum() or char in "_$":
            numeric = char.isdigit()
            allowed = "._" if numeric else "_$"
            end = index + 1
            while end < len(self.source) and (
                self.source[end].isalnum() or self.source[end] in allowed
            ):
                end += 1
            return end, (
                "literal" if numeric else "word",
                self.source[index:end],
            )
        return index + 1, ("punct", char)

    def scan(self, start: int, nested: bool = False) -> int:
        index = start
        depth = 0
        while index < len(self.source):
            index, token = self.next_token(index)
            if token is None:
                continue
            if token == ("punct", "{"):
                depth += 1
            elif token == ("punct", "}"):
                if nested and depth == 0:
                    return index
                depth -= 1
            self.tokens.append(token)
        if nested:
            raise ValueError("Unterminated frontend template interpolation")
        return index


def _javascript_tokens(source: str) -> list[tuple[str, str]]:
    scanner = _JavaScriptScanner(source)
    scanner.scan(0)
    return scanner.tokens


def _validate_frontend(path: Path) -> None:
    tokens = _javascript_tokens(path.read_text(encoding="utf-8"))
    for index, (kind, value) in enumerate(tokens):
        previous = tokens[index - 1][1] if index else ""
        following = tokens[index + 1][1] if index + 1 < len(tokens) else ""
        if kind == "word" and previous != ".":
            if value == "import" and following not in (".", ":"):
                raise ValueError("Frontend must not import other JS/CSS")
            if value in ("require", "importScripts") and following == "(":
                raise ValueError("Frontend must not load other scripts")
            if value == "export" and following in ("{", "*"):
                for item in tokens[index + 1 :]:
                    if item[1] == ";":
                        break
                    if item == ("word", "from"):
                        raise ValueError("Frontend must not re-export imports")
        if kind == "string" and (
            "@import" in value.lower()
            or re.fullmatch(r"[^\s<>]*\.css(?:[?#][^\s<>]*)?", value, re.I)
        ):
            raise ValueError("Frontend must not depend on external CSS")
    for extra in path.parent.rglob("*"):
        if (
            extra.is_file()
            and extra != path
            and extra.suffix in (".js", ".css")
        ):
            raise ValueError("Frontend build must not contain JS/CSS chunks")


def _source_files(root: Path) -> tuple[dict, dict[str, bytes]]:
    manifest = json.loads((root / "plugin.json").read_text(encoding="utf-8"))
    if manifest.get("id") != PLUGIN_ID:
        raise ValueError(f"Expected plugin id {PLUGIN_ID}")
    version = manifest.get("version", "")
    if not isinstance(version, str) or not re.fullmatch(
        r"\d+\.\d+\.\d+",
        version,
    ):
        raise ValueError("A three-part preview version is required")
    entries = manifest.get("entry", {})
    expected = {"backend": "backend/plugin.py", "frontend": FRONTEND_ENTRY}
    if entries != expected:
        raise ValueError(f"Expected both declared runtime entries: {expected}")
    paths = set(REQUIRED_FILES)
    paths.update(
        path.relative_to(root).as_posix()
        for path in (root / "backend").rglob("*.py")
    )
    files = {}
    for relative in sorted(paths):
        path = root / PurePosixPath(relative)
        if not path.is_file() or any(
            item.is_symlink()
            for item in (path, *path.parents)
            if item != root.parent
        ):
            raise ValueError(
                f"Required regular file missing or symlinked: {relative}",
            )
        if not path.resolve().is_relative_to(root):
            raise ValueError(f"File escapes plugin root: {relative}")
        files[relative] = path.read_bytes()
    # Deliberately validate every entry, not the host's any-entry fallback.
    for entry in entries.values():
        if entry not in files:
            raise ValueError(f"Declared entry missing from whitelist: {entry}")
    _validate_frontend(root / FRONTEND_ENTRY)
    return manifest, files


def build_archive(plugin_root: Path, output: Path) -> Path:
    """Validate and atomically build the ZIP; do not import or install it."""
    root = plugin_root.resolve(strict=True)
    output = output.resolve()
    if output.is_relative_to(root) or output.suffix != ".zip":
        raise ValueError(
            "Output must be a .zip outside the plugin source tree",
        )
    _, files = _source_files(root)
    output.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{output.stem}-",
        suffix=".tmp",
        dir=output.parent,
    )
    os.close(descriptor)
    temporary = Path(temporary_name)
    try:
        # ZIP_STORED avoids compression-library version differences and bounds
        # the actual delivered archive, including its metadata, to 10 MiB.
        with zipfile.ZipFile(
            temporary,
            "w",
            compression=zipfile.ZIP_STORED,
        ) as archive:
            for relative, content in sorted(files.items()):
                info = zipfile.ZipInfo(
                    f"{PLUGIN_ID}/{relative}",
                    (1980, 1, 1, 0, 0, 0),
                )
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                archive.writestr(info, content)
        if temporary.stat().st_size > MAX_ARCHIVE_BYTES:
            raise ValueError("Runtime ZIP exceeds the 10 MiB delivery limit")
        os.replace(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)
    return output


def write_evidence(archive: Path) -> dict:
    """Write SHA-256 and the exact archive member manifest beside the ZIP."""
    members = []
    with zipfile.ZipFile(archive) as package:
        for item in package.infolist():
            members.append(
                {
                    "path": item.filename,
                    "size": item.file_size,
                    "sha256": hashlib.sha256(package.read(item)).hexdigest(),
                },
            )
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    evidence = {
        "archive": archive.name,
        "size": archive.stat().st_size,
        "max_size": MAX_ARCHIVE_BYTES,
        "sha256": digest,
        "files": members,
    }
    archive.with_suffix(".zip.sha256").write_text(
        f"{digest}  {archive.name}\n",
        encoding="utf-8",
        newline="\n",
    )
    archive.with_suffix(".zip.manifest.json").write_text(
        json.dumps(evidence, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    return evidence


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    manifest, _ = _source_files(root)
    output = args.output_dir / f"{PLUGIN_ID}-{manifest['version']}.zip"
    archive = build_archive(root, output)
    evidence = write_evidence(archive)
    print(json.dumps(evidence, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
