# LAS v5.2.3 — 文学分析系统

**L**iterary **A**nalysis **S**ystem — 基于大语言模型的十六维文学价值评估框架。

用户提交作品（原创或经典），系统以严肃文学史谱系为参照，对文本进行 16 个维度的逐项评分，综合体裁策略权重、偏科惩罚和平庸惩罚，输出包含雷达图、评分详表、深度文学分析、评分决策日志和文学签文的交互式报告。

---

## 快速开始

### 环境要求

- Python 3.12+
- DeepSeek API Key

### 安装与运行

```bash
# 1. 配置环境
cp .env.example .env
# 编辑 .env，填入 LAS_LLM_API_KEY

# 2. 安装依赖
pip install -r backend/requirements.txt

# 3. 启动
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Windows 用户直接双击 `start.bat`。浏览器打开 `http://localhost:8000`，点击「提交作品」开始使用。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `LAS_LLM_API_KEY` | （必填） | DeepSeek API 密钥 |
| `LAS_LLM_MODEL` | `deepseek-v4-pro` | 模型名 |
| `LAS_LLM_BASE_URL` | `https://api.deepseek.com/v1` | API 地址 |
| `LAS_LLM_MAX_TOKENS` | `32000` | 输出上限 |
| `LAS_LLM_TEMPERATURE` | `0.1` | 生成温度 |
| `LAS_SECRET_KEY` | `dev-secret-...` | JWT 签名密钥 |
| `LAS_DEV` | `false` | 开发模式（跳过认证） |
| `LAS_PROMPT_VERSION` | `v2` | 提示词版本（v2=JSON 模式） |
| `LAS_CORS_ORIGINS` | `http://localhost:8000` | CORS 白名单 |

---

## 使用流程

### 经典模式
仅需输入作品名（如《红楼梦》《百年孤独》），LLM 基于预训练知识库进行全文分析，作者名自动补全。

### 原创模式
填写标题、作者（选填）、粘贴正文或上传文件。支持 **TXT / MD / Word (.docx)** 格式，拖拽至文本框或点击按钮上传。右下角实时显示字数统计。

分析过程通过 SSE 流式传输 10 步进度（初始化 → 体裁识别 → 缺陷扫描 → 四层逐维评分 → 基准比对 → 均衡校验 → 综合计算），完成后自动跳转至报告页。

---

## 评分体系

### 十六维度（四层面）

| 层面 | 维度 1-4 | 维度 5-8 | 维度 9-12 | 维度 13-16 |
|------|---------|---------|----------|-----------|
| **A 语言与形式** | 语言艺术性 | 修辞运用 | 结构设计 | 文体适配 |
| **B 叙事与内容** | 叙事技巧 | 人物塑造 | 情节架构 | 细节密度 |
| **C 思想与意义** | 主题深度 | 情感力量 | 象征体系 | 时代价值 |
| **D 审美与影响** | 风格独创性 | 审美统一 | 文学影响 | 经典地位 |

### 综合分计算

```
WCS = PWS × k × mf

PWS  = Σ(16维分数 × 策略权重)    加权综合分
k    = 1/(1+0.01×gap)          偏科惩罚（核心弱而周边强）
mf   = 1-0.006×(75-mean)       平庸惩罚（全面平庸无亮点）
```

### 十五级锚定标尺

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
| 0-4.9 | 零价值 | — |

---

## 技术架构

```
浏览器 (SPA)              FastAPI 后端                 DeepSeek V4
┌──────────────┐  HTTP   ┌──────────────────┐  API   ┌───────────┐
│ spa.html     │◄───────►│ main.py          │◄───────►│ v4-pro    │
│ ├ upload.js  │         │ ├ routers/works  │  SSE    │ 1M ctx    │
│ ├ analyze.js │  SSE    │ ├ services/llm   │ stream  │           │
│ └ report.js  │◄───────│ ├ analyzer       │◄───────│           │
│              │         │ └ calculator     │         └───────────┘
└──────────────┘         └──────────────────┘
```

- **前端**：Vanilla JS SPA，hash 路由，Chart.js 雷达图，mammoth.js 文档解析，html2canvas 截图。经典模式（深红）与原创模式（紫色）双模板
- **后端**：FastAPI + SQLAlchemy + SQLite，SSE 流式传输分析进度，3 层 JSON 容错修复（截断/转义/格式）
- **AI**：DeepSeek V4，58KB 系统提示词（6 公理 + 13 步工作流 + 16 维锚定表 + 15 级标尺 + scoring_audit 自检），支持 V1/V2 提示词版本切换

---

## 项目结构

```
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── config.py            # 环境配置
│   ├── models/orm.py        # SQLAlchemy 模型
│   ├── schemas/models.py    # Pydantic 模型
│   ├── routers/             # API 路由
│   │   ├── auth.py          # 注册/登录/JWT
│   │   └── works.py         # 作品 CRUD + SSE 分析流
│   ├── services/
│   │   ├── llm.py           # LLM 调用 + JSON 容错解析
│   │   ├── analyzer.py      # 报告构建编排
│   │   └── calculator.py    # 评分引擎 (PWS/k/mf/WCS)
│   └── prompts/las.py       # 提示词加载
│
├── frontend/
│   ├── spa.html             # SPA 入口
│   ├── quotes.json          # 302 条文学金句
│   ├── css/app.css          # 全局样式
│   ├── js/
│   │   ├── api.js           # API 客户端
│   │   ├── app.js           # Hash 路由 + 工具函数
│   │   └── pages/
│   │       ├── upload.js    # 提交页（文件上传 + 字数统计）
│   │       ├── analyze.js   # 分析进度页（SSE 驱动）
│   │       └── report.js    # 报告渲染（模板 + 雷达图 + 截图）
│   └── templates/
│       ├── classic.html     # 经典模式报告模板
│       └── original.html    # 原创模式报告模板
│
├── docs/                    # 项目文档
│   ├── project-overview.md  # 项目概况
│   ├── recruitment.md       # 招募说明
│   ├── STATUS.md            # 当前状态
│   ├── json-mode-reference.md
│   └── visual-tuning-guide.md
│
├── SKILL/                   # Claude Code 自定义技能
├── scripts/                 # 工具脚本
├── lascd.html               # 首页（LAS 体系介绍）
├── DESIGN.md                 # 设计语言规范（awesome-design-md 格式）
├── start.bat                # Windows 启动脚本
├── Dockerfile
└── docker-compose.yml
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

## 设计规范

`DESIGN.md` 基于 [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 范式编写，定义了 LAS 的设计语言：学术期刊 × 东方古籍美学、深红/金色/墨色六色系统、三级字体栈（Noto Serif SC / Noto Sans SC / JetBrains Mono）。AI 编程工具可读取该文件，生成风格一致的 UI。

---

## Claude Code 技能

| 技能 | 用途 |
|------|------|
| `las-debug` | 全链路诊断：逐层排查 LLM→后端→API→前端 |
| `las-smoke` | 端到端冒烟测试 |
| `code-reviewer` | 前端代码多维度审查 |
| `design-to-code` | 设计稿→代码还原 |
| `frontend-designer` | 前端设计美学规范 |
