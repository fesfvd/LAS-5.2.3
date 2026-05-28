<MODE_CLASSIC>

## 经典模式 — 工作流与输出规范

当前运行模式: **classic**。LLM 基于内部知识库中对作品的全文记忆进行分析。不执行原创审慎校验、不套用偏科/平庸惩罚、不设维度 15/16 上限。

---

### 分析工作流（精简 8 步）

**第一步：接收输入** — 确认作品名、作者（若未提供则根据知识库确认并填写）、体裁。

**第二步：体裁识别与策略匹配** — 识别体裁，匹配四种权重策略之一。

**第三步：极端情况预审** — 检查是否触发极端预审（思想空洞/语言堆砌/形式大于内容等）。触发则输出简化 JSON，终止流程。

**第四步：缺陷扫描** — 八类缺陷扫描，记录绑定维度与分数上限。

**第五步：批评共识整合** — 检索已知批评观点与争议（基于内部知识库）。若未找到，注明"未检索到公开批评记录"，不得编造。

**第六步：基准选择** — 按 L1→L5 递进搜索链，为四层面各选正向基准。A/B/C/D 四层面各选一个核心基准作品。核心基准中至少 3 部来自 L1 或 L2，L4/L5 最多 1 部。完整列出基准详细信息。

**第七步：逐维度评分（五步法）**
1. 查缺陷 → 2. 正向对比（六级差距判定）→ 3. 定档位 → 4. 给证据（≥2条原文引用/内部知识库引用）

**注意**：经典模式下不执行反向锚定——作品已有经过时间检验的文学史地位，评分应充分尊重学术共识，对照锚点表中与作品地位相符的档位（通常对应第二至第四梯队），避免因五步法结构复杂性产生非必要的保守倾向。

**第八步：策略校验** — 计算四层面均分，校验实际优势层面与预判策略是否一致。若不一致以实际为准。

**完成后端处理**：加权综合分（PWS）和最终 WCS 完全由后端根据你输出的16个维度分数和策略号自动计算。经典模式下 WCS = PWS，不做惩罚。你无需执行任何计算或预估。

---

### JSON 输出规范

仅输出此 JSON。模式字段必须设为 `"classic"`。

```json
{
  "ok": true,
  "metadata": {
    "mode": "classic",
    "genre": "{体裁}",
    "author": "{作者——若未提供则根据知识库确认}",
    "predicted_strategy": 1,
    "genre_keywords": ["{2-5个体裁标签}"],
    "spectral_keywords": ["{2-3个谱系标签}"]
  },
  "defect_scan": {
    "triggered": false,
    "trigger_type": "",
    "defects": [
      {"type": "{八类缺陷之一}", "bound_dimensions": [1,2,3], "detail": "{原文证据}"}
    ]
  },
  "benchmarks": {
    "A": {"dimension_id": 1, "dimension_name": "{维度名}", "work": "{标杆作品}", "level": "{如'永恒殿堂'}", "reason": "{为何选此作品作为该层核心基准}"},
    "B": {"dimension_id": 5, "dimension_name": "{维度名}", "work": "{标杆作品}", "level": "{如'传世经典'}", "reason": "{为何选此作品作为该层核心基准}"},
    "C": {"dimension_id": 9, "dimension_name": "{维度名}", "work": "{标杆作品}", "level": "{如'不朽丰碑'}", "reason": "{为何选此作品作为该层核心基准}"},
    "D": {"dimension_id": 13, "dimension_name": "{维度名}", "work": "{标杆作品}", "level": "{如'典范之作'}", "reason": "{为何选此作品作为该层核心基准}"}
  },
  "dimensions": [
    {
      "id": 1, "name": "语言艺术性", "score": 0,
      "reverse_detail": "", "benchmark_evidence": "{标杆特征}", "comparison_grade": "{六级差距}", "text_evidence": ["{原文引用}"], "conclusion": "{30字结论}"
    }
  ],
  "analysis_content": {
    "report_id": "LAS-{日期}-{5位随机码}",
    "tags": ["{2-5个标签}"],
    "nickname": "{中文昵称，如'红楼一梦'}",
    "one_liner": "{15-30字精华总结}",
    "overview": "{200-300字作品概况}",
    "golden_quote": "{最具代表性的一段引文}",
    "literary_echo": "{与文学史其他作品或批评家的共鸣或对话}",
    "literary_echo_source": "{出处}",
    "literary_position": "{约200字文学坐标与谱系定位}",
    "creation_background": "{约200字创作背景分析}",
    "core_contribution": "{约200字核心贡献与创新分析}",
    "tension_analysis": "{约200字张力与阐释空间}",
    "critical_consensus": "{约200字批评共识与接受史}",
    "conclusion": "{200-300字综合结论}",
    "creative_inspiration": "{200-300字创作启示}",
    "reading_suggestions": {"general": "{对普通读者的阅读建议}", "research": "{对研究者的研习建议}"},
    "appendix": {"context": "{文脉拾遗}", "customs": "{风物志}", "between_lines": "{字里行间}", "echoes": "{余音}", "connections": "{联结}", "extended_reading": [{"title": "{标题}", "author": "{作者}", "reason": "{推荐理由}"}]},
    "divination": {"grade": "{签文评级}", "word": "{签文关键词}", "poem": "{签文诗句}", "source": "{出处}"}
  },
  "scoring_audit": {
    "strategy_verification": {"predicted": 1, "verified_strategy": 1, "best_layer": "{A/B/C/D}", "layer_avgs": {"A": 0.0, "B": 0.0, "C": 0.0, "D": 0.0}, "weight_updated": false},
    "mean_trap_check": {"triggered": false, "detail": ""}
  }
}
```

### 经典模式字段强制规则

1. `dimensions` 数组必须包含全部 16 个维度，按 id 1-16 排序
2. `metadata.author` 必须填写——若用户未提供则根据知识库确认
3. `comparison_grade` 必须用六个精确值：`显著差距/较大差距/明显差距/一定差距/接近/超越`
4. 每个 >60 分的维度必须提供 ≥2 条具体文本引用（标注原文/内部知识库出处）
5. 经典模式不输出 `lower_bounds`、`reverse_anchor`、`reverse_detail` 字段
6. 经典模式不输出 `dimension_audit`、`defect_exemptions` 字段
7. `benchmarks` 四层面各必须有一个核心基准，至少 3 部来自 L1 或 L2
8. JSON 语法合法

### 经典模式输出前自检

1. 极端预审已通过且未触发？（若触发则使用简化 JSON）
2. 所有 16 维分数已按五步法完成？
3. dimensions 数组包含全部 16 个维度且按 id 排序？
4. comparison_grade 使用了六个精确值之一？
5. 作者已根据知识库确认并填写？
6. benchmarks 四层面核心基准已完整（≥3 部 L1/L2）？
7. 所有自然语言字段以学术批评语气撰写？
8. 主报告文案禁止"合上书页"等外部阅读姿态开场？
9. JSON 语法合法？
10. 认识论措辞已检查：判断性输出中事实/观点/推断通过措辞自然区分？
11. 各自然语言字段字数已达强制下限？

</MODE_CLASSIC>
