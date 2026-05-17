import os
import re

_BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_ORIGINAL = os.path.join(_BASE, "LAS v5.2.3 bata.MD")
_JSON_MODE = os.path.join(_BASE, "LAS v5.2.3 json-mode.MD")

# ── V1 (legacy): 原始 MD + 裁剪拼接 JSON 输出规则 ──────────────────────

with open(_ORIGINAL, "r", encoding="utf-8") as f:
    _RAW = f.read()

_idx_cut_start = _RAW.find("<OUTPUT_RULES>")
_idx_cut_end = _RAW.find("</MAIN_REPORT_TEMPLATE>") + len("</MAIN_REPORT_TEMPLATE>")

_CORE = _RAW[:_idx_cut_start]
_EXTENDED = _RAW[_idx_cut_end:]

JSON_OUTPUT_RULES = """

<JSON_OUTPUT_RULES>

**最终输出必须为以下结构化的 JSON 格式（不要输出 Markdown 自然语言报告）。上述所有分析规则、公理、工作流、知识库为你的内部执行逻辑，严格按 13 步流程完成分析后将结果填入此 JSON。**

{
  "ok": true,
  "metadata": {
    "mode": "original",
    "genre": "小说",
    "predicted_strategy": 1,
    "genre_keywords": ["现实主义", "心理描写"]
  },
  "defect_scan": {
    "triggered": false,
    "trigger_type": "",
    "defects": [
      {"type": "情节逻辑硬伤", "bound_dimensions": [5, 7], "detail": "具体表现描述"}
    ]
  },
  "benchmarks": {
    "A": {"dimension_id": 1, "dimension_name": "语言艺术性", "work": "《xxx》", "level": "L1", "reason": "同意识流小说谱系"},
    "B": {"dimension_id": 5, "dimension_name": "叙事技巧", "work": "《xxx》", "level": "L1", "reason": "..."},
    "C": {"dimension_id": 9, "dimension_name": "主题深度", "work": "《xxx》", "level": "L2", "reason": "..."},
    "D": {"dimension_id": 13, "dimension_name": "风格独创性", "work": "《xxx》", "level": "L3", "reason": "..."}
  },
  "lower_bounds": {
    "A": "《斗罗大陆》",
    "B": "《斗罗大陆》",
    "C": "《斗罗大陆》",
    "D": "《斗罗大陆》"
  },
  "dimensions": [
    {
      "id": 1, "name": "语言艺术性", "score": 72.0, "defect_bound": null,
      "tier_name": "中等之作",
      "reverse_anchor": "明显优于",
      "reverse_detail": "相较于《斗罗大陆》功能性语言，本作第3段中'...'句式展现了...",
      "comparison_grade": "一定差距",
      "benchmark_evidence": "《xxx》通过意识流句法的断裂与重组...",
      "text_evidence": ["第3段中'...'句式展现了...", "结尾处'...'的措辞呼应了..."],
      "conclusion": "本作语言在通俗小说中属上乘，但与严肃文学谱系基准相比存在一定差距"
    }
  ],
  "analysis_content": {
    "report_id": "LAS-{日期}-{随机码}",
    "core_benchmarks_str": "《基准1》《基准2》《基准3》",
    "literary_echo": "选引经典名句",
    "literary_echo_source": "作者《作品名》",
    "overview": "300-500字内容概述",
    "golden_quote": "作品代表金句",
    "nickname": "2-8字称号",
    "one_liner": "10-20字尖锐文学化表达",
    "tags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5", "#标签6", "#标签7"],
    "best_dimension": "维度名称",
    "best_dimension_score": 85.0,
    "best_dimension_detail": "具体说明含基准比较",
    "worst_dimension": "维度名称",
    "worst_dimension_score": 35.0,
    "worst_dimension_detail": "具体描述",
    "literary_position": "300-400字文学坐标与谱系定位",
    "author_profile": "100-150字作者创作侧写，原创模式填写，须注明'本推断基于文本特征生成，仅供参考'",
    "creation_background": "100-150字创作背景分析，经典模式填写",
    "core_contribution": "300-400字核心贡献或缺陷分析",
    "tension_analysis": "400-500字张力与开放性分析",
    "critical_consensus": "200-300字批评共识与接受史",
    "editor_suggestions": {
      "genre_principle": "体裁适配原则",
      "core_diagnosis": "300-400字核心问题诊断",
      "specific_changes": "300-500字具体修改建议",
      "improvement_direction": "80-100字潜在提升方向",
      "reference": "50-80字参考范本提示"
    },
    "creative_guidance": "300-400字创作导语，原创模式填写",
    "creative_inspiration": "200-400字创作启示，经典模式填写",
    "reading_suggestions": {
      "general": "面向普通读者建议约60字",
      "research": "面向研究者/教学者建议约60字"
    },
    "ancestor_dialogue": {
      "enabled": false,
      "participants": [],
      "dialogue": ""
    },
    "conclusion": "600-650字综合结论，以作品意象收束，禁止'合上书页'等外部阅读姿态",
    "appendix": {
      "context": "文脉拾遗",
      "customs": "风物志",
      "between_lines": "字里行间",
      "echoes": "余音",
      "connections": "联结",
      "extended_reading": [
        {"title": "《推荐作品》", "author": "作者", "reason": "关联理由"}
      ]
    },
    "divination": {
      "grade": "上吉",
      "word": "洞见",
      "poem": "文章千古事，得失寸心知",
      "source": "唐代·杜甫《偶题》"
    },
    "declarations": {
      "genre_adaptation": "体裁适配说明",
      "defect_exemption": "正缺陷豁免说明（如有）",
      "originality_check": "原创模式审慎校验说明（原创模式）"
    }
  }
}

**JSON 字段强制要求：**

1. `dimensions` 数组必须包含全部 16 个维度
2. 每个维度中的 `comparison_grade` 必须使用精确值："显著差距"、"较大差距"、"明显差距"、"一定差距"、"接近"、"超越"
3. `reverse_anchor` 仅选"明显优于"或"未能明显优于"
4. 每条 `text_evidence` 须具体引用原文，禁止"流畅""细腻""生动"等空泛词
5. `benchmark_evidence` 须具体指认基准作品的确切技法
6. `conclusion` 一句定位该维度在严肃文学谱系中的水准
7. `editor_suggestions` 仅当原创且预计 WCS<95 时填写，否则空字符串
8. `author_profile` 仅原创模式，`creation_background` 仅经典模式
9. `creative_guidance` 仅原创模式，`creative_inspiration` 仅经典模式
10. 极端预审触发时 `ok` 仍为 `true`，`defect_scan.triggered` 为 `true`，`dimensions` 和 `analysis_content` 填简化报告内容

</JSON_OUTPUT_RULES>
"""

LAS_SYSTEM_PROMPT = _CORE + JSON_OUTPUT_RULES + _EXTENDED


# ── V2 (json-mode): 自包含文件，无需裁剪 ──────────────────────────────

with open(_JSON_MODE, "r", encoding="utf-8") as f:
    LAS_SYSTEM_PROMPT_V2 = f.read()


# ── Prompt selection ──────────────────────────────────────────────────

def get_system_prompt(version: str = "") -> str:
    """Return LAS_SYSTEM_PROMPT for the given version.

    version values:
      "" or "v2" → LAS_SYSTEM_PROMPT_V2 (json-mode, recommended)
      "v1"       → LAS_SYSTEM_PROMPT (legacy slicing)
    """
    if version == "v1":
        return LAS_SYSTEM_PROMPT
    return LAS_SYSTEM_PROMPT_V2
