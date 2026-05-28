"""Tests for llm.py JSON parsing pipeline."""
from backend.services.llm import _extract_json, _repair_truncated, _parse_json


class TestExtractJson:
    def test_simple_json(self):
        text = '{"ok": true, "score": 95.5}'
        assert _extract_json(text) == text

    def test_code_fence_removal(self):
        text = '```json\n{"ok": true}\n```'
        result = _extract_json(text)
        assert '"ok"' in result
        assert '```' not in result

    def test_code_fence_without_lang(self):
        text = '```\n{"ok": true}\n```'
        result = _extract_json(text)
        assert '"ok"' in result
        assert '```' not in result

    def test_text_before_json(self):
        text = 'Some prefix text\n{"ok": true, "value": 42}\nMore suffix'
        result = _extract_json(text)
        assert result == '{"ok": true, "value": 42}'

    def test_nested_braces(self):
        text = '{"outer": {"inner": [1, 2, {"deep": true}]}}'
        result = _extract_json(text)
        assert result == text

    def test_string_with_braces(self):
        text = '{"name": "hello {world}"}'
        result = _extract_json(text)
        assert result == text

    def test_string_with_escaped_quote(self):
        text = '{"name": "say \\"hello\\""}'
        result = _extract_json(text)
        assert result == text

    def test_escaped_backslash(self):
        text = '{"path": "C:\\\\Users\\\\test"}'
        result = _extract_json(text)
        assert result == text

    def test_no_json(self):
        assert _extract_json("no json here") is None

    def test_empty_string(self):
        assert _extract_json("") is None

    def test_array_not_object_finds_first_object(self):
        text = '[1, 2, 3] {"ok": true}'
        result = _extract_json(text)
        assert result == '{"ok": true}'

    def test_malformed_inner_brace_retries(self):
        # Inner unmatched { -- parser skips past it
        text = '{"broken": { "ok": true }'
        result = _extract_json(text)
        assert result is not None
        assert '"ok"' in result


class TestRepairTruncated:
    def test_unclosed_string(self):
        text = '{"key": "unfinished value'
        result = _repair_truncated(text)
        assert result.endswith('"') or result.endswith('}')

    def test_unclosed_object(self):
        text = '{"a": 1, "b": 2'
        result = _repair_truncated(text)
        assert result.endswith('}')

    def test_nested_unclosed(self):
        text = '{"outer": {"inner": [1, 2'
        result = _repair_truncated(text)
        assert result.endswith('}')

    def test_no_brace(self):
        assert _repair_truncated("no brace") is None

    def test_trailing_comma(self):
        text = '{"a": 1,'
        result = _repair_truncated(text)
        assert result is not None
        assert 'null' in result or '}' in result


class TestParseJson:
    def test_valid_json_fast_path(self):
        result = _parse_json('{"ok": true, "score": 100}')
        assert result["ok"] is True
        assert result["score"] == 100

    def test_ok_false_llm_error(self):
        text = '{"ok": false, "error": "insufficient content"}'
        result = _parse_json(text)
        assert result["ok"] is False
        assert "error" in result
        assert result.get("_parse_ok") is True

    def test_repair_truncated_json(self):
        text = '{"ok": true, "items": [1, 2, 3'
        result = _parse_json(text)
        assert result["ok"] is True

    def test_completely_invalid(self):
        text = "this is not json at all"
        result = _parse_json(text)
        assert result["ok"] is False
        assert "error" in result

    def test_not_a_dict(self):
        text = "[1, 2, 3]"
        result = _parse_json(text)
        assert result["ok"] is False

    def test_json_repair_fallback(self):
        # trailing comma — json_repair can fix
        text = '{"ok": true, "score": 95,}'
        result = _parse_json(text)
        assert result["ok"] is True

    def test_complex_repair(self):
        # unescaped quote in string + truncation
        text = '{"ok": true, "analysis": "He said "hello" and walked away'
        # json_repair or manual repair can handle this
        result = _parse_json(text)
        assert result is not None  # at minimum returns something

    def test_preserves_raw_on_error(self):
        result = _parse_json("not json")
        assert "raw" in result

    def test_unicode_content(self):
        text = '{"ok": true, "author": "鲁迅", "genre": "小说"}'
        result = _parse_json(text)
        assert result["ok"] is True
        assert result["author"] == "鲁迅"
