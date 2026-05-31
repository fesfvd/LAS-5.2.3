import logging
import random
import string
from datetime import datetime, timezone

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
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
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
    limit: int = 20,
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
            "created_at": u.created_at.isoformat() if u.created_at else "",
            "work_count": work_count,
            "analysis_count": analysis_count,
        })
    return {"ok": True, "items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/works")
def list_works(
    limit: int = 20,
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
            "created_at": w.created_at.isoformat() if w.created_at else "",
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
