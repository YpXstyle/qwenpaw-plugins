# -*- coding: utf-8 -*-
"""Build one local plugin ZIP; never install, publish or access GitHub."""

import argparse
from importlib import import_module
import json
from pathlib import Path

collection = import_module(
    f"{__package__}._collection" if __package__ else "_collection",
)
build_package = collection.build_package


def main() -> None:
    """Select a plugin without coupling other plugins' release versions."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plugin", required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("dist"))
    args = parser.parse_args()
    archive, evidence = build_package(args.plugin, args.output_dir)
    print(json.dumps({"archive": str(archive), **evidence}, indent=2))


if __name__ == "__main__":
    main()
