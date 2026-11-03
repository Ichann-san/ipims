import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import init_db
from .routers import admin, public
from .services import network, vision


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    # Load the CV model and road graph in the background so the first request is not slow.
    threading.Thread(target=lambda: (vision.warm(), network.available()), daemon=True).start()
    yield


app = FastAPI(title="IPIMS API", version="1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5288", "http://127.0.0.1:5288"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(public.router)
app.include_router(admin.router)

settings.media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")
