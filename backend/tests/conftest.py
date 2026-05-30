"""Test infrastructure — fixtures backed by SQLite temp file."""
import os
import uuid
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.models.orm import Base, get_session, User
from backend.routers.auth import hash_password, create_token


@pytest.fixture(autouse=True)
def _tmp_db():
    """Each test gets a fresh temp SQLite file."""
    fd, path = tempfile.mkstemp(suffix=".db", prefix="las_test_")
    os.close(fd)
    os.environ["LAS_DB_PATH"] = path

    engine = create_engine(
        f"sqlite:///{path}",
        echo=False,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)

    yield path, SessionLocal

    engine.dispose()
    try:
        os.remove(path)
    except OSError:
        pass


@pytest.fixture
def db(_tmp_db):
    """Fresh DB session for direct ORM access."""
    _, SessionLocal = _tmp_db
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(_tmp_db):
    """FastAPI TestClient using the same temp SQLite file."""
    from fastapi.testclient import TestClient
    from backend.main import app
    from backend.routers import deps

    _, SessionLocal = _tmp_db

    def _override():
        s = SessionLocal()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_session] = _override

    # Disable DEV_MODE so get_user() uses JWT auth, not hardcoded dev user
    saved_dev = deps.DEV_MODE
    deps.DEV_MODE = False

    with TestClient(app) as c:
        yield c

    deps.DEV_MODE = saved_dev
    app.dependency_overrides.clear()


# ── Helpers ──

def mk_user(db, username="tester", email=None, password="test1234", role="user"):
    """Create a user directly and return the ORM object."""
    u = User(
        id=str(uuid.uuid4()),
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=role,
    )
    db.add(u)
    db.commit()
    return u


def auth_token(user):
    """Create a JWT token for the given user."""
    return create_token(user.id, user.username)
