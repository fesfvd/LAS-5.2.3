import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, JSON, create_engine
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

from backend.config import DB_PATH


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    works = relationship("Work", back_populates="user", cascade="all, delete-orphan")


class Work(Base):
    __tablename__ = "works"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    author = Column(String(100), default="")
    content = Column(Text, nullable=False)
    mode = Column(String(20), default="original")
    ancestor_dialogue = Column(String(5), default="false")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="works")
    analyses = relationship("Analysis", back_populates="work", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_id = Column(String(36), ForeignKey("works.id"), nullable=False, index=True)
    model = Column(String(50), default="")
    status = Column(String(20), default="pending")
    wcs_score = Column(Float, nullable=True)
    tier = Column(String(30), default="")
    tier_badge = Column(String(10), default="")
    report_json = Column(JSON, nullable=True)
    prompt_tokens = Column(Float, nullable=True)
    completion_tokens = Column(Float, nullable=True)
    total_tokens = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    work = relationship("Work", back_populates="analyses")


import os
os.makedirs(os.path.dirname(DB_PATH) if os.path.dirname(DB_PATH) else ".", exist_ok=True)

_engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
SessionLocal = sessionmaker(bind=_engine)


def init_db():
    Base.metadata.create_all(_engine)


def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
