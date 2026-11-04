"""Photo persistence, keeping the public /media path independent of storage."""
import re

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from ..config import settings

_PHOTO_PATH = re.compile(r"reports/[0-9a-f]{32}\.jpg")


def _blob():
    # Optional locally; the production Python 3.12 runtime installs vercel-blob.
    from vercel.blob import BlobNotFoundError, sync

    return sync, BlobNotFoundError


def write_photo(pathname: str, data: bytes) -> None:
    if not _PHOTO_PATH.fullmatch(pathname):
        raise ValueError("Invalid photo path")
    if settings.media_storage == "blob":
        sdk, _ = _blob()
        uploaded = sdk.put_blob(
            pathname, data, access="private", content_type="image/jpeg",
            add_random_suffix=False, allow_overwrite=False,
        )
        if uploaded.pathname != pathname:
            raise RuntimeError("Photo storage returned an unexpected path")
    else:
        path = settings.media_dir / pathname
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)


def blob_photo(pathname: str) -> Response:
    if not _PHOTO_PATH.fullmatch(pathname):
        raise HTTPException(status_code=404, detail="Photo not found")
    try:
        sdk, not_found = _blob()
    except Exception:
        raise HTTPException(status_code=503, detail="Photo storage unavailable") from None
    try:
        download = sdk.get_blob(pathname, access="private")
    except not_found:
        raise HTTPException(status_code=404, detail="Photo not found") from None
    except Exception:
        raise HTTPException(status_code=503, detail="Photo storage unavailable") from None
    return Response(
        content=download.body, media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff"},
    )


def mount_media(app: FastAPI) -> None:
    if settings.media_storage == "blob":
        app.add_api_route("/media/{pathname:path}", blob_photo, methods=["GET"], name="media")
    else:
        settings.media_dir.mkdir(parents=True, exist_ok=True)
        app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")
