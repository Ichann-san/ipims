"""The deployment must reject incomplete or unexpected runtime artifacts."""
import hashlib
import importlib.util
import io
from pathlib import Path
import zipfile

import pytest

SPEC = importlib.util.spec_from_file_location(
    "prepare_deployment", Path(__file__).resolve().parents[2] / "scripts/prepare_deployment.py",
)
bundle = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(bundle)


def archive(names):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as target:
        for name in names:
            target.writestr(name, b"fixture")
    return stream.getvalue()


def test_verified_bundle_extracts_only_runtime_files(tmp_path, monkeypatch):
    monkeypatch.setattr(bundle, "ROOT", tmp_path)
    data = archive(bundle.GRAPH_FILES)
    bundle.extract_graph(data, hashlib.sha256(data).hexdigest())
    assert (tmp_path / "ml/artifacts/surabaya/graph/nodes.csv").read_bytes() == b"fixture"


def test_corrupt_bundle_fails_before_writing(tmp_path, monkeypatch):
    monkeypatch.setattr(bundle, "ROOT", tmp_path)
    with pytest.raises(ValueError, match="checksum"):
        bundle.extract_graph(archive(bundle.GRAPH_FILES), "incorrect")
    assert not (tmp_path / "ml").exists()


@pytest.mark.parametrize("names", [
    {"surabaya/graph/nodes.csv"},
    bundle.GRAPH_FILES | {"../unexpected"},
])
def test_incomplete_or_unexpected_manifest_fails(tmp_path, monkeypatch, names):
    monkeypatch.setattr(bundle, "ROOT", tmp_path)
    data = archive(names)
    with pytest.raises(ValueError, match="manifest"):
        bundle.extract_graph(data, hashlib.sha256(data).hexdigest())
    assert not (tmp_path / "ml").exists()
