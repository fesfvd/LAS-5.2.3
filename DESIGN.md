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
  muted: "#6b6558"
  muted-soft: "rgba(107,101,88,0.3)"
  rule: "rgba(26,26,26,0.08)"
  rule-strong: "rgba(26,26,26,0.15)"
  surface-glass: "rgba(255,255,255,0.45)"
  surface-soft: "#f5f0e8"
  surface-card: "#efe9de"
  surface-warning: "rgba(180,120,30,0.04)"
  surface-adjustment: "rgba(180,120,30,0.08)"
  on-gold: "#faf8f3"
  on-crimson: "#faf8f3"
  on-purple: "#faf8f3"
  semantic-success: "#2d6a4f"
  semantic-warning: "#8b6914"
  semantic-error: "#dc2626"

card-tints:
  jade: "rgba(45,106,79,0.04)"
  warning: "rgba(180,120,30,0.04)"
  error: "rgba(220,38,38,0.04)"
  gold: "rgba(184,134,11,0.04)"
  purple: "rgba(107,33,168,0.04)"

chart:
  layer-a-classic: "#8b0000"
  layer-a-original: "#6b21a8"
  layer-b: "#2d6a4f"
  layer-c: "#b8860b"
  layer-d: "#1a1a1a"
  radar-fill-classic: "rgba(139,0,0,0.08)"
  radar-fill-original: "rgba(107,33,168,0.08)"
  radar-border-classic: "#8b0000"
  radar-border-original: "#6b21a8"
  reference-ring: "rgba(26,26,26,0.06)"
  tooltip-bg: "rgba(26,26,26,0.85)"
  tooltip-text: "#faf8f3"

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
    fontFeature: "tnum"
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

motion:
  duration:
    instant: 100ms
    fast: 200ms
    normal: 350ms
    slow: 500ms
    reveal: 1500ms
  easing:
    standard: cubic-bezier(0.4, 0, 0.2, 1)
    decelerate: cubic-bezier(0.0, 0, 0.2, 1)
    smooth: cubic-bezier(0.22, 0.61, 0.36, 1)

elevation:
  flat:
    description: 纸底背景，无边框无阴影
  hairline:
    description: 1px {colors.rule} 边框
  strong:
    description: 1px {colors.rule-strong} 边框
  sticky:
    description: backdrop-filter blur(12px) + 半透明纸底
  overlay:
    description: 半透明遮罩

z-index:
  base: 0
  raised: 10
  dropdown: 50
  sticky: 100
  overlay: 1000

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
    rounded: "{rounded.sm}"
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
- **Muted**（`{colors.muted}` — #6b6558）：次要文字、辅助标签、元数据信息。与 paper 背景对比度 5.1:1，满足 WCAG AA。
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

## Motion

动效在 LAS 中不是装饰，是信息层次和状态转换的无声语言。所有动效参数从 token 中引用，禁止硬编码 duration/easing。

### Duration Scale

| Token | Value | Use |
|---|---|---|
| `{motion.duration.instant}` | 100ms | 微交互（scale 按下、opacity toggle、checkbox 切换） |
| `{motion.duration.fast}` | 200ms | hover 过渡（颜色、边框、translateY） |
| `{motion.duration.normal}` | 350ms | 页面转场、卡片入场、手风琴展开 |
| `{motion.duration.slow}` | 500ms | 进度动画、报告 section 入场 stagger |
| `{motion.duration.reveal}` | 1500ms | 评分环形图首次绘制、柱状条增长、雷达图动画 |

### Easing Curve

| Token | Value | Use |
|---|---|---|
| `{motion.easing.standard}` | cubic-bezier(0.4, 0, 0.2, 1) | 入场、展开、fadeIn——元素进入页面 |
| `{motion.easing.decelerate}` | cubic-bezier(0.0, 0, 0.2, 1) | 出场、收起、fadeOut——元素离开页面 |
| `{motion.easing.smooth}` | cubic-bezier(0.22, 0.61, 0.36, 1) | 页面转场 overlay——需要弹性感的大幅度运动 |

### Per-Component Animation Spec

| 组件 | 属性 | Duration | Easing | 备注 |
|------|------|----------|--------|------|
| Page transition | opacity + translateY(12px) | 350ms | standard | `#spaApp.page-enter`，不使用 `forwards` |
| StickyBar 滑入 | translateY(-100% → 0) | 300ms | standard | Hero 滚出视口后触发 |
| Score ring 进度弧 | stroke-dashoffset | 2000ms | standard | 首次加载从 0 动画到实际分数 |
| Bar fill 增长 | width (0 → 实际%) | 1500ms | standard | 四层面柱状条加载动画 |
| Radar chart | 数据点半径 + 位置 | 2500ms | quartic ease-out | Chart.js 动画配置 |
| Accordion 展开 | max-height (0 → 8000px) | 400ms | standard | 手风琴内容区滑开 |
| Expand row 展开 | max-height (0 → 800px) | 400ms | standard | 评分详表行展开 |
| Card 入场 | opacity + translateY(20px) | 350ms | standard | 分析页卡片 stagger 入场 |
| Badge glow | background-position 循环 | 10s | linear infinite | 评级徽标 shimmer 动画 |
| Hover 微位移 | translateY(0 → -1px or -2px) | 200ms | standard | 按钮、卡片、列表项 hover |
| Active 按下 | scale(1 → 0.97) | 100ms | standard | 按钮按下反馈 |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

