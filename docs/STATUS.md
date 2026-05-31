# LAS v5.2.3 项目现状

> 最后更新: 2026-05-31

## 当前状态

**稳定** — 提交 → 分析 → 报告 → 对比 → 统计 全链路通畅。

- 经典模式：仅需作品名，LLM 根据训练数据中的全文知识分析
- 原创模式：需粘贴正文，16 维评分 + 审慎校验 + 惩罚计算
- 双模板渲染：classic.html（深红）/ original.html（紫色）
- 作品管理：按需选择模式（批量删除/作品对比）、统计图表（评级分布+分数走势）
- 作品对比：独立全屏页面（雷达图叠加 + 16维评分表 + 四层面总结 + 差异分析）
- 管理后台：统计卡片 + 用户列表 + 邀请码生成（仅 admin 可见入口在个人中心）
- 金句广场：筛选（全部/原创/经典）+ 网格展示 + 换一批
- Default 模型：DeepSeek V4 Flash（可选 V4 Pro）
- JSON 解析多层防护（json.loads → json-repair → 手动补全）
- 分析进度基于 SSE 字符流真实进度（conclusion/divination 里程碑）
- SSE 健壮性：读超时 25s + 心跳 15s + 120s 无内容 watchdog + AbortController
- 报告导出：PDF（打印展开 + 自动命名）+ DOCX（真格式）
- 数据库：SQLite WAL 模式 + PRAGMA 优化 + 连接池
- 设计规范：DESIGN.md 16 章（含新增 Interaction Patterns 10 条交互铁律）
- Dev 模式：start.bat 自动 `LAS_DEV=true`，前端自动登录，默认 admin 角色

---

## 5/31 会话完成的工作

### 安全修复

| # | 内容 | 文件 |
|---|------|------|
| 1 | 分享页 XSS：title/one_liner/golden/tier/author 全部 html_escape | main.py |
| 2 | 内存泄漏：_login_attempts + _buckets 空 key 自动 pop | auth.py + rate_limit.py |
| 3 | 并发竞态：quotes.json 读写加 threading.Lock | main.py |
| 4 | SSE 看门狗：120s 无新内容自动 abort + error 事件 | llm.py |

### 路由引擎

| # | 内容 | 文件 |
|---|------|------|
| 5 | _startTransition 直接调用 _render() 替代 hashchange 依赖 | app.js |
| 6 | App.navigate 用 history.pushState 消 hashchange 副作用 | app.js |
| 7 | /compare 和 /stats 静态路由移至 /{work_id} 之前 | works.py |

### UX 重设计

| # | 内容 | 文件 |
|---|------|------|
| 8 | 作品管理复选框按需出现（批量删除/对比两种模式） | works.js |
| 9 | 作品对比独立全屏页面（雷达图/评分表/层面总结/差异分析） | works.js |
| 10 | 统计图表（评级分布饼图+分数走势曲线+模式筛选） | works.py + works.js |
| 11 | 首页顶部导航栏 + 进入系统按钮 | index.html |
| 12 | 管理后台入口从全局导航移至个人中心 | spa.html + profile.js |

### 设计系统进化

| # | 内容 | 文件 |
|---|------|------|
| 13 | DESIGN.md 新增 Interaction Patterns 章节（10 条交互铁律） | DESIGN.md |
| 14 | 触控目标 ≥40px：filter-chip/quote-filter/btn 全部调整 | app.css + works.js + quotes.js |
| 15 | .work-item:hover 去掉 translateY（改用 border-color） | app.css |
| 16 | 13 级评级色板：金/深红/紫/翠绿/墨/琥珀/蓝/青/靛/红/橙/灰 | works.py |

### 技能进化

| # | 内容 | 文件 |
|---|------|------|
| 17 | ux-designer 重写（LAS 项目上下文 + 10 条交互铁律） | ~/.claude/skills/ux-designer |
| 18 | frontend-designer 8→9 维（新增交互合规检查） | ~/.claude/skills/frontend-designer |
| 19 | team 调度链强化（加功能强制 UX 审查 + 先交互后视觉） | ~/.claude/skills/team |
| 20 | code-detective 新增交互反模式检测（10 项检查表） | ~/.claude/skills/code-detective |

---

## 5/22 会话完成的工作

### 性能与加载速度

| # | 内容 | 文件 |
|---|------|------|
| 1 | **done 事件提前发送**：原在 build_report+db.commit 之后发 done，前端卡在进度条不更新。改为先发 done 再保存 | works.py |
| 2 | **waitForReport 轮询加速**：首次延迟 200ms→0ms，间隔 2s→500ms，上限 40→15 次 | reader.js |
| 3 | **超时参数调大**：READ_TIMEOUT 8s→25s，IDLE_GIVEUP 90s→300s，心跳 15s 不再被超时打断 | reader.js |
| 4 | **SQLite WAL + PRAGMA**：journal_mode=WAL, synchronous=NORMAL, 64MB 缓存, busy_timeout=5s, 连接池 | orm.py |

### 进度与流程

| # | 内容 | 文件 |
|---|------|------|
| 5 | **里程碑对齐真实流程**：`analysis_content`(~30%)→`conclusion`(~80%)+`divination`(~95%) | llm.py + reader.js |
| 6 | **默认模型切换**：V4 Pro → V4 Flash（分析速度更快） | upload.js |
| 7 | **作者默认佚名**：提交时 author 为空自动填入 | upload.js |

### 截图与导出修复

