# -*- coding: utf-8 -*-
"""Require an explicitly selected host without copying its test harness."""

import os
from pathlib import Path

import pytest


def _host_source() -> Path:
    selected = os.environ.get("QWENPAW_HOST_SOURCE")
    if not selected:
        raise pytest.UsageError(
            "Set QWENPAW_HOST_SOURCE to the QwenPaw "
            "source checkout under test.",
        )
    source = Path(selected).expanduser().resolve()
    expected = source / "src/qwenpaw/__init__.py"
    if not expected.is_file():
        raise pytest.UsageError(
            f"QWENPAW_HOST_SOURCE is not a usable source checkout: {source}",
        )
    return source


def pytest_configure() -> None:
    """Reject an editable install from a different, possibly patched host."""
    source = _host_source()
    try:
        import qwenpaw
    except ImportError as exc:
        raise pytest.UsageError(
            "QwenPaw is unavailable; put the selected host's src directory "
            "on PYTHONPATH before starting pytest.",
        ) from exc
    loaded = Path(qwenpaw.__file__).resolve()
    expected = (source / "src/qwenpaw/__init__.py").resolve()
    if loaded != expected:
        raise pytest.UsageError(
            f"Host source mismatch: loaded {loaded}; expected {expected}. "
            "Set PYTHONPATH to the selected host source.",
        )


@pytest.fixture(scope="session")
def host_source() -> Path:
    """The explicit host checkout whose imports were verified at collection."""
    return _host_source()
