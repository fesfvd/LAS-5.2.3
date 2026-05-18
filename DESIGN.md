---
version: "1.0"
name: LAS-design-system
description: LAS（文学分析系统）的设计语言根植于"学术期刊 × 东方古籍美学"——暖米白纸底、衬线标题、金色品牌 accent、深红/紫双主题模式。整个系统建立在一套暖色调画布之上，以 Noto Serif SC 衬线体承担文学严肃性，Noto Sans SC 承担 UI 功能性，JetBrains Mono 承担技术精确性。组件体系中 glass-card（半透白卡）是唯一标准卡片，rule-strong 粗分割线开辟每个区块，StickyBar + sectionNav 构成报告页的双层导航。

colors:
  ink: "#1a1a1a"
  paper: "#faf8f3"
  gold: "#b8860b"
  gold-pressed: "#9a6f09"
  gold-soft: "rgba(184,134,11,0.08)"
  crimson: "#8b0000"
  crimson-pressed: "#6b0000"
  purple: "#6b21a8"
  purple-pressed: "#4e157a"
  jade: "#2d6a4f"
  jade-soft: "rgba(45,106,79,0.08)"
  muted: "#8a8578"
  muted-soft: "rgba(138,133,120,0.3)"
  rule: "rgba(26,26,26,0.08)"
  rule-strong: "rgba(26,26,26,0.15)"
  surface-glass: "rgba(255,255,255,0.45)"
  surface-warning: "rgba(180,120,30,0.04)"
  surface-adjustment: "rgba(180,120,30,0.08)"
  on-gold: "#faf8f3"
  on-crimson: "#faf8f3"
  on-purple: "#faf8f3"
  semantic-success: "#2d6a4f"
  semantic-warning: "#8b6914"
  semantic-error: "#dc2626"

typography:
  display-xl:
    fontFamily: "Noto Serif SC, Georgia, serif"
    fontSize: 80px
    fontWeight: 900
    lineHeight: 0.85
    letterSpacing: "0.15em"
  display-lg:
    fontFamily: "Noto Serif SC, Georgia, serif"
    fontSize: 48px
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "0.05em"
  heading-1:
    fontFamily: "Noto Serif SC, Georgia, serif"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.03em"
  heading-2:
    fontFamily: "Noto Serif SC, Georgia, serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.03em"
  heading-3:
    fontFamily: "Noto Serif SC, Georgia, serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.03em"
  body-lg:
    fontFamily: "Noto Serif SC, Georgia, serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 2.0
    letterSpacing: "0.03em"
  body-md:
    fontFamily: "Noto Sans SC, Helvetica, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: 0
  body-sm:
    fontFamily: "Noto Sans SC, Helvetica, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: 0
  caption:
    fontFamily: "Noto Sans SC, Helvetica, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "4px"
  mono-label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0
  mono-score:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0
  mono-data:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  quote:
    fontFamily: "Noto Serif SC, Georgia, serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.625
    letterSpacing: "0.03em"
    fontStyle: italic

rounded:
  xs: 2px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 20px
  xl: 24px
  xxl: 32px
  section: 40px