尊重用户的系统级动效偏好。LAS 在 `app.css` 中已全局实现此媒体查询——所有非必要动画在用户开启"减少动效"时降级为即时切换。评分环、柱状条等数据可视化的入场动画也被覆盖，但 Chart.js 需要单独配置 `animation: false`。

### Micro-Interactions（借鉴 Apple / Framer / Stripe / Linear）

顶级产品的流畅感不在于大幅动画，而在于每个微小交互的精准反馈。以下模式定义了 LAS 的"丝滑感"标准。

#### Button Press（按钮按下）

借鉴 Apple 和 Figma 的 scale 收缩模式——按压缩放比颜色变化更能传达"物理按下"的触感：

```
default → hover (200ms):  金色填充 + translateY(-1px)
hover → active (100ms):   scale(0.97) + 背景加深至 gold-pressed
active → default (200ms): 弹回原尺寸 + 还原透明背景
```

**关键**：使用 `scale(0.97)` 而非 `scale(0.95)`。0.95 会产生"缩小过多"的廉价感，0.97 是 Apple/Figma 验证过的微缩黄金值。禁止使用 `scale(0.9)`——那是卡通动画，不是精密交互。

#### Card Hover Lift（卡片悬停抬升）

借鉴 Framer 的双层效果——顶部边缘高光 + 边框加深，无阴影：

```
default → hover (200ms):
  - translateY(-1px) 微抬升
  - border-color: var(--rule) → var(--rule-strong)
  - 可选：0.5px 顶部内边缘高光（inset 0 1px 0 rgba(255,255,255,0.6)）——仅深色背景下
```

LAS 的 paper 底色环境不使用顶部高光（纸面本身已够亮）。在 paper 环境下，用 `border-color` 过渡和 `translateY` 即可传达层级变化。这是 Framer 的"light edge"技巧在浅色主题下的适配。

#### Surface Ladder Hover（表面层级悬停）

借鉴 Linear 和 Raycast——可交互元素 hover 时提升一个表面档位：

