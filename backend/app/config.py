from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_prefix="IPIMS_")

    database_url: str = "postgresql+psycopg://ipims:ipims@127.0.0.1:5433/ipims"
    media_dir: Path = BACKEND_DIR / "media"
    artifacts_dir: Path = REPO_DIR / "ml" / "artifacts"
    region: str = "surabaya"
    jwt_secret: str = "dev-only-insecure-secret-change-in-env"
    token_hours: int = 12
    admin_username: str = "admin"
    admin_password: str = "admin123"
    max_photo_bytes: int = 8 * 1024 * 1024
    snap_max_m: float = 150.0


    @property
    def graph_dir(self) -> Path:
        return self.artifacts_dir / self.region / "graph"

    @property
    def gnn_dir(self) -> Path:
        return self.artifacts_dir / self.region / "gnn"


settings = Settings()

# Make the repository root importable so the backend can use the `ml` package.
import sys  # noqa: E402

if str(REPO_DIR) not in sys.path:
    sys.path.insert(0, str(REPO_DIR))

# The ml package reads the region from the environment; keep it in step with backend settings (.env included).
import os  # noqa: E402

os.environ["IPIMS_REGION"] = settings.region