| # | 内容 | 文件 |
|---|------|------|
| 8 | **全部报告截图空白**：reveal 元素仅 IntersectionObserver 激活后才可见，截图前强制激活所有 reveal | report.js |
| 9 | **深度分析折叠未展开**：截图/PDF 前 `overflow:visible` + `maxHeight:none` | report.js |
| 10 | **hero 区截图空白**：去掉模板 min-height:calc(100vh)（正常浏览不受影响） | templates |
| 11 | **docx 子标题提取**：识别 LLM 输出中的 `##`/`**`/短行标题模式 | report.js |

### 显示修复

| # | 内容 | 文件 |
|---|------|------|
| 12 | **版本号**：footer 中 v5.2 → v5.2.3 | templates |
| 13 | **Token 显示**：隐去固定提示词消耗，只展示可变部分（作品 + 生成报告） | report.js |
| 14 | **模板引号嵌套**：去掉 `WORK_TITLE_HONOR` 等 5 个字段的外层 `"…"` | templates |
| 15 | **《》书名号去重**：加 `debracket()` 函数，包裹前先剥离已有书名号 | app.js + report.js |
| 16 | **文件上传筛选**：accept 精简到 8 种常用文档格式 | upload.js |
| 17 | **文本框可缩放**：textarea `resize:none` → `resize:vertical` | app.css |

### 工程改进

| # | 内容 | 文件 |
|---|------|------|
| 18 | **ruff 格式化**：10 个 Python 文件格式化，lint 全通过 | backend/ |
| 19 | **pydantic-settings**：替换手写 `os.getenv`，类型校验 + 启动验证 | config.py |
| 20 | **依赖更新**：移除 python-dotenv，新增 pydantic-settings | requirements.txt |

---

## 本次会话完成的工作 (2026-05-20/21)

### 架构变更

| # | 内容 | 文件 |
|---|------|------|
| 1 | **原创审慎校验权责分离**：LLM 对全部 16 维输出 `d_value`（dimension_audit），后端筛选 ≥75 分 + 取前 4 + 套公式。LLM 不再自行决定"哪些该调" | prompt + calculator.py + analyzer.py |
| 2 | **分数下调 bug 修复**：原路径 1 无 ≥75 守卫，LLM 盲信输入导致 68→59.2 误下调。已加固 | calculator.py |
| 3 | **性能优化**：里程碑匹配从全文本重扫改为增量 delta 匹配 + 去重 `_repair_truncated` + 缓存 JSON 错误 | llm.py |
| 4 | **SSE 健壮性**：后端每 15s 心跳保活 + 前端 8s 读超时 / 30s 警告 / 90s 放弃 + AbortController 清理 + 流断开不再当成功处理 | llm.py + reader.js + api.js |

### 分析页重构

| # | 内容 | 文件 |
|---|------|------|
| 1 | **纸底画布**：全局 #faf8f3 暖米白底色，无卡片包裹，内容直接呼吸在纸面上 | app.css + reader.js |
| 2 | **进度环升级**：56px/2px → 80px/5px，添加背景轨 stroke + drop-shadow 呼吸光晕 | app.css + reader.js |
| 3 | **终端修正**：底色 rgba(26,26,26,0.02) 暖墨、字体 mono-label 13px/1.7、✓ jade 语义色 | app.css |
| 4 | **文心拾贝重构**：18px italic + gold 顶线 + 居中文本 + crossfade 无空白 + height 自适应过渡 | app.css + reader.js |
| 5 | **三区合一**：单一 glass-card → 三条细 rule 分隔，卡片边界消失，回归书页感 | reader.js |
| 6 | **卡片入场动画**：stagger 依次淡入上滑 → 单容器单动画 | app.css |

### 报告页导出

| # | 内容 | 文件 |
|---|------|------|
| 1 | **PDF 导出**：打印前自动展开所有折叠区 + document.title 自动命名 + afterprint 恢复 | report.js + app.css |
| 2 | **Word 导出**：从 HTML 伪装 .doc → 真正 .docx（docx 库生成 OOXML），含完整标题/段落/表格/签文/footer | report.js + spa.html |
| 3 | **导出按钮重设计**：三按钮竖排（截图/PDF/Word），统一样式 | report.js + app.css |

### 健壮性修复

| # | 问题 | 文件 |
|---|------|------|
| 1 | 报告页轮询 5→8 次，waitForReport 30→40 次，错误页增加重新加载按钮 | report.js + reader.js |
| 2 | beforeunload 监听器重复添加 → { once: true } | reader.js |
| 3 | JSON 解析错误不再静默吞噬——单条 warn + 10 条汇总 error | reader.js |
| 4 | 心跳事件提前触发 firstEvent → 移到 JSON.parse 之后 | reader.js |
| 5 | `waitForReport` 返回值被忽略 → 检查并 warn | reader.js |
| 6 | LLM 调用无超时 → timeout=300s | llm.py |
| 7 | `.env` API Key 已泄露，需轮换 | — |

---

## 提示词

- **当前使用**: V2 (`LAS v5.2.3 json-mode.MD`)，自包含，含 scoring_audit + 16 项自检
- **关键变更**: `originality_adjustments` → `dimension_audit`（全 16 维 D 值，后端筛选执行）
- **V1 备份**: `LAS v5.2.3 bata.MD`，通过 `LAS_PROMPT_VERSION=v1` 切换

---

## 分支

- `main` — 稳定分支
- `feat/v5.2.3-stable` — 当前工作分支（架构优化 + 健壮性 + 分析页重构 + 导出）

---

## 启动方式

```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
# Windows: 双击 start.bat
```

访问：`http://localhost:8000/app`
