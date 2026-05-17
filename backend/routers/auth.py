import logging
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.orm import User, get_session
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
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "邮箱已注册")
    user = User(username=req.username, email=req.email, password_hash=hash_password(req.password))
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
