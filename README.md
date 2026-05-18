# LAS v5.2.3 — 文学分析系统

**L**iterary **A**nalysis **S**ystem — 基于大语言模型的十六维文学价值评估框架。

用户提交作品（原创或经典），系统以严肃文学史谱系为参照，对文本进行 16 个维度的逐项评分，综合体裁策略权重、偏科惩罚和平庸惩罚，输出一份包含雷达图、评分详表、深度分析和文学签文的交互式报告。

---

## 架构概览

```
浏览器 (SPA)                FastAPI 后端                   DeepSeek V4
┌──────────────┐   HTTP    ┌──────────────────┐   API    ┌───────────┐
│ spa.html     │◄─────────►│ main.py          │◄───────►│ v4-pro    │
│ ├ upload.js  │           │ ├ routers/works  │         │ 1M ctx    │
│ ├ analyze.js │  SSE      │ ├ services/llm   │ stream  │           │
│ └ report.js  │◄─────────│ ├ analyzer       │◄───────│           │
│              │           │ └ calculator     │         └───────────┘
│ classic.html │           │                  │
│ original.html│           │ SQLite           │
└──────────────┘           └──────────────────┘
```

- **前端**：Vanilla JS SPA，hash 路由，Chart.js 雷达图，classic（深红）/ original（紫色）双模板
- **后端**：FastAPI + SQLAlchemy + SSE 流式传输
- **AI**：DeepSeek V4 Flash/Pro，58KB 系统提示词（6 公理 + 13 步工作流 + 16 维锚定表 + 15 级标尺）

---

## 快速开始

### 环境要求

