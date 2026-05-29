import logging
import sys
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("las.config")


class _Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent / ".env",
        env_prefix="LAS_",
        extra="ignore",
    )

    db_path: str = "data/las.db"
    secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    llm_provider: str = "openai"
    llm_model: str = "deepseek-v4-pro"
    llm_api_key: str = ""
    llm_base_url: str = "https://api.deepseek.com/v1"
    llm_max_tokens: int = 32000
    llm_temperature: float = 0.4

    smtp_host: str = "smtp.163.com"
    smtp_port: int = 465
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_from: str = ""

    dev: bool = False
    cors_origins: str = ""
    prompt_version: str = "v2"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


_cfg = _Settings()

# ── Backward-compatible uppercase exports ──
DB_PATH = _cfg.db_path
SECRET_KEY = _cfg.secret_key
JWT_ALGORITHM = _cfg.jwt_algorithm
JWT_EXPIRE_HOURS = _cfg.jwt_expire_hours

LLM_PROVIDER = _cfg.llm_provider
LLM_MODEL = _cfg.llm_model
LLM_API_KEY = _cfg.llm_api_key
LLM_BASE_URL = _cfg.llm_base_url
LLM_MAX_TOKENS = _cfg.llm_max_tokens
LLM_TEMPERATURE = _cfg.llm_temperature

SMTP_HOST = _cfg.smtp_host
SMTP_PORT = _cfg.smtp_port
SMTP_USER = _cfg.smtp_user
SMTP_PASS = _cfg.smtp_pass
SMTP_FROM = _cfg.smtp_from

DEV_MODE = _cfg.dev
CORS_ORIGINS = _cfg.cors_origin_list
PROMPT_VERSION = _cfg.prompt_version

# ── Startup validation ──
_DEFAULT_SECRET = "dev-secret-change-in-production"
if SECRET_KEY == _DEFAULT_SECRET and not DEV_MODE:
    logger.critical("LAS_SECRET_KEY 仍为默认值，拒绝在非开发模式下启动")
    sys.exit(1)
if DEV_MODE:
    logger.warning("DEV_MODE 已启用 — 认证完全跳过，仅用于本地开发")
if not LLM_API_KEY:
    logger.warning("LLM_API_KEY 未设置，分析功能将无法使用")
