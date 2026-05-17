---
name: las-smoke
description: LAS 端到端冒烟测试。改完代码后快速验证全链路是否通畅。用极短文本秒级完成分析。触发：改完代码想验证、部署前检查、说"跑个冒烟测试"。
---

# LAS 冒烟测试 SKILL

## 触发条件
用户说：跑个测试 / 验证一下 / 冒烟测试 / 检查能不能用 / smoke test。

## 测试流程

### Step 1: 确保服务器运行
```bash
curl -s http://127.0.0.1:8000/api/health
```
若失败 → 启动服务器：`python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000`

### Step 2: 提交测试作品（原创模式）
```bash
curl -s -X POST http://127.0.0.1:8000/api/works \
  -H "Content-Type: application/json" \
  -d '{"title":"春风","author":"测试","content":"春风又绿江南岸，明月何时照我还。", "mode":"original"}'
```
记录返回的 `id`。

### Step 3: 提交测试作品（经典模式 — 只给标题）
```bash
curl -s -X POST http://127.0.0.1:8000/api/works \
  -H "Content-Type: application/json" \
  -d '{"title":"红楼梦","mode":"classic"}'
```

### Step 4: 触发分析
对每个 work ID：
```bash
curl -s -X POST http://127.0.0.1:8000/api/works/{id}/analyze \
  -H "Content-Type: application/json" \
  -d '{}'
```
等待分析完成（约 20-40 秒）。

### Step 5: 验证报告
```bash
curl -s http://127.0.0.1:8000/api/works/{id}/report
```

### Step 6: 检查清单

对返回的报告 JSON 逐项检查：

```python
report = response["report"]
assert report["ok"] == True, "报告未成功生成"
assert len(report["dimensions"]) == 16, f"维度数量异常: {len(report['dimensions'])}"
assert report["scoring"]["wcs"] > 0, "WCS 分数异常"
assert report["scoring"]["tier"], "档位名称为空"

# 检查 analysis_content 关键字段不为空
ac = report["analysis_content"]
for field in ["golden_quote", "one_liner", "nickname", "conclusion"]:
    assert ac.get(field), f"{field} 为空"

# 检查四层面均分
layers = report["scoring"]["layer_avgs"]
for l in ["A", "B", "C", "D"]:
    assert l in layers, f"层面 {l} 缺失"

# 检查 benchmarks
for l in ["A", "B", "C", "D"]:
    assert report["benchmarks"].get(l), f"benchmark {l} 缺失"

# 检查 scoring_audit（仅原创模式）
if report["metadata"]["mode"] == "original":
    audit = report.get("scoring_audit", {})
    # 原创模式 2 个维度 ≥75 分触发了下调 → 应有调整记录
    
print("ALL CHECKS PASSED")
```

### Step 7: 前端验证
打开 `http://localhost:8000/app`，手动验证：
- [ ] 提交页：模式切换正常
- [ ] 分析页：进度条脉冲动画、阶段清单显示
- [ ] 报告页：无 debug 黑条、分数环有填充、雷达图有数据、评分表 16 行、手风琴可展开
- [ ] 经典模式：只填标题可提交、作者被自动补全
- [ ] 先贤灵境：勾选后报告中有"延伸批评 · 先贤灵境"区块

## 快捷命令

```bash
# 一键冒烟测试（需要服务器已启动）
python -c "
import requests, json
BASE = 'http://127.0.0.1:8000/api'

# 原创模式
r = requests.post(f'{BASE}/works', json={'title':'测试诗','author':'AI','content':'白日依山尽，黄河入海流。欲穷千里目，更上一层楼。','mode':'original'})
wid = r.json()['id']
print(f'原创模式 work_id={wid}')

# 经典模式
r = requests.post(f'{BASE}/works', json={'title':'红楼梦','mode':'classic'})
wid2 = r.json()['id']
print(f'经典模式 work_id={wid2}')

# 触发分析并等待
for wid, label in [(wid, '原创'), (wid2, '经典')]:
    requests.post(f'{BASE}/works/{wid}/analyze', json={})
    print(f'{label}模式分析已触发，等待...')
    import time
    for _ in range(60):
        time.sleep(3)
        r = requests.get(f'{BASE}/works/{wid}/report')
        if r.status_code == 200 and r.json().get('report',{}).get('ok'):
            rep = r.json()['report']
            print(f'{label}模式 OK: WCS={rep[\"scoring\"][\"wcs\"]}, tier={rep[\"scoring\"][\"tier\"]}, dims={len(rep[\"dimensions\"])}')
            break
    else:
        print(f'{label}模式超时')
"
```