- Python 3.12+
- DeepSeek API Key（[platform.deepseek.com](https://platform.deepseek.com)）

### 安装与运行

```bash
# 1. 克隆项目
git clone <repo-url> && cd LAS

# 2. 配置环境
cp .env.example .env
# 编辑 .env，填入你的 LAS_LLM_API_KEY

# 3. 安装依赖
pip install -r backend/requirements.txt

# 4. 启动
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Windows 用户可直接双击 `start.bat`。

浏览器打开 `http://localhost:8000` 进入首页，点击「提交作品」开始使用。

### 配置说明

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `LAS_LLM_API_KEY` | （必填） | DeepSeek API 密钥 |
| `LAS_LLM_MODEL` | `gpt-4o` | 模型名（推荐 `deepseek-v4-flash`） |
| `LAS_LLM_BASE_URL` | `https://api.openai.com/v1` | API 地址 |
| `LAS_LLM_MAX_TOKENS` | `16000` | 输出上限（推荐 32000） |
| `LAS_SECRET_KEY` | `dev-secret-...` | JWT 签名密钥（生产必改） |
| `LAS_DEV` | `false` | 开发模式（跳过认证） |
| `LAS_PROMPT_VERSION` | `v2` | 提示词版本（v2=json-mode） |
| `LAS_CORS_ORIGINS` | `http://localhost:8000` | CORS 白名单 |

---

## 使用流程

### 原创模式
1. **提交作品** → 填写标题、作者（选填）、粘贴正文
2. **等待分析** → 进度条展示 5 个阶段，LLM 逐维度评分
3. **查看报告** → 紫色主题的交互式报告

### 经典模式
1. **提交作品** → 只需填写作品名（如《红楼梦》《百年孤独》）
2. 系统利用 LLM 训练数据中的全文知识进行分析
3. 作者名由 LLM 自动补全

---

## 评分体系

### 十六维度（四层面）

| 层面 | 维度 1-4 | 维度 5-8 | 维度 9-12 | 维度 13-16 |
|------|---------|---------|----------|-----------|
| **A 语言与形式** | 语言艺术性 | 修辞运用 | 结构设计 | 文体适配 |
| **B 叙事与内容** | 叙事技巧 | 人物塑造 | 情节架构 | 细节密度 |
| **C 思想与意义** | 主题深度 | 情感力量 | 象征体系 | 时代价值 |
| **D 审美与影响** | 风格独创性 | 审美统一 | 文学影响 | 经典地位 |

### 综合分计算公式

```
WCS = PWS × k × mf

PWS  = Σ(16维分数 × 策略权重)    加权综合分
k    = 1/(1+0.01×gap)          偏科惩罚（核心弱而周边强）
mf   = 1-0.006×(75-mean)       平庸惩罚（全面平庸无亮点）
```

### 十五级锚定标尺

| 分数 | 评级 | 守门员 |
|------|------|--------|
| 140-150 | 文学之巅 👑 | 《圣经》《诗经》 |
| 125-139 | 永恒殿堂 🏆 | 《红楼梦》《哈姆雷特》 |
| 115-124 | 不朽丰碑 🏛️ | 《百年孤独》《战争与和平》 |
| 105-114 | 传世经典 📜 | 《罪与罚》《包法利夫人》 |
| 95-104 | 典范之作 ⭐ | 《了不起的盖茨比》 |
| ... | ... | ... |
| 0-4.9 | 零价值 ∅ | — |

---

## 项目结构

```
LAS/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── config.py            # 环境配置
│   ├── requirements.txt     # Python 依赖
│   ├── models/orm.py        # SQLAlchemy 模型 (User/Work/Analysis)
│   ├── schemas/models.py    # Pydantic 请求/响应模型
│   ├── routers/
│   │   ├── auth.py          # 注册/登录/JWT
│   │   ├── deps.py          # 认证依赖注入
│   │   └── works.py         # 作品 CRUD + SSE 分析流
│   ├── services/
│   │   ├── llm.py           # DeepSeek API 调用 + JSON 解析
│   │   ├── analyzer.py      # 报告构建编排
│   │   └── calculator.py    # 评分引擎 (PWS/k/mf/WCS)
│   └── prompts/las.py       # 提示词加载 (V1/V2)
│
├── frontend/
│   ├── spa.html             # SPA 入口
│   ├── css/app.css          # 全局样式
│   ├── js/
│   │   ├── api.js           # API 客户端
│   │   ├── app.js           # Hash 路由器
│   │   └── pages/
│   │       ├── upload.js    # 提交页
│   │       ├── analyze.js   # 分析进度页
│   │       └── report.js    # 报告渲染
│   └── templates/
│       ├── classic.html     # 经典模式报告模板（深红，纯 HTML 无脚本）
│       └── original.html    # 原创模式报告模板（紫色，纯 HTML 无脚本）
│   └── standalone/          # 独立报告页（自包含 HTML）
│
├── LAS v5.2.3 bata.MD       # 原始 LAS 框架文档（V1 提示词基准）
├── LAS v5.2.3 json-mode.MD  # JSON 输出模式提示词（V2，当前使用）
├── lascd.html               # 首页（LAS 体系介绍）
├── DESIGN.md                 # 设计规范（awesome-design-md 格式，供 AI/设计师）
├── Dockerfile
├── docker-compose.yml
├── start.bat                # Windows 启动脚本
└── SKILL/                   # Claude Code 自定义技能
    ├── las-debug/            # 全链路诊断
    ├── las-smoke/            # 冒烟测试
    ├── code-reviewer/        # 前端代码审查
    ├── design-to-code/       # 设计稿→代码
    └── frontend-designer/    # 前端设计规范
```

---

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 |
| `POST` | `/api/auth/register` | 注册 |
| `POST` | `/api/auth/login` | 登录 |
| `GET` | `/api/works` | 作品列表 |
| `POST` | `/api/works` | 提交作品 |
| `GET` | `/api/works/{id}` | 作品详情 |
| `DELETE` | `/api/works/{id}` | 删除作品 |
| `POST` | `/api/works/{id}/analyze` | 触发分析（SSE 流） |
| `GET` | `/api/works/{id}/report` | 获取报告 |

---

## Docker 部署

```bash
docker compose up -d
```

服务监听 `http://localhost:8000`，数据持久化在 `./data` 目录。

---

## 设计规范

项目根目录的 `DESIGN.md` 基于 [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 范式编写。AI 编程工具（Claude Code、Cursor 等）可读取该文件，按照 LAS 的设计语言（学术期刊 × 东方古籍美学、深红/金色/墨色系统、三级字体栈）生成风格一致的 UI。

`LAS 报告页 2D 视觉微调指导文档 (v5.2.3).md` 进一步细化报告页的排版与交互规范。

## Claude Code 技能

| 技能 | 用途 |
|------|------|
| `/las-debug` | 全链路诊断：报告空白、分析失败时逐层排查 |
| `/las-smoke` | 端到端冒烟测试 |
| `/code-reviewer` | 前端代码多维度审查 |
| `/design-to-code` | 设计稿→代码还原 |
| `/frontend-designer` | 前端设计美学规范 |

---

## 设计者

凸(→_→)凸 · LAS 框架 · v5.2.3 beta
