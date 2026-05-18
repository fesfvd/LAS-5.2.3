# LAS v5.2.3 项目现状

> 最后更新: 2026-05-18

## 当前状态

**可用** — 提交作品 → 分析 → 报告 全链路通畅。
- 经典模式：仅需作品名，LLM 根据训练数据中的全文知识分析
- 原创模式：需粘贴正文，16 维评分 + 审慎校验 + 惩罚计算
- 双模板渲染：classic.html（深红）/ original.html（紫色）

**最新测试结果**：原创模式《淇水，桑椹与笑》分析成功，报告完整渲染。

---

## 本次会话完成的工作

### Bug 修复 (12项)
| # | 问题 | 文件 |
|---|------|------|
| 1 | 报告页 10 个 UI 问题（分数环/进度条/折叠/双重标题等） | app.css, report.js, 两个模板 |
| 2 | `toggleAdjustment` TDZ 错误（变量在声明前引用） | original.html |
| 3 | `esc(0)` 返回空字符串（`s\|\|''` → `0` 被视为 falsy） | app.js |
| 4 | 引用不存在的 `home.js` 导致 404 | index.html（已删除） |
| 5 | `work.genre` 列已删除但代码仍引用，每次分析崩溃 | works.py |
| 6 | `const DIM` 重复声明 + `const LC` 重复声明 → 内联脚本静默失败 | 两个模板 |
| 7 | original.html 脚本缺一个 `}` → SyntaxError | original.html |
| 8 | `var(--crimson)88` 不是合法 CSS → 基准图标无颜色 | report.js |
| 9 | 先贤灵境未勾选时也出现在报告中 | report.js |
| 10 | `apply_originality_check()` 始终用 D=1 忽略 LLM 偏差等级 | calculator.py |
| 11 | 进度条字符计数方式导致数字横跳+假百分比 | analyze.js |
| 12 | 启动脚本 pip 每次重装+浏览器过早打开 | start.bat |

### 安全加固 (5项)
| # | 内容 | 文件 |
|---|------|------|
| 1 | 创建 `.gitignore`（排除 .env / data / .claude） | 项目根 |
| 2 | 密码哈希 SHA-256 → bcrypt | auth.py, requirements.txt |
| 3 | JWT 过期 720h → 24h，默认密钥拒绝启动 | config.py |
| 4 | CORS 修正（DEV_MODE 用 allow_origin_regex） | main.py |
| 5 | DEV_MODE 启动警告 + 输入净化指令 | deps.py, json-mode.MD |

### 功能新增 (7项)
| # | 内容 |
|---|------|
| 1 | 经典模式仅需作品名（LLM 靠训练数据知识分析） |
| 2 | 经典模式 LLM 自动补全作者 |
| 3 | 先贤灵境开关（全链路：表单→API→LLM→报告） |
| 4 | 报告页显示 token 消耗量 |
| 5 | 极端情况触发时防崩溃（空维度返回简化报告） |
| 6 | 惩罚系数展示区（原创报告审慎校验→第三节） |
| 7 | 作品基础信息区（内容概述+金句+元数据） |

### 设计迭代 (4轮)
| # | 内容 |
|---|------|
| 1 | 提交页：双语标签 + 模式按钮 + iOS 拨动开关 + 提交覆盖层动画 |
| 2 | 分析页：终端日志流 + SVG 进度环 + 四层微型进度条 |
| 3 | 全局按钮样式统一：JetBrains Mono + 12px/32px padding + hover 上浮 |
| 4 | 分析页进度条全金色 + 四层统一风格 |

### 技能安装 (15个)
详见 `SKILL/` 和 `~/.claude/skills/`

---

## 提示词

### 当前使用: V2 (`LAS v5.2.3 json-mode.MD`)
- 自包含文件，无需 las.py 裁剪拼接
- 含 DECISION_LOG_THINKING（内部决策框架）
- 含 scoring_audit（LLM 输出 D 值，后端读取执行公式）
- 含 13 项自检清单

### V1 备份: `LAS v5.2.3 bata.MD`
- 原始自然语言输出设计
- las.py 中保留 V1 加载逻辑，通过 `LAS_PROMPT_VERSION=v1` 切换

---

## 已知问题

| 严重度 | 问题 | 状态 |
|--------|------|------|
| 🔴 | classic.html 缺 `toggleAdjustment` 函数 | 待修 |
| 🔴 | `renderFromTemplate()` 433 行巨型函数 | 待拆分 |
| 🟠 | `verifyHtml` 330 行死代码未删除 | 待清理 |
| 🟠 | CSS `.progress-bar` 类名冲突 | 待重命名 |
| 🟡 | placeholder 替换链无校验（45 个 replace 无枚举） | 待加 |
| 🟡 | `::-webkit-scrollbar` 规则重复定义 | 待合并 |
| 🟡 | `.dim-bar` / `.dim-fill` 孤儿 CSS 类 | 待删 |
| 🟡 | `apply_defect_exemption` 双重循环误导 | 待重构 |
| 🟡 | 魔法数字无注释（0.01/0.65/0.006/0.75） | 待补 |
| 🟡 | analyze.js `_progressInterval` 离开页面未清理 | 待加 |
| 🟡 | upload.js `delete data['']` 死代码 | 待删 |

> 详细优化计划见 `C:\Users\lz\.claude\plans\las-code-optimization.md`

---

## 独立 HTML 文件

| 文件 | 用途 | 状态 |
|------|------|------|
| `frontend/standalone/提交页 (中性交互 + 双语体系).html` | 设计师优化版提交页 | 已合并到 SPA |
| `frontend/standalone/分析页 (完整修正版.html` | 设计师优化版分析页 | 已合并到 SPA |
| `frontend/standalone/upload.html` | 原始提取版（已废弃） | 保留 |
| `frontend/standalone/analyze.html` | 原始提取版（已废弃） | 保留 |
| `frontend/standalone/经典报告页.html` | 从真实渲染提取 | ✓ 精确匹配 |
| `frontend/standalone/原创报告页.html` | 待用户提供真实渲染 | ⏳ |

---

## 启动方式

```bash
# Linux/Mac
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Windows
双击 start.bat
```

访问：首页 `http://localhost:8000` → 点击「提交作品」→ 进入 `/app`

---

## Git 状态

- 分支: `main`
- 提交数: 15
- `.gitignore` 已排除: `.env` / `data/` / `.claude/` / `01_已归档作品/` / `参考文件/`
