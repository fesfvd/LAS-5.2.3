# LAS v5.2.3 项目现状

> 最后更新: 2026-05-19

## 当前状态

**稳定** — 提交 → 分析 → 报告 全链路通畅。

- 经典模式：仅需作品名，LLM 根据训练数据中的全文知识分析
- 原创模式：需粘贴正文，16 维评分 + 审慎校验 + 惩罚计算
- 双模板渲染：classic.html（深红）/ original.html（紫色）
- 模板为纯 HTML，所有交互逻辑在 report.js 的 `initReport()` 统一初始化
- JSON 解析三层防护（json.loads → json-repair → 手动补全）
- 分析进度条基于 SSE 字符流真实进度（非假计时）

---

## 本次会话完成的工作

### 设计系统

| # | 内容 | 文件 |
|---|------|------|
| 1 | **DESIGN.md**：基于 awesome-design-md 格式，提炼"学术期刊 × 东方古籍美学"完整设计规范 | DESIGN.md |
| 2 | **前端设计语言记忆**：六色系统、三级字体栈（Serif=文学/Mono=技术/Sans=UI）、glass-card 唯一卡片、区块标题模式 | memory/design_language.md |
| 3 | `LAS文学分析系统项目概况.md` 重写：新增技术架构/双模式/Claude Code 技能章节 | 项目概况.md |
| 4 | `LAS项目招募说明.md`：国赛团队招募文档 | 招募说明.md |

### 报告页重构

| # | 内容 | 文件 |
|---|------|------|
| 1 | **WorkInfo 重构**：元数据卡片移除，新增"作品概况"标题，金句独立金色装饰线 | 两个模板 |
| 2 | **Professional 统一**：去彩色左边框，全局使用 glass-card | report.js |
| 3 | **深度分析恢复 emoji**：📖⚡📜✍️💡，文学正文 serif leading-[2] | report.js |
| 4 | **Footer 摊开布局**：从居中堆叠改为水平 justify-between 分散 | 两个模板 |
| 5 | **区域导航重设计**：双行结构（英文 Mono + 中文 Sans），加大加粗，IntersectionObserver 高亮 | report.js, app.css |
| 6 | **雷达图 hover tooltip**：深色背景 + 金色边框 + interaction nearest 模式 + 显示维度/分数/档位/权重 | report.js |
| 7 | **Grid 高度对齐**：去掉 h-full 包装层，雷达图与左侧信息区等高 | 两个模板 |

### 健壮性修复

| # | 问题 | 文件 |
|---|------|------|
| 1 | **JSON 解析三层防护**：json.loads → repair_json → `_repair_truncated` 手动补全闭合 | llm.py |
| 2 | LLM 输出 `ok: false` 但无 error 字段 → 自动注入"未提供具体错误原因" | llm.py |
| 3 | 未转义双引号（如 `"DAITLAS"`）导致 JSON 解析失败 → json-repair 自动修复 | llm.py |
| 4 | JSON 被 max_tokens 截断未闭合 → 手动 `_repair_truncated` 补全 `"]}` | llm.py |
| 5 | 分析进度条硬封顶 98%（假计时无意义）→ 改为基于 SSE 字符流量的真实进度 | analyze.js |
| 6 | `.env.example` MAX_TOKENS 12000 → 32000 | .env.example |
| 7 | `json-repair>=0.30.0` 添加到依赖 | requirements.txt |

### 首页移动端适配

| # | 内容 | 文件 |
|---|------|------|
| 1 | 768px + 480px 双断点完整适配 | lascd.html |
| 2 | Hero CTA 堆叠、锚点阶梯条宽度强制撑满、策略标签/层面按钮缩小 | lascd.html |
| 3 | tap 交互替代 hover（公理卡片/维度卡片触摸展开） | lascd.html |

---

## 提示词

- **当前使用**: V2 (`LAS v5.2.3 json-mode.MD`)，自包含，含 scoring_audit + 13 项自检
- **V1 备份**: `LAS v5.2.3 bata.MD`，通过 `LAS_PROMPT_VERSION=v1` 切换

---

## 分支

- `main` — 稳定分支
- `feat/v5.2.3-design-system-fixes` — 当前工作分支（设计系统 + 报告页重构 + 健壮性修复）

---

## 启动方式

```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
# Windows: 双击 start.bat
```

访问：`http://localhost:8000/app`
