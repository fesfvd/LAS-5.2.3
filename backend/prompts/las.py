import os

_BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_JSON_MODE = os.path.join(_BASE, "LAS v5.2.3 json-mode.MD")

with open(_JSON_MODE, "r", encoding="utf-8") as f:
    LAS_SYSTEM_PROMPT = f.read()


def get_system_prompt(version: str = "") -> str:
    return LAS_SYSTEM_PROMPT
