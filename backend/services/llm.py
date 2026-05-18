import json
import logging
import re
import time
from typing import AsyncIterator, Tuple

from json_repair import repair_json

from openai import AsyncOpenAI

from backend.config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, LLM_MAX_TOKENS, LLM_TEMPERATURE, PROMPT_VERSION
from backend.prompts.las import get_system_prompt

logger = logging.getLogger("las.llm")
_client = AsyncOpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)


def build_user_prompt(title: str, author: str, content: str, mode: str, ancestor_dialogue: bool = False) -> str:
    header = f"以下作品需要你按上述系统指令进行文学分析。\n作品名：《{title}》"
    if author:
        header += f"\n作者：{author}"
    else:
        header += "\n作者：（请根据你的知识库确认并填写）"
    header += f"\n分析模式：{mode}"
    if ancestor_dialogue:
        header += "\n高级模块：已启用「先贤灵境」——请在报告中包含 ancestor_dialogue 模块。"

    if mode == "classic" and (not content or len(content.strip()) < 50):
        header += "\n\n注意：本作品为经典模式。用户未提供正文（或仅提供标题）。请完全基于你的训练知识库中对该作品的全文记忆进行分析。你应当在内部检索该作品的完整文本信息——包括情节、人物、语言风格、叙事结构等——并据此完成全部16维评分。在 metadata 中填写正确的作者名和体裁。"
    else:
        header += f"\n\n--- 作品正文 ---\n{content}\n--- 正文结束 ---"

    header += "\n\n请输出完整 JSON 结果（仅输出纯 JSON 格式数据）。"
    return header


async def analyze_stream(
    title: str, author: str, content: str, mode: str, model: str = "", ancestor_dialogue: bool = False
) -> Tuple[dict, AsyncIterator[dict]]:
    m = model or LLM_MODEL
    system_prompt = get_system_prompt(PROMPT_VERSION)
    user_prompt = build_user_prompt(title, author, content, mode, ancestor_dialogue)
    result_holder = {"data": None, "usage": None}
    full_text = ""
    t0 = time.time()

    async def _stream() -> AsyncIterator[dict]:
        nonlocal full_text
        logger.info("LLM 调用开始 model=%s title=%s len=%d", m, title, len(content))
        stream = await _client.chat.completions.create(
            model=m,
            max_tokens=LLM_MAX_TOKENS,
            temperature=LLM_TEMPERATURE,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
            stream_options={"include_usage": True},
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                full_text += delta.content
                yield {"type": "token", "text": delta.content}
            if hasattr(chunk, 'usage') and chunk.usage:
                total = getattr(chunk.usage, 'total_tokens', 0) or 0
                inp = getattr(chunk.usage, 'prompt_tokens', 0) or 0
                out = getattr(chunk.usage, 'completion_tokens', 0) or 0
                if total > 0:
                    result_holder["usage"] = {"prompt": inp, "completion": out, "total": total}

        # Fallback: estimate if API didn't return usage
        if not result_holder["usage"]:
            est_in = len(system_prompt) // 3 + len(user_prompt) // 3
            est_out = len(full_text) // 3
            result_holder["usage"] = {"prompt": est_in, "completion": est_out, "total": est_in + est_out}

        elapsed = round(time.time() - t0, 1)
        parsed = _parse_json(full_text)
        result_holder["data"] = parsed
        if parsed.get("ok"):
            logger.info("LLM 调用完成 model=%s elapsed=%.1fs output_len=%d", m, elapsed, len(full_text))
        else:
            logger.warning("LLM JSON 解析失败 model=%s elapsed=%.1fs error=%s", m, elapsed, parsed.get("error", ""))
        yield {"type": "done", "result": parsed}

    return result_holder, _stream()


def _extract_json(text: str) -> str | None:
    text = text.strip()
    text = re.sub(r'```(?:json)?\s*|\s*```', ' ', text)

    for attempt in range(3):
        start = text.find('{')
        if start == -1:
            return None

        depth = 0
        in_string = False
        escape = False
        for i in range(start, len(text)):
            c = text[i]
            if escape:
                escape = False
                continue
            if c == '\\':
                escape = True
                continue
            if c == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]
        text = text[start + 1:] if start + 1 < len(text) else ""
    return None


