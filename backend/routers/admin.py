import logging
import random
import string
from backend.config import BJ_TZ
from datetime import datetime, timedelta, timezone

def _bjt(dt):
    """Convert UTC datetime to Beijing time (UTC+8) ISO string."""
    if not dt: return ""
    return (dt + timedelta(hours=8)).isoformat()

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.models.orm import User, Work, Analysis, InviteCode, get_session
from backend.routers.deps import get_user

logger = logging.getLogger("las.admin")
router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(user: User = Depends(get_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "需要管理员权限")
    return user


@router.get("/stats")
def get_stats(user: User = Depends(require_admin), db: Session = Depends(get_session)):
    today = datetime.now(BJ_TZ).replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    total_users = db.query(User).filter(User.is_deleted == False).count()
    total_works = db.query(Work).count()
    total_analyses = db.query(Analysis).count()
    today_works = db.query(Work).filter(Work.created_at >= today).count()
    today_analyses = db.query(Analysis).filter(Analysis.created_at >= today).count()
    guest_count = db.query(User).filter(User.role == "guest", User.is_deleted == False).count()
    available_invites = db.query(InviteCode).filter(InviteCode.is_used == False).count()
    return {
        "ok": True,
        "stats": {
            "total_users": total_users,
            "total_works": total_works,
            "total_analyses": total_analyses,
            "today_works": today_works,
            "today_analyses": today_analyses,
            "guest_count": guest_count,
            "available_invites": available_invites,
        },
    }


@router.get("/users")
def list_users(
    limit: int = Query(default=20, le=100),
    offset: int = 0,
    search: str = "",
    user: User = Depends(require_admin),
    db: Session = Depends(get_session),
):
    q = db.query(User).filter(User.is_deleted == False)
    if search:
        q = q.filter(User.username.contains(search) | User.email.contains(search))
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    items = []
    for u in users:
        work_count = db.query(Work).filter(Work.user_id == u.id).count()
        analysis_count = (
            db.query(Analysis)
            .join(Work, Analysis.work_id == Work.id)
            .filter(Work.user_id == u.id)
            .count()
        )
        items.append({
            "id": u.id,
            "username": u.username,
            "email": u.email or "",
            "role": u.role,
            "email_verified": u.email_verified,
            "created_at": _bjt(u.created_at),
            "work_count": work_count,
            "analysis_count": analysis_count,
        })
    return {"ok": True, "items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/works")
def list_works(
    limit: int = Query(default=20, le=100),
    offset: int = 0,
    mode: str = "",
    search: str = "",
    user: User = Depends(require_admin),
    db: Session = Depends(get_session),
):
    q = db.query(Work)
    if mode and mode in ("original", "classic"):
        q = q.filter(Work.mode == mode)
    if search:
        q = q.filter(Work.title.contains(search))
    total = q.count()
    works = q.order_by(Work.created_at.desc()).offset(offset).limit(limit).all()
    items = []
    for w in works:
        owner = db.query(User).filter(User.id == w.user_id).first()
        latest = (
            db.query(Analysis)
            .filter(Analysis.work_id == w.id)
            .order_by(Analysis.created_at.desc())
            .first()
        )
        items.append({
            "id": w.id,
            "title": w.title,
            "author": w.author or "",
            "mode": w.mode,
            "user_id": w.user_id,
            "username": owner.username if owner else "?",
            "created_at": _bjt(w.created_at),
            "latest_status": latest.status if latest else None,
            "latest_score": latest.wcs_score if latest else None,
            "latest_tier": latest.tier if latest else None,
        })
    return {"ok": True, "items": items, "total": total, "limit": limit, "offset": offset}


@router.post("/invite-codes")
def generate_invite_codes(
    count: int = Query(default=5, ge=1, le=20),
    user: User = Depends(require_admin),
    db: Session = Depends(get_session),
):
    codes = []
    for _ in range(count):
        code = "LAS-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=4)) + "-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        inv = InviteCode(code=code)
        db.add(inv)
        codes.append(code)
    db.commit()
    return {"ok": True, "codes": codes, "count": len(codes)}


@router.get("/invite-codes")
def list_invite_codes(
    limit: int = Query(default=30, le=100),
    offset: int = 0,
    user: User = Depends(require_admin),
    db: Session = Depends(get_session),
):
    total = db.query(InviteCode).count()
    codes = db.query(InviteCode).order_by(InviteCode.created_at.desc()).offset(offset).limit(limit).all()
    # Batch user lookup — avoid N+1
    used_ids = [c.used_by for c in codes if c.used_by]
    user_map = {}
    if used_ids:
        users = db.query(User).filter(User.id.in_(used_ids)).all()
        user_map = {u.id: u.username for u in users}
    items = []
    for c in codes:
        items.append({
            "id": c.id,
            "code": c.code,
            "created_at": _bjt(c.created_at),
            "is_used": c.is_used,
            "used_by": user_map.get(c.used_by) if c.used_by else None,
            "used_at": _bjt(c.used_at),
        })
    return {"ok": True, "items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/analyses")
def list_analyses(
    limit: int = Query(default=30, le=100),
    offset: int = 0,
    status: str = "",
    user: User = Depends(require_admin),
    db: Session = Depends(get_session),
):
    """List recent analyses with user/work info — admin only, no report content."""
    q = (
        db.query(Analysis, User.username, User.role, Work.title)
        .join(Work, Analysis.work_id == Work.id)
        .join(User, Work.user_id == User.id)
    )
    if status and status in ("done", "failed", "running"):
        q = q.filter(Analysis.status == status)
    total = q.count()
    rows = (
        q.order_by(Analysis.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    items = []
    for a, username, role, title in rows:
        items.append({
            "id": a.id,
            "username": username,
            "role": role,
            "title": title,
            "status": a.status,
            "model": a.model or "default",
            "wcs_score": round(a.wcs_score, 1) if a.wcs_score else None,
            "tier": a.tier or "",
            "tokens": {
                "prompt": a.prompt_tokens or 0,
                "completion": a.completion_tokens or 0,
                "total": a.total_tokens or 0,
            },
            "report_number": a.report_number,
            "report_prefix": a.report_prefix or "",
            "created_at": _bjt(a.created_at),
        })
    return {"ok": True, "items": items, "total": total, "limit": limit, "offset": offset}
