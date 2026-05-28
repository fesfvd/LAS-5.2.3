import os

_HERE = os.path.dirname(os.path.abspath(__file__))

_SHARED = os.path.join(_HERE, "las-shared.MD")
_ORIGINAL = os.path.join(_HERE, "las-original.MD")
_CLASSIC = os.path.join(_HERE, "las-classic.MD")
_LEGACY = os.path.join(_HERE, "LAS v5.2.3 json-mode.MD")
_V1 = os.path.join(_HERE, "LAS v5.2.3 beta v0.md")

_cache = {}


def _load(path):
    if path not in _cache:
        with open(path, "r", encoding="utf-8") as f:
            _cache[path] = f.read()
    return _cache[path]


def get_system_prompt(version: str = "", mode: str = "original") -> str:
    if version == "v1":
        return _load(_V1)
    if version == "legacy":
        return _load(_LEGACY)
    if mode == "classic":
        return _load(_SHARED) + "\n\n" + _load(_CLASSIC)
    return _load(_SHARED) + "\n\n" + _load(_ORIGINAL)
