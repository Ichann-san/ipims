"""Adapter to the CV package. Returns None when no model is available, so reports still flow."""
import logging
from functools import lru_cache

from PIL import Image

log = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _analyzer():
    try:
        from ml.cv.infer import Analyzer

        return Analyzer.load()
    except Exception as exc:  # model missing or dependency not installed
        log.warning("CV model unavailable: %s", exc)
        return None


def available() -> bool:
    return _analyzer() is not None


def analyze(image: Image.Image) -> dict | None:
    analyzer = _analyzer()
    if analyzer is None:
        return None
    try:
        return analyzer.analyze(image)
    except Exception:
        log.exception("CV analysis failed")
        return None
