import json
import logging
import re
import time
from typing import AsyncIterator, Tuple

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


def _parse_json(text: str) -> dict:
    raw = _extract_json(text)
    if not raw:
        snippet = text[:800].replace('\n', '↵')
        return {"ok": False, "error": f"无法找到 JSON 对象（总长{len(text)}字，开头: {snippet[:200]}）", "raw": text[:500]}

    try:
        return json.loads(raw)
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
        return {"ok": False, "error": f"JSON 解析失败: {e.msg}{line_col}", "raw": raw[:500]}
