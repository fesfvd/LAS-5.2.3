"""Generate standalone LAS report HTML from API data.

Follows LAS v5.2.3 Visual Tuning Guide:
- Font hierarchy: JetBrains Mono (system) / Noto Sans SC (body) / Noto Serif SC (literary)
- Drop cap on overview first character
- Golden quote as standalone block with gold left border
- Double-border literary fortune container
- Terminal-log style system metadata footer
"""
import requests, json, os, re
from datetime import datetime

BASE = 'http://127.0.0.1:8000/api'
PROJECT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT_DIR = os.path.join(PROJECT, 'frontend', 'standalone')


def esc(s):
    if s is None: return ''
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def nl2p(text):
    if not text: return ''
    return ''.join(f'<p class="mb-2 last:mb-0">{line.strip()}</p>' for line in text.split('\n') if line.strip())


def layer_pct(v):
    return round(v / 150 * 100)


def k(v):
    return f'{v/1000:.1f}K' if v >= 1000 else str(int(v))


def build_sections(data, rep):
    """Replicate JS buildReportSections logic in Python."""
    mode = data.get('mode', 'original')
    is_original = mode == 'original'
    s = rep.get('scoring', {}) or {}
    ac = rep.get('analysis_content', {}) or {}
    dims_map = rep.get('dimensions', {}) or {}
    dims = list(dims_map.values())
    meta = rep.get('metadata', {}) or {}
    ds = rep.get('defect_scan', {}) or {}
    now = datetime.now()

    date_str = f'{now.year}年{now.month}月{now.day}日'
    wcs_val = s.get('wcs') or 0
    percentile = min(round(wcs_val / 150 * 100), 99)

    tags_html = ''.join(
        f'<span class="tag" style="background:rgba(139,0,0,.06);border:1px solid rgba(139,0,0,.1);color:var(--crimson)">{esc(t)}</span>'
        for t in (ac.get('tags') or [])
    )

    layer_avgs = s.get('layer_avgs', {}) or {'A': 0, 'B': 0, 'C': 0, 'D': 0}

    dim_data = []
    for d in dims:
        did = d.get('id', 0)
        layer = 0 if did <= 4 else 1 if did <= 8 else 2 if did <= 12 else 3
        evidence = '; '.join(d.get('text_evidence') or [])
        adj_score = d.get('adjusted_score')
        is_adj = adj_score is not None and adj_score != d.get('score')
        dim_data.append({
            'name': d.get('name', ''),
            'score': adj_score or d.get('score', 0),
            'level': d.get('tier_name', ''),
            'weight': f'{d.get("weight", 0):.1f}%',
            'benchmark': (d.get('benchmark_evidence', '') or '-')[:30] + '…',
            'layer': layer,
            'evidence': evidence,
            'compare': d.get('conclusion', ''),
            'lowerRef': d.get('reverse_detail', ''),
            'benchmarkPerf': d.get('benchmark_evidence', ''),
            'gapLevel': d.get('comparison_grade', ''),
            'originalScore': d.get('score', 0),
            'adjusted': is_adj,
        })

    # Assessment summary
    sorted_dims = sorted(dims, key=lambda d: d.get('adjusted_score') or d.get('score', 0), reverse=True)
    best, worst = sorted_dims[0] if sorted_dims else None, sorted_dims[-1] if sorted_dims else None
    bs = (best.get('adjusted_score') or best.get('score', 0)) if best else 0
    ws = (worst.get('adjusted_score') or worst.get('score', 0)) if worst else 0

    assessment_html = f'''<section id="assessmentSummary" class="py-10 reveal">
<hr class="rule-strong mb-6">
<h2 class="section-h2">评估概要</h2>
<div class="glass-card rounded-2xl p-5 md:p-6 space-y-4">
<div class="grid grid-cols-2 gap-4">
<div class="h-full"><div class="p-4 rounded-lg h-full" style="background:rgba(45,106,79,.04);border:1px solid rgba(45,106,79,.15)">
<div class="flex items-center justify-between mb-2"><span class="sys-label text-jade"><i class="fas fa-arrow-up mr-1"></i>最突出优势</span><span class="mono data-score text-jade">{bs:.1f}<span class="data-unit">/150</span></span></div>
<p class="text-xs font-semibold serif mb-0.5" style="color:var(--ink)">{esc(best.get('name', ''))}</p>
<p class="text-[10px]" style="color:var(--muted);line-height:1.6">{esc(best.get('conclusion', ''))}</p>
</div></div>
<div class="h-full"><div class="p-4 rounded-lg h-full" style="background:rgba(220,38,38,.04);border:1px solid rgba(220,38,38,.1)">
<div class="flex items-center justify-between mb-2"><span class="sys-label" style="color:#dc2626"><i class="fas fa-arrow-down mr-1"></i>最明显短板</span><span class="mono data-score" style="color:#dc2626">{ws:.1f}<span class="data-unit">/150</span></span></div>
<p class="text-xs font-semibold serif mb-0.5" style="color:var(--ink)">{esc(worst.get('name', ''))}</p>
<p class="text-[10px]" style="color:var(--muted);line-height:1.6">{esc(worst.get('conclusion', ''))}</p>
</div></div>
</div>
<div style="border-top:1px solid var(--rule);padding-top:0.75rem"><details class="text-[11px]" style="color:var(--muted)"><summary class="cursor-pointer"><i class="fas fa-info-circle mr-1"></i>评级说明</summary><p class="mt-2 leading-relaxed">本评级为LAS通用框架下的相对定位，以叙事性作品为基准原型。</p></details></div>
</div></section>'''

    # Benchmarks
    benchmarks = rep.get('benchmarks', {}) or {}
    bench_names = {'A': '语言与形式', 'B': '叙事与内容', 'C': '思想与意义', 'D': '审美与影响'}
    bench_colors = ['#8b0000', '#2d6a4f', '#b8860b', '#1a1a1a']
    bench_html = ''
    for i, bk in enumerate(['A', 'B', 'C', 'D']):
        b = benchmarks.get(bk, {}) or {}
        bench_html += f'''<div class="flex items-center gap-3 p-3 rounded-lg border" style="border-color:var(--rule)">
<div class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow flex-shrink-0" style="background:{bench_colors[i]}">{bk}</div>
<div class="flex-1 min-w-0"><p class="text-sm font-semibold serif leading-tight truncate">{esc(b.get('work', '—'))}</p><p class="sys-meta">{b.get('dimension_id','')}.{b.get('dimension_name','')} · {b.get('level','')} · {bench_names[bk]}</p></div></div>'''

    # Deep analysis
    deep = []
    if ac.get('literary_position'): deep.append(('\U0001f4d6', '文学坐标与谱系定位', ac['literary_position']))
    if ac.get('tension_analysis'): deep.append(('⚡', '张力、开放性与阐释空间', ac['tension_analysis']))
    if ac.get('critical_consensus'): deep.append(('\U0001f4dc', '批评共识与接受史', ac['critical_consensus']))
    prof = ac.get('author_profile') if is_original else ac.get('creation_background')
    if prof: deep.append(('✍️', '作者创作侧写' if is_original else '创作背景', prof))
    if ac.get('core_contribution'): deep.append(('\U0001f4a1', '核心贡献', ac['core_contribution']))
    deep_html = ''
    for idx, (emoji, title, text) in enumerate(deep):
        deep_html += f'''<div class="glass-card rounded-xl overflow-hidden">
<button class="accordion-trigger w-full flex items-center justify-between p-4 text-left" onclick="toggleAccordion({idx})">
<div class="flex items-center gap-3"><span class="text-base">{emoji}</span><span class="font-semibold serif text-sm">{title}</span></div>
<i class="fas fa-chevron-down accordion-icon" style="color:var(--muted);font-size:10px;transition:transform .3s"></i></button>
<div class="accordion-content"><div class="px-4 pb-4 text-sm leading-relaxed" style="color:var(--muted)">{nl2p(esc(text))}</div></div></div>'''

    # Professional sections
    editor_html = guide_html = reading_html = ''
    es = ac.get('editor_suggestions')
    if is_original and es and isinstance(es, dict):
        ehtml = ''
        for key, label in [('genre_principle', '体裁适配原则'), ('core_diagnosis', '核心问题诊断'), ('specific_changes', '具体修改建议'), ('improvement_direction', '提升方向'), ('reference', '参考范本')]:
            if es.get(key): ehtml += f'<p class="mb-2"><strong class="text-ink/60">{label}：</strong>{esc(es[key])}</p>'
        if ehtml:
            editor_html = f'''<div class="pro-card" style="border-color:var(--jade)">
<div class="pro-card-header"><span class="pro-card-label">EDITORIAL REVIEW</span><i class="fas fa-edit" style="color:var(--jade);font-size:14px"></i><h3 class="text-sm font-bold serif">编辑审稿建议</h3></div>
<div class="text-sm leading-relaxed" style="color:var(--muted)">{ehtml}</div></div>'''

    if is_original and ac.get('creative_guidance'):
        guide_html = f'''<div class="pro-card" style="border-color:var(--crimson)">
<div class="pro-card-header"><span class="pro-card-label">CREATIVE INSIGHT</span><i class="fas fa-lightbulb" style="color:var(--crimson);font-size:14px"></i><h3 class="text-sm font-bold serif">创作导语</h3></div>
<div class="text-sm leading-relaxed" style="color:var(--muted)">{nl2p(esc(ac['creative_guidance']))}</div></div>'''
    elif not is_original and ac.get('creative_inspiration'):
        guide_html = f'''<div class="pro-card" style="border-color:var(--jade)">
<div class="pro-card-header"><span class="pro-card-label">CREATIVE INSIGHT</span><i class="fas fa-book-reader" style="color:var(--jade);font-size:14px"></i><h3 class="text-sm font-bold serif">创作启示</h3></div>
<div class="text-sm leading-relaxed" style="color:var(--muted)">{nl2p(esc(ac['creative_inspiration']))}</div></div>'''

    rs = ac.get('reading_suggestions', {}) or {}
    if rs.get('general') or rs.get('research'):
        reading_html = f'''<div class="pro-card" style="border-color:var(--jade)">
<div class="pro-card-header"><span class="pro-card-label">READING GUIDE</span><i class="fas fa-book-reader" style="color:var(--jade);font-size:14px"></i><h3 class="text-sm font-bold serif">阅读与研习建议</h3></div>
<div class="reading-grid">'
{f'<div><span class="reading-col-label">GENERAL</span><p style="color:var(--muted)">{esc(rs["general"])}</p></div>' if rs.get('general') else ''}
{f'<div><span class="reading-col-label">ACADEMIC</span><p style="color:var(--muted)">{esc(rs["research"])}</p></div>' if rs.get('research') else ''}
</div></div>'''

    # Ancestor
    ancestor = ac.get('ancestor_dialogue', {}) or {}
    ancestor_html = ''
    if data.get('ancestor_dialogue') and ancestor.get('enabled'):
        parts_html = ''
        if ancestor.get('participants'):
            parts_html = '<div class="glass-card rounded-xl p-5 mb-4"><h3 class="text-sm font-bold serif mb-3 flex items-center"><i class="fas fa-users mr-2" style="color:var(--gold)"></i>与会先贤</h3><div class="flex flex-wrap gap-3">'
            for p in ancestor['participants']:
                parts_html += f'<span class="rounded-full px-3 py-1 text-xs" style="background:rgba(184,134,11,.08);color:#8b6914">{esc(p.get("name",""))}（《{esc(p.get("work",""))}》）</span>'
            parts_html += '</div></div>'
        dial_html = f'<div class="glass-card rounded-xl p-5"><div class="text-sm leading-relaxed space-y-4 serif" style="color:var(--muted)">{nl2p(esc(ancestor.get("dialogue","")))}</div></div>' if ancestor.get('dialogue') else ''
        ancestor_html = f'<section id="ancestor-dialogue" class="py-10 reveal"><hr class="rule-strong mb-6"><div class="flex items-center gap-3 mb-5"><h2 class="section-h2">延伸批评 · 先贤灵境</h2><span class="sys-badge">ADVANCED MODULE</span></div>{parts_html}{dial_html}</section>'

    # Conclusion
    conclusion_html = f'<div class="conclusion-text">{nl2p(esc(ac.get("conclusion","")))}</div>' if ac.get('conclusion') else ''

    # Appendix
    app = ac.get('appendix', {}) or {}
    app_html = ''
    for title, icon, key, color in [
        ('文脉拾遗', 'fa-scroll', 'context', 'var(--crimson)'),
        ('风物志', 'fa-mountain', 'customs', 'var(--jade)'),
        ('字里行间', 'fa-pen-fancy', 'between_lines', 'var(--gold)'),
        ('余音', 'fa-music', 'echoes', '#d97706'),
        ('联结', 'fa-link', 'connections', '#3b82f6'),
    ]:
        if app.get(key):
            app_html += f'<div class="glass-card rounded-xl p-5"><h3 class="text-sm font-bold serif mb-3 flex items-center"><i class="fas {icon} mr-2" style="color:{color}"></i>{title}</h3><p class="text-sm leading-relaxed" style="color:var(--muted)">{esc(app[key])}</p></div>'
    ext_readings = app.get('extended_reading', []) or []
    if ext_readings:
        app_html += '<div class="glass-card rounded-xl p-5"><h3 class="text-sm font-bold serif mb-3 flex items-center"><i class="fas fa-book mr-2" style="color:#8b5cf6"></i>延伸阅读</h3><div class="space-y-2">'
        for b in ext_readings:
            app_html += f'<div class="flex items-start gap-2 text-sm" style="color:var(--muted)"><span style="color:#8b5cf6;margin-top:2px"><i class="fas fa-book"></i></span><div><span class="font-semibold" style="color:var(--ink)">《{esc(b.get("title",""))}》</span> {esc(b.get("author",""))}。{esc(b.get("reason",""))}</div></div>'
        app_html += '</div></div>'

    # Verification data
    extreme_text = '已触发' if ds.get('triggered') else '无'
    extreme_detail = f'（{esc(ds.get("trigger_type",""))}）' if ds.get('triggered') else '（未触发任何极端情况，继续详细评分流程）'
    has_adjustments = any(d.get('adjusted') for d in dim_data)
    adj_items_html = '<div class="text-sm" style="color:var(--muted)">无调整记录</div>'
    if has_adjustments:
        items = []
        for idx, d in enumerate(d for d in dim_data if d['adjusted']):
            items.append(f'''<div class="glass-card rounded-xl overflow-hidden">
<button class="w-full flex items-center justify-between p-3 text-left" onclick="toggleAdjustment({idx})">
<div class="flex items-center gap-2"><span class="font-semibold text-sm">{esc(d['name'])}</span><span class="adjustment-badge">{d['originalScore']} → {d['score']}</span></div>
<i class="fas fa-chevron-down accordion-icon text-xs" style="color:var(--muted);transition:transform .3s"></i></button>
<div class="accordion-content"><div class="px-4 pb-4 text-sm space-y-1.5" style="color:var(--muted)">
<p><strong style="color:var(--ink)">原始分数：</strong>{d['originalScore']} → <strong class="audit-down">{d['score']}</strong></p>
{f'<p><strong style="color:var(--ink)">差距等级：</strong><span class="audit-d-level">D={esc(d["gapLevel"])}</span></p>' if d.get('gapLevel') else ''}
{f'<p><strong style="color:var(--ink)">基准表现：</strong>{esc(d["benchmarkPerf"])}</p>' if d.get('benchmarkPerf') else ''}
{f'<p><strong style="color:var(--ink)">证据引用：</strong><span class="evidence-quote">{esc(d["evidence"])}</span></p>' if d.get('evidence') else ''}
{f'<p><strong style="color:var(--ink)">结论：</strong>{esc(d["compare"])}</p>' if d.get('compare') else ''}
</div></div></div>''')
        adj_items_html = ''.join(items)

    # Penalty
    k_val, mf_val = s.get('core_penalty_k', 1) or 1, s.get('mediocrity_mf', 1) or 1
    pws_val = s.get('pws') or wcs_val
    k_trig, mf_trig = k_val < 0.999, mf_val < 0.999
    pen_impact = round((pws_val - wcs_val) * 10) / 10 if (k_trig or mf_trig) else 0

    penalty_html = ''
    if is_original:
        penalty_html = f'''<h3 class="text-base font-bold serif mb-3 flex items-center"><i class="fas fa-calculator mr-2" style="color:var(--muted);font-size:14px"></i>三、惩罚系数计算</h3>
<div class="glass-card rounded-xl overflow-hidden mb-4">
<button class="w-full flex items-center justify-between p-3 text-left" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.accordion-icon').classList.toggle('open')">
<div class="flex items-center gap-2"><span class="font-semibold text-sm">WCS = PWS{' × k' if k_trig else ''}{' × mf' if mf_trig else ''}</span><span class="text-xs" style="color:var(--muted)">{pws_val:.1f}{f' × {k_val:.4f}' if k_trig else ''}{f' × {mf_val:.4f}' if mf_trig else ''} = {wcs_val:.1f}</span>{f'<span class="adjustment-badge">-{pen_impact:.1f}</span>' if pen_impact > 0 else ''}</div>
<i class="fas fa-chevron-down accordion-icon text-xs" style="color:var(--muted);transition:transform .3s"></i></button>
<div class="accordion-content"><div class="px-4 pb-4 text-sm space-y-3" style="color:var(--muted)">
<div class="flex items-start gap-3"><span class="mono text-xs font-semibold" style="min-width:48px;color:var(--ink)">PWS</span><span>加权综合分 = {pws_val:.1f}</span></div>
<div class="flex items-start gap-3"><span class="mono text-xs font-semibold" style="min-width:48px;color:{'var(--crimson)' if k_trig else 'var(--muted)'}">k = {k_val:.4f}</span><span>{'核心维度偏科惩罚已触发。' if k_trig else '未触发。'}</span></div>
<div class="flex items-start gap-3"><span class="mono text-xs font-semibold" style="min-width:48px;color:{'var(--crimson)' if mf_trig else 'var(--muted)'}">mf = {mf_val:.4f}</span><span>{'整体平庸惩罚已触发。' if mf_trig else '未触发。'}</span></div>
<div class="flex items-start gap-3 pt-2" style="border-top:1px solid var(--rule)"><span class="mono text-xs font-bold" style="min-width:48px;color:var(--ink)">WCS</span><span class="font-semibold" style="color:var(--ink)">最终综合分 = {wcs_val:.1f} / 150（{esc(s.get('tier', ''))}）</span></div></div></div></div>'''

    div = ac.get('divination', {}) or {}
    tokens = data.get('tokens', {}) or {}
    token_str = f'消耗 {k(tokens["total"])} tokens（提示 {k(tokens.get("prompt",0))} + 生成 {k(tokens.get("completion",0))}）' if tokens.get('total') else ''
    las_id = ac.get('report_id') or f'LAS-{now.year}{now.month:02d}{now.day:02d}-{data.get("id","")[:3]}'

    # Overview with drop cap and golden quote extraction
    overview_text = ac.get('overview', '')
    drop_char = ''
    rest_text = overview_text
    if overview_text and len(overview_text) > 0:
        drop_char = overview_text[0]
        rest_text = overview_text[1:] if len(overview_text) > 1 else ''

    sections = {}
    for key, val in [
        ('WORK_TITLE', esc(data.get('title', ''))),
        ('WORK_AUTHOR', esc(data.get('author', ''))),
        ('WORK_TAGS', tags_html),
        ('LAS_ID', esc(las_id)),
        ('WORK_TYPE', esc(meta.get('genre', ''))),
        ('WCS_SCORE', f'{wcs_val:.2f}'),
        ('WORK_LEVEL', esc(s.get('tier', ''))),
        ('WORK_PERCENTILE', str(percentile)),
        ('WORK_TITLE_HONOR', esc(ac.get('nickname', ''))),
        ('WORK_SHARP_COMMENT', esc(ac.get('one_liner', ''))),
        ('WORK_OVERVIEW', f'<span class="drop-cap">{esc(drop_char)}</span>{nl2p(esc(rest_text))}'),
        ('GOLDEN_QUOTE', esc(ac.get('golden_quote', ''))),
        ('LITERARY_ECHO', esc(ac.get('literary_echo', ''))),
        ('LITERARY_ECHO_SOURCE', esc(ac.get('literary_echo_source', ''))),
        ('LAYER1_PERCENT', str(layer_pct(layer_avgs.get('A', 0)))),
        ('LAYER1_AVG', f'{layer_avgs.get("A", 0):.2f}'),
        ('LAYER2_PERCENT', str(layer_pct(layer_avgs.get('B', 0)))),
        ('LAYER2_AVG', f'{layer_avgs.get("B", 0):.2f}'),
        ('LAYER3_PERCENT', str(layer_pct(layer_avgs.get('C', 0)))),
        ('LAYER3_AVG', f'{layer_avgs.get("C", 0):.2f}'),
        ('LAYER4_PERCENT', str(layer_pct(layer_avgs.get('D', 0)))),
        ('LAYER4_AVG', f'{layer_avgs.get("D", 0):.2f}'),
        ('DIM_DATA_JSON', json.dumps(dim_data, ensure_ascii=False).replace('</', '<\\/')),
        ('ASSESSMENT_SUMMARY', assessment_html),
        ('CORE_BENCHMARKS', bench_html),
        ('DEEP_ANALYSIS_SECTIONS', deep_html),
        ('CONCLUSION_CONTENT', conclusion_html),
        ('APPENDIX_SECTIONS', app_html or ''),
        ('EDITOR_REVIEW_SECTION', editor_html),
        ('CREATION_GUIDE_SECTION', guide_html),
        ('READING_RECOMMENDATIONS', reading_html),
        ('PROFESSIONAL_SECTIONS', editor_html + guide_html + reading_html),
        ('ANCESTOR_DIALOGUE_SECTION', ancestor_html),
        ('EXTREME_CHECK_RESULT', extreme_text),
        ('EXTREME_CHECK_DETAIL', extreme_detail),
        ('ADJUSTMENT_TRIGGER', '高分段维度触发原创审慎校验下调' if has_adjustments else '无需调整'),
        ('ADJUSTMENT_ITEMS', adj_items_html),
        ('PENALTY_CALCULATION', penalty_html),
        ('FORTUNE_LEVEL', esc(div.get('grade', ''))),
        ('FORTUNE_KEYWORD', esc(div.get('word', ''))),
        ('FORTUNE_TEXT', esc(div.get('poem', ''))),
        ('FORTUNE_SOURCE', esc(div.get('source', ''))),
        ('CURRENT_DATE', date_str),
        ('TOKEN_USAGE', token_str),
    ]:
        sections[key] = val

    return sections, dim_data, layer_avgs, wcs_val, s.get('tier', '')


