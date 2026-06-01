import json
import logging
import logging.handlers
import os
from contextlib import asynccontextmanager
from html import escape as html_escape

from sqlalchemy import text

from pydantic import BaseModel
from fastapi import FastAPI, Body, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response

from backend.config import DEV_MODE, CORS_ORIGINS
from backend.models.orm import init_db
from backend.middleware.rate_limit import check_rate_limit
from backend.routers import auth, works, users, admin

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
    if request.url.path.startswith("/api/") and request.method in ("GET",):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


@app.middleware("http")
async def rate_limiter(request, call_next):
    if not DEV_MODE:
        check_rate_limit(request, None)  # uses client IP
    return await call_next(request)

app.include_router(auth.router)
app.include_router(works.router)
app.include_router(works.public_router)
app.include_router(users.router)
app.include_router(admin.router)

frontend_dir = os.path.join(BASE_DIR, "frontend")
data_dir = os.path.join(BASE_DIR, "data")
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
    from backend.models.orm import _engine, Analysis
    from backend.config import DB_PATH, BJ_TZ
    from datetime import datetime, timezone
    try:
        with _engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    today_count = 0
    if db_ok:
        try:
            from backend.models.orm import SessionLocal
            db = SessionLocal()
            today = datetime.now(BJ_TZ).replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
            today_count = db.query(Analysis).filter(Analysis.created_at >= today, Analysis.status == "done").count()
            db.close()
        except Exception:
            pass
    return {
        "status": "ok" if db_ok else "degraded",
        "version": "5.2.3",
        "db": db_ok,
        "today_analyses": today_count,
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
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return resp


@app.get("/share/{report_id}")
async def share_report(report_id: str):
    from backend.models.orm import SessionLocal, Analysis, Work
    db = SessionLocal()
    try:
        analysis = db.query(Analysis).filter(Analysis.id == report_id).first()
        if not analysis or not analysis.report_json:
            return Response(status_code=404)
        work = db.query(Work).filter(Work.id == analysis.work_id).first()
        r = analysis.report_json
        ac = r.get("analysis_content", {}) if isinstance(r, dict) else {}
        title = html_escape((work.title if work else "") or "")
        author = html_escape((work.author if work else "") or "")
        score = analysis.wcs_score or 0
        tier = html_escape(analysis.tier or "")
        one_liner = html_escape(ac.get("one_liner", "") if isinstance(ac, dict) else "")
        golden = html_escape(ac.get("golden_quote", "") if isinstance(ac, dict) else "")
        share_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta property="og:title" content="《{title}》— {score:.1f}分 {tier}">
<meta property="og:description" content="{one_liner}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="LAS 文学分析">
<meta name="twitter:card" content="summary">
<title>《{title}》— LAS 文学分析</title>
<style>
body{{font-family:'Noto Serif SC',Georgia,serif;background:#faf8f3;color:#1a1a1a;max-width:600px;margin:60px auto;padding:0 24px;text-align:center}}
.score{{font-size:64px;font-weight:900;color:#8b0000;line-height:1}}
.tier{{font-size:18px;color:#b8860b;margin:8px 0}}
.title{{font-size:24px;font-weight:700;margin:20px 0 8px}}
.author{{font-size:14px;color:#6b6558;margin-bottom:24px}}
.quote{{font-size:16px;line-height:1.9;color:#4a4a4a;font-style:italic;padding:20px;border-left:3px solid #b8860b;text-align:left;margin:24px 0}}
.oneliner{{font-size:14px;color:#6b6558;line-height:1.8;margin:16px 0}}
.footer{{margin-top:40px;font-size:11px;color:#888}}
.footer a{{color:#b8860b;text-decoration:none}}
</style>
</head>
<body>
<div class="score">{score:.1f}</div>
<div class="tier">{tier}</div>
<h1 class="title">《{title}》</h1>
<p class="author">{author} 著</p>
<div class="oneliner">「{one_liner}」</div>
{('<div class="quote">' + golden + '</div>') if golden else ''}
<div class="footer">由 <a href="https://lasystem.cn">LAS 文学分析系统</a> 生成 · AI 生成内容仅供参考</div>
</body>
</html>"""
        resp = Response(content=share_html, media_type="text/html; charset=utf-8")
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return resp
    finally:
        db.close()


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


import threading
_quote_lock = threading.Lock()


def _get_quotes_file() -> str:
    """Return path to quotes.json, migrating from frontend/ if needed."""
    quote_file = os.path.join(data_dir, "quotes.json")
    old_file = os.path.join(frontend_dir, "quotes.json")
    if not os.path.exists(quote_file) and os.path.exists(old_file):
        try:
            import shutil
            shutil.copy2(old_file, quote_file)
            logger.info("quotes.json 已从 frontend/ 迁移到 data/")
        except OSError:
            pass
    return quote_file


@app.post("/api/quotes")
async def contribute_quote(data: QuoteBody, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "请先登录")
    quote_file = _get_quotes_file()
    with _quote_lock:
        try:
            with open(quote_file, "r", encoding="utf-8") as f:
                quotes = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            quotes = []
        quotes.append({"t": data.quote.strip(), "s": data.source.strip(), "m": data.mode})
        with open(quote_file, "w", encoding="utf-8") as f:
            json.dump(quotes, f, ensure_ascii=False, indent=2)
    return {"ok": True, "count": len(quotes)}


@app.get("/api/quotes")
async def get_quotes(mode: str = "", random: int = 0):
    quote_file = _get_quotes_file()
    try:
        with open(quote_file, "r", encoding="utf-8") as f:
            quotes = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        quotes = []
    if mode:
        quotes = [q for q in quotes if q.get("m") == mode]
    if random and random < len(quotes):
        import random as _random
        quotes = _random.sample(quotes, random)
    return {"quotes": quotes}
