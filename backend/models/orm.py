import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    DateTime,
    create_engine,
    event,
    text,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

from backend.config import DB_PATH


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(16), default="user", nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    email_verified = Column(Boolean, default=False)

    works = relationship("Work", back_populates="user", cascade="all, delete-orphan")


class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    purpose = Column(String(20), nullable=False, index=True)  # "register" / "reset" / "bind"
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class InviteCode(Base):
    __tablename__ = "invite_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(32), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    used_by = Column(String(36), nullable=True)
    used_at = Column(DateTime, nullable=True)
    is_used = Column(Boolean, default=False, nullable=False, index=True)


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
    analyses = relationship(
        "Analysis", back_populates="work", cascade="all, delete-orphan"
    )


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_id = Column(String(36), ForeignKey("works.id"), nullable=False, index=True)
    report_number = Column(Integer, nullable=True, index=True)
    model = Column(String(50), default="")
    status = Column(String(20), default="pending")
    wcs_score = Column(Float, nullable=True)
    tier = Column(String(30), default="")
    tier_badge = Column(String(10), default="")
    report_json = Column(JSON, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    work = relationship("Work", back_populates="analyses")



os.makedirs(
    os.path.dirname(DB_PATH) if os.path.dirname(DB_PATH) else ".", exist_ok=True
)

_engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    connect_args={"check_same_thread": False},
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)


@event.listens_for(_engine, "connect")
def _set_sqlite_pragmas(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode = WAL")
    cursor.execute("PRAGMA synchronous = NORMAL")
    cursor.execute("PRAGMA busy_timeout = 5000")
    cursor.execute("PRAGMA cache_size = -64000")
    cursor.execute("PRAGMA wal_autocheckpoint = 1000")
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.close()


SessionLocal = sessionmaker(bind=_engine)


def init_db():
    Base.metadata.create_all(_engine)
    # Migration: add columns added after initial deploy
    with _engine.connect() as conn:
        for col, dtype in [("report_number", "INTEGER"), ("role", "VARCHAR(20)"), ("created_at", "DATETIME")]:
            try:
                conn.execute(text(f"ALTER TABLE analyses ADD COLUMN {col} {dtype}"))
                conn.commit()
            except Exception:
                pass  # column already exists
        for col, dtype in [("role", "VARCHAR(20)"), ("created_at", "DATETIME")]:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {dtype}"))
                conn.commit()
            except Exception:
                pass


def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
