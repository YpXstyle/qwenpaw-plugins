# -*- coding: utf-8 -*-
"""Prepare local release evidence only after explicit human acceptance."""

import argparse
from importlib import import_module
import datetime
import json
import re
from pathlib import Path

collection = import_module(
    f"{__package__}._collection" if __package__ else "_collection",
)
digest = collection.digest
find_plugin = collection.find_plugin
read_json = collection.read_json
source_hashes = collection.source_hashes
verify_archive = collection.verify_archive


def check_release(plugin_id: str, validation: dict, acceptance: dict) -> dict:
    """Bind acceptance to the tested version, archive and current source."""
    _, manifest = find_plugin(plugin_id)
    if validation.get("status") != "passed":
        raise ValueError("Automated validation has not passed")
    for key, expected in (
        ("plugin_id", plugin_id),
        ("version", manifest["version"]),
    ):
        if validation.get(key) != expected or acceptance.get(key) != expected:
            raise ValueError(
                f"Validation/acceptance {key} does not match source",
            )
    if validation.get("source_hashes") != source_hashes(plugin_id):
        raise ValueError(
            "Source changed after validation; validate the final source again",
        )
    archive = Path(validation["archive"])
    expected_sha = digest(archive)
    if validation.get("archive_sha256") != expected_sha:
        raise ValueError("Archive changed after automated validation")
    verify_archive(plugin_id, archive)
    if acceptance.get("result") != "passed":
        raise ValueError(
            "Human acceptance is pending; no release may be prepared",
        )
    if acceptance.get("archive_sha256") != expected_sha:
        raise ValueError("Human acceptance is for a different archive")
    tester = acceptance.get("tested_by", "").strip()
    if not tester or "REPLACE" in tester:
        raise ValueError("Human tester identity is required")
    tested_at = datetime.datetime.fromisoformat(
        acceptance["tested_at"].replace("Z", "+00:00"),
    )
    if tested_at.tzinfo is None:
        raise ValueError("Human acceptance time must include a timezone")
    checked_at = datetime.datetime.fromisoformat(
        validation["checked_at"].replace("Z", "+00:00"),
    )
    if tested_at < checked_at or tested_at > datetime.datetime.now(
        datetime.timezone.utc,
    ):
        raise ValueError(
            "Human acceptance must follow validation "
            "and cannot be in the future",
        )
    if re.fullmatch(r"[0-9a-f]{64}", expected_sha) is None:
        raise ValueError("Invalid archive SHA-256")
    return {
        "plugin_id": plugin_id,
        "version": manifest["version"],
        "archive": str(archive),
        "archive_sha256": expected_sha,
        "tag": f"{plugin_id}-v{manifest['version']}",
        "tested_by": tester,
        "tested_at": tested_at.isoformat(),
        "status": "local-release-prepared",
        "published": False,
    }


def main() -> None:
    """Emit local notes; this command has no network or Git mutations."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plugin", required=True)
    parser.add_argument("--validation", type=Path, required=True)
    parser.add_argument("--acceptance", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("dist"))
    args = parser.parse_args()
    record = check_release(
        args.plugin,
        read_json(args.validation),
        read_json(args.acceptance),
    )
    destination = args.output_dir / args.plugin / record["version"]
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "RELEASE.json").write_text(
        json.dumps(record, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (destination / "RELEASE-CANDIDATE.md").write_text(
        f"# {args.plugin} {record['version']}\n\n"
        "Local evidence prepared; not published.\n\n"
        f"Tag: `{record['tag']}`\n\n"
        f"SHA-256: `{record['archive_sha256']}`\n\n"
        "Author: Yance <xstyle@qq.com>\n\n"
        "Use this exact ZIP only. Source upload, GitHub Release and "
        "marketplace submission require the user's release authorization.\n",
        encoding="utf-8",
    )
    print(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