| 元素 | Default | Hover | 过渡 |
|------|---------|-------|------|
| 可点击卡片（作品列表项） | `var(--surface-glass)` | `var(--surface-card)` (#efe9de) | 200ms standard |
| 筛选 chip | 透明 | `var(--gold-soft)` | 200ms standard |
| 表格行 | 透明 | 模式主题色 4% 透明度 | 200ms standard |
| Section nav 按钮 | 透明 | `var(--gold-soft)` | 200ms standard |
| Nav pip | `rgba(26,26,26,0.12)` | 模式主题色 40% 透明度 + scale(1.2) | 200ms standard |

**关键**：hover 不是"亮起来"，而是"暖起来"——LAS 的暖色调体系下，层级提升表现为向金色/纸色方向微微偏暖，而非 Linear 的向白色偏冷。

#### Scroll Reveal（滚动揭示）

借鉴 Figma 的滚动触发动画——报告页长内容需要节奏感：

```
Section 进入视口 (IntersectionObserver, threshold: 0.15):
  - opacity: 0 → 1
  - translateY: 20px → 0
  - duration: 350ms, easing: standard
  - 每个 section 延迟 +80ms（stagger 瀑布流）
```

适用场景：
- 报告页的 9 个 section（概览/评估/校验/详表/基准/分析/专业/结论/附录）
- 首页的 feature 区块
- 作品列表的卡片网格

不适用场景（即时渲染，不做 reveal）：
- 分析进度页——实时日志需要即时出现
- 导航栏——sticky 元素永远立即可见
- 弹窗/遮罩——overlay 层不做入场动画（只有 fade 0.15s）

#### Stagger Cascade（瀑布流入场）

多个同类元素同时入场时，使用 stagger 延迟创造"涟漪"效果：

```
容器内 N 个子元素:
  - 每个子元素延迟: index × 50ms
  - 每个子元素动画: opacity 0→1 + translateY(12px→0)
  - duration: 350ms, easing: standard
  - 最大总延迟: 400ms（即最多 8 个元素有 stagger，之后的一起出现）
```

适用：分析页卡片网格、作品列表、评分详表行、附录卡片。

#### Skeleton Shimmer（骨架屏流光）

借鉴 Vercel 的占位策略 + LAS 暖色调适配：

```
骨架屏:
  - 背景: var(--rule) (rgba(26,26,26,0.08))
  - 流光: linear-gradient(90deg, transparent, var(--surface-glass), transparent)
  - 动画: background-position 循环, 1.5s, ease-in-out infinite
  - 圆角: var(--rounded-md) (8px)
```

不使用冷灰骨架屏（`#e0e0e0`）——LAS 的纸底环境需要用暖色系占位。骨架屏形状应与最终内容形状一致，防止 CLS（布局偏移）。

#### Active Color Shift（按下色变）

借鉴 Stripe 的明确按下色偏移——按下不只靠缩放，颜色也要同步变化：

```
可交互元素 hover → active 时:
  - 金色按钮: var(--gold) → var(--gold-pressed) (#9a6f09)
  - 经典主题元素: var(--crimson) → var(--crimson-pressed) (#6b0000)
  - 原创主题元素: var(--purple) → var(--purple-pressed) (#4e157a)
  - scale(0.97) 同步触发
```

Stripe 的 `#533afd → #2e2b8c` 是 47% 亮度降幅。LAS 的 gold `#b8860b → #9a6f09` 是 17% 降幅——更克制，适合暖色调品牌。

#### Focus Ring Transition（焦点环过渡）

借鉴 Linear 的 50% 透明度焦点环——焦点不应突兀出现：

```
:focus-visible:
  - outline: 2px solid var(--gold)
  - outline-offset: 2px
  - transition: outline-color 200ms standard
  - 初始色: transparent → 目标色: var(--gold)
```

键盘 Tab 导航时焦点环平滑淡入，鼠标点击时不出现。这在 `app.css` 中已通过 `:focus-visible`（而非 `:focus`）实现。

#### Spring-Like Bounce（弹性回弹）

LAS **不使用**弹簧动画（spring/elastic easing）。原因：
- 弹簧动画传达"玩具感"——与文学分析的严肃气质冲突
- Apple 的 iOS 弹簧动画在桌面 Web 上无法原生实现（需要 JS 库）
- `cubic-bezier(0.4, 0, 0.2, 1)` 的轻微 overshoot 感知已足够传达"响应性"

唯一例外是 Figma 的 sticky note 旋转效果（`rotate(-2deg)` 微偏轴）——如果 LAS 未来增加便签式注释功能，可采用。

### Principles
- 入场用 standard easing（加速 → 减速），出场用 decelerate（快速消失）
- 数据可视化的首次绘制动画可以更长（1.5-2.5s），让数字"生长"有仪式感
- 微交互（hover/active）控制在 200ms 以内，不给用户拖沓感
- 页面转场不要超过 400ms——转场是为了平滑切换，不是为了表演
- 不要在所有元素上同时播动画——使用 stagger 延迟（每个子元素 +50ms）创造瀑布流入场感

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

## Elevation & Z-Index

LAS **不使用阴影（box-shadow）**。所有深度来自半透白卡片与纸底的微妙色差，以及 sticky 元素的毛玻璃 blur 效果。这与 Claude 和 Figma 的"surface-first, shadow rare"理念一致——但 LAS 更极端，连 hover 态都不用 shadow，用 translateY(-1px) 微位移替代。

### Elevation Levels

| Level | Treatment | Use |
|---|---|---|
| Flat | 无阴影、无边框 | Body 背景、section 内容区 |
| Hairline | 1px `{colors.rule}` 边框 | Glass-card 卡片、表格单元格分隔 |
| Strong hairline | 1px `{colors.rule-strong}` 边框 | Section 顶部分割线 |
| Glass card | `{colors.surface-glass}` 背景 + hairline 边框 | 所有内容卡片 |
| Sticky | `backdrop-filter: blur(12px)` + 半透明纸底 | StickyBar、SectionNav |
| Overlay | 半透明遮罩（`rgba(26,26,26,0.3)`） | 转场过渡、loading 遮罩 |

### Surface Ladder（借鉴 Claude / Linear）

当需要在纸底上创造层次而不用阴影时，使用表面色阶梯：

| Level | Token | 色值 | Use |
|---|---|---|---|
| Canvas | `{colors.paper}` | #faf8f3 | 全局背景 |
| Soft | `{colors.surface-soft}` | #f5f0e8 | 首页 hero 下方交替 section 背景 |
| Glass | `{colors.surface-glass}` | rgba(255,255,255,0.45) | 标准卡片 |
| Card | `{colors.surface-card}` | #efe9de | 嵌套卡片（glass-card 内部的子卡片） |
| Dark | `{colors.ink}` | #1a1a1a | Footer 反转区块 |

相邻 section 之间可以通过交替 `paper` / `surface-soft` 底色来创造视觉节奏，而不需要额外分割线——这是从 Claude 的 cream-to-dark surface alternation 借鉴的技巧。

### Z-Index Scale

禁止随意写死 `z-index: 9999`。全局使用以下层级变量：

| Token | Value | Use |
|---|---|---|
| `{z-index.base}` | 0 | 所有静态内容 |
| `{z-index.raised}` | 10 | submit-overlay、输入框下拉、工具提示 |
| `{z-index.dropdown}` | 50 | 下拉菜单、nav-top、模式选择器 |
| `{z-index.sticky}` | 100 | sticky-bar、export-bar、section-nav |
| `{z-index.overlay}` | 1000 | 全屏转场遮罩、modal（如有时） |

**规则**：
- 新元素只能在已有层级之间取整数值，不得超越 overlay
- 两个相邻层级之间保留至少 10 的间距，以便未来插入中间层
- CSS 中定义 `--z-*` 变量，组件通过 `var(--z-dropdown)` 引用而非写死数字

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

### Two-Radius System（借鉴 Figma + Stripe）

LAS 采用二半径体系作为品牌信号——圆角不只是装饰，它传达元素的功能定位：

| 半径族 | Token 范围 | 性格 | 适用元素 |
|--------|-----------|------|---------|
| **编辑/学术** | `{rounded.xs}` ~ `{rounded.sm}` (2-4px) | 严谨、精确、学术感 | 输入框、进度条、标签、调整徽标 |
| **功能/容器** | `{rounded.md}` ~ `{rounded.lg}` (8-12px) | 亲和、现代、功能感 | 按钮、卡片、下拉菜单、筛选 chip |

**按钮圆角规则**：主 CTA 按钮使用 `{rounded.sm}`（4px）——属于"编辑/学术"半径族。微圆角保留了学术严肃感，同时解决了直角按钮在圆角卡片环境中被误认为"不可点击"的可用性问题（三位外部审查共识）。4px 是 Apple 和 Notion 的"安静矩形"黄金值——既有几何精确感，又不至于像 0px 那样割裂。

**Pill 仅用于标签**：`{rounded.pill}` 保留给评级徽标、模式标签、nav-pip 等短小标签——不用于按钮或卡片。这是从 Notion 借鉴的规则（Notion 用 8px 矩形按钮而非 pill）。

### Visual Embellishments
- **Badge Glow**：评级徽标使用 shimmer 渐变动画——金色到深红循环的 background-position 动画——传达"这个评级是精心计算出来的"仪式感。仅用于 Hero 区评级徽标，其他地方用静态 pill。
- **Rule Gold**：短金色分割线（width: 3rem），仅用于首页 Hero 和 Footer——报告页不使用，保持严肃。

## Interactive States

借鉴 Stripe 的系统化按钮状态机与 Sanity 的 universal hover 模式，LAS 的每个可交互元素必须覆盖完整的六态周期。没有反馈的按钮是死物。

### State Machine（六态周期）

```
default → hover → active/pressed → focus-visible → disabled → loading
```

### 通用交互规则

| State | Visual Treatment | Duration |
|-------|-----------------|----------|
| **Default** | 元素的标准外观，见 Components 中各组件定义 | — |
| **Hover** | translateY(-1px) 微位移；按钮反转配色（金色填充 + 纸色文字）；卡片 border-color → `{colors.rule-strong}` | 200ms |
| **Active/Pressed** | scale(0.97) 按下反馈；颜色使用 `-pressed` token（`{colors.gold-pressed}` / `{colors.crimson-pressed}`） | 100ms |
| **Focus-visible** | 2px `{colors.gold}` 实线轮廓，outline-offset: 2px（仅键盘导航触发，鼠标点击不显示） | 0ms（即时） |
| **Disabled** | opacity: 0.4, cursor: not-allowed, transform: none, 移除所有 hover/active 效果 | — |
| **Loading** | 按钮文字替换为 spinner（16px 半透明圆环旋转动画）或 skeleton 占位块；按钮保持原宽度防止布局偏移 | — |

### 按元素类型的差异化处理

**按钮（`.btn`）**：
- hover: 金色填充 + `{colors.on-gold}` 文字 + translateY(-1px)
- active: scale(0.97) + `{colors.gold-pressed}` 背景
- disabled: opacity 0.4 + 还原透明背景
- loading: 文字旁显示 16px spinner，按钮不可点击

**链接（`a`）**：
- hover: 颜色过渡至 `{colors.gold}`，无 translateY
- active: 颜色过渡至 `{colors.gold-pressed}`
- focus-visible: 标准金色焦点环

**玻璃卡片（`.glass-card`）**：
- hover: border-color 过渡至 `{colors.rule-strong}`（可选，仅当卡片有交互时）
- 卡片本身通常不可交互——交互由内部元素承载
- 可点击的卡片（如作品列表项）：hover 时 translateY(-1px)

**输入框（`.input-underline`）**：
- focus: border-bottom-color → `{colors.gold}`，border-bottom-width 加粗
- error: border-bottom-color → `{colors.semantic-error}`，下方显示红色错误提示

**导航 Pip**：
- default: `rgba(26,26,26,0.12)` 灰色
- hover: 颜色加深至模式主题色 40% 透明（经典 crimson / 原创 purple）
- active: 模式主题色填充 + scale(1.4)

**Section Nav 按钮**：
- default: `{colors.muted}` 文字
- hover: `{colors.gold}` 文字
- active: `{colors.gold}` 文字 + `{colors.gold-soft}` 背景 + `{colors.gold}` 边框

**筛选 Chip / 分页按钮**：
- default: 透明背景 + `{colors.muted}` 文字 + `{colors.rule}` 边框
- hover: `{colors.ink}` 文字 + `{colors.rule-strong}` 边框
- active/selected: `{colors.gold}` 文字 + `{colors.gold}` 边框 + `{colors.gold-soft}` 背景

### Universal Hover 模式（借鉴 Sanity）

所有可交互元素的 hover 过渡共享同一套参数：
- `transition: all {motion.duration.fast} {motion.easing.standard}`
- 颜色、边框、阴影、transform 统一使用此过渡
- 不逐元素定义不同的 transition——一致性优于个例优化

### 状态可访问性

- **键盘导航**：所有交互元素支持 Tab 聚焦、Enter/Space 触发、Esc 关闭
- **焦点可见性**：永不禁用全局 outline——使用 `:focus-visible` 替代 `:focus`，为鼠标用户隐藏焦点环但保留给键盘用户
- **触碰目标**：交互元素最小 44×44px（WCAG 2.5.5），移动端尤其重要

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

### Card Tints（卡片内部微色变体）

借鉴 Notion 的 pastel card-tint 色板，LAS 定义 5 种 glass-card **内部**微色背景变体。这些 tint 仅用于 glass-card 内部的内容区块——外层容器仍然是标准 glass-card，内部区块使用微色背景作为视觉区分。

| Token | 色值 | 语义 | 使用场景 |
|-------|------|------|---------|
| `{card-tints.jade}` | rgba(45,106,79,0.04) | 正面/通过 | 最突出优势卡、极端筛查通过、成功状态 |
| `{card-tints.warning}` | rgba(180,120,30,0.04) | 审慎/警告 | 审慎下调列表、校验警告、中等风险提示 |
| `{card-tints.error}` | rgba(220,38,38,0.04) | 负面/拒评 | 最明显短板卡、极端筛查拒评、错误状态 |
| `{card-tints.gold}` | rgba(184,134,11,0.04) | 强调/品牌 | 签文区块、金句展示、品牌强调信息 |
| `{card-tints.purple}` | rgba(107,33,168,0.04) | 原创模式 | 原创模式特有信息、创意维度强调 |

**使用规则**：
- Tint 不是新的卡片类型——外层始终是标准 `glass-card`
- Tint 区块内部使用 `<div style="background: var(--card-tint-jade)">` 包裹内容
- Tint 区块可以有自己独立的 1px 同色系边框（如 `border: 1px solid rgba(45,106,79,0.1)`）
- **一个 glass-card 内最多一个 tint 区块**——这是防滥用的硬性约束。不允许在同一个卡片中并排多个 tint（如 jade + error 双色卡），避免视觉碎片化
- **双主题约束**：`card-tints.purple` 仅在原创模式下允许使用——经典模式中不出现紫色调元素。同理，`card-tints.error`（红色调）在原创模式中慎用，避免与 purple 主题色混淆
- Tint 仅用于以下三个明确场景：
  1. **评估概要**（Assessment Summary）：最突出优势用 jade-tint，最明显短板用 error-tint
  2. **校验记录**（Verification）：极端筛查通过用 jade-tint，审慎下调列表用 warning-tint
  3. **签文展示**（Fortune）：品牌签文用 gold-tint
- 标准内容卡（深度分析、专业视角、基准集）不使用任何 tint——保持 glass-card 标准白
- 这是唯一允许的 glass-card 内部色彩变体——不发明新的 tint 颜色

### Assessment Summary

Hero 下方第一个 section。左右双卡布局：左侧 jade 色调"最突出优势"（绿色图标 + 最高分维度名 + 结论），右侧 error 色调"最明显短板"（红色图标 + 最低分维度名 + 结论）。底部折叠式评级说明。两张卡内部分别使用 `{card-tints.jade}` 和 `{card-tints.error}` 微色背景而非 glass-card 标准白——这是 Card Tints 系统的标准用法。

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

**`button-primary`** — LAS 唯一的按钮样式。透明背景 + `{colors.gold}` 边框 + `{colors.gold}` 文字 + `{typography.mono-label}` + 大写英文 + 3px letter-spacing + `{rounded.sm}`（4px 微圆角，属"编辑/学术"半径族）。没有次级按钮、没有 ghost 按钮、没有彩色填充按钮。提交页和分析页使用此按钮。

六态完整定义（详见 [Interactive States](#interactive-states)）：

| State | Visual |
|-------|--------|
| Default | 透明背景 + `{colors.gold}` 边框 + `{colors.gold}` 文字 |
| Hover | `{colors.gold}` 填充 + `{colors.on-gold}` 文字 + translateY(-1px) |
| Active | scale(0.97) + `{colors.gold-pressed}` 背景 |
| Focus-visible | 2px `{colors.gold}` 轮廓 + 2px offset |
| Disabled | opacity: 0.4, cursor: not-allowed, 还原透明背景 |
| Loading | 文字旁显示 16px spinner，按钮不可点击，保持原宽度 |

### Top Button

**`topBtn`** — 36px 圆形返回顶部按钮，固定在右下角。纸色背景 + `{colors.rule}` 边框。初始透明（opacity: 0），滚动超过 600px 后淡入。hover 切换为主题色（经典 crimson / 原创 purple）。移动端尺寸缩小至 32px。

## Accessibility

借鉴 Apple 的系统化无障碍标准。LAS 面向文学研究者、教师、学生和普通读者——界面必须包容所有用户。无障碍不是可选特性，是强约束。

### 色彩对比度（WCAG AA）

| 关系 | 最小值 | LAS 实际情况 |
|------|--------|-------------|
| 正文 vs 背景 | 4.5:1 | `{colors.ink}` (#1a1a1a) vs `{colors.paper}` (#faf8f3) = ~15:1 ✓ |
| 大标题 (≥18px bold) vs 背景 | 3:1 | 金色标题 (#b8860b) vs paper = ~3.2:1 ⚠️ 边界通过 |
| Muted 文字 vs 背景 | 4.5:1 | `{colors.muted}` (#6b6558) vs paper = ~5.1:1 ✓ 通过 |

**Muted 文字使用规则**：
- `{colors.muted}` 用于辅助文字、元数据标签、次要信息——已满足 WCAG AA 4.5:1
- 对于更轻的装饰性分隔，使用 `{colors.muted-soft}`（rgba 透明度 30%）——仅限非信息承载场景
- 金色（`{colors.gold}` #b8860b）仅用于 ≥18px 且 font-weight ≥700 的大标题，或作为装饰线（border-left）颜色——小字号金色对比度仅 3.2:1，不满足 AA

### 触摸目标

所有可交互元素最小触摸区域为 **44×44px**（WCAG 2.5.5 Level AA）：

| 元素 | 现状 | 是否达标 |
|------|------|---------|
| `.btn` | padding: 12px 32px | ✓ (48px 高度) |
| `.filter-chip` | padding: 4px 10px | ✗ (~24px 高度) — 需增大或使用伪元素扩展触摸区 |
| `.pager-btn` | padding: 6px 12px | ✗ (~28px 高度) — 同上 |
| `.nav-pip` | 8px 直径 | ✗ — 依赖间距补偿，移动端已隐藏 |
| `.section-nav-btn` | padding: 4px 12px | ✗ (~22px 高度) — 移动端水平滚动，可接受 |
| Accordion trigger | padding: 16px, w-full | ✓ (整行可点击) |

对于过小的触摸目标（chip、pager、pip），必须在移动端检测并增大，或使用 `::after` 伪元素扩展点击区域至 44×44px。

### 焦点管理

- **`:focus-visible` 全局规则**：所有交互元素在键盘聚焦时显示 2px `{colors.gold}` 实线轮廓 + 2px offset
- **永不禁用 outline**：不使用 `outline: none` 除非同时提供替代焦点指示器
- **表单提交后焦点转移**：验证失败时 `focus()` 移至第一个错误字段；成功后移至确认信息
- **模态/遮罩焦点陷阱**：转场 overlay 显示期间，焦点应锁定在 overlay 内部

### 动效减弱偏好

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

已在 `app.css` 中全局实现。Chart.js 动画需单独通过 `options.animation: false` 关闭。

### 语义化 HTML

- 使用原生 `<button>` 承载交互（不用 `<div onclick="">`）
- 使用 `<label>` 关联表单控件（`for` 属性或嵌套）
- 图标必须携带 `aria-label` 或与可见文本配对
- 表单错误提示使用 `aria-describedby` 关联输入框
- 页面使用语义化地标：`<nav>`, `<main>`, `<section>`, `<footer>`

### 键盘导航

- Tab 顺序遵循 DOM 顺序（不使用 `tabindex > 0`）
- Enter/Space 触发按钮和链接
- Esc 关闭下拉、手风琴、弹窗
- 手风琴触发器使用 `<button>` + `aria-expanded`
- 评分详表展开行可通过 Enter 触发

### 错误传达

错误信息不能仅靠颜色传达（色盲用户无法区分红色/绿色）：
- 错误字段：红色边框 + 错误图标（⚠）+ 文字提示
- 成功状态：绿色边框 + 成功图标（✓）+ 文字提示
- 图标和文字缺一不可——单独使用颜色区分状态违反 WCAG 1.4.1

## Do's and Don'ts

### Do
- 以 `{colors.paper}` 纸底为全局背景。纯白 #fff 或冷灰 #f5f5f5 会破坏"旧纸期刊"的气质。
- 文学性正文使用 `.serif`（Noto Serif SC），UI 标签使用 Sans，技术数据使用 `.mono`。三轨字体各司其职，不得混用。
- 每个 section 以 `<hr class="rule-strong">` 开头，后跟 `<h2 class="serif font-bold">` 标题。这是 LAS 的"翻页"仪式。
- 使用 `{components.glass-card}` 作为唯一卡片样式。不发明新的卡片变体。
- 金色仅用于关键交互节点：主按钮、active 态、金句装饰线、签文关键词。克制使用。
- 经典模式用 crimson，原创模式用 purple，同一页面不同时出现两套主题色。
- Section 间距保持 40px——报告页内容密度高，不需要首页的 96px 大间距。
- 列表页始终显示复选框（不藏在"批量模式"里），对比/删除等操作直接放在工具栏。
- 危险操作（删除）必须有二次确认弹窗，无副作用的操作（对比、导出）直接执行。
- 每个数据容器覆盖空/加载/错误三态——空态给引导，错误态给重试，加载态给骨架或 spinner。
- 按钮四态完整：default / hover / active / disabled，disabled 外观明确区别于 default。
- 可点击元素高度 ≥ 40px（桌面），按钮 padding ≥ 8px 16px。

### Don't
- 不要使用彩色左边框卡片（`border-left: 4px solid`）——这是已废弃的旧版样式。
- 不要给卡片添加阴影（`box-shadow`）。LAS 的深度来自半透白 glass 效果，不是投影。
- 不要在文学正文中使用 Sans 字体——这会完全破坏"文学批评"的严肃感。
- 不要使用纯黑 #000 文字——`{colors.ink}`（#1a1a1a）是预设的最深色。
- 不要发明新的卡片样式。Glass card 是唯一标准。
- 不要将金色用于大面积背景填充。金色是 accent，不是 surface。
- 报告页不使用 `rule-gold`（短金色分割线）——那是首页的专属装饰元素。
- 不要在同一个分析流程中混合两种模式的视觉元素。
- 不要硬编码 `z-index` 值——使用 Z-Index Scale 中定义的 `--z-*` CSS 变量。
- 不要硬编码动画 duration/easing——使用 Motion 章节中定义的 token。
- 不要给 card-tint 区块使用彩色边框或独立卡片样式——tint 是 glass-card 内部的微色背景，不是新的卡片类型。
- 不要在一个 glass-card 内使用超过一个 tint 区块——避免视觉碎片化。经典模式下不允许出现 purple-tint。
- 不要在标准内容卡（深度分析、专业视角、基准集）中使用任何 tint——tint 仅限评估概要、校验记录、签文展示三个场景。
- 不要全局禁用 outline（`outline: none`）——除非同时提供替代焦点指示器。
- 不要仅用颜色传达错误/成功状态——错误必须配图标（⚠）+ 文字，成功必须配图标（✓）+ 文字。
- 不要使用"批量模式""编辑模式"等全局状态切换——操作入口始终可见，选择通过复选框完成。
- 不要把操作按钮藏在 `display:none` 的容器中——按钮始终渲染，不适用时灰色 disabled。
- 不要让卡片 hover 使用 `translateY`（暗示可拖拽）——改用 `border-color` 过渡。
- 不要在列表项中合并复选框和导航热区——两个独立热区互不干扰。

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

## Data Visualization

LAS 报告包含多种图表（评分环形图、四层面柱状条、16 维雷达图、评分详表）。图表色板从品牌 token 中派生，不引入新的专属颜色。

### 四层面柱状条色板

四个维度层面各有固定颜色，不随模式（经典/原创）变化——仅 A 层（语言形式）随主题切换：

| 层面 | Token | 经典模式 | 原创模式 |
|------|-------|---------|---------|
| A — 语言形式 | `{chart.layer-a-classic}` / `{chart.layer-a-original}` | #8b0000 (crimson) | #6b21a8 (purple) |
| B — 叙事内容 | `{chart.layer-b}` | #2d6a4f (jade) | 同左 |
| C — 思想意义 | `{chart.layer-c}` | #b8860b (gold) | 同左 |
| D — 审美影响 | `{chart.layer-d}` | #1a1a1a (ink) | 同左 |

### 雷达图色板

| 元素 | Token | 经典模式 | 原创模式 |
|------|-------|---------|---------|
| 数据填充 | `{chart.radar-fill-classic}` / `{chart.radar-fill-original}` | rgba(139,0,0,0.08) | rgba(107,33,168,0.08) |
| 数据边框 | `{chart.radar-border-classic}` / `{chart.radar-border-original}` | #8b0000 | #6b21a8 |
| 数据点 | 同 border | 5px 半径，hover 9px | 同左 |
| 参考环线 | `{chart.reference-ring}` | rgba(26,26,26,0.06) | 同左 |

雷达图五圈参考环（150/125/105/95/75）使用 `{chart.reference-ring}`，不与任何维度色混淆。

### Tooltip 色板

| 元素 | Token | 色值 |
|------|-------|------|
| 背景 | `{chart.tooltip-bg}` | rgba(26,26,26,0.85) |
| 文字 | `{chart.tooltip-text}` | #faf8f3 (paper) |
| 档位标签 | 继承评级 pill 色 | — |

### 评分环形图色板

| 元素 | 经典模式 | 原创模式 |
|------|---------|---------|
| 进度弧 | `{colors.crimson}` | `{colors.purple}` |
| 背景弧 | `rgba(26,26,26,0.05)` | 同左 |
| 分数字 | `{colors.ink}` | 同左 |
| "/150" 小字 | `{colors.muted}` | 同左 |

### 图表实现注意事项

- Chart.js 首次渲染动画 duration 不超过 2500ms，easing 使用 quartic ease-out
- 柱状条动画 1500ms cubic-bezier(0.4, 0, 0.2, 1)
- 环形图动画 2000ms cubic-bezier(0.4, 0, 0.2, 1)
- `prefers-reduced-motion` 时所有图表动画应通过 `options.animation: false` 跳过
- 图表色板值通过 JS 变量传递（`window.__LAS_REPORT_MODE` 决定主题），不在 CSS 中硬编码

## Interaction Patterns

LAS 的交互模式遵循 10 条铁律，提炼自 Apple、Stripe、Linear、Notion、Figma、Vercel、Shopify、Airbnb、Tesla 九个顶级设计体系。以下每条都是硬性规则，写前端代码时必须遵守。

### Rule 1: 操作入口始终可见

常用操作直接放在工具栏/页面中，始终渲染在 DOM 中。不要求用户先点击某个按钮"进入模式"才能看到。

**正确**：对比和删除按钮直接放在列表工具栏，未选中时灰色 disabled，选中后点亮。
**错误**：按钮藏在 `display:none` 的 div 中，需点"批量"才显示。

### Rule 2: 选择与导航分离

列表项同时支持选中和导航时，两者必须是独立热区。

**正确**：`<input type="checkbox">` 处理选中，卡片其余区域处理导航。
**错误**：点击卡片同时触发选中和导航，或只有进入"选择模式"后才出现复选框。
**实现**：复选框始终渲染，点击 `e.stopPropagation()` 阻止冒泡到卡片。

### Rule 3: 即时的状态反馈

每个可交互元素至少覆盖 default / hover / active / disabled 四态。详见 [Interactive States](#interactive-states) 六态机。

**disabled 态硬性要求**：`opacity: 0.4; cursor: not-allowed; transform: none; border-color: var(--rule); color: var(--muted)`。

### Rule 4: 单一主行动层级

一个页面/区块只有一个最突出的 CTA。其余操作用描边或纯文字样式降低视觉权重。

**按钮层级**：
- **主 CTA**：`button-primary`（金色边框 + 金色文字，透明背景，hover 金色填充）
- **次要操作**：描边按钮（`border: 1px solid var(--rule-strong); color: var(--muted)`，hover 变色）
- **危险操作**：描边按钮（`border-color: var(--crimson); color: var(--crimson)`，hover crimson 填充）
- **纯文字操作**：无边框，`color: var(--muted)`，hover `color: var(--gold)`

**错误**：所有按钮同一颜色同一尺寸，用户不知道优先做什么。

### Rule 5: 禁止全局模式切换

不设"批量模式""编辑模式"之类的全局界面状态切换。操作能力始终在线，通过局部控件（复选框）表达可选操作。

**正确**：复选框始终存在。勾选后工具栏自动点亮对比/删除按钮。
**错误**：点击"批量"→界面大变→再点"取消"→界面变回去。这是 90 年代 Windows 范式，现代 Web 早已淘汰。

### Rule 6: 危险操作二次确认

删除、不可逆修改等操作必须有确认步骤。查看、对比、导出等无副作用操作直接执行。

**确认弹窗规范**：
```
半透明遮罩（z-index: var(--z-overlay), background: rgba(26,26,26,0.3)）
+ glass-card（max-width: 360px, text-align: center, padding: 32px）
  + 标题（.serif, font-weight: 700, color: var(--ink)）
  + 描述文字（.text-sm, color: var(--muted)）
  + 按钮行（flex, gap: 12px, justify-content: center）
    + 取消按钮（描边 muted）
    + 确认按钮（描边 crimson / 金色，依操作类型）
```

**错误**：每次操作都弹 confirm()，或删除无确认直接执行。

### Rule 7: 选中项需视觉差异

选中的卡片必须有外观变化——不只靠 checkbox 的勾选状态。

**实现**：选中卡片 `border-color: var(--gold)` + `background: var(--gold-soft)` 或 `var(--surface-card)`。未选中卡片保持标准 `glass-card` 外观。

### Rule 8: 触控目标 ≥ 40px

所有可点击元素高度 ≥ 40px（桌面），移动端 ≥ 44px。按钮 padding 至少 `8px 16px`。

**已知违规**（待修）：`.filter-chip` (padding: 4px 10px ≈ 24px)、`.pager-btn` (padding: 6px 12px ≈ 28px)、`.section-nav-btn` (padding: 4px 12px ≈ 22px)。

对于不可增大尺寸的小元素，使用 `::after` 伪元素扩展点击区域至 44×44px。

### Rule 9: 动画克制

已完整覆盖在 [Motion](#motion) 章节。关键约束：卡片 hover 不使用 `translateY`（暗示可拖拽），改用 `border-color` 过渡。

### Rule 10: 空/加载/错误三态

每个数据容器必须覆盖 7 种状态。这是硬性约束，不是"最好有"。

**状态矩阵模板**：

| 状态 | UI 表现 | 用户可操作 |
|------|---------|-----------|
| 初始/默认 | 正常渲染 | 正常交互 |
| 加载中 | spinner 或骨架屏（暖色 `var(--rule)` 背景 + 流光动画） | 可取消（如适用） |
| 空数据 | 玻璃卡片 + 引导文案 + CTA 按钮（如"提交第一部作品"） | 点 CTA 跳转 |
| 正常/有数据 | 正常内容 | 正常交互 |
| 错误/失败 | 错误图标(⚠) + 错误描述 + 重试按钮 | 重试 / 返回 |
| 边界/极端 | 截断/省略/水平滚动 | — |
| 完成/成功 | 成功图标(✓) + 成功描述 | 下一步操作 |

**错误**：空列表只显示"暂无数据"不给操作入口；加载中纯白屏；错误态只有红色文字无重试按钮。

## Iteration Guide

1. 所有颜色引用使用 token（`{colors.gold}`），禁止硬编码 hex。
2. 组件变体（hover/active/disabled/focus/loading）作为独立条目记录在 `components:` 中——遵循 [Interactive States](#interactive-states) 的六态机定义。
3. 新增 section 遵循标准模板：`<section id="xxx"><hr class="rule-strong"><h2 class="serif">标题</h2>...`
4. 卡片统一使用 `glass-card`，不发明新样式。如需视觉区分，使用 [Card Tints](#card-tints-卡片内部微色变体) 微色背景变体（仅限评估/校验/签文等状态传达场景）。
5. 经典/原创双主题的差异仅限于主题色（crimson ↔ purple）和 section 数量——不引入第三种主题色。
6. 字体分工铁律不可打破：Serif = 文学，Sans = UI，Mono = 技术（含 `tnum` 等宽数字）。
7. 不确定如何强调时，优先加大衬体字号（weight 700→900）而非换颜色。
8. 动画参数（duration/easing）从 [Motion](#motion) token 引用，禁止硬编码毫秒值或贝塞尔曲线。
9. z-index 值从 [Z-Index Scale](#z-index-scale) 层级变量引用（`var(--z-dropdown)`），禁止写死数字。
10. 图表颜色从 [Data Visualization](#data-visualization) token 派生，不引入新的 hex 颜色。
11. 所有交互元素必须覆盖至少 4 个基础状态：default / hover / active / focus-visible。
12. 不发明新的 card-tint 颜色——5 种 tint 覆盖所有状态传达需求。
13. 所有前端页面必须通过 10 条 [Interaction Patterns](#interaction-patterns) 逐条审查——操作可见性、选择/导航分离、四态反馈、主行动层级、无模式切换、确认机制、选中差异、触控尺寸、动画克制、三态完整。
