# LAS v5.2.3 项目现状

> 最后更新: 2026-05-18

## 当前状态

**稳定** — 提交 → 分析 → 报告 全链路通畅，无已知 Bug。

- 经典模式：仅需作品名，LLM 根据训练数据中的全文知识分析
- 原创模式：需粘贴正文，16 维评分 + 审慎校验 + 惩罚计算
- 双模板渲染：classic.html（深红）/ original.html（紫色）
- 模板去脚本化：模板为纯 HTML，所有交互逻辑在 report.js 的 `initReport()` 统一初始化

---

## 本次会话完成的工作

### 架构重构

| # | 内容 | 文件 |
|---|------|------|
| 1 | **模板去脚本化**：删除两个模板的全部 `<script>` 块（~230 行），所有交互逻辑移入 report.js `initReport()` | classic.html, original.html, report.js |
| 2 | **消除 `activateScripts` hack**：不再用 `replaceChild` 重执行脚本，改为标准 DOM API 初始化 | report.js |
| 3 | **拆分 `renderFromTemplate`**：巨型函数拆为 `buildReportSections` / `applyTemplate` / `initReport` | report.js |
| 4 | **共享函数集中**：`toggleAdjustment` / `toggleAccordion` / `toggleRow` / `scrollTo` / `buildTable` 移到 report.js | report.js, 两个模板 |

### Bug 修复

| # | 问题 | 文件 |
|---|------|------|
| 1 | `apply_defect_exemption` 中 `exempted` 未初始化 → `NameError` 崩溃 | calculator.py |
| 2 | SSE 流 `done` 事件因缓冲区处理顺序丢失 → 进度条不到 100%、不跳转报告页 | analyze.js |
| 3 | SSE 流意外断开无兜底 → 永远卡在分析页 | analyze.js |
| 4 | 后端 `db.commit()` 崩溃无保护 → 报告永久丢失 | works.py |
| 5 | `renderFromTemplate` 引用闭包变量 `id` → `ReferenceError` 报告加载失败 | report.js |
| 6 | 雷达图 `backgroundColor: '#8b0000' + '0.06'` → 非法颜色，黑块渲染 | report.js |
| 7 | 报告页无意义轮询 → 改为等待分析页后台确认后直接跳转 | analyze.js, report.js |
| 8 | D 值异常静默吞噬 → 加 `logger.warning` | calculator.py |
| 9 | 魔法数字无注释 → 补注释 | calculator.py |
| 10 | `_progressInterval` 离开页面未清理 → 加 `beforeunload` | analyze.js |

### 文档新建

| # | 内容 |
|---|------|
| 1 | `DESIGN.md` — LAS 设计规范文档（awesome-design-md 格式，供 AI/设计师使用） |
| 2 | `scripts/generate_standalone.py` — 独立报告页生成脚本 |

---

## 提示词

- **当前使用**: V2 (`LAS v5.2.3 json-mode.MD`)，自包含，含 scoring_audit + 13 项自检
- **V1 备份**: `LAS v5.2.3 bata.MD`，通过 `LAS_PROMPT_VERSION=v1` 切换

---

## 启动方式

```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
# Windows: 双击 start.bat
```

访问：`http://localhost:8000/app`
