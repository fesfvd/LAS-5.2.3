import logging
import random
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.config import SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_HOURS
from backend.models.orm import User, InviteCode, VerificationCode, get_session
from backend.schemas.models import RegisterRequest, LoginRequest, TokenResponse
from backend.services.email import send_code

logger = logging.getLogger("las.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except (ValueError, TypeError):
        return False


def create_token(user_id: str, username: str, remember: bool = False) -> str:
    hours = 168 if remember else JWT_EXPIRE_HOURS  # 7 days vs 24h
    payload = {
        "sub": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=hours),
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


def _gen_code() -> str:
    return str(random.randint(100000, 999999))


def _verify_code(db: Session, email: str, code: str, purpose: str) -> bool:
    vc = (
        db.query(VerificationCode)
        .filter(
            VerificationCode.email == email,
            VerificationCode.code == code,
            VerificationCode.purpose == purpose,
            VerificationCode.used == False,
            VerificationCode.expires_at > datetime.now(timezone.utc),
        )
        .order_by(VerificationCode.created_at.desc())
        .first()
    )
    if vc:
        vc.used = True
        db.commit()
        return True
    return False


# ── Password validation ──

_MIN_PASSWORD_LEN = 6
_WEAK_PASSWORDS = {"123456", "password", "111111", "12345678", "qwerty", "abc123", "123456789", "123123"}


def _validate_password(pw: str) -> str | None:
    if len(pw) < _MIN_PASSWORD_LEN:
        return f"密码至少 {_MIN_PASSWORD_LEN} 位"
    if pw.lower() in _WEAK_PASSWORDS:
        return "密码过于常见，请更换"
    return None


# ── Routes ──


class SendCodeBody(BaseModel):
    email: str
    purpose: str = "register"


@router.post("/send-code")
def send_verification_code(req: SendCodeBody, db: Session = Depends(get_session)):
    """发送验证码。purpose: register | reset | bind"""
    email = req.email.strip().lower()
    purpose = req.purpose
    if not email or "@" not in email:
        raise HTTPException(400, "请提供有效的邮箱地址")
    if purpose not in ("register", "reset", "bind"):
        raise HTTPException(400, "无效的用途")

    # register: email must NOT exist; reset: email MUST exist; bind: no check
    if purpose == "register" and db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "该邮箱已被注册")
    if purpose == "reset" and not db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "该邮箱未注册")

    # Rate limit: 1 code per 60s per email
    recent = (
        db.query(VerificationCode)
        .filter(
            VerificationCode.email == email,
            VerificationCode.purpose == purpose,
            VerificationCode.created_at > datetime.now(timezone.utc) - timedelta(seconds=60),
        )
        .first()
    )
    if recent:
        raise HTTPException(429, "请 60 秒后再试")

    code = _gen_code()

    # Send email FIRST — don't persist code if email fails
    if not send_code(email, code, purpose):
        raise HTTPException(500, "邮件发送失败，请稍后重试")

    vc = VerificationCode(
        email=email,
        code=code,
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    db.add(vc)
    db.commit()

    return {"ok": True, "message": "验证码已发送"}


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_session)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "用户名已存在")

    email = (req.email or "").strip().lower()
    if not email:
        raise HTTPException(400, "请提供邮箱地址")

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "邮箱已注册")

    # Verify email code
    veri_code = (req.code or "").strip()
    if not _verify_code(db, email, veri_code, "register"):
        raise HTTPException(400, "验证码无效或已过期")

    # Handle invite code for role upgrade
    inv_code = (req.invite_code or "").strip().upper()
    if inv_code:
        invite = db.query(InviteCode).filter(InviteCode.code == inv_code, InviteCode.is_used == False).first()
        if not invite:
            raise HTTPException(400, "邀请码无效或已被使用")
        role = "user"
    else:
        invite = None
        role = "guest"

    err = _validate_password(req.password)
    if err:
        raise HTTPException(400, err)

    user = User(
        username=req.username,
        email=email,
        email_verified=True,
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
        email=None,
        password_hash=hash_password(guest_id),
        role="guest",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(user.id, user.username)
    return TokenResponse(access_token=token, username=user.username)


class LoginRequestV2(BaseModel):
    username: str
    password: str
    remember: bool = False


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequestV2, db: Session = Depends(get_session)):
    login_id = req.username.strip()
    if "@" in login_id:
        user = db.query(User).filter(User.email == login_id.lower()).first()
    else:
        user = db.query(User).filter(User.username == login_id).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(400, "用户名或密码错误")
    token = create_token(user.id, user.username, req.remember)
    return TokenResponse(access_token=token, username=user.username)


class ForgotPasswordBody(BaseModel):
    email: str


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordBody):
    """前端直接调用 send-code 即可，这里作为语义别名保留"""
    return {"ok": True}


class ResetPasswordBody(BaseModel):
    email: str
    code: str
    new_password: str


@router.post("/reset-password")
def reset_password(req: ResetPasswordBody, db: Session = Depends(get_session)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(400, "该邮箱未注册")

    if not _verify_code(db, email, req.code, "reset"):
        raise HTTPException(400, "验证码无效或已过期")

    err = _validate_password(req.new_password)
    if err:
        raise HTTPException(400, err)

    user.password_hash = hash_password(req.new_password)
    user.email_verified = True
    db.commit()
    return {"ok": True, "message": "密码已重置"}
