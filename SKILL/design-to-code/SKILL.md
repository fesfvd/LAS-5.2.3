---
name: "design-to-code"
description: "将 Figma 设计稿、截图或自然语言设计描述转化为高质量前端代码。当用户提供设计稿链接、界面截图，或用自然语言描述 UI 需求时调用，确保 1:1 还原设计意图。"
---

# 设计稿转代码规范

## 核心原则：忠实还原，而非自由发挥
你的第一要务是**100% 还原设计稿**。设计师的每一个间距、颜色、字重都是经过推敲的，不要自认为"优化"。只有在设计稿明显遗漏状态（loading / empty / error / hover）时，才合理补全。

---

## 📐 还原精度要求

### 1. 间距还原（1px 级）
- **所有间距必须精确**：padding、margin、gap 的误差不超过 1px。
- **测量方法**：Figma 中选中两个元素，按 `Alt` 查看距离。截图场景下用比例推算。
- **网格对齐**：如果设计稿基于 8px 网格，必须保持对齐，不允许出现 7px、13px 这样的零碎间距。

### 2. 颜色还原
- **直接取色**：使用设计稿中的精确 hex 值，不要主观调整"看起来差不多"。
- **透明度叠加**：如果设计稿使用了 `rgba` 或 layer 叠加，按实际渲染结果取值。
- **暗黑模式**：设计稿只给了一套色值时，不自行生成暗黑模式方案。需明确指定后才补全。

### 3. 字体还原
- **字号**：严格匹配设计稿 px 值。
- **字重**：Figma 中 Regular(400)、Medium(500)、SemiBold(600)、Bold(700) 必须精确。
- **行高**：设计稿中有行高标注则严格匹配，无标注时按 1.6 默认。
- **字间距**：设计稿中的 `letter-spacing` 值按 px 直接使用（不换算单位）。

### 4. 圆角与边框
- **圆角**：逐一检查设计稿中每个元素的 `border-radius`，不同元素的圆角值可能不同。
- **边框宽度**：0.5px 边框在移动端是常见设计，不可擅自改成 1px。
- **边框颜色**：细边框通常用 `rgba(0,0,0,0.06-0.12)` 范围，必须取精确值。

---

## 🔄 设计稿 → 代码映射规则

### Figma 专属
| 设计元素 | 代码映射 | 注意事项 |
|----------|---------|---------|
| Auto Layout (horizontal) | `display: flex; flex-direction: row` | gap 值直接用 |
| Auto Layout (vertical) | `display: flex; flex-direction: column` | gap 值直接用 |
| Auto Layout wrap | `flex-wrap: wrap` | 确认换行后的间距 |
| Constraints (left/right) | 对应 CSS 定位或 flex 对齐 | 不要全部用 absolute |
| Text layer 行高 | 用 `line-height` 精确匹配 | 注意百分比 vs px |
| Text layer 字间距 | 用 `letter-spacing` | Figma 默认 0，不要加 |
| Group | 用 `div` 包裹 | 不要滥用 section/article |
| Instance (组件实例) | 复用已有代码组件 | 不要重新实现已有组件 |

### 截图/图片还原
1. **先描摹结构**：识别 Header / Sidebar / Content / Footer 等区域划分。
2. **网格估算**：对齐明显网格线的元素，推测列数。
3. **间距推算**：以已知字号（如正文 16px）为基准，按比例推算其他间距。
4. **颜色取色**：使用取色工具获取精确色值，不要目测。

---

## 🧩 补全设计未覆盖状态

### 必须补全的状态
- **Hover**：所有可交互元素必须有 hover 态（微弱的背景变化或边框加深）
- **Active/Pressed**：按钮/链接的按下状态（`translateY(1px)` + 阴影减弱）
- **Focus**：输入框/可聚焦元素的 focus 轮廓（使用 `:focus-visible`，不用 `outline: none`）
- **Disabled**：表单元素的禁用态（降低不透明度到 0.4-0.5 + `cursor: not-allowed`）
- **Loading**：等待状态的骨架屏或 spinner
- **Empty**：空数据占位（插图 + 引导文案）

### 不应补全的
- 不做设计稿不存在的交互特效（如花哨的 hover 动画）
- 不加设计师未指定的装饰元素

---

## 🏗️ 生成代码结构规范

### 单文件交付
- HTML/CSS 放同一文件时，CSS 写在 `<style>` 中，放在 `</head>` 之前。
- 不使用 `!important`，除非覆盖第三方库样式。

### 组件交付（React / Vue）
- 一个组件一个文件。子组件放同目录或 `components/` 子目录。
- Props 必须定义类型（TypeScript 优先）。
- 不引入第三方 UI 库，除非用户明确要求。
- **样式方案选择优先级**：用户指定方案 > 项目现有方案 > Tailwind CSS > CSS Modules > styled-components。

---

## ✨ 交付质量自检

- [ ] 间距值与设计稿逐一比对，误差不超过 1px
- [ ] 颜色值与设计稿取色一致，没有主观调整
- [ ] 字号、字重、行高与设计稿标注一致
- [ ] 所有可交互元素有 hover、active、focus 态
- [ ] 有 disabled、loading、empty 态的合理补全
- [ ] 代码没有使用 `!important`
- [ ] 没有引入未声明的第三方依赖
- [ ] 在 1920px、1440px、375px 三个宽度下检查布局不崩
- [ ] 图片有 `alt` 属性（即使留空）
- [ ] 装饰性元素用 `aria-hidden="true"` 标记
