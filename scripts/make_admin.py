"""创建一个管理员账号用于本地测试。

用法:
    python scripts/make_admin.py            # 交互式输入
    python scripts/make_admin.py admin       # 指定用户名（自动生成密码）
    python scripts/make_admin.py admin 123456  # 指定用户名和密码
"""
import os
import sys
import getpass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from backend.models.orm import User, get_session


def main():
    args = sys.argv[1:]
    username = args[0] if len(args) > 0 else input("用户名: ").strip()
    password = args[1] if len(args) > 1 else getpass.getpass("密码: ").strip()
    if not password:
        password = "admin123"
        print(f"使用默认密码: {password}")

    db = next(get_session())
    try:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            existing.role = "admin"
            existing.password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            db.commit()
            print(f"用户「{username}」已设为管理员，密码已更新")
        else:
            import uuid
            user = User(
                id=str(uuid.uuid4()),
                username=username,
                email=username + "@admin.local",
                email_verified=True,
                password_hash=bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
                role="admin",
            )
            db.add(user)
            db.commit()
            print(f"管理员账号创建成功: {username} / {password}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