def _repair_truncated(text: str) -> str | None:
    """Try to close a truncated JSON string by appending missing quotes/brackets/braces."""
    start = text.find('{')
    if start == -1:
        return None
    s = text[start:]
    depth_obj = 0
    depth_arr = 0
    in_string = False
    escape = False
    for c in s:
        if escape:
            escape = False
            continue
        if c == '\\':
            escape = True
            continue
        if c == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if c == '{':
            depth_obj += 1
        elif c == '}':
            depth_obj -= 1
        elif c == '[':
            depth_arr += 1
        elif c == ']':
            depth_arr -= 1
    if depth_obj == 0 and depth_arr == 0 and not in_string:
        return s  # already balanced, shouldn't happen but be safe
    repaired = s.rstrip()
    last_char = repaired[-1] if repaired else ''
    if in_string:
        repaired += '"'
    if last_char == ',' or last_char == ':':
        repaired += 'null'
    while depth_arr > 0:
        repaired += ']'
        depth_arr -= 1
    while depth_obj > 0:
        repaired += '}'
        depth_obj -= 1
    return repaired


def _parse_json(text: str) -> dict:
    raw = _extract_json(text)
    used_repair = False
    if not raw:
        raw = _repair_truncated(text)
        used_repair = True
    if not raw:
        snippet = text[:800].replace('\n', '↵')
        logger.warning("LLM 输出完全无法提取 JSON（总长%d字，开头: %s）", len(text), snippet[:200])
        return {"ok": False, "error": f"无法找到 JSON 对象（总长{len(text)}字，开头: {snippet[:200]}）", "raw": text[:500]}

    # Fast path: valid JSON
    result = None
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Fallback: attempt repair (handles truncation, unescaped quotes, trailing commas, etc.)
    if result is None:
        try:
            repaired = repair_json(raw)
            result = json.loads(repaired)
            used_repair = True
            logger.warning("JSON 已自动修复（原长%d，修复后%d），可能包含截断或格式错误", len(raw), len(repaired))
        except Exception:
            pass

    # Final attempt: manual truncation repair
    if result is None:
        try:
            manual = _repair_truncated(text)
            if manual:
                result = json.loads(manual)
                used_repair = True
        except Exception:
            pass

    # All attempts failed — report detailed error
    if result is None:
        try:
            json.loads(raw)
        except json.JSONDecodeError as e:
            line_col = ""
            try:
                line_no = e.lineno
                col_no = e.colno
                lines = raw.split('\n')
                if line_no and col_no and line_no <= len(lines):
                    problem_line = lines[line_no - 1]
                    start = max(0, col_no - 40)
                    end = min(len(problem_line), col_no + 40)
                    line_col = f" 行{line_no}列{col_no}附近: ...{problem_line[start:end]}..."
            except Exception:
                pass
            logger.warning("JSON 修复失败（%d次尝试），错误: %s%s", 3 if used_repair else 1, e.msg, line_col)
            return {"ok": False, "error": f"JSON 解析失败: {e.msg}{line_col}", "raw": raw[:500]}

    # Parsed successfully — validate structure
    if not isinstance(result, dict):
        logger.warning("LLM 输出解析成功但结果不是 JSON 对象，类型: %s", type(result).__name__)
        return {"ok": False, "error": f"LLM 输出不是有效的 JSON 对象（类型: {type(result).__name__}）", "raw": str(result)[:500]}

    if not result.get("ok"):
        llm_error = result.get("error", "")
        if not llm_error:
            llm_error = "LLM 返回 ok=false 但未提供具体错误原因"
        logger.warning("LLM 分析失败（JSON 完整）: %s", llm_error)
        result["raw"] = raw[:500]
        if used_repair:
            result["error"] = f"（经自动修复）{llm_error}"
        elif not result.get("error"):
            result["error"] = llm_error
        result["_parse_ok"] = True
        return result

    return result
