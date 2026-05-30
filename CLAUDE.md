# LAS 文学分析系统 v5.2.3

## 会话规则

**每轮回复必须以「一号」开头。** 例如："一号，已收到。"、"一号，这里的问题是..."

## 项目概要

DeepSeek LLM 驱动的文学分析 SPA。用户提交作品文本，系统通过 16 维标尺评估文学价值，生成完整报告。

**网站**：https://lasystem.cn/ · **服务器**：49.233.22.200 · **部署路径**：/www/wwwroot/lasystem.cn

## 技术栈

| 层 | 技术 | 文件 |
|----|------|------|
| 后端 | FastAPI + SQLAlchemy (async) + SQLite WAL | `backend/` |
| 前端 | Vanilla JS SPA (hash 路由) | `frontend/` |
| LLM | DeepSeek API (OpenAI 兼容) | `backend/services/llm.py` |
| 部署 | Docker + docker-compose + nginx 反向代理 | `Dockerfile`, `docker-compose.prod.yml`, `deploy/` |

## 项目结构

```
backend/
  main.py              # FastAPI app + 路由注册
  config.py            # Pydantic Settings (env → LAS_ prefix)
  models/orm.py        # SQLAlchemy ORM (User, Work, Analysis, InviteCode, VerificationCode)
  routers/auth.py      # 注册/登录/忘记密码/重置密码/游客
  routers/works.py     # 作品 CRUD + 分析 + 报告
  routers/users.py     # 个人中心（改密码/换邮箱/统计）
  services/llm.py      # DeepSeek 流式调用 + 里程碑
  services/analyzer.py # build_report() — LLM 输出 → 结构化报告
  services/calculator.py # compute_wcs() — 后端重算 PWS/WCS/评级
  services/email.py    # SMTP 邮件发送
  prompts/             # LLM 提示词（las-shared.MD + las-original.MD + las-classic.MD）
frontend/
  spa.html             # SPA 入口 /app
  index.html           # 首页 /
  css/app.css          # 全局样式（40+ CSS 变量、z-index 层级、motion token）
  js/app.js            # 路由 + 转场状态机 + 离线检测 + 隐私路由
  js/api.js            # API 客户端（含 getWorksPaginated 分页）
  js/pages/auth.js     # 登录/注册/忘记密码（密码显隐切换、⚠ 错误图标）
  js/pages/upload.js   # 提交作品（提交取消按钮、maxlength 50万字）
  js/pages/analyze.js  # 分析进度（立即取消按钮、失败重试按钮）
  js/pages/report.js   # 报告渲染（CDN 守卫、card-tint 替换旧彩色左边框）
  js/pages/works.js    # 作品管理（glass-card Modal 替换 confirm、分页器防累积）
  js/pages/profile.js  # 个人中心
  templates/           # 报告 HTML 模板（classic.html / original.html）
  quotes.json          # 分析页句子库
```

## 设计规范

调用 `/frontend-designer` 或以 `DESIGN.md` 为唯一宪法。DESIGN.md 包含 15 个完整章节：

| 章节 | 内容 |
|------|------|
| Colors | 30+ token（surface 层级、card-tint 色板、semantic 色、pressed 态） |
| Typography | 14 级字体阶梯 + 三轨铁律（.serif / Sans / .mono + tnum） |
| Motion | 5 档 duration + 3 条 easing + 组件动画表 + 微交互模式 |
| Elevation & Z-Index | 6 级表面层级 + 表面色阶梯 + 5 级 z-index 变量 |
| Shapes | 二半径体系（编辑/学术 2-4px + 功能/容器 8-12px + pill 仅标签） |
| Interactive States | 六态机（default/hover/active/focus-visible/disabled/loading） |
| Components | glass-card 唯一卡片 + card-tints 5 色变体 + button-primary 六态 |
| Accessibility | WCAG AA 对比度 + 44px 触摸 + focus-visible + 语义化 HTML |
| Data Visualization | 四层面色板 + 雷达图色板 + tooltip + 图表动画 |
| Dual-Theme System | 经典 crimson / 原创 purple 双主题切换 |
| Responsive Behavior | 三断点 + 触摸目标 + 折叠策略 |
| Iteration Guide | 12 条开发铁律 |