def apply_template(tpl, sections):
    for key, value in sections.items():
        tpl = tpl.replace('{{' + key + '}}', str(value))
    residual = set(re.findall(r'\{\{[A-Z_]+\}\}', tpl))
    if residual:
        print(f'  Warning: unresolved {residual}')
    return tpl


def generate(mode, work_id):
    print(f'Generating {mode} standalone from {work_id}...')
    r = requests.get(f'{BASE}/works/{work_id}/report')
    data = r.json()
    rep = data['report']
    sections, dim_data, layer_avgs, wcs_val, tier = build_sections(data, rep)

    tpl_path = os.path.join(PROJECT, 'frontend', 'templates', f'{mode}.html')
    with open(tpl_path, 'r', encoding='utf-8') as f:
        tpl = f.read()
    html = apply_template(tpl, sections)

    css_path = os.path.join(PROJECT, 'frontend', 'css', 'app.css')
    with open(css_path, 'r', encoding='utf-8') as f:
        app_css = f.read()

    purp = mode == 'original'
    primary = '#6b21a8' if purp else '#8b0000'
    paper = '#faf8f5' if purp else '#faf8f3'
    dim_json = json.dumps(dim_data, ensure_ascii=False)
    lc_json = json.dumps(['#6b21a8','#2d6a4f','#b8860b','#1a1a1a'] if purp else ['#8b0000','#2d6a4f','#b8860b','#1a1a1a'])
    secs_json = json.dumps(
        ['hero','assessmentSummary','verification','table','coreBenchmarks','deepAnalysis','professional','conclusion','appendix'] if purp
        else ['hero','assessmentSummary','table','coreBenchmarks','deepAnalysis','professional','conclusion','appendix']
    )

    # Visual tuning CSS (per LAS v5.2.3 Visual Tuning Guide)
    tuning_css = '''
/* === Visual Tuning: Typography === */
.section-h2 { font-family: 'Noto Serif SC', serif; font-size: 1.5rem; font-weight: 700; margin-bottom: 1.25rem; letter-spacing: .03em; }
.sys-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
.sys-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); letter-spacing: 0.5px; }
.sys-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; padding: 2px 8px; border-radius: 2px; background: rgba(26,26,26,.04); color: var(--muted); letter-spacing: 1px; }
.data-score { font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 700; }
.data-unit { font-size: 0.65rem; opacity: 0.6; font-weight: 400; }
.text-jade { color: var(--jade) !important; }

/* === Visual Tuning: Drop Cap === */
.drop-cap { font-family: 'Noto Serif SC', serif; font-size: 3.5em; float: left; line-height: 0.8; padding-right: 12px; padding-top: 4px; font-weight: 900; color: var(--ink); }

/* === Visual Tuning: Golden Quote === */
.golden-quote-block { margin: 40px 0; padding: 24px 32px; background: rgba(26,26,26,.015); border-left: 3px solid var(--gold); }
.golden-quote-block blockquote { font-family: 'Noto Serif SC', serif; font-style: italic; font-size: 1.1rem; line-height: 1.8; color: var(--ink); text-indent: 2em; margin: 0; }

/* === Visual Tuning: Professional Cards === */
.pro-card { padding: 20px 24px; border: 1px solid var(--rule-strong); border-left-width: 3px; border-radius: 8px; background: rgba(26,26,26,.01); margin-bottom: 16px; }
.pro-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.pro-card-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 2px; color: var(--muted); background: var(--paper); padding: 0 4px; margin-top: -28px; position: absolute; }
.reading-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.reading-col-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 2px; color: var(--gold); margin-bottom: 8px; display: block; }
@media (max-width: 767px) { .reading-grid { grid-template-columns: 1fr; } }

/* === Visual Tuning: Conclusion === */
.conclusion-text { font-family: 'Noto Sans SC', sans-serif; font-size: 0.95rem; line-height: 2; text-align: justify; color: var(--muted); max-width: 680px; }

/* === Visual Tuning: Table === */
#table thead th { font-family: 'JetBrains Mono', monospace !important; font-size: 11px !important; letter-spacing: 1px !important; color: var(--muted) !important; }
.evidence-quote { font-family: 'Noto Serif SC', serif; font-style: italic; border-left: 1px solid var(--muted); padding-left: 12px; margin: 8px 0; display: block; color: var(--ink); }
.audit-down { color: var(--crimson); font-weight: 700; }
.audit-d-level { font-family: 'JetBrains Mono', monospace; background: var(--rule); padding: 0 4px; border-radius: 2px; font-size: 11px; }

/* === Visual Tuning: Fortune Container === */
.fortune-container { border: 4px double var(--rule-strong); padding: 40px 20px; text-align: center; margin: 48px 0; }
.fortune-grade { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 4px; color: var(--gold); text-transform: uppercase; }
.fortune-keyword { font-family: 'Noto Serif SC', serif; font-size: 2rem; font-weight: 900; color: var(--ink); margin: 8px 0; }
.fortune-poem { font-family: 'Noto Serif SC', serif; font-size: 1.1rem; font-style: italic; line-height: 2; color: var(--ink); }

/* === Visual Tuning: System Footer === */
.sys-footer { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); letter-spacing: 0.5px; text-align: center; padding: 24px 0; border-top: 1px solid var(--rule); }
.sys-footer .disclaimer { font-size: 10px; color: rgba(26,26,26,.3); margin-top: 8px; }

/* === Visual Tuning: Body text === */
.report-body { font-family: 'Noto Sans SC', sans-serif; font-size: 0.95rem; line-height: 1.9; text-align: justify; color: var(--muted); max-width: 680px; }

/* === Visual Tuning: Tier badges === */
.tier-badge { display: inline-block; border: 1px solid var(--gold); color: var(--gold); border-radius: 2px; padding: 2px 8px; font-size: 11px; font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
'''

    standalone = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{sections['WORK_TITLE']} — LAS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Serif+SC:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
