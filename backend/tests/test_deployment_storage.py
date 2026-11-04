import io
import sys
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image

from app.config import REPO_DIR, Settings, settings
from app.services import media, reports, vision

PATH = "reports/" + "a" * 32 + ".jpg"


def test_model_path_is_independent_of_runtime_working_directory(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    configured = Settings(_env_file=None, cv_model_path="deployment-artifacts/cv")
    assert configured.cv_model_path == REPO_DIR / "deployment-artifacts/cv"


class BlobNotFoundError(Exception):
    pass


def test_local_photo_roundtrip(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "media_storage", "local")
    monkeypatch.setattr(settings, "media_dir", tmp_path)
    path = reports.save_photo(Image.new("RGB", (12, 10)))
    app = FastAPI()
    media.mount_media(app)
    response = TestClient(app).get("/media/" + path)
    assert response.status_code == 200
    assert Image.open(io.BytesIO(response.content)).size == (12, 10)


def test_blob_photo_roundtrip_without_local_directory(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "media_storage", "blob")
    directory = tmp_path / "must-not-exist"
    monkeypatch.setattr(settings, "media_dir", directory)
    sdk = SimpleNamespace(put_blob=Mock(side_effect=lambda path, body, **kwargs: SimpleNamespace(pathname=path)))
    monkeypatch.setattr(media, "_blob", lambda: (sdk, BlobNotFoundError))
    path = reports.save_photo(Image.new("RGB", (12, 10)))
    args, kwargs = sdk.put_blob.call_args
    assert args[0] == path
    assert Image.open(io.BytesIO(args[1])).format == "JPEG"
    assert kwargs == dict(access="private", content_type="image/jpeg", add_random_suffix=False, allow_overwrite=False)
    sdk.get_blob = Mock(return_value=SimpleNamespace(body=args[1]))
    app = FastAPI()
    media.mount_media(app)
    response = TestClient(app).get("/media/" + path)
    assert response.status_code == 200
    assert response.content == args[1]
    assert response.headers["content-type"] == "image/jpeg"
    sdk.get_blob.assert_called_once_with(path, access="private")
    assert not directory.exists()


@pytest.mark.parametrize("pathname", ["reports/../secret.jpg", "https://evil.example/x", "reports/no.jpg", "reports/" + "a" * 32 + ".png"])
def test_invalid_blob_paths_never_reach_sdk(monkeypatch, pathname):
    sdk = Mock()
    monkeypatch.setattr(media, "_blob", sdk)
    with pytest.raises(Exception) as exc:
        media.blob_photo(pathname)
    assert exc.value.status_code == 404
    sdk.assert_not_called()


@pytest.mark.parametrize("error,status", [(BlobNotFoundError(), 404), (RuntimeError("credentials"), 503)])
def test_blob_read_failure(monkeypatch, error, status):
    monkeypatch.setattr(media, "_blob", lambda: (SimpleNamespace(get_blob=Mock(side_effect=error)), BlobNotFoundError))
    with pytest.raises(Exception) as exc:
        media.blob_photo(PATH)
    assert exc.value.status_code == status


def test_failed_photo_persistence_aborts_report(client, monkeypatch):
    monkeypatch.setattr(settings, "media_storage", "blob")
    monkeypatch.setattr(media, "_blob", lambda: (SimpleNamespace(put_blob=Mock(side_effect=RuntimeError("upload failed"))), BlobNotFoundError))
    data = io.BytesIO()
    Image.new("RGB", (12, 10)).save(data, "JPEG")
    with pytest.raises(RuntimeError, match="upload failed"):
        client.post("/api/v1/reports", files={"photo": ("test.jpg", data.getvalue(), "image/jpeg")}, data={"lat": -7.765, "lng": 112.195, "category": "jalan"})
    assert client.get("/api/v1/reports").json()["total"] == 0


def test_vision_forwards_model_path(monkeypatch, tmp_path):
    load = Mock(return_value=object())
    monkeypatch.setitem(sys.modules, "ml.cv.infer", SimpleNamespace(Analyzer=SimpleNamespace(load=load)))
    monkeypatch.setattr(settings, "cv_model_path", tmp_path)
    monkeypatch.setattr(vision, "_state", {"analyzer": None, "tried": False})
    assert vision._analyzer() is load.return_value
    load.assert_called_once_with(model_path=tmp_path)


@pytest.mark.parametrize("local", [False, True])
def test_model_loading_source_preserves_safetensors(monkeypatch, tmp_path, local):
    from ml.cv.infer import Analyzer, MODEL_ID
    model = Mock()
    processor = Mock()
    monkeypatch.setitem(sys.modules, "transformers", SimpleNamespace(CLIPModel=model, CLIPProcessor=processor))
    monkeypatch.setattr(Analyzer, "__init__", lambda self, *args: None)
    Analyzer.load(model_path=tmp_path if local else None)
    options = {"local_files_only": True} if local else {}
    source = str(tmp_path) if local else MODEL_ID
    model.from_pretrained.assert_called_once_with(source, use_safetensors=True, **options)
    processor.from_pretrained.assert_called_once_with(source, **options)
