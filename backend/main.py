import json
import logging
import logging.handlers
import os
from contextlib import asynccontextmanager

from sqlalchemy import text

from pydantic import BaseModel
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response

from backend.config import DEV_MODE, CORS_ORIGINS
from backend.models.orm import init_db
from backend.middleware.rate_limit import check_rate_limit
from backend.routers import auth, works, users

logging.basicConfig(
    level=logging.DEBUG if DEV_MODE else logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.handlers.RotatingFileHandler(
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "las.log"),
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=30,             # 保留 30 个备份 ≈ 300MB
            encoding="utf-8",
        ),
    ],
)
logger = logging.getLogger("las")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LAS v5.2.3 启动中...")
    os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
    init_db()
    # Clean up zombie analyses (stuck in "running" for >30 min)
    from backend.models.orm import SessionLocal, Analysis
    from datetime import datetime, timedelta, timezone
    session = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)
        zombies = session.query(Analysis).filter(
            Analysis.status == "running",
            Analysis.created_at < cutoff
        ).all()
        if zombies:
            for a in zombies:
                a.status = "failed"
            session.commit()
            logger.info(f"已清理 {len(zombies)} 个超时分析记录")
        # Clean up soft-deleted accounts older than 7 days
        from backend.models.orm import User as UserModel
        purge_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        purged = session.query(UserModel).filter(
            UserModel.is_deleted == True,
            UserModel.deleted_at < purge_cutoff
        ).delete()
        if purged:
            session.commit()
            logger.info(f"已清理 {purged} 个过期注销账号")
    finally:
        session.close()
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
    _cors_kwargs["allow_origins"] = (
        CORS_ORIGINS if CORS_ORIGINS else ["http://localhost:8000"]
    )

app.add_middleware(CORSMiddleware, **_cors_kwargs)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.middleware("http")
async def rate_limiter(request, call_next):
    if not DEV_MODE:
        check_rate_limit(request, None)  # uses client IP
    return await call_next(request)

app.include_router(auth.router)
app.include_router(works.router)
app.include_router(users.router)

frontend_dir = os.path.join(BASE_DIR, "frontend")
app.mount("/css", StaticFiles(directory=os.path.join(frontend_dir, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(frontend_dir, "js")), name="js")
app.mount(
    "/templates",
    StaticFiles(directory=os.path.join(frontend_dir, "templates")),
    name="templates",
)
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")


@app.get("/api/health")
def health():
    from backend.models.orm import _engine
    try:
        with _engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "version": "5.2.3",
        "db": db_ok,
    }


@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(BASE_DIR, "frontend", "index.html"))


@app.get("/app")
async def serve_spa():
    resp = FileResponse(os.path.join(frontend_dir, "spa.html"))
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return resp


@app.get("/privacy")
async def serve_privacy():
    resp = FileResponse(os.path.join(frontend_dir, "privacy.html"))
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp


@app.get("/favicon.ico")
async def favicon():
    ico = os.path.join(frontend_dir, "favicon.ico")
    if not os.path.exists(ico):
        return Response(status_code=204)
    return FileResponse(ico)


class QuoteBody(BaseModel):
    quote: str
    source: str = ""
    mode: str = "classic"


@app.post("/api/quotes")
async def contribute_quote(data: QuoteBody):
    quote_file = os.path.join(frontend_dir, "quotes.json")
    try:
        with open(quote_file, "r", encoding="utf-8") as f:
            quotes = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        quotes = []
    quotes.append({"t": data.quote.strip(), "s": data.source.strip(), "m": data.mode})
    with open(quote_file, "w", encoding="utf-8") as f:
        json.dump(quotes, f, ensure_ascii=False, indent=2)
    return {"ok": True, "count": len(quotes)}
