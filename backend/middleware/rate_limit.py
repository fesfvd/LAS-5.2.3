import time
import re
from collections import defaultdict

from fastapi import Request, HTTPException

# {key: [timestamps]}
_buckets: dict[str, list[float]] = defaultdict(list)

# Route → (max_requests, window_seconds)
RULES: dict[str, tuple[int, int]] = {
    r"^/api/works/[^/]+/analyze": (3, 300),    # 3 per 5 min per user
    r"^/api/auth/login":          (10, 60),     # 10 per 1 min per IP
    r"^/api/auth/guest":          (10, 300),    # 10 per 5 min per IP
    r"^/api/auth/register":       (5, 600),     # 5 per 10 min per IP
    r"^/api/auth/send-code":      (3, 120),     # 3 per 2 min per IP
    r"^/api/quotes$":             (5, 60),      # 5 per 1 min per user (POST)
}


def _cleanup(key: str, now: float, window: int) -> None:
    cutoff = now - window
    _buckets[key] = [t for t in _buckets[key] if t > cutoff]


def check_rate_limit(request: Request, user_id: str | None) -> None:
    """Raise HTTPException(429) if rate limit exceeded."""
    path = request.url.path
    client_ip = request.client.host if request.client else "unknown"

    for pattern, (max_req, window) in RULES.items():
        if re.match(pattern, path):
            key = f"{pattern}:{user_id or client_ip}"
            now = time.time()
            _cleanup(key, now, window)
            if len(_buckets[key]) >= max_req:
                raise HTTPException(
                    429,
                    detail=f"请求过于频繁，请 {window // 60} 分钟后再试"
                    if window >= 60
                    else "请求过于频繁，请稍后再试",
                )
            _buckets[key].append(now)
            return
