"""生成邀请码 — 用于前期内测用户注册。

用法:
    python scripts/gen_invite.py 10          # 生成 10 个邀请码
    python scripts/gen_invite.py 5 --list    # 列出已有未使用的邀请码
    python scripts/gen_invite.py --stats     # 查看邀请码使用统计
"""
import os
import sys
import secrets
import string

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models.orm import InviteCode, get_session

ALPHABET = string.ascii_uppercase + string.digits  # 不含易混淆字符


def generate_codes(count: int) -> list[str]:
    """生成 count 个邀请码，格式: LAS-XXXX-XXXX"""
    codes = []
    for _ in range(count):
        part1 = "".join(secrets.choice(ALPHABET) for _ in range(4))
        part2 = "".join(secrets.choice(ALPHABET) for _ in range(4))
        codes.append(f"LAS-{part1}-{part2}")
    return codes


def main():
    if "--stats" in sys.argv:
        db = next(get_session())
        total = db.query(InviteCode).count()
        used = db.query(InviteCode).filter(InviteCode.is_used == True).count()
        print(f"总计: {total} | 已用: {used} | 可用: {total - used}")
        db.close()
        return

    if "--list" in sys.argv or "-l" in sys.argv:
        db = next(get_session())
        codes = (
            db.query(InviteCode)
            .filter(InviteCode.is_used == False)
            .order_by(InviteCode.created_at.desc())
            .all()
        )
        if not codes:
            print("没有可用的邀请码。")
        else:
            print(f"可用邀请码 ({len(codes)} 个):")
            for c in codes:
                print(f"  {c.code}")
        db.close()
        return

    count = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    codes = generate_codes(count)

    db = next(get_session())
    added = 0
    for code in codes:
        existing = db.query(InviteCode).filter(InviteCode.code == code).first()
        if existing:
            continue
        db.add(InviteCode(code=code))
        added += 1
        print(f"  {code}")
    db.commit()

    print(f"\n生成 {added} 个邀请码（跳过 {count - added} 个重复）")
    db.close()


if __name__ == "__main__":
    main()