:root{{--ink:#1a1a1a;--paper:{paper};--gold:#b8860b;--crimson:#8b0000;--jade:#2d6a4f;--muted:#8a8578;--rule:rgba(26,26,26,.08);--rule-strong:rgba(26,26,26,.15);--surface:rgba(255,255,255,.5)}}
{app_css}
{tuning_css}
</style>
</head>
<body style="background:var(--paper)">
{html}
<script>
window.__LAS_DATA = {{ dimData: {dim_json}, LC: {lc_json}, mode: '{mode}', primaryColor: '{primary}', wcs: {wcs_val} }};
</script>
<script>
function toggleAdjustment(idx){{var items=document.querySelectorAll('#adjustmentList > div');items.forEach(function(item,i){{var c=item.querySelector('.accordion-content'),a=item.querySelector('.accordion-icon');if(!c||!a)return;if(i===idx){{c.classList.toggle('open');a.classList.toggle('open')}}else{{c.classList.remove('open');a.classList.remove('open')}}}});}}
function toggleAccordion(idx){{var items=document.querySelectorAll('#accordion > div');var c=items[idx].querySelector('.accordion-content'),a=items[idx].querySelector('.accordion-icon');c.classList.toggle('open');a.classList.toggle('open')}}
function toggleRow(i){{var ex=document.getElementById('ex'+i),ar=document.getElementById('arr'+i);var open=ex.classList.contains('open');document.querySelectorAll('.expand-row').forEach(function(e){{e.classList.remove('open')}});document.querySelectorAll('.arr').forEach(function(a){{a.style.transform=''}});if(!open){{ex.classList.add('open');ar.style.transform='rotate(180deg)'}}}}
function scrollTo(id){{document.getElementById(id).scrollIntoView({{behavior:'smooth',block:'start'}})}}
</script>
<script>
(function(){{var D=window.__LAS_DATA;if(!D||D.dimData.length===0)return;var DIM=D.dimData,LC=D.LC,wcs=D.wcs,primary=D.primaryColor,isOrig=D.mode==='original';
(function(){{var el=document.getElementById('goldenQuote');if(el){{var l=el.textContent.trim().length;if(l<=15){{el.style.fontSize='1.25rem';el.style.fontWeight='600'}}else if(l<=25){{el.style.fontSize='1.1rem';el.style.fontWeight='500'}}else if(l<=40){{el.style.fontSize='1rem';el.style.fontWeight='500'}}else if(l<=60){{el.style.fontSize='0.9rem';el.style.fontWeight='400'}}else{{el.style.fontSize='0.875rem';el.style.fontWeight='400'}}}}var sc=document.getElementById('sharpComment');if(sc){{var l=sc.textContent.trim().length;if(l<=20){{sc.style.fontSize='1.35rem';sc.style.fontWeight='700'}}else if(l<=35){{sc.style.fontSize='1.2rem';sc.style.fontWeight='600'}}else if(l<=50){{sc.style.fontSize='1.1rem';sc.style.fontWeight='600'}}else if(l<=70){{sc.style.fontSize='1rem';sc.style.fontWeight='500'}}else if(l<=100){{sc.style.fontSize='0.9rem';sc.style.fontWeight='500'}}else{{sc.style.fontSize='0.875rem';sc.style.fontWeight='400'}}}}}})();
(function(){{var p=document.getElementById('heroProgress'),v=document.getElementById('heroValue');if(!p||!v)return;var score=wcs||0,c=2*Math.PI*42,o=c*(1-score/150);setTimeout(function(){{p.style.strokeDashoffset=o;var d=2000,start=performance.now();(function a(t){{var prog=Math.min((t-start)/d,1),eased=1-Math.pow(1-prog,4);v.textContent=(eased*score).toFixed(2);if(prog<1)requestAnimationFrame(a)}})(performance.now())}},400)}})();
(function(){{var canvas=document.getElementById('radarChart');if(!canvas)return;var ctx=canvas.getContext('2d');var tgt=DIM.map(function(d){{return d.score}}),cur=new Array(16).fill(0);var isP=primary==='#6b21a8';var cBg=isP?'rgba(107,33,168,0.06)':'rgba(139,0,0,0.06)',cBorder=isP?'rgba(107,33,168,0.5)':'rgba(139,0,0,0.5)',cPoint=isP?'rgba(107,33,168,0.7)':'rgba(139,0,0,0.7)',tBorder=isP?'rgba(107,33,168,0.1)':'rgba(139,0,0,0.1)';
var lvl={{id:'lvl',beforeDatasetsDraw:function(ch){{var c=ch.ctx,top=ch.chartArea.top,bottom=ch.chartArea.bottom,left=ch.chartArea.left,right=ch.chartArea.right,da=ch.scales.r.drawingArea,cx=(left+right)/2,cy=(top+bottom)/2;[150,125,105,95,75].forEach(function(v,i){{var rd=(v/150)*da;c.save();c.beginPath();c.arc(cx,cy,rd,0,2*Math.PI);c.strokeStyle=(isP?'rgba(107,33,168,':'rgba(139,0,0,')+(0.4-i*0.06).toFixed(2)+')';c.lineWidth=0.8;c.setLineDash([3,4]);c.stroke();c.setLineDash([]);c.fillStyle='rgba(26,26,26,.3)';c.font='9px "Noto Sans SC"';c.textAlign='left';c.textBaseline='middle';c.fillText(v,cx+rd+4,cy);c.restore()}})}}}};
var chart=new Chart(ctx,{{type:'radar',data:{{labels:DIM.map(function(d){{return d.name}}),datasets:[{{data:cur,fill:true,backgroundColor:cBg,borderColor:cBorder,pointBackgroundColor:cPoint,pointBorderColor:'#faf8f5',pointBorderWidth:1.5,pointRadius:3.5,pointHoverRadius:6,borderWidth:1.5}}]}},options:{{responsive:true,maintainAspectRatio:false,onClick:function(e,el){{if(el.length)document.getElementById('table').scrollIntoView({{behavior:'smooth'}})}},scales:{{r:{{min:0,max:150,ticks:{{display:false}},grid:{{color:'rgba(26,26,26,.04)',circular:true}},angleLines:{{color:'rgba(26,26,26,.04)'}},pointLabels:{{font:{{size:11,family:"'Noto Sans SC'",weight:'500'}},color:'#1a1a1a'}}}}}},plugins:{{legend:{{display:false}},tooltip:{{backgroundColor:'rgba(250,248,245,.95)',titleColor:primary,bodyColor:'#1a1a1a',borderColor:tBorder,borderWidth:1,padding:8,cornerRadius:4,titleFont:{{family:"'Noto Serif SC'",weight:'600'}},callbacks:{{title:function(c){{return[DIM[c[0].dataIndex].name]}},label:function(c){{return[DIM[c[0].dataIndex].score+'/150',DIM[c[0].dataIndex].level,DIM[c[0].dataIndex].weight]}}}}}}}},animation:{{duration:0}}}},plugins:[lvl]}});
setTimeout(function(){{var d=2500,start=performance.now();(function a(t){{var prog=Math.min((t-start)/d,1),eased=1-Math.pow(1-prog,4);for(var i=0;i<16;i++)cur[i]=tgt[i]*eased;chart.update('none');if(prog<1)requestAnimationFrame(a)}})(performance.now())}},600)}})();
function buildTable(filter,query){{var D=window.__LAS_DATA;if(!D)return;var DIM=D.dimData,LC=D.LC,isO=D.mode==='original';var hBg=isO?'rgba(107,33,168,.03)':'rgba(139,0,0,.03)',lrc=isO?'rgba(107,33,168,.5)':'rgba(139,0,0,.5)',tC=LC[0],tBg=isO?'rgba(107,33,168,.08)':'rgba(139,0,0,.08)';var f=filter!==undefined?filter:(document.getElementById('levelFilter')?document.getElementById('levelFilter').value:'all');var q=query!==undefined?query:(document.getElementById('tableSearch')?document.getElementById('tableSearch').value:'');var tb=document.getElementById('tableBody');if(!tb)return;tb.innerHTML='';var n=0;DIM.forEach(function(d,i){{if(f!=='all'&&d.level!==f)return;if(q&&d.name.indexOf(q)===-1)return;n++;var tiers={{'文学之巅':'color:'+tC+';background:'+tBg,'永恒殿堂':'color:#b8860b;background:rgba(184,134,11,.08)','不朽丰碑':'color:#1a1a1a;background:rgba(26,26,26,.04)','典范之作':'color:#2d6a4f;background:rgba(45,106,79,.08)','上乘佳作':'color:#059669;background:rgba(5,150,105,.06)'}};var lc=tiers[d.level]||'color:#8a8578;background:rgba(138,133,120,.06)';var adj=d.adjusted?'<span class="text-[9px] text-gold/60 ml-0.5">*</span>':'';var r=document.createElement('tr');r.style.cssText='border-bottom:1px solid var(--rule);cursor:pointer;transition:background .2s';r.onmouseenter=function(){{r.style.background=hBg}};r.onmouseleave=function(){{r.style.background=''}};r.innerHTML='<td class="py-2.5 px-3 font-medium"><span class="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style="background:'+LC[d.layer]+'"></span>'+d.name+adj+'</td><td class="py-2.5 px-2 text-center mono text-muted text-xs">'+d.weight+'</td><td class="py-2.5 px-2 text-center mono font-bold">'+d.score+'</td><td class="py-2.5 px-2 text-center"><span class="text-[11px] px-2 py-0.5 rounded-full font-semibold" style="'+lc+'">'+d.level+'</span></td><td class="py-2.5 px-3 text-muted text-xs">'+d.benchmark+'</td><td class="py-2.5 px-2 text-center"><i class="fas fa-chevron-down text-muted/30 text-[10px] arr" id="arr'+i+'"></i></td>';r.onclick=(function(idx){{return function(){{toggleRow(idx)}}}})(i);tb.appendChild(r);var er=document.createElement('tr');er.id='er'+i;var gap=d.gapLevel?'<p><strong class="text-ink/60">'+'\\u2460'.repeat(1)+' 基准表现：</strong>'+(d.benchmarkPerf||'暂无')+'</p><p><strong class="text-ink/60">'+'\\u2461'.repeat(1)+' 证据引用：</strong><span class="evidence-quote">'+(d.evidence||'暂无')+'</span></p><p><strong class="text-ink/60">'+'\\u2462'.repeat(1)+' 差距等级：</strong><span class="audit-d-level">D='+d.gapLevel+'</span></p>'+(d.lowerRef?'<p><strong style="color:'+lrc+'">'+'\\u2463'.repeat(1)+' 反向锚定：</strong>'+d.lowerRef+'</p>':'')+'<p><strong class="text-ink/60">'+'\\u2464'.repeat(1)+' 结论：</strong>'+(d.compare||'暂无')+'</p>':'<p><strong class="text-ink/60">关键证据：</strong><span class="evidence-quote">'+(d.evidence||'暂无')+'</span></p><p><strong class="text-ink/60">基准比较：</strong>'+(d.compare||'暂无')+'</p>'+(d.lowerRef?'<p><strong style="color:'+lrc+'">反向锚定：</strong>'+d.lowerRef+'</p>':'');er.innerHTML='<td colspan="6" class="p-0"><div class="expand-row" id="ex'+i+'"><div class="px-6 py-3 text-sm text-muted leading-relaxed space-y-1.5 serif" style="background:rgba(26,26,26,.015)">'+gap+'</div></div></td>';tb.appendChild(er)}});if(!n){{var e=document.createElement('tr');e.innerHTML='<td colspan="6" class="py-8 text-center text-muted">无匹配结果</td>';tb.appendChild(e)}}}}
buildTable();
var sEl=document.getElementById('tableSearch');if(sEl)sEl.addEventListener('input',function(){{buildTable()}});
var fEl=document.getElementById('levelFilter');if(fEl)fEl.addEventListener('change',function(){{buildTable()}});
var secs={secs_json};
document.querySelectorAll('.nav-pip').forEach(function(p){{p.addEventListener('click',function(){{scrollTo(p.dataset.target)}})}});
var sObs=new IntersectionObserver(function(es){{es.forEach(function(e){{if(e.isIntersecting)document.querySelectorAll('.nav-pip').forEach(function(p){{p.classList.toggle('active',p.dataset.target===e.target.id)}})}})}},{{threshold:0.15,rootMargin:'-10% 0px -60% 0px'}});
secs.forEach(function(id){{var el=document.getElementById(id);if(el)sObs.observe(el)}});
var bar=document.getElementById('stickyBar'),hero=document.getElementById('hero');
window.addEventListener('scroll',function(){{if(bar&&hero)bar.classList.toggle('show',hero.getBoundingClientRect().bottom<0);var btn=document.getElementById('topBtn');if(btn){{var s=window.scrollY>600;btn.style.opacity=s?'1':'0';btn.style.pointerEvents=s?'auto':'none'}}}},{{passive:true}});
var rObs=new IntersectionObserver(function(es){{es.forEach(function(e){{if(e.isIntersecting)e.target.classList.add('visible')}})}},{{threshold:0.08}});
document.querySelectorAll('.reveal').forEach(function(el){{rObs.observe(el)}});
var bObs=new IntersectionObserver(function(es){{es.forEach(function(e){{if(e.isIntersecting){{e.target.querySelectorAll('.bar-fill').forEach(function(b){{b.style.width=b.dataset.width+'%'}});bObs.unobserve(e.target)}}}})}},{{threshold:0.3}});
var lb=document.getElementById('layerBars');if(lb)bObs.observe(lb);
}})();
</script>
</body>
</html>'''

    out_name = f'LAS_{"原创" if purp else "经典"}报告_{sections["WORK_TITLE"].replace("/","_")}.html'
    out_path = os.path.join(OUT_DIR, out_name)
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(standalone)
    print(f'  -> {out_name} ({len(standalone):,} bytes)')
    return out_path


if __name__ == '__main__':
    os.makedirs(OUT_DIR, exist_ok=True)
    generate('classic', 'cb118ad7-0c05-4b82-bc20-35ff6678d17f')
    generate('original', '0ac678b3-ace2-4919-a32e-35065cf24a5f')
    print('Done. Open the files in a browser to verify.')
