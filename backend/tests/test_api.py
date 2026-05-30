"""Tests for API endpoints — auth, works, users."""
import uuid
import pytest
from unittest.mock import patch, MagicMock

from backend.models.orm import InviteCode, Work
from backend.routers.auth import _check_login_rate
from backend.tests.conftest import mk_user, auth_token


# ═══════════════ Auth endpoints ═══════════════

class TestLogin:
    def test_login_success(self, client, db):
        user = mk_user(db, "logintest", email="login@test.com")
        r = client.post("/api/auth/login", json={
            "username": "logintest", "password": "test1234",
        })
        assert r.status_code == 200
        assert r.json()["username"] == "logintest"
        assert "access_token" in r.json()

    def test_login_by_email(self, client, db):
        mk_user(db, "emailuser", email="email@test.com")
        r = client.post("/api/auth/login", json={
            "username": "email@test.com", "password": "test1234",
        })
        assert r.status_code == 200
        assert r.json()["username"] == "emailuser"

    def test_login_wrong_password(self, client, db):
        mk_user(db, "wrongpwd", email="wp@test.com")
        r = client.post("/api/auth/login", json={
            "username": "wrongpwd", "password": "wrong",
        })
        assert r.status_code == 400
        assert "用户名或密码错误" in r.json()["detail"]

    def test_login_nonexistent(self, client):
        r = client.post("/api/auth/login", json={
            "username": "ghost", "password": "doesntmatter",
        })
        assert r.status_code == 400

    def test_login_rate_limit(self, client):
        """5 failed attempts → 6th blocked."""
        for _ in range(5):
            client.post("/api/auth/login", json={
                "username": "rate_bucket", "password": "wrong",
            })
        r = client.post("/api/auth/login", json={
            "username": "rate_bucket", "password": "wrong",
        })
        assert r.status_code == 429
        assert "15 分钟" in r.json()["detail"]


class TestGuestLogin:
    def test_guest_returns_token(self, client):
        r = client.post("/api/auth/guest", json={})
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["username"].startswith("guest_")


# ═══════════════ User endpoints ═══════════════

class TestMe:
    def test_auth_required(self, client):
        r = client.get("/api/users/me")
        assert r.status_code == 401

    def test_returns_user_info(self, client, db):
        user = mk_user(db, "metest", email="me@test.com")
        tok = auth_token(user)
        r = client.get("/api/users/me", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["username"] == "metest"
        assert u["role"] == "user"
        assert "total_works" in u
        assert "analysis_count" in u

    def test_deleted_user_rejected(self, client, db):
        user = mk_user(db, "deleted", email="del@test.com")
        user.is_deleted = True
        db.commit()
        tok = auth_token(user)
        r = client.get("/api/users/me", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 401
        assert "注销" in r.json()["detail"]


class TestChangeUsername:
    def test_valid_change(self, client, db):
        user = mk_user(db, "oldname", email="name@test.com")
        tok = auth_token(user)
        r = client.put("/api/users/username",
                       json={"username": "newname"},
                       headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        assert r.json()["username"] == "newname"

    def test_duplicate_rejected(self, client, db):
        mk_user(db, "taken", email="taken@test.com")
        user2 = mk_user(db, "myname", email="my@test.com")
        tok = auth_token(user2)
        r = client.put("/api/users/username",
                       json={"username": "taken"},
                       headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 400

    def test_too_short(self, client, db):
        user = mk_user(db, "shortname", email="short@test.com")
        tok = auth_token(user)
        r = client.put("/api/users/username",
                       json={"username": "x"},
                       headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 400


class TestDeleteAccount:
    def test_soft_delete(self, client, db):
        user = mk_user(db, "softdel", email="soft@test.com")
        tok = auth_token(user)
        r = client.delete("/api/users/me",
                          headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        assert "标记删除" in r.json()["message"]

        # token should now be invalid
        r2 = client.get("/api/users/me",
                        headers={"Authorization": f"Bearer {tok}"})
        assert r2.status_code == 401


# ═══════════════ Upgrade ═══════════════

class TestUpgrade:
    def test_guest_upgrade_success(self, client, db):
        user = mk_user(db, "guest_up", email="guest@test.com", role="guest")
        tok = auth_token(user)
        inv = InviteCode(code="UPGRADE01")
        db.add(inv)
        db.commit()
        r = client.post("/api/auth/upgrade",
                        json={"invite_code": "UPGRADE01"},
                        headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        assert r.json()["role"] == "user"

    def test_already_user_rejected(self, client, db):
        user = mk_user(db, "already", email="al@test.com", role="user")
        tok = auth_token(user)
        r = client.post("/api/auth/upgrade",
                        json={"invite_code": "ANY"},
                        headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 400
        assert "已是正式用户" in r.json()["detail"]

    def test_invalid_code_rejected(self, client, db):
        user = mk_user(db, "guest_inv", email="gi@test.com", role="guest")
        tok = auth_token(user)
        r = client.post("/api/auth/upgrade",
                        json={"invite_code": "NOSUCH"},
                        headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 400

    def test_used_code_rejected(self, client, db):
        inv = InviteCode(code="USED0001", is_used=True)
        db.add(inv)
        db.commit()
        user = mk_user(db, "guest_used", email="gu@test.com", role="guest")
        tok = auth_token(user)
        r = client.post("/api/auth/upgrade",
                        json={"invite_code": "USED0001"},
                        headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 400


# ═══════════════ Works endpoints ═══════════════

class TestWorks:
    def test_list_empty(self, client, db):
        user = mk_user(db, "empty_user", email="empty@test.com")
        tok = auth_token(user)
        r = client.get("/api/works", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        assert r.json()["total"] == 0

    def test_batch_delete(self, client, db):
        user = mk_user(db, "batcher", email="batch@test.com")
        w1 = Work(user_id=user.id, title="作品A", content="x")
        w2 = Work(user_id=user.id, title="作品B", content="x")
        db.add_all([w1, w2])
        db.commit()
        tok = auth_token(user)
        r = client.post("/api/works/batch-delete",
                        json=[str(w1.id), str(w2.id)],
                        headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        assert r.json()["deleted"] == 2


# ═══════════════ Health & misc ═══════════════

class TestHealth:
    def test_health_ok(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_index_html(self, client):
        r = client.get("/")
        assert r.status_code == 200
        assert "text/html" in r.headers["content-type"]


# ═══════════════ Rate limiter unit tests ═══════════════

class TestRateLimiterUnit:
    def test_allows_under_limit(self):
        assert _check_login_rate("unit_key_1", max_attempts=3, window_min=10)

    def test_blocks_over_limit(self):
        bucket = "unit_key_2"
        for _ in range(3):
            _check_login_rate(bucket, max_attempts=3, window_min=10)
        assert not _check_login_rate(bucket, max_attempts=3, window_min=10)
