"""Fetch the pinned, private runtime graph and public safetensors at build time."""
import hashlib
import io
import os
from pathlib import Path, PurePosixPath
import zipfile

ROOT = Path(__file__).resolve().parent.parent
MODEL_ID = "laion/CLIP-ViT-B-32-laion2B-s34B-b79K"
MODEL_REVISION = "1a25a446712ba5ee05982a381eed697ef9b435cf"
GRAPH_FILES = {
    "surabaya/graph/nodes.csv",
    "surabaya/graph/segments.geojson",
    "surabaya/graph/facilities.geojson",
    "surabaya/graph/impact.json",
    "surabaya/gnn/predictions.json",
    "surabaya/gnn/eval.json",
}


def extract_graph(data: bytes, expected_sha: str) -> None:
    if hashlib.sha256(data).hexdigest() != expected_sha:
        raise ValueError("Runtime artifact checksum mismatch")
    destination = ROOT / "ml" / "artifacts"
    allowed = GRAPH_FILES | {"cv/head.npz"}
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = set(archive.namelist())
        if not GRAPH_FILES.issubset(names) or not names.issubset(allowed):
            raise ValueError("Unexpected runtime artifact manifest")
        if sum(info.file_size for info in archive.infolist()) > 128 * 1024 * 1024:
            raise ValueError("Runtime artifacts exceed the build limit")
        for name in names:
            path = PurePosixPath(name)
            if path.is_absolute() or ".." in path.parts:
                raise ValueError("Invalid runtime artifact path")
            target = destination.joinpath(*path.parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(name))


def main() -> None:
    from huggingface_hub import snapshot_download
    from vercel.blob.sync import get_blob

    downloaded = get_blob(os.environ["IPIMS_RUNTIME_BLOB_PATH"], access="private")
    extract_graph(downloaded.body, os.environ["IPIMS_RUNTIME_SHA256"])
    snapshot_download(
        repo_id=MODEL_ID,
        revision=MODEL_REVISION,
        local_dir=ROOT / "deployment-artifacts" / "cv",
        allow_patterns=[
            "config.json", "preprocessor_config.json", "tokenizer_config.json",
            "tokenizer.json", "special_tokens_map.json", "vocab.json", "merges.txt",
            "model.safetensors",
        ],
    )
    print("Runtime graph verified; pinned CLIP safetensors are bundled.")


if __name__ == "__main__":
    main()