components:
  glass-card:
    backgroundColor: "{colors.surface-glass}"
    borderColor: "{colors.rule}"
    rounded: "{rounded.lg}"
    padding: 20px
  button-primary:
    backgroundColor: transparent
    textColor: "{colors.gold}"
    borderColor: "{colors.gold}"
    typography: "{typography.mono-label}"
    rounded: 0
    padding: "12px 32px"
    letterSpacing: "3px"
    textTransform: uppercase
  button-primary-hover:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.on-gold}"
    borderColor: "{colors.gold}"
  score-ring:
    size: 120px
    strokeWidth: 7
    bgStroke: "rgba(26,26,26,0.05)"
    progressStroke: "{colors.crimson}"
    progressStrokePurple: "{colors.purple}"
    dashArray: 264
  badge-glow:
    background: "linear-gradient(90deg, {colors.crimson}, {colors.gold}, {colors.crimson}, {colors.gold}, {colors.crimson})"
    backgroundSize: "200% 100%"
    textColor: "{colors.on-crimson}"
  adjustment-badge:
    backgroundColor: "{colors.surface-adjustment}"
    textColor: "{colors.semantic-warning}"
    rounded: "{rounded.pill}"
    fontSize: "0.65rem"
    fontWeight: 600
  section-nav-btn:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.65rem"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  section-nav-btn-active:
    textColor: "{colors.gold}"
    borderColor: "{colors.gold}"
    backgroundColor: "{colors.gold-soft}"
  accordion-trigger:
    padding: 16px
    cursor: pointer
  accordion-content:
    maxHeight: 0
    overflow: hidden
    transition: "max-height 0.4s ease"
  accordion-content-open:
    maxHeight: 8000px
  sticky-bar:
    position: fixed
    top: 0
    backgroundColor: "rgba(250,248,243,0.92)"
    backdropFilter: "blur(12px)"
    borderBottom: "1px solid {colors.rule}"
    transform: "translateY(-100%)"
  sticky-bar-show:
    transform: "translateY(0)"
  section-nav:
    position: fixed
    top: 0
    backgroundColor: "rgba(250,248,243,0.88)"
    backdropFilter: "blur(10px)"
    borderBottom: "1px solid {colors.rule}"
  nav-pip:
    size: 8px
    rounded: "{rounded.pill}"
    backgroundColor: "rgba(26,26,26,0.12)"
  nav-pip-active:
    backgroundColor: "{colors.crimson}"
    transform: "scale(1.4)"
  bar-track:
    height: 6px
    rounded: 3px
    backgroundColor: "rgba(26,26,26,0.05)"
  bar-fill:
    height: "100%"
    rounded: 3px
    transition: "width 1.5s cubic-bezier(0.4,0,0.2,1)"
  expand-row:
    maxHeight: 0
    overflow: hidden
    transition: "max-height 0.4s ease"
  expand-row-open:
    maxHeight: 800px
  toast-loading:
    backgroundColor: "{colors.paper}"
    borderColor: "{colors.rule}"
    typography: "{typography.body-sm}"
    textColor: "{colors.muted}"
  analyze-terminal:
    backgroundColor: "rgba(26,26,26,0.02)"
    borderColor: "{colors.rule}"
    typography: "{typography.mono-label}"
    textColor: "{colors.ink}"
    padding: 20px
---

## Overview

LAS 的界面气质定位于**学术期刊 × 东方古籍美学**的交汇点。底色是暖米白 `{colors.paper}`（#faf8f3）——不是冷灰白，不是纯白，而是微微泛黄的旧纸色。这个底色是 LAS 与所有 SaaS/技术产品最根本的视觉分界：它暗示这不是一个冷冰冰的分析工具，而是一本会说话的文学评论期刊。

标题使用 **Noto Serif SC** 衬线体（对应 Claude 的 Copernicus），正文分析段落同样用衬线，营造文学批评的严肃感。UI 标签和导航使用 **Noto Sans SC**，承担功能性角色。所有技术标签、评分数字、英文缩写使用 **JetBrains Mono** 等宽字体，传达精确测量的工具理性。

品牌 accent 是**金色** `{colors.gold}`（#b8860b）——不像 Claude 的珊瑚那样柔和，金色更接近书籍烫金、古籍题签的质感。

LAS 有两套主题模式，切换维度是分析类型：

1. **经典模式（Crimson）**：深红 `{colors.crimson}`（#8b0000）——分析已出版的经典作品。深红 = 权威、经典、不可撼动的文学史坐标。
2. **原创模式（Purple）**：紫色 `{colors.purple}`（#6b21a8）——分析用户提交的原创作品。紫色 = 创造力、可能性、尚未被经典化的写作。

两套主题共享相同的金色品牌 accent 和纸底背景，仅在评分环形图、雷达图主色、StickyBar 分数颜色、标签徽标等处切换 crimson ↔ purple。

