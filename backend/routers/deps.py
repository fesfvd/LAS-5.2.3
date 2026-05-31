import logging

from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from backend.config import DEV_MODE
from backend.models.orm import User, get_session
from backend.routers.auth import get_current_user

logger = logging.getLogger("las.auth")
DEV_USER_ID = "dev-local-user"


def get_user(
    authorization: str = Header(None), db: Session = Depends(get_session)
) -> User:
    if DEV_MODE:
        logger.debug("DEV_MODE: 使用本地开发用户，跳过 JWT 认证")
        user = db.query(User).filter(User.id == DEV_USER_ID).first()
        if user:
            if user.role != "admin":
                user.role = "admin"
                db.commit()
            return user
        user = User(
            id=DEV_USER_ID, username="dev", email="dev@local", password_hash="dev", role="admin"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    if not authorization:
        raise HTTPException(401, "未登录")
    token = authorization[7:] if authorization.startswith("Bearer ") else authorization
    return get_current_user(token, db)
