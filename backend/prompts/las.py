import os

_HERE = os.path.dirname(os.path.abspath(__file__))

_SHARED = os.path.join(_HERE, "las-shared.MD")
_ORIGINAL = os.path.join(_HERE, "las-original.MD")
_CLASSIC = os.path.join(_HERE, "las-classic.MD")
_LEGACY = os.path.join(_HERE, "LAS v5.2.3 json-mode.MD")
_V1 = os.path.join(_HERE, "LAS v5.2.3 beta v0.md")

with open(_SHARED, "r", encoding="utf-8") as f:
    SHARED_PROMPT = f.read()

with open(_ORIGINAL, "r", encoding="utf-8") as f:
    ORIGINAL_MODE = f.read()

with open(_CLASSIC, "r", encoding="utf-8") as f:
    CLASSIC_MODE = f.read()


def get_system_prompt(version: str = "", mode: str = "original") -> str:
    if version == "v1":
        with open(_V1, "r", encoding="utf-8") as f:
            return f.read()
    if version == "legacy":
        with open(_LEGACY, "r", encoding="utf-8") as f:
            return f.read()
    if mode == "classic":
        return SHARED_PROMPT + "\n\n" + CLASSIC_MODE
    return SHARED_PROMPT + "\n\n" + ORIGINAL_MODE
