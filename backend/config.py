import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

logger = logging.getLogger("las.config")

DB_PATH = os.getenv("LAS_DB_PATH", "data/las.db")
SECRET_KEY = os.getenv("LAS_SECRET_KEY", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("LAS_JWT_EXPIRE_HOURS", "24"))

LLM_PROVIDER = os.getenv("LAS_LLM_PROVIDER", "openai")
LLM_MODEL = os.getenv("LAS_LLM_MODEL", "gpt-4o")
LLM_API_KEY = os.getenv("LAS_LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LAS_LLM_BASE_URL", "https://api.openai.com/v1")
LLM_MAX_TOKENS = int(os.getenv("LAS_LLM_MAX_TOKENS", "16000"))
LLM_TEMPERATURE = float(os.getenv("LAS_LLM_TEMPERATURE", "0.4"))

DEV_MODE = os.getenv("LAS_DEV", "").lower() == "true"
CORS_ORIGINS = [o.strip() for o in os.getenv("LAS_CORS_ORIGINS", "").split(",") if o.strip()]
PROMPT_VERSION = os.getenv("LAS_PROMPT_VERSION", "v2")

_DEFAULT_SECRET = "dev-secret-change-in-production"
if SECRET_KEY == _DEFAULT_SECRET and not DEV_MODE:
    logger.critical("LAS_SECRET_KEY 仍为默认值，拒绝在非开发模式下启动")
    sys.exit(1)
if DEV_MODE:
    logger.warning("⚠ DEV_MODE 已启用 — 认证完全跳过，仅用于本地开发")
if not LLM_API_KEY:
    logger.warning("⚠ LLM_API_KEY 未设置，分析功能将无法使用")