**关键设计特征**：
- 纸底画布 `{colors.paper}`（#faf8f3）+ 暖墨色文字 `{colors.ink}`（#1a1a1a）
- Serif 文学正文 + Sans UI 标签 + Mono 技术数据，三轨字体各司其职
- `{components.glass-card}` 半透白卡是唯一标准卡片——没有彩色边框、没有彩色背景
- `rule-strong`（`{colors.rule-strong}`）粗分割线开辟每个 section，替代彩色 section header
- 区块标题模式：`<hr class="rule-strong">` → `<h2 class="serif font-bold">` → 内容
- 金色只在关键交互节点出现（主按钮、active 态、品牌标记），大多数界面保持 ink/paper/muted 的克制配色
- 原创模式报告比经典模式多一个"审慎校验" section（Verification）
- 报告页拥有双层导航：StickyBar（标题+分数） + SectionNav（区块快捷跳转）

## Colors

### Brand & Accent
- **Gold / Primary**（`{colors.gold}` — #b8860b）：品牌识别色，用于主按钮边框、active 导航态、文学签文关键词、金句左侧装饰线。不用于大面积填充——金色的力量来自克制。
- **Gold Pressed**（`{colors.gold-pressed}` — #9a6f09）：按钮 hover/按下加深。
- **Gold Soft**（`{colors.gold-soft}` — rgba(184,134,11,0.08)）：金色背景微调，用于 active 标签底色。

### Mode Themes
- **Crimson**（`{colors.crimson}` — #8b0000）：经典模式主题色。评分环形图进度弧、StickyBar 分数字色、nav-pip active 态。深红传达经典权威。
- **Purple**（`{colors.purple}` — #6b21a8）：原创模式主题色。评分环形图进度弧、StickyBar 分数字色、"原创模式"徽标。紫色传达创造力。
- 同一页面中 crimson 和 purple 不同时出现——模式在分析开始时就已确定。

### Surface
- **Paper**（`{colors.paper}` — #faf8f3）：全局背景。暖米白，仿旧纸质感。这是 LAS 与所有冷色调产品的根本分界线。
- **Glass Card**（`{colors.surface-glass}` — rgba(255,255,255,0.45)）：半透白卡片，叠加在 paper 底色上产生微妙的层次差异。
- **Warning Surface**（`{colors.surface-warning}` — rgba(180,120,30,0.04)）：审慎校验警告框的暖黄底色。
- **Adjustment Surface**（`{colors.surface-adjustment}` — rgba(180,120,30,0.08)）：维度调整徽标的底色。

### Text
- **Ink**（`{colors.ink}` — #1a1a1a）：所有标题和正文文字。暖黑，不是纯黑 #000。
- **Muted**（`{colors.muted}` — #8a8578）：次要文字、辅助标签、元数据信息。
- **Muted Soft**（`{colors.muted-soft}` — rgba(138,133,120,0.3)）：极其克制的分隔符和图标色。

### Divider
- **Rule**（`{colors.rule}` — rgba(26,26,26,0.08)）：细分割线，卡片内部使用。
- **Rule Strong**（`{colors.rule-strong}` — rgba(26,26,26,0.15)）：粗分割线，section 之间使用。

### Semantic
- **Jade**（`{colors.jade}` — #2d6a4f）：正面指标——"最突出优势"分数色、极端筛查通过图标、策略三叙事层代表色。
- **Warning**（`{colors.semantic-warning}` — #8b6914）：调整徽标文字色。
- **Error**（`{colors.semantic-error}` — #dc2626）："最明显短板"分数色。

## Typography

### Font Family
系统使用三级字体栈，严格分工：

| 角色 | 字体 | CSS Class | 用途 |
|------|------|-----------|------|
| 文学 | Noto Serif SC, Georgia, serif | `.serif` | 标题、正文分析段落、引语、结论、文学签文 |
| 功能 | Noto Sans SC, Helvetica, sans-serif | （默认） | UI 标签、导航、按钮中文、元数据 |
| 技术 | JetBrains Mono, monospace | `.mono` | 英文缩写标签、评分数字、LAS ID、token 统计 |

