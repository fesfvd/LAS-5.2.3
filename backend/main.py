import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response

from backend.config import DEV_MODE, CORS_ORIGINS
from backend.models.orm import init_db
from backend.routers import auth, works

logging.basicConfig(
    level=logging.DEBUG if DEV_MODE else logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("las")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LAS v5.2.3 启动中...")
    os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
    init_db()
    logger.info("数据库初始化完成")
    yield


app = FastAPI(title="LAS", version="5.2.3", lifespan=lifespan)

_cors_kwargs = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if DEV_MODE:
    _cors_kwargs["allow_origin_regex"] = ".*"
else:
    _cors_kwargs["allow_origins"] = CORS_ORIGINS if CORS_ORIGINS else ["http://localhost:8000"]

app.add_middleware(CORSMiddleware, **_cors_kwargs)

app.include_router(auth.router)
app.include_router(works.router)

frontend_dir = os.path.join(BASE_DIR, "frontend")
app.mount("/css", StaticFiles(directory=os.path.join(frontend_dir, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(frontend_dir, "js")), name="js")
app.mount("/templates", StaticFiles(directory=os.path.join(frontend_dir, "templates")), name="templates")
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "5.2.3"}


@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(BASE_DIR, "lascd.html"))


@app.get("/app")
async def serve_spa():
    resp = FileResponse(os.path.join(frontend_dir, "spa.html"))
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return resp


@app.get("/favicon.ico")
async def favicon():
    ico = os.path.join(frontend_dir, "favicon.ico")
    if not os.path.exists(ico):
        return Response(status_code=204)
    return FileResponse(ico)