**铁律**：
- 三级字体不可混用：`.serif`（文学正文）、Sans 默认（UI）、`.mono`（英文标签/数字，含 `tnum` 等宽数字）
- `glass-card` 是唯一卡片样式——禁止 box-shadow、禁止彩色左边框、禁止彩色背景卡片
- card-tint 仅限评估概要/校验记录/签文展示三个场景，一个卡片内最多一个 tint 区块
- 经典模式禁止 purple-tint，原创模式慎用 error-tint（红色调避免与 purple 混淆）
- 按钮 `rounded: var(--rounded-sm)`（4px 微圆角），pill 仅用于标签徽标
- 所有颜色使用 CSS 变量（`var(--ink)` 等），禁止硬编码 hex/rgba
- 区块结构：`<hr class="rule-strong">` → `<h2 class="serif font-bold">` → 内容
- z-index 使用 `--z-*` 变量，动效 duration/easing 使用 motion token
- `muted` 色值 `#6b6558`（WCAG AA 5.1:1 ✓）
- 原创模式用 purple `#6b21a8` 替代 crimson `#8b0000`

## 编码规范

调用 `/karpathy-principles`（全局最高标准）：
1. 先思考再编码 — 改之前理清逻辑
2. 简洁优先 — 不动不需要的代码
3. 手术式修改 — 改一行能解决的绝不改十行
4. 目标驱动 — 改完必须验证

## 常用命令

```bash
# 本地开发
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# 部署（调用 /las-deploy 走完整流程）
cd /www/wwwroot/lasystem.cn && git pull && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 服务器 GitHub 不通时配镜像
git config --global url."https://ghproxy.net/https://github.com".insteadOf "https://github.com"
```

## API 概况

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（需验证码） |
| POST | `/api/auth/login` | 登录（用户名/邮箱，支持 remember me） |
| POST | `/api/auth/send-code` | 发送验证码（register/reset/bind 三种用途） |
| POST | `/api/auth/forgot-password` | 忘记密码 |
| POST | `/api/auth/reset-password` | 重置密码 |
| GET | `/api/users/me` | 个人中心（含 analysis_count、best_score） |
| PUT | `/api/users/password` | 修改密码 |
| PUT | `/api/users/email` | 换绑邮箱（需验证码） |
| GET | `/api/works?limit=&offset=&mode=&sort_by=&sort_order=` | 作品列表（分页+筛选+排序） |
| POST | `/api/works` | 创建作品 |
| DELETE | `/api/works/{id}` | 删除作品 |
| POST | `/api/works/{id}/analyze` | 启动分析 (SSE) |
| GET | `/api/works/{id}/report` | 获取报告（含 report_number LAS-000001） |
| POST | `/api/quotes` | 贡献金句 |

## 关键 Skill

| Skill | 用途 |
|-------|------|
| `/team` | 团队调度器——自动识别场景，调取最佳 Skill 组合 |
| `/las-deploy` | 审→推→更→验 全链路部署 |
| `/code-detective` | 深层缺陷侦探（CSS陷阱/异步竞态/跨文件影响链） |
| `/code-reviewer` | 表层规范审查（语义化/a11y/性能/安全/可维护性） |
| `/ux-designer` | 交互审计（交互流程/状态覆盖/微交互/移动端） |
| `/frontend-designer` | 设计规范执行器（以 DESIGN.md 为宪法，8 维审查） |
| `/las-prompt` | 提示词安全修改（跨文件影响追踪 + 一致性验证） |
| `/las-debug` | 全链路诊断（LLM输出→后端解析→API响应→前端渲染） |
| `/las-smoke` | 端到端冒烟测试 |
| `/meta-skill-designer` | Skill 设计师（创建/进化/全量审查） |
| `/karpathy-principles` | 编码原则（全局最高标准） |

## 最近优化（2026-05-30）

三轮前端大审查，25 项修复：

**第一轮（止血）**：CSS 变量补全到 40+ 个、分析页取消按钮立即可用、连接失败加「重新连接」按钮、PDF 回调修复、分页器防累积、全局离线检测、模板加载 fallback、works fetch 走统一 401 拦截

**第二轮（合规）**：去除全部彩色左边框改用 card-tint、z-index 全部变量化（`--z-*`）、glass-card 风格自定义 Modal 替换原生 confirm、4 处事件/观察器泄漏修复、图表 A/C 层色修正、密码显隐切换、提交超时取消按钮、CDN 加载守卫、导航中文去 .mono、错误状态加 ⚠ 图标

**第三轮（打磨）**：动效 duration 对齐 spec（.btn 200ms/.reveal 350ms）、附录图标非品牌色替换为 token、报告失败加「返回作品列表」、文本域 maxlength 50万字、筛选切换 spinner 闪烁优化、/privacy 路由修复