**铁律**：
- 文学内容（作品概述、分析文本、引语、结论）必须用 `.serif`
- 系统标签（英文 acronym、评分数字、ID）必须用 `.mono`
- UI 辅助文字（导航、按钮中文、筛选下拉）用 Sans（默认）
- 不得混用：不允许 Sans 出现在分析段落中，不允许 Serif 出现在技术标签中

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 80px | 900 | 0.85 | 0.15em | 首页 Hero "LAS" — Noto Serif SC |
| `{typography.display-lg}` | 48px | 900 | 1.05 | 0.05em | 报告页作品标题 — Noto Serif SC |
| `{typography.heading-1}` | 30px | 700 | 1.1 | 0.03em | 提交页/分析页主标题 |
| `{typography.heading-2}` | 24px | 700 | 1.2 | 0.03em | Section 标题（"评分详表""深度文学分析"等） |
| `{typography.heading-3}` | 18px | 600 | 1.3 | 0.03em | 卡片内部小标题 |
| `{typography.body-lg}` | 18px | 400 | 2.0 | 0.03em | 综合结论正文 — Serif |
| `{typography.body-md}` | 16px | 400 | 1.8 | 0 | UI 辅助文字 — Sans |
| `{typography.body-sm}` | 14px | 400 | 1.625 | 0 | 卡片内描述文字 |
| `{typography.caption}` | 12px | 400 | 1.5 | 0 | 元数据标签 |
| `{typography.caption-uppercase}` | 11px | 500 | 1.4 | 4px | 英文 section 标签（"PHILOSOPHY""DIMENSIONS"） |
| `{typography.mono-label}` | 13px | 400 | 1.7 | 0 | 终端风格日志、分析进度文字 |
| `{typography.mono-score}` | 24px | 700 | 1 | 0 | 综合分大数字（"75.10"） |
| `{typography.mono-data}` | 12px | 400 | 1.5 | 0 | 表格内权重/分数数据 |
| `{typography.quote}` | 18px | 500 | 1.625 | 0.03em | 金句引用 — Serif italic |

### Principles
- 衬线体标题使用 weight 900（Black）或 700（Bold），不使用 400 Regular——LAS 的文学权威感需要衬线加粗来承载，这与 Claude 的 400 轻衬线不同。
- 金句（golden quote）必须 italic + 金色左侧装饰线（`border-left: 2px solid {colors.gold}`）。
- 正文分析段落使用 `line-height: 2.0`，比常规 1.6-1.8 更宽松——文学批评需要呼吸感。
- Mono 数字不使用 letter-spacing，保持数字紧凑精确。
- 禁止在衬线体上使用负 letter-spacing——Noto Serif SC 的中文字符在负间距下会显得拥挤。

## Layout

### Spacing System
- **Base unit:** 4px
- **Section 间距:** `{spacing.section}` (40px) — 报告页内容密度高，不加到 96px
- **卡片内边距:** 20px（`{components.glass-card}` 的 padding）
- **网格间距:** `gap-5` (20px) 到 `gap-8` (32px)

### Grid & Container
- **报告页最大宽度:** `max-w-5xl`（~1024px）——文学文本行宽不能太宽，保证阅读舒适度
- **Hero 区布局:** 12 列网格，4/8 分栏（左：综合分环形图 + 四层面柱状条；右：雷达图）
- **评分详表:** 单列，`min-width: 680px` 保证表格不挤压，溢出时水平滚动
- **附录:** 2 列网格（md 以上），卡片式排列
- **移动端:** 全部单列堆叠

### Whitespace Philosophy
报告页内容密度远高于首页——一份报告包含 Hero、评估概要、校验记录、评分详表、基准集、深度分析、专业视角、结论、附录共 9 个 section。因此 section 间距控制在 40px（而非首页的 96px），卡片内边距 20px（而非 32px）。整体节奏紧凑但不拥挤——每个 section 之间有 `rule-strong` 粗线作为视觉"翻页"信号。

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | 无阴影、无边框 | Body 背景、section 内容区 |
| Hairline | 1px `{colors.rule}` 边框 | Glass-card 卡片、表格单元格分隔 |
| Strong hairline | 1px `{colors.rule-strong}` 边框 | Section 顶部分割线 |
| Glass card | `{colors.surface-glass}` 背景 + hairline 边框 | 所有内容卡片 |
| Sticky | `backdrop-filter: blur(12px)` + 半透明纸底 | StickyBar、SectionNav |

