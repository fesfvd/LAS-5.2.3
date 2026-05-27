import logging
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.orm import User, InviteCode, get_session
from backend.schemas.models import RegisterRequest, LoginRequest, TokenResponse
from backend.config import SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_HOURS

logger = logging.getLogger("las.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except (ValueError, TypeError):
        return False


def create_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user = db.query(User).filter(User.id == payload["sub"]).first()
        if not user:
            raise HTTPException(401, "用户不存在")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token 已过期")
    except jwt.PyJWTError:
        raise HTTPException(401, "Token 无效")


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_session)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "用户名已存在")
    if req.email and db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "邮箱已注册")

    code = req.invite_code.strip().upper() if req.invite_code else ""
    if code:
        invite = (
            db.query(InviteCode)
            .filter(InviteCode.code == code)
            .first()
        )
        if not invite:
            raise HTTPException(400, "邀请码无效")
        if invite.is_used:
            raise HTTPException(400, "邀请码已被使用")
        role = "user"
    else:
        invite = None
        role = "guest"

    user = User(
        username=req.username,
        email=req.email or "",
        password_hash=hash_password(req.password),
        role=role,
    )
    db.add(user)
    db.flush()

    if invite:
        invite.is_used = True
        invite.used_by = user.id
        invite.used_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)
    token = create_token(user.id, user.username)
    return TokenResponse(access_token=token, username=user.username)


@router.post("/guest", response_model=TokenResponse)
def guest_login(db: Session = Depends(get_session)):
    import uuid as _uuid
    guest_id = "guest_" + str(_uuid.uuid4())[:8]
    user = User(
        username=guest_id,
        email="",
        password_hash=hash_password(guest_id),
        role="guest",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(user.id, user.username)
    return TokenResponse(access_token=token, username=user.username)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_session)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(400, "用户名或密码错误")
    token = create_token(user.id, user.username)
    return TokenResponse(access_token=token, username=user.username)
