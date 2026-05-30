import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.models.orm import User, Analysis, Work, VerificationCode, get_session
from backend.routers.auth import (
    get_current_user,
    hash_password,
    verify_password,
    _validate_password,
    _verify_code,
)

logger = logging.getLogger("las.users")
router = APIRouter(prefix="/api/users", tags=["users"])


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


class ChangeEmailBody(BaseModel):
    email: str
    code: str


class ChangeUsernameBody(BaseModel):
    username: str


@router.get("/me")
def get_profile(authorization: str | None = Header(None), db: Session = Depends(get_session)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "请先登录")
    user = get_current_user(authorization.split(" ", 1)[1], db)

    # Count analyses
    analysis_count = (
        db.query(Analysis)
        .join(Work, Analysis.work_id == Work.id)
        .filter(Work.user_id == user.id, Analysis.report_json.isnot(None))
        .count()
    )

    # Best score
    best = (
        db.query(Analysis.wcs_score, Analysis.tier)
        .join(Work, Analysis.work_id == Work.id)
        .filter(Work.user_id == user.id, Analysis.wcs_score.isnot(None))
        .order_by(Analysis.wcs_score.desc())
        .first()
    )

    # Total works and average score
    total_works = db.query(Work).filter(Work.user_id == user.id).count()
    avg_row = (
        db.query(Analysis.wcs_score)
        .join(Work, Analysis.work_id == Work.id)
        .filter(Work.user_id == user.id, Analysis.wcs_score.isnot(None))
        .all()
    )
    avg_score = round(sum(r.wcs_score for r in avg_row) / len(avg_row), 1) if avg_row else None

    # Recent 5 works
    recent = (
        db.query(Work, Analysis.status, Analysis.wcs_score, Analysis.tier)
        .outerjoin(Analysis, Analysis.work_id == Work.id)
        .filter(Work.user_id == user.id)
        .order_by(Work.created_at.desc())
        .limit(5)
        .all()
    )
    recent_works = [{
        "id": rw[0].id,
        "title": rw[0].title,
        "mode": rw[0].mode,
        "created_at": rw[0].created_at.isoformat() if rw[0].created_at else "",
        "status": rw[1] or "none",
        "score": round(rw[2], 1) if rw[2] is not None else None,
        "tier": rw[3] or "",
    } for rw in recent]

    return {
        "ok": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email or "",
            "email_verified": user.email_verified,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else "",
            "analysis_count": analysis_count,
            "best_score": best.wcs_score if best else None,
            "best_tier": best.tier if best else None,
            "total_works": total_works,
            "avg_score": avg_score,
            "recent_works": recent_works,
        },
    }


@router.put("/password")
def change_password(
    req: ChangePasswordBody,
    authorization: str | None = Header(None),
    db: Session = Depends(get_session),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "请先登录")
    user = get_current_user(authorization.split(" ", 1)[1], db)

    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(400, "当前密码不正确")

    err = _validate_password(req.new_password)
    if err:
        raise HTTPException(400, err)

    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"ok": True, "message": "密码已修改"}


@router.put("/email")
def change_email(
    req: ChangeEmailBody,
    authorization: str | None = Header(None),
    db: Session = Depends(get_session),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "请先登录")
    user = get_current_user(authorization.split(" ", 1)[1], db)

    email = req.email.strip().lower()
    if db.query(User).filter(User.email == email, User.id != user.id).first():
        raise HTTPException(400, "该邮箱已被其他账号使用")

    if not _verify_code(db, email, req.code, "bind"):
        raise HTTPException(400, "验证码无效或已过期")

    user.email = email
    user.email_verified = True
    db.commit()
    return {"ok": True, "message": "邮箱已更新"}


@router.put("/username")
def change_username(
    req: ChangeUsernameBody,
    authorization: str | None = Header(None),
    db: Session = Depends(get_session),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "请先登录")
    user = get_current_user(authorization.split(" ", 1)[1], db)

    username = req.username.strip()
    if len(username) < 2 or len(username) > 50:
        raise HTTPException(400, "用户名 2-50 个字符")
    if db.query(User).filter(User.username == username, User.id != user.id).first():
        raise HTTPException(400, "用户名已被占用")

    user.username = username
    db.commit()
    return {"ok": True, "username": username}


@router.delete("/me")
def delete_account(
    authorization: str | None = Header(None),
    db: Session = Depends(get_session),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "请先登录")
    user = get_current_user(authorization.split(" ", 1)[1], db)
    user.is_deleted = True
    user.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "message": "账号已标记删除，7 天内可联系恢复"}