LAS **不使用阴影**。所有深度来自半透白卡片与纸底的微妙色差，以及 sticky 元素的毛玻璃 blur 效果。这与 Claude 的"color-block first, shadow rare"理念一致，但更极端——连 hover 态都不用 shadow，用 translateY(-2px) 微位移替代。

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 2px | 进度条、柱状条端点 |
| `{rounded.sm}` | 4px | 小标签、调整徽标 |
| `{rounded.md}` | 8px | 按钮、输入框、筛选下拉 |
| `{rounded.lg}` | 12px | Glass-card 卡片 |
| `{rounded.xl}` | 16px | Hero 插图容器 |
| `{rounded.pill}` | 9999px | 评级徽标、模式标签、nav-pip、section-nav-btn |

### Visual Embellishments
- **Badge Glow**：评级徽标使用 shimmer 渐变动画——金色到深红循环的 background-position 动画——传达"这个评级是精心计算出来的"仪式感。仅用于 Hero 区评级徽标，其他地方用静态 pill。
- **Rule Gold**：短金色分割线（width: 3rem），仅用于首页 Hero 和 Footer——报告页不使用，保持严肃。

## Components

### Top Navigation（报告页）

**`sticky-bar`** — 固定在页面顶部的信息条。初始隐藏（translateY(-100%)），Hero 区滚出视口后滑入。左侧：羽毛图标（原创模式）/ 作品标题 + 作者；右侧：综合分数字（`.mono-score` + 模式主题色）+ 评级 pill + 返回顶部按钮。高度约 52px。

**`section-nav`** — StickyBar 下方的第二层导航。水平排列所有 section 快捷按钮（概览/评估/校验/详表/基准/分析/专业/结论/附录），当前可视 section 对应按钮高亮（金色边框 + 金色文字 + 金色微底）。原创模式多一个"校验"按钮。移动端水平可滚动。

### Side Navigation

**`nav-pip`** — 固定在右侧的圆点导航。8px 直径圆形，默认 `rgba(26,26,26,0.12)` 灰色，当前 section 对应 pip 放大至 1.4 倍 + 模式主题色填充。hover 时变深。移动端隐藏（`display: none`）。

**`mob-nav`** — 移动端替代方案：底部固定 4 按钮导航条（概览/详表/分析/附录），原创模式多一个"校验"。

### Score Ring

**`score-ring`** — 120px 直径 SVG 环形进度图。背景弧（`{colors.rule}` 透明度），进度弧（经典模式 `{colors.crimson}` / 原创模式 `{colors.purple}`），stroke-width 7px，stroke-linecap round。dasharray 264（2π×42）。中心叠加分数字（`.mono-score` 24px bold）和 "/150" 小字。页面加载后进度弧从 0 动画过渡到实际分数（2s cubic-bezier）。

### Radar Chart

**`radar-chart`** — Chart.js radar 类型。16 轴（对应 16 个维度名），0-150 刻度隐藏。数据集：半透明主题色填充 + 主题色边框。数据点半径 5px，hover 放大至 9px 并切换 cursor 为 pointer。内置 lvlPlugin 绘制 150/125/105/95/75 五圈虚线参考环。tooltip 显示维度名 + 分数/150 + 档位 + 权重。首次加载分数从 0 动画过渡（2.5s quartic ease-out）。点击数据点跳转至评分详表。

### Bars

**`bar-track` / `bar-fill`** — 四层面水平柱状图。6px 高圆角轨道（`rgba(26,26,26,0.05)`）+ 主题色填充条。各层颜色：A 语言形式（purple/crimson）、B 叙事内容（jade）、C 思想意义（gold）、D 审美影响（ink）。加载后宽度从 0 动画过渡到实际百分比（1.5s cubic-bezier）。

### Glass Card

**`glass-card`** — LAS 唯一标准卡片。`{colors.surface-glass}` 半透白背景 + `{colors.rule}` 1px 边框 + `{rounded.lg}` 12px 圆角 + 20px 内边距。**禁止变体**：不允许彩色左边框、不允许彩色背景、不允许阴影。卡片的视觉区分靠内部元素（图标颜色、标题层级、内容密度）来实现。

### Assessment Summary

