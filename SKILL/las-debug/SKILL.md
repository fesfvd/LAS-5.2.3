---
name: las-debug
description: LAS 项目全链路诊断。当报告空白、数据缺失、分析失败、脚本报错、功能不工作时调用。自动追踪 LLM 输出→后端解析→API 响应→前端渲染，定位断点。
---

# LAS 全链路诊断 SKILL

## 触发条件
用户报告：报告空白 / 某区块不显示 / 分数环为空 / 雷达图空白 / 分析失败 / "报告不存在" / debug 黑条出现 / 任何功能异常。

## 诊断流程（按序执行，找到根因即停）

### Layer 1: 后端日志
```bash
# 查看最近的服务器日志输出
# 关注: ERROR 级别、traceback、JSON 解析失败
```
检查 [backend/routers/works.py](backend/routers/works.py) 中 `logger.error()` 的输出。
- 若出现 `报告构建异常` → 跳到 Layer 2
- 若出现 `JSON 解析失败` → 检查 `max_tokens` 是否太小导致截断

### Layer 2: 数据库 Analysis 记录
```bash
python -c "
from backend.models.orm import SessionLocal, Analysis
db = SessionLocal()
a = db.query(Analysis).order_by(Analysis.created_at.desc()).first()
if a:
    r = a.report_json or {}
    dims = r.get('dimensions', {})
    scoring = r.get('scoring', {})
    print(f'status={a.status}  ok={r.get(\"ok\")}  dims={len(dims)}  wcs={scoring.get(\"wcs\")}  tier={scoring.get(\"tier\")}')
    if not r.get('ok'): print(f'error={r.get(\"error\")}')
    if len(dims) != 16: print(f'DIMENSION COUNT WRONG: expected 16, got {len(dims)}')
"
```
- `status=failed` + `error` 有值 → LLM JSON 有问题
- `status=done` + `ok=true` 但 dims≠16 → build_report 有问题
- `status=running` → 分析未完成或 SSE 断开

### Layer 3: 前端数据
打开浏览器 F12 → Console，检查：
- 红色 debug 黑条是否出现？上面写了什么？
- `dimData: N items` — 应 =16
- `Script errors:` — 如有，记下完整错误信息

### Layer 4: 模板渲染
- **只有 hero 区块有内容，下面全空** → 内联脚本错误（最常见：`const` 重复声明）。检查 `var DIM` 是否生效。
- **分数环/雷达图空但文本有** → 脚本执行失败。检查 `DIM_DATA_JSON` 中是否含有 `</script>`。
- **所有 `.reveal` 区块不可见** → IntersectionObserver 未触发。检查 CSS `opacity`。
- **某特定区块空** → 检查对应 `{{PLACEHOLDER}}` 在 report.js 替换链中是否存在。

### Layer 5: 模板占位符
```bash
# 检查模板中每个占位符是否在 report.js 中有对应替换
grep -oP '\{\{[A-Z_]+\}\}' frontend/templates/classic.html | sort -u
grep -oP '\{\{[A-Z_]+\}\}' frontend/templates/original.html | sort -u
grep -oP "replace\('.*?\/\{\{(.*?)\}\}" frontend/js/pages/report.js
```
不匹配的占位符 → 该区块永远为空。

## 常见根因速查表

| 症状 | 根因 | 修复位置 |
|------|------|---------|
| 报告大部分空白 + debug黑条 `Script errors: Identifier 'DIM' has already been` | `const` 在 script 重执行时冲突 | report.js: 脚本包裹块作用域 `{}` |
| 报告大部分空白 + debug黑条 `Script errors: Identifier 'LC' has already been` | 同上，`LC` 数组也冲突 | 同上 |
| 分析失败: `报告构建异常: 1` | `KeyError: 1` — `scores` 空字典 | analyzer.py: 空维度时跳过分计算 |
| 分析失败: `报告构建异常: 'genre'` | `work.genre` 列不存在 | works.py: 改用 LLM metadata |
| JSON 解析失败 + 输出截断 | `max_tokens` 太小 | .env: `LAS_LLM_MAX_TOKENS=32000` |
| 分数环有结构无填充 | 脚本未执行 | 检查 `DIM_DATA_JSON` 是否有 `</` |
| 经典模式分析触发极端预审 | content 为空被当成"篇幅不符" | upload.js: 经典模式去掉 required |
| 报告不存在 (404) + 后来恢复 | 时序竞争 — 分析还在跑 | 正常，轮询会自动加载 |
| 某维度/字段值为空 | 检查 LLM JSON schema 是否包含该字段 | json-mode.MD |

## 诊断报告格式
```
## LAS 诊断结果
**症状**: [用户描述]
**断点位置**: Layer N — [具体文件:行号]
**根因**: [一句话]
**修复**: [具体修改]
```
