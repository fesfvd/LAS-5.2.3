# LAS v5.2.3 — 文学分析系统

**L**iterary **A**nalysis **S**ystem — 基于大语言模型的十六维文学价值评估框架。

提交作品文本，系统以严肃文学史谱系为参照，进行 16 个维度的逐项评分，输出包含评分环、雷达图、四层面解析、金句摘录和文学签文的交互式报告。

线上地址：**[lasystem.cn](https://lasystem.cn)**

---

## 快速开始

### 环境要求

- Python 3.12+
- DeepSeek API Key

### 安装与运行

```bash
cp .env.example .env
# 编辑 .env，填入 LAS_LLM_API_KEY
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Windows 双击 `start.bat`。浏览器打开 `http://localhost:8000`。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `LAS_LLM_API_KEY` | （必填） | DeepSeek API 密钥 |
| `LAS_LLM_MODEL` | `deepseek-v4-flash` | 默认模型 |
| `LAS_LLM_BASE_URL` | `https://api.deepseek.com/v1` | API 地址 |
| `LAS_LLM_MAX_TOKENS` | `48000` | 输出上限 |
| `LAS_LLM_TEMPERATURE` | `0.4` | 生成温度 |
| `LAS_SECRET_KEY` | `dev-secret-...` | JWT 签名密钥 |
| `LAS_DEV` | `false` | 开发模式（跳过认证） |
| `LAS_PROMPT_VERSION` | `v2` | 提示词版本 |

---

## 使用流程

### 经典模式

仅需输入作品名（如《红楼梦》《百年孤独》），LLM 基于预训练知识库进行全文分析，作者名自动补全。

### 原创模式

填写标题、粘贴正文或上传文件（TXT / MD / Word / PDF 等 8 种格式），拖拽至文本框或点击按钮上传。支持最高 50 万字。

分析过程 SSE 流式传输 10 步进度，完成后自动跳转至报告页。报告支持截图分享（自动生成分享卡片含评分环+楹联+QR 码）和 Word 导出。

### 用户角色与额度

| 角色 | 每日次数 | 永久次数 | 字数上限 | 可用模型 |
|------|---------|---------|---------|---------|
| 游客 | 5 | 3 | 5 万字 | Flash（强切） |
| 注册用户 | 5 | 20 | 50 万字 | Flash / Pro |
| 管理员 | 无限制 | 无限制 | 50 万字 | Flash / Pro |

分析失败不消耗次数。删除失败/卡住的作品自动返还配额。

---

## 评分体系

### 十六维度（四层面）

| 层面 | 维度 |
|------|------|
| **A 语言与形式** | 语言艺术性 · 修辞运用 · 结构设计 · 文体适配 |
| **B 叙事与内容** | 叙事技巧 · 人物塑造 · 情节架构 · 细节密度 |
| **C 思想与意义** | 主题深度 · 情感力量 · 象征体系 · 时代价值 |
| **D 审美与影响** | 风格独创性 · 审美统一 · 文学影响 · 经典地位 |

### 综合分

```
WCS = PWS × k × mf
PWS  = Σ(16维分数 × 策略权重)    加权综合分
k    = 1/(1+0.01×gap)          偏科惩罚
mf   = 1-0.006×(75-mean)       平庸惩罚
```

### 十五级标尺

| 分数 | 评级 | 守门员 |
|------|------|--------|
| 140-150 | 文学之巅 | 《圣经》《诗经》 |
| 125-139 | 永恒殿堂 | 《红楼梦》《哈姆雷特》 |
| 115-124 | 不朽丰碑 | 《百年孤独》《战争与和平》 |
| 105-114 | 传世经典 | 《罪与罚》《包法利夫人》 |
| 95-104 | 典范之作 | 《了不起的盖茨比》 |
| 85-94 | 上乘佳作 | — |
| 75-84 | 中等之作 | — |
| 65-74 | 准文学级 | — |
| 55-64 | 合格文本 | — |
| 45-54 | 严重瑕疵 | — |
| … | … | … |

---

## 错误码

分析失败时页面显示错误码 + 详情 + 建议，可一键复制：

| 码 | 含义 |
|----|------|
| E001 | LLM JSON 解析失败 |
| E002 | LLM 拒绝分析 |
| E003 | 报告构建异常 |
| E004 | 报告保存异常 |
| E005 | API 超时（120s） |
| E006 | 配额耗尽 |
| E007 | 未登录 |
| E008 | SSE 流意外断开 |
| E009 | 网络连接失败 |
| E010 | 服务器内部错误 |

---

## 技术架构

```
浏览器 (SPA)              FastAPI 后端                 DeepSeek V4
┌──────────────┐  HTTP   ┌──────────────────┐  API   ┌───────────┐
│ spa.html     │◄───────►│ main.py          │◄───────►│ v4-pro    │
│ ├ upload.js  │         │ ├ routers/works  │  SSE    │ 1M ctx    │
│ ├ progress.js│  SSE    │ ├ services/llm   │ stream  │           │
│ └ report.js  │◄───────│ ├ analyzer       │◄───────│           │
│              │         │ └ calculator     │         └───────────┘
└──────────────┘         └──────────────────┘
```

- **前端**：Vanilla JS SPA，hash 路由，Chart.js 雷达图，mammoth.js 文档解析，html2canvas 分享卡片截图，docx 导出。经典（深红）/ 原创（紫）双模板。`glass-card` 唯一卡片 + 三级字体栈（`.serif` / Sans / `.mono`）
- **后端**：FastAPI + SQLAlchemy + SQLite WAL，SSE 流式分析进度（心跳 15s + 看门狗 120s），pydantic-settings 配置，ruff 格式化
- **AI**：DeepSeek V4 Flash（默认）/ V4 Pro 可选，70KB 系统提示词，user_id 隔离 KVCache

---

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查（含今日分析数） |
| `POST` | `/api/auth/register` | 注册 |
| `POST` | `/api/auth/login` | 登录 |
| `POST` | `/api/auth/guest` | 游客登录 |
| `POST` | `/api/auth/send-code` | 发送验证码 |
| `POST` | `/api/auth/forgot-password` | 忘记密码 |
| `GET` | `/api/users/me` | 个人中心（含配额） |
| `PUT` | `/api/users/password` | 修改密码 |
| `PUT` | `/api/users/email` | 换绑邮箱 |
| `GET` | `/api/works` | 作品列表（分页+筛选+排序） |
| `POST` | `/api/works` | 提交作品 |
| `GET` | `/api/works/{id}` | 作品详情 |
| `DELETE` | `/api/works/{id}` | 删除作品（失败返还配额） |
| `POST` | `/api/works/{id}/analyze` | 启动分析（SSE） |
| `GET` | `/api/works/{id}/report` | 获取报告 |
| `PUT` | `/api/works/{id}/publish` | 公开/私密切换 |
| `GET` | `/api/works/compare` | 作品对比（2-3 部） |
| `GET` | `/api/works/stats` | 个人统计（评级分布+走势） |
| `POST` | `/api/works/batch-delete` | 批量删除 |
| `GET` | `/api/public/works` | 公开作品（无需认证） |
| `POST` | `/api/quotes` | 贡献金句 |
| `GET` | `/api/admin/stats` | 管理后台统计 |
| `GET` | `/api/admin/users` | 用户列表 |
| `GET` | `/api/admin/analyses` | 分析记录 |
| `GET` | `/api/admin/invite-codes` | 邀请码列表 |
| `POST` | `/api/admin/invite-codes` | 生成邀请码 |

---

## 项目结构

```
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── models/orm.py           # ORM (User/Work/Analysis/InviteCode)
│   ├── schemas/models.py       # Pydantic schemas
│   ├── routers/
│   │   ├── auth.py             # 认证 + 配额初始化
│   │   ├── works.py            # 作品 CRUD + SSE 分析 + 公开作品
│   │   ├── users.py            # 个人中心
│   │   └── admin.py            # 管理后台
│   ├── services/
│   │   ├── llm.py              # LLM 流式调用 + JSON 容错
│   │   ├── analyzer.py         # 报告构建编排
│   │   ├── calculator.py       # 评分引擎
│   │   └── email.py            # SMTP 邮件
│   └── prompts/                # 提示词（shared + original + classic）
│
├── frontend/
│   ├── spa.html                # SPA 入口 /app
│   ├── index.html              # 首页 /
│   ├── css/app.css             # 全局样式（CSS 变量 + motion token）
│   ├── js/
│   │   ├── api.js              # API 客户端
│   │   ├── app.js              # Hash 路由 + 转场 + 错误码
│   │   └── pages/
│   │       ├── progress.js     # 分析进度（SSE 流 + 进度环）
│   │       ├── auth.js         # 登录/注册/忘记密码
│   │       ├── upload.js       # 提交作品
│   │       ├── report.js       # 报告渲染 + 分享卡片 + 赞赏
│   │       ├── report-sections.js
│   │       ├── report-charts.js
│   │       ├── works.js        # 作品管理 + 公开切换
│   │       ├── discover.js     # 发现页（公开作品）
│   │       ├── profile.js      # 个人中心
│   │       ├── admin.js        # 管理后台
│   │       └── quotes.js       # 金句广场
│   └── templates/              # 经典/原创 报告 HTML 模板
│
├── DESIGN.md                   # 设计语言规范（16 章）
├── CLAUDE.md                   # Claude Code 项目指令
├── start.bat
├── Dockerfile
└── docker-compose.yml
```

---

## 设计规范

`DESIGN.md` 定义了 LAS 的完整设计语言：学术期刊 × 东方古籍美学、30+ 色彩 token、三级字体栈、5 档动效 token、5 级 z-index 变量、二半径体系、六态机。所有前端代码以 DESIGN.md 为唯一宪法。

---

## 部署

```bash
cd /www/wwwroot/lasystem.cn && git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

GitHub 不通时先配镜像：`git config --global url."https://ghproxy.net/https://github.com".insteadOf "https://github.com"`