Hero 下方第一个 section。左右双卡布局：左侧 jade 色调"最突出优势"（绿色图标 + 最高分维度名 + 结论），右侧 error 色调"最明显短板"（红色图标 + 最低分维度名 + 结论）。底部折叠式评级说明。两张卡内部使用微色背景（`rgba(45,106,79,0.04)` / `rgba(220,38,38,0.04)`）而非 glass-card 标准白——这是唯一允许的玻璃卡内部色彩变体。

### Rating Table

**`table`** — 16 行评分详表。6 列：维度名（`.serif` + 四层色点）+ 权重（`.mono`）+ 分数（`.mono` bold）+ 档位（pill 徽标）+ 核心基准（截断 30 字）+ 展开箭头。每行可点击展开（`.expand-row`），显示五步法详情：基准表现 → 证据引用 → 差距等级 → 反向锚定（彩色文字）→ 结论。顶部搜索框（按维度名筛选）+ 档位下拉筛选。鼠标 hover 行背景变主题色微调。

### Accordion

**`accordion`** — 深度文学分析区使用。触发按钮：flex 水平布局，左侧 emoji + serif 标题，右侧 chevron 图标。内容区 `max-height: 0 → 8000px` 过渡（0.4s ease）。点击展开/折叠，图标旋转 180°。多个手风琴独立操作（不采用"展开一个就收起其他"的手风琴模式——文学分析各节内容独立，用户可能需要同时参考两个面板）。

### Verification（原创模式独有）

三部分构成：
1. **极端筛查**：绿色盾牌 ✓ 或警告三角，绿色微底卡片
2. **审慎下调列表**：`{components.glass-card}` 包裹的调整条目，每项显示维度名 + 原始分→调整分（`adjustment-badge`）+ 展开后显示五步证据
3. **惩罚系数计算**：PWS × k × mf = WCS 的数学展开，每行左侧 Mono 标签 + 右侧解释文字

### Professional Sections

三个子卡片（编辑审稿建议/创作导语/阅读研习建议）均使用标准 `glass-card`。图标颜色区分类型：jade = 编辑/阅读建议，crimson = 创作导语。原创模式额外显示"原创模式" pill 标签。**不再使用 border-left 彩色左边框**——这是旧版样式，已被 glass-card 统一替代。

### Fortune（文学签文）

报告正文结束后、Footer 之前的居中区块。三行结构：评级 + 关键词（Serif bold + 模式主题色/金色）+ 签文诗句（Serif medium）+ 出处（Sans caption muted）。灵感来源于寺庙签文，是 LAS 最具东方古籍气质的设计元素。

### Footer

三行居中布局：① LAS ID · 版本 · 日期 · 模式徽标 ② Token 消耗统计（Mono）③ 免责声明 + QQ 群链接。`py-8` 上下间距，`{colors.rule}` 顶部分割线。经典模式链接用 crimson，原创模式用 purple。

### Buttons

**`button-primary`** — 透明背景 + 金色边框 + 金色文字 + Mono 字体 + 大写英文 + 3px letter-spacing。hover 时反转：金色填充 + 纸色文字。这是 LAS 唯一的按钮样式——没有次级按钮、没有 ghost 按钮、没有彩色填充按钮。提交页和分析页使用此按钮。

### Top Button

**`topBtn`** — 36px 圆形返回顶部按钮，固定在右下角。纸色背景 + `{colors.rule}` 边框。初始透明（opacity: 0），滚动超过 600px 后淡入。hover 切换为主题色（经典 crimson / 原创 purple）。移动端尺寸缩小至 32px。

## Do's and Don'ts

### Do
- 以 `{colors.paper}` 纸底为全局背景。纯白 #fff 或冷灰 #f5f5f5 会破坏"旧纸期刊"的气质。
- 文学性正文使用 `.serif`（Noto Serif SC），UI 标签使用 Sans，技术数据使用 `.mono`。三轨字体各司其职，不得混用。
- 每个 section 以 `<hr class="rule-strong">` 开头，后跟 `<h2 class="serif font-bold">` 标题。这是 LAS 的"翻页"仪式。
- 使用 `{components.glass-card}` 作为唯一卡片样式。不发明新的卡片变体。
- 金色仅用于关键交互节点：主按钮、active 态、金句装饰线、签文关键词。克制使用。
- 经典模式用 crimson，原创模式用 purple，同一页面不同时出现两套主题色。
- Section 间距保持 40px——报告页内容密度高，不需要首页的 96px 大间距。

