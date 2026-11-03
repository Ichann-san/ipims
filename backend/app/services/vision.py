"""Adapter to the CV package. Returns None when no model is available, so reports still flow."""
import logging
import threading

from PIL import Image

log = logging.getLogger(__name__)

# The model is loaded once, under a lock: concurrent first imports of transformers can fail
# half-way and must not be cached as "unavailable".
_lock = threading.Lock()
_state: dict = {"analyzer": None, "tried": False}


def _analyzer():
    with _lock:
        if not _state["tried"]:
            try:
                from ml.cv.infer import Analyzer

                _state["analyzer"] = Analyzer.load()
            except Exception as exc:  # model missing or dependency not installed
                log.warning("CV model unavailable: %s", exc)
            _state["tried"] = True
        return _state["analyzer"]


def warm() -> None:
    _analyzer()


def available() -> bool:
    """True once the model is loaded. Never blocks, so /health stays fast while it loads."""
    return _state["analyzer"] is not None


def analyze(image: Image.Image) -> dict | None:
    analyzer = _analyzer()
    if analyzer is None:
        return None
    try:
        return analyzer.analyze(image)
    except Exception:
        log.exception("CV analysis failed")
        return None