### Don't
- 不要使用彩色左边框卡片（`border-left: 4px solid`）——这是已废弃的旧版样式。
- 不要给卡片添加阴影（`box-shadow`）。LAS 的深度来自半透白 glass 效果，不是投影。
- 不要在文学正文中使用 Sans 字体——这会完全破坏"文学批评"的严肃感。
- 不要使用纯黑 #000 文字——`{colors.ink}`（#1a1a1a）是预设的最深色。
- 不要发明新的卡片样式。Glass card 是唯一标准。
- 不要将金色用于大面积背景填充。金色是 accent，不是 surface。
- 报告页不使用 `rule-gold`（短金色分割线）——那是首页的专属装饰元素。
- 不要在同一个分析流程中混合两种模式的视觉元素。

## Dual-Theme System

LAS 有两套主题，通过 `window.__LAS_REPORT_MODE` 在运行时确定：

| 属性 | 经典模式 (classic) | 原创模式 (original) |
|------|-------------------|---------------------|
| 主题色 | `{colors.crimson}` #8b0000 | `{colors.purple}` #6b21a8 |
| 评分环进度弧 | crimson | purple |
| 雷达图填充/边框 | crimson 系 | purple 系 |
| 四层面柱 A 层色 | crimson | purple |
| StickyBar 分数色 | crimson | purple |
| 模式标签 | 无（经典模式不额外标注） | "原创模式" purple pill |
| Section 数量 | 8 个（无 Verification） | 9 个（多 Verification） |
| Professional 内容 | 创作启示 + 阅读建议 | 编辑审稿 + 创作导语 + 阅读建议 |
| Verification | 无 | 有（极端筛查 + 审慎下调 + 惩罚计算） |

实现方式：模板为纯 HTML + `{{PLACEHOLDER}}`，所有颜色差异由 `report.js` 的 `initReport()` 根据 mode 动态注入。主题色通过 `LC` 数组和 `primaryColor` 变量传递。

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | 右侧 pip 导航隐藏，底部 mob-nav 显示；Hero 4/8 分栏变单列堆叠；评分详表水平滚动；SectionNav 按钮缩小字号；StickyBar 压缩高度；附录 2 列变 1 列 |
| Tablet | 768-1024px | 侧边导航显示；Hero 保持分栏但间距收紧；附录 2 列 |
| Desktop | > 1024px | 完整布局 |

### Touch Targets
- Nav-pip: 8px 直径（偏小，但通过 hover 放大 + 足够的间距补偿）
- Section-nav-btn: 最小 32px 宽
- Accordion trigger: 整行可点击（`w-full`）
- Table expand row: 整行可点击（`cursor: pointer`）

### Collapsing Strategy
- 右侧 pip 导航在移动端直接隐藏——移动端屏幕窄，pip 没有放置空间
- 底部 mob-nav 替代 pip 作为移动端的快捷导航
- SectionNav 按钮不换行，改为水平滚动（`overflow-x: auto`）
- 评分详表设置 `min-width: 680px`，移动端水平滚动而非挤压列宽
- 雷达图 canvas 响应式缩放（`responsive: true, maintainAspectRatio: false`）

## Iteration Guide

1. 所有颜色引用使用 token（`{colors.gold}`），禁止硬编码 hex。
2. 组件变体（hover/active/disabled）作为独立条目记录在 `components:` 中。
3. 新增 section 遵循标准模板：`<section id="xxx"><hr class="rule-strong"><h2 class="serif">标题</h2>...`
4. 卡片统一使用 `glass-card`，不发明新样式。如需视觉区分，调整内部元素的图标颜色或微调内部背景。
5. 经典/原创双主题的差异仅限于主题色（crimson ↔ purple）和 section 数量——不引入第三种主题色。
6. 字体分工铁律不可打破：Serif = 文学，Sans = UI，Mono = 技术。
7. 不确定如何强调时，优先加大衬体字号（weight 700→900）而非换颜色。
