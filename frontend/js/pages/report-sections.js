// report-sections.js — buildReportSections: 数据 → HTML 模板变量
// 依赖: esc(), nl2p(), debracket() (定义于 app.js)

function buildReportSections(data, r, fallbackId) {
  const mode = data.mode || 'original';
  const isOriginal = mode === 'original';
  const s = r.scoring || {};
  const ac = r.analysis_content || {};
  const dmap = r.dimensions || {};
  const dims = Object.values(dmap);
  const meta = r.metadata || {};
  const ds = r.defect_scan || {};

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
  const percentile = Math.min(Math.round((s.wcs || 0) / 150 * 100), 99);


  // Genre & spectral keywords
  const genreKW = (meta.genre_keywords || []).map(k =>
    `<span class="tag tag--genre">${esc(k)}</span>`
  ).join('');
  const spectralKW = (meta.spectral_keywords || []).map(k =>
    `<span class="tag tag--spectral">${esc(k)}</span>`
  ).join('');
  const keywordsHtml = (genreKW || spectralKW) ? `<div class="flex flex-wrap gap-1.5 mb-4">${genreKW}${spectralKW}</div>` : '';

  // Tags: try per-field format first, fall back to legacy array
  const tagFields = ['tag_1','tag_2','tag_3','tag_4','tag_5','tag_6','tag_7'];
  const newTags = tagFields.map(k => ac[k]).filter(t => t != null && t !== '');
  const tags = (newTags.length ? newTags : (ac.tags || [])).map(t =>
    `<span class="tag tag--work">#${esc((t||'').replace(/^#/,''))}</span>`
  ).join('');

  const layerAvgs = s.layer_avgs || { A: 0, B: 0, C: 0, D: 0 };
  const layerPct = (v) => Math.round((v / 150) * 100);

  // Build DIM_DATA for template JS
  const dimData = dims.map(d => {
    const layer = d.id <= 4 ? 0 : d.id <= 8 ? 1 : d.id <= 12 ? 2 : 3;
    const evidence = (d.text_evidence || []).join('; ');
    const isAdj = d.adjusted_score !== undefined && d.adjusted_score !== d.score;
    return {
      name: d.name,
      score: d.adjusted_score || d.score,
      level: d.tier_name || '',
      weight: (d.weight || 0).toFixed(1) + '%',
      benchmark: d.benchmark_evidence ? d.benchmark_evidence.slice(0, 30) + '…' : '-',
      layer,
      evidence,
      compare: d.conclusion || '',
      lowerRef: d.reverse_detail || '',
      benchmarkPerf: d.benchmark_evidence || '',
      gapLevel: d.comparison_grade || '',
      originalScore: d.score,
      adjusted: isAdj,
    };
  });

  // Assessment Summary
  const sorted = [...dims].sort((a, b) => (b.adjusted_score || b.score) - (a.adjusted_score || a.score));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const assessmentHtml = `
    <section id="assessmentSummary" class="py-10 reveal">
      <hr class="rule-strong mb-6">
      <h2 class="text-2xl font-bold serif mb-5">评估概要</h2>
      <div class="glass-card rounded-2xl p-5 md:p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="h-full">
            <div class="p-4 rounded-lg h-full" style="background:rgba(45,106,79,.04);border:1px solid rgba(45,106,79,.15)">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-semibold tracking-wider uppercase" style="color:var(--jade)"><i class="fas fa-arrow-up mr-1"></i>最突出优势</span>
                <span class="mono-text text-2xl font-bold" style="color:var(--jade)">${best ? (best.adjusted_score || best.score).toFixed(1) : '—'}<span class="text-xs opacity-60 font-normal">/150</span></span>
              </div>
              <p class="text-xs font-semibold serif-text mb-0.5" style="color:var(--ink)">${esc(best ? best.name : '')}</p>
              <p class="text-[10px]" style="color:var(--muted);line-height:1.6">${esc(best ? (best.conclusion || '') : '')}</p>
            </div>
          </div>
          <div class="h-full">
            <div class="p-4 rounded-lg h-full" style="background:rgba(220,38,38,.04);border:1px solid rgba(220,38,38,.1)">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-semibold tracking-wider uppercase" style="color:#dc2626"><i class="fas fa-arrow-down mr-1"></i>最明显短板</span>
                <span class="mono-text text-2xl font-bold" style="color:#dc2626">${worst ? (worst.adjusted_score || worst.score).toFixed(1) : '—'}<span class="text-xs opacity-60 font-normal">/150</span></span>
              </div>
              <p class="text-xs font-semibold serif-text mb-0.5" style="color:var(--ink)">${esc(worst ? worst.name : '')}</p>
              <p class="text-[10px]" style="color:var(--muted);line-height:1.6">${esc(worst ? (worst.conclusion || '') : '')}</p>
            </div>
          </div>
        </div>
        <div style="border-top:1px solid var(--rule);padding-top:0.75rem">
          <details class="text-[11px]" style="color:var(--muted)">
            <summary class="cursor-pointer"><i class="fas fa-info-circle mr-1" style="color:var(--muted)"></i>评级说明</summary>
            <p class="mt-2 leading-relaxed">本评级为LAS通用框架下的相对定位，以叙事性作品为基准原型。非叙事性体裁虽经体裁适配调整权重，仍可能存在结构性偏差。请结合核心维度得分与"体裁适配摘要"及"特殊说明"综合理解。</p>
          </details>
        </div>
      </div>
    </section>`;

  // Core benchmarks
  const benchmarks = r.benchmarks || {};
  const benchKeys = ['A', 'B', 'C', 'D'];
  const benchNames = { A: '语言与形式', B: '叙事与内容', C: '思想与意义', D: '审美与影响' };
  const benchColors = ['#8b0000', '#2d6a4f', '#b8860b', '#1a1a1a'];
  const benchHtml = benchKeys.map((k, i) => {
    const b = benchmarks[k] || {};
    return `<div class="bench-card border rounded-lg overflow-hidden" style="border-color:var(--rule);cursor:pointer;transition:all .25s" onclick="this.classList.toggle('expanded')">
      <div class="flex items-center gap-3 p-3">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow flex-shrink-0" style="background:${benchColors[i]}">${k}</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold serif-text leading-tight truncate">${esc(b.work || '—')}</p>
          <p class="text-[10px]" style="color:var(--muted)">${b.dimension_id||''}.${b.dimension_name||''} · ${b.level||''} · ${benchNames[k]}</p>
        </div>
        ${(b.reason||'').trim() ? '<i class="fas fa-chevron-down text-[10px] bench-chevron flex-shrink-0" style="color:var(--muted);transition:transform .3s"></i>' : ''}
      </div>
      ${(b.reason||'').trim() ? `<div class="bench-reason"><div class="px-3 pb-3 pl-16 text-[11px] leading-relaxed" style="color:var(--muted)"><span class="text-muted/60">选择依据：</span>${esc(b.reason||'')}</div></div>` : ''}
    </div>`;
  }).join('');

  // Deep analysis accordion
  const deepSections = [];
  if (ac.literary_position) deepSections.push(['📖', '文学坐标与谱系定位', ac.literary_position]);
  const profileKey = isOriginal ? (ac.author_profile || '') : (ac.creation_background || '');
  if (profileKey) deepSections.push(['✍️', isOriginal ? '作者创作侧写' : '创作背景分析', profileKey]);
  if (ac.core_contribution) deepSections.push(['💡', '核心贡献与创新分析', ac.core_contribution]);
  if (ac.tension_analysis) deepSections.push(['⚡', '张力、开放性与阐释空间', ac.tension_analysis]);
  if (ac.critical_consensus) deepSections.push(['📜', '批评共识与接受史', ac.critical_consensus]);
  const deepHtml = deepSections.map(([emoji, title, text], idx) =>
    `<div class="glass-card rounded-xl overflow-hidden">
      <button class="accordion-trigger w-full flex items-center justify-between p-4 text-left" onclick="toggleAccordion(${idx})">
        <div class="flex items-center gap-3">
          <span class="text-lg flex-shrink-0">${emoji}</span>
          <span class="font-bold serif text-sm">${title}</span>
        </div>
        <i class="fas fa-chevron-down accordion-icon" style="color:var(--muted);font-size:10px;transition:transform .3s"></i>
      </button>
      <div class="accordion-content">
        <div class="px-4 pb-4 text-sm leading-[2] serif" style="color:var(--muted)">${nl2p(esc(text))}</div>
      </div>
    </div>`
  ).join('');

  // Professional sections
  let editorHtml = '', guideHtml = '', readingHtml = '';
  const es = ac.editor_suggestions;
  if (isOriginal && es && typeof es === 'object') {
    let ehtml = '';
    if (es.genre_principle) ehtml += `<p class="mb-2"><strong class="text-ink/60">体裁适配原则：</strong>${esc(es.genre_principle)}</p>`;
    if (es.core_diagnosis) ehtml += `<p class="mb-2"><strong class="text-ink/60">核心问题诊断：</strong>${esc(es.core_diagnosis)}</p>`;
    if (es.specific_changes) ehtml += `<p class="mb-2"><strong class="text-ink/60">具体修改建议：</strong>${esc(es.specific_changes)}</p>`;
    if (es.improvement_direction) ehtml += `<p class="mb-2"><strong class="text-ink/60">提升方向：</strong>${esc(es.improvement_direction)}</p>`;
    if (es.reference) ehtml += `<p class="mb-2"><strong class="text-ink/60">参考范本：</strong>${esc(es.reference)}</p>`;
    if (ehtml) editorHtml = `
      <div class="glass-card rounded-xl p-5">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-edit text-sm flex-shrink-0" style="color:var(--jade)"></i>
          <h3 class="text-sm font-bold serif">编辑审稿建议</h3>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-jade/8" style="color:var(--jade);font-weight:500">原创模式</span>
        </div>
        <div class="text-sm leading-[2] serif" style="color:var(--muted)">${ehtml}</div>
      </div>`;
  }
  if (isOriginal && ac.creative_guidance) {
    guideHtml = `
      <div class="glass-card rounded-xl p-5">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-lightbulb text-sm flex-shrink-0" style="color:var(--crimson)"></i>
          <h3 class="text-sm font-bold serif">创作导语</h3>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-crimson/8" style="color:var(--crimson);font-weight:500">原创模式</span>
        </div>
        <div class="text-sm leading-[2] serif" style="color:var(--muted)">${nl2p(esc(ac.creative_guidance))}</div>
      </div>`;
  } else if (!isOriginal && ac.creative_inspiration) {
    guideHtml = `
      <div class="glass-card rounded-xl p-5">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-book-reader text-sm flex-shrink-0" style="color:var(--jade)"></i>
          <h3 class="text-sm font-bold serif">创作启示</h3>
        </div>
        <div class="text-sm leading-[2] serif" style="color:var(--muted)">${nl2p(esc(ac.creative_inspiration))}</div>
      </div>`;
  }
  const rs = ac.reading_suggestions || {};
  if (rs.general || rs.research) {
    readingHtml = `
      <div class="glass-card rounded-xl p-5">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-book-reader text-sm flex-shrink-0" style="color:var(--jade)"></i>
          <h3 class="text-sm font-bold serif">阅读与研习建议</h3>
        </div>
        <div class="text-sm leading-[2] serif" style="color:var(--muted)">
          ${rs.general ? `<p><strong style="color:var(--muted)">面向普通读者：</strong>${esc(rs.general)}</p>` : ''}
          ${rs.research ? `<p class="mt-1"><strong style="color:var(--muted)">面向研究者/教学者：</strong>${esc(rs.research)}</p>` : ''}
        </div>
      </div>`;
  }

  // Ancestor dialogue
  const ancestor = ac.ancestor_dialogue || {};
  const ancestorHtml = (data.ancestor_dialogue && ancestor.enabled) ? `
    <section id="ancestor-dialogue" class="py-10 reveal">
      <hr class="rule-strong mb-6">
      <div class="flex items-center gap-3 mb-5">
        <h2 class="text-2xl font-bold serif">延伸批评 · 先贤灵境</h2>
        <span class="text-[10px] px-2 py-0.5 rounded" style="background:rgba(139,0,0,.06);color:var(--crimson);font-weight:500">高级模块</span>
      </div>
      ${ancestor.participants && ancestor.participants.length ? `
      <div class="glass-card rounded-xl p-5 mb-4">
        <h3 class="text-sm font-bold serif-text mb-3 flex items-center">
          <i class="fas fa-users mr-2" style="color:var(--gold)"></i>与会先贤
        </h3>
        <div class="flex flex-wrap gap-3">
          ${ancestor.participants.map(p => `
            <span class="rounded-full px-3 py-1 text-xs" style="background:rgba(184,134,11,.08);color:#8b6914">
              ${esc(p.name)}（《${esc(debracket(p.work || ''))}》）
            </span>
          `).join('')}
        </div>
      </div>` : ''}
      ${ancestor.dialogue ? `
      <div class="glass-card rounded-xl p-5">
        <div class="text-sm leading-relaxed space-y-4 serif" style="color:var(--muted)">
          ${nl2p(esc(ancestor.dialogue))}
        </div>
      </div>` : ''}
    </section>` : '';

  // Conclusion
  const conclusionHtml = ac.conclusion ? `
      <div class="text-base leading-[2] space-y-4 text-justify serif" style="color:var(--muted)">
        ${nl2p(esc(ac.conclusion))}
      </div>` : '';

  // Appendix
  const app = ac.appendix || {};
  const appItems = [
    ['文脉拾遗', 'fa-scroll', app.context, 'var(--crimson)'],
    ['风物志', 'fa-mountain', app.customs, 'var(--jade)'],
    ['字里行间', 'fa-pen-fancy', app.between_lines, 'var(--gold)'],
    ['余音', 'fa-music', app.echoes, 'var(--gold)'],
    ['联结', 'fa-link', app.connections, 'var(--jade)'],
  ];
  let appHtml = appItems.filter(([, , t]) => t).map(([title, icon, text, color]) =>
    `<div class="glass-card rounded-xl p-5">
      <h3 class="text-sm font-bold serif-text mb-3 flex items-center"><i class="fas ${icon} mr-2" style="color:${color}"></i>${title}</h3>
      <p class="text-sm leading-relaxed" style="color:var(--muted)">${esc(text)}</p>
    </div>`
  ).join('');
  const extReadings = app.extended_reading || [];
  if (extReadings.length) {
    appHtml += `
      <div class="glass-card rounded-xl p-5">
        <h3 class="text-sm font-bold serif-text mb-3 flex items-center"><i class="fas fa-book mr-2" style="color:var(--purple)"></i>延伸阅读</h3>
        <div class="space-y-2">${extReadings.map(b =>
          `<div class="flex items-start gap-2 text-sm" style="color:var(--muted)">
            <span style="color:var(--purple);margin-top:2px"><i class="fas fa-book"></i></span>
            <div><span class="font-semibold" style="color:var(--ink)">《${esc(debracket(b.title||''))}》</span> ${esc(b.author||'')}。${esc(b.reason||'')}</div>
          </div>`
        ).join('')}</div>
      </div>`;
  }

  // Verification data (original only)
  const defects = ds.defects || [];
  const defectsHtml = defects.length ? defects.map(d =>
    `<div class="glass-card rounded-lg p-3 text-sm" style="background:var(--card-tint-error);border:1px solid rgba(220,38,38,.1)">
      <p class="font-semibold text-xs mb-1" style="color:var(--semantic-error)">${esc(d.type || '')}</p>
      <p class="text-xs leading-relaxed" style="color:var(--muted)">${esc(d.detail || '')}</p>
      ${Array.isArray(d.bound_dimensions) && d.bound_dimensions.length ? `<p class="text-[10px] mt-1" style="color:var(--muted)">绑定维度：${d.bound_dimensions.join(', ')}</p>` : ''}
    </div>`
  ).join('') : '';
const extremeText = ds.triggered ? '已触发' : '无';
  const extremeDetail = ds.triggered ? `（${esc(ds.trigger_type || '')}）` : '（未触发任何极端情况，继续详细评分流程）';
  const hasAdjustments = dimData.some(d => d.adjusted);
  const adjItemsHtml = hasAdjustments
    ? dimData.filter(d => d.adjusted).map((d, idx) =>
      `<div class="glass-card rounded-xl overflow-hidden">
        <button class="w-full flex items-center justify-between p-3 text-left" onclick="toggleAdjustment(${idx})">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm">${esc(d.name)}</span>
            <span class="adjustment-badge">${d.originalScore} → ${d.score}</span>
          </div>
          <i class="fas fa-chevron-down accordion-icon text-xs" style="color:var(--muted);transition:transform .3s"></i>
        </button>
        <div class="accordion-content">
          <div class="px-4 pb-4 text-sm space-y-1.5" style="color:var(--muted)">
            <p><strong style="color:var(--ink)">原始分数：</strong>${d.originalScore} → <strong style="color:var(--crimson)">${d.score}</strong></p>
            ${d.gapLevel ? `<p><strong style="color:var(--ink)">差距等级：</strong>${esc(d.gapLevel)}</p>` : ''}
            ${d.benchmarkPerf ? `<p><strong style="color:var(--ink)">基准表现：</strong>${esc(d.benchmarkPerf)}</p>` : ''}
            ${d.evidence ? `<p><strong style="color:var(--ink)">证据引用：</strong>${esc(d.evidence)}</p>` : ''}
            ${d.compare ? `<p><strong style="color:var(--ink)">结论：</strong>${esc(d.compare)}</p>` : ''}
          </div>
        </div>
      </div>`
    ).join('')
    : '<div class="text-sm" style="color:var(--muted)">无调整记录</div>';

  // Lower bounds reference (original only)
  const lbs = r.lower_bounds || {};
  const lowerBoundsHtml = (lbs.A || lbs.B || lbs.C || lbs.D) ? `<p class="text-[11px] mt-3" style="color:var(--muted)"><span class="text-muted/60">下限参照：</span>A层《${esc(debracket(lbs.A||''))}》 · B层《${esc(debracket(lbs.B||''))}》 · C层《${esc(debracket(lbs.C||''))}》 · D层《${esc(debracket(lbs.D||''))}》</p>` : '';

  // Penalty calculation display (original only)
  const kVal = s.core_penalty_k !== undefined ? s.core_penalty_k : 1;
  const mfVal = s.mediocrity_mf !== undefined ? s.mediocrity_mf : 1;
  const pwsVal = s.pws !== undefined ? s.pws : (s.wcs || 0);
  const kTriggered = kVal < 0.999;
  const mfTriggered = mfVal < 0.999;
  const penaltyImpact = kTriggered || mfTriggered ? Math.round((pwsVal - (s.wcs || 0)) * 10) / 10 : 0;
  const penaltyHtml = isOriginal ? `
    <h3 class="text-base font-bold serif mb-3 flex items-center"><i class="fas fa-calculator mr-2" style="color:var(--muted);font-size:14px"></i>三、惩罚系数计算</h3>
    <div class="glass-card rounded-xl overflow-hidden mb-4">
      <button class="w-full flex items-center justify-between p-3 text-left" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.accordion-icon').classList.toggle('open')">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-sm">WCS = PWS${kTriggered ? ' × k' : ''}${mfTriggered ? ' × mf' : ''}</span>
          <span class="text-xs" style="color:var(--muted)">${pwsVal.toFixed(1)}${kTriggered ? ' × ' + kVal.toFixed(4) : ''}${mfTriggered ? ' × ' + mfVal.toFixed(4) : ''} = ${(s.wcs || 0).toFixed(1)}</span>
          ${penaltyImpact > 0 ? `<span class="adjustment-badge">-${penaltyImpact.toFixed(1)}</span>` : ''}
        </div>
        <i class="fas fa-chevron-down accordion-icon text-xs" style="color:var(--muted);transition:transform .3s"></i>
      </button>
      <div class="accordion-content">
        <div class="px-4 pb-4 text-sm space-y-3" style="color:var(--muted)">
          <div class="flex items-start gap-3">
            <span class="text-xs font-semibold mono" style="min-width:48px;color:var(--ink)">PWS</span>
            <span>加权综合分 = ${pwsVal.toFixed(1)}（16维分数 × 策略权重求和）</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-xs font-semibold mono" style="min-width:48px;color:${kTriggered ? 'var(--crimson)' : 'var(--muted)'}">k = ${kVal.toFixed(4)}</span>
            <span>${kTriggered
              ? `核心维度偏科惩罚已触发。核心四维（1/5/9/13）与非核心维度之间存在显著差距，WCS 相应下调。该惩罚体现了公理E（均衡性暴政抵抗）：偏科比平庸更接近文学本质，但核心维度的薄弱仍需如实反映。`
              : '核心维度偏科惩罚未触发（核心与非核心差距不显著，或体裁在偏科豁免列表中）。'}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-xs font-semibold mono" style="min-width:48px;color:${mfTriggered ? 'var(--crimson)' : 'var(--muted)'}">mf = ${mfVal.toFixed(4)}</span>
            <span>${mfTriggered
              ? `整体平庸惩罚已触发。前14维分数集中在狭窄区间且均值偏低，呈现"全面平庸"特征——没有突出亮点，也没有明显短板。该惩罚体现了公理D（拉开差距是职责）：有个性的偏科优于无个性的均衡。`
              : '整体平庸惩罚未触发（前14维均分正常或分数分布有足够区分度）。'}</span>
          </div>
          <div class="flex items-start gap-3 pt-2" style="border-top:1px solid var(--rule)">
            <span class="text-xs font-bold mono" style="min-width:48px;color:var(--ink)">WCS</span>
            <span class="font-semibold" style="color:var(--ink)">最终综合分 = ${(s.wcs || 0).toFixed(1)} / 150（${esc(s.tier || '')}）</span>
          </div>
        </div>
      </div>
    </div>` : '';

  // Literary fortune
  const div = ac.divination || {};

  // Token usage — show actual totals from API, not estimated
  const t = data.tokens || {};
  const tokenStr = (() => {
    if (!t.total) return '';
    const k = (v) => v >= 1000 ? (v / 1000).toFixed(1) + 'K' : String(v);
    var parts = [];
    if (t.prompt) parts.push('输入 ' + k(t.prompt));
    if (t.completion) parts.push('输出 ' + k(t.completion));
    parts.push('合计 ' + k(t.total));
    return '消耗 ' + parts.join(' · ') + ' tokens';
  })();


  // Scoring Audit Log
  const sa = r.scoring_audit || {};
  let auditHtml = '';
  const sv = sa.strategy_verification || {};
  const svBestLayer = {A:'语言与形式',B:'叙事与内容',C:'思想与意义',D:'审美与影响'}[sv.best_layer] || '';
  if (sv.predicted !== undefined) {
    const matched = sv.predicted === sv.verified_strategy;
    auditHtml += `<div class="audit-item"><div class="audit-row"><span class="audit-label">策略校验</span><span class="audit-value">预判策略 ${sv.predicted || '?'} → 校验确认策略 ${sv.verified_strategy || '?'}</span><span class="audit-tag ${matched ? '' : 'updated'}">${matched ? '一致' : '已更新'}</span></div>${sv.best_layer ? `<p class="audit-sub">四层均分：A ${(sv.layer_avgs||{}).A||'?'} / B ${(sv.layer_avgs||{}).B||'?'} / C ${(sv.layer_avgs||{}).C||'?'} / D ${(sv.layer_avgs||{}).D||'?'} · 最优层：${svBestLayer}${sv.weight_updated === true ? ' · 权重已更新' : ''}</p>` : ''}</div>`;
  }
  // Defect exemption details
  const defExemptions = sa.defect_exemptions;
  if (defExemptions && defExemptions.length) {
    auditHtml += '<div class="audit-item"><div class="audit-row"><span class="audit-label">正缺陷豁免</span><span class="audit-value">' + defExemptions.length + ' 项</span><span class="audit-tag updated">已应用</span></div>';
    defExemptions.forEach(function(ex, i) {
      var tfj = ex.three_factor_judgment || {};
      auditHtml += '<div class="audit-sub audit-sub--exemption">'
        + '<span style="color:var(--ink);font-weight:500">豁免 ' + (i+1) + '：</span>'
        + '维度 ' + esc(ex.exempted_dimension_name || ex.exempted_dimension_id || '?')
        + '（' + (ex.original_score != null ? ex.original_score.toFixed(1) : '?') + '分）'
        + ' → 传世级维度 ' + esc(ex.linked_to_master_dimension_name || ex.linked_to_master_dimension_id || '?')
        + '（' + (ex.master_score != null ? ex.master_score.toFixed(1) : '?') + '分）';
      if (tfj.causal_necessity) {
        auditHtml += '<p class="text-xs" style="color:var(--muted);margin-top:4px">'
          + '<span style="color:var(--ink)">因果必然性：</span>' + esc(tfj.causal_necessity) + '</p>';
      }
      if (tfj.unavoidability) {
        auditHtml += '<p class="text-xs" style="color:var(--muted);margin-top:2px">'
          + '<span style="color:var(--ink)">不可规避性：</span>' + esc(tfj.unavoidability) + '</p>';
      }
      if (tfj.internal_consistency) {
        auditHtml += '<p class="text-xs" style="color:var(--muted);margin-top:2px">'
          + '<span style="color:var(--ink)">内在一贯性：</span>' + esc(tfj.internal_consistency) + '</p>';
      }
      auditHtml += '</div>';
    });
    auditHtml += '</div>';
  }

  const auditSectionHtml = auditHtml ? `<section id="auditLog" class="py-10 reveal"><hr class="rule-strong mb-6"><h2 class="text-2xl font-bold serif mb-5">评分决策日志</h2><div class="glass-card rounded-xl p-5 space-y-3">${auditHtml}</div></section>` : '';

  const sections = {
    WORK_TITLE: esc(data.title),
    WORK_AUTHOR: esc(data.author || ''),
    WORK_TAGS: tags,
    LAS_ID: (data.report_number ? 'LAS-' + (data.report_prefix ? data.report_prefix + '-' : '') + String(data.report_number).padStart(6, '0') : 'LAS-'+now.getFullYear()+('0'+(now.getMonth()+1)).slice(-2)+('0'+now.getDate()).slice(-2)+'-'+String(id||'').slice(0,3)),
    WORK_TYPE: esc(meta.genre || ''),
    WCS_SCORE: (s.wcs || 0).toFixed(2),
    WORK_LEVEL: esc(s.tier || ''),
    WORK_PERCENTILE: percentile,
    WORK_TITLE_HONOR: esc(ac.nickname || ''),
    WORK_SHARP_COMMENT: esc(ac.one_liner || ''),
    WORK_OVERVIEW: nl2p(esc(ac.overview || '')),
    GOLDEN_QUOTE: esc(ac.golden_quote || ''),
    LITERARY_ECHO: esc(ac.literary_echo || ''),
    LITERARY_ECHO_SOURCE: esc(ac.literary_echo_source || ''),
    LAYER1_PERCENT: layerPct(layerAvgs.A),
    LAYER1_AVG: layerAvgs.A.toFixed(2),
    LAYER2_PERCENT: layerPct(layerAvgs.B),
    LAYER2_AVG: layerAvgs.B.toFixed(2),
    LAYER3_PERCENT: layerPct(layerAvgs.C),
    LAYER3_AVG: layerAvgs.C.toFixed(2),
    LAYER4_PERCENT: layerPct(layerAvgs.D),
    LAYER4_AVG: layerAvgs.D.toFixed(2),
    DIM_DATA_JSON: JSON.stringify(dimData).replace(/<\//g, '<\\/'),
    ASSESSMENT_SUMMARY: assessmentHtml,
    CORE_BENCHMARKS: benchHtml,
    DEEP_ANALYSIS_SECTIONS: deepHtml,
    CONCLUSION_CONTENT: conclusionHtml,
    APPENDIX_SECTIONS: appHtml || '',
    EDITOR_REVIEW_SECTION: editorHtml,
    CREATION_GUIDE_SECTION: guideHtml,
    READING_RECOMMENDATIONS: readingHtml,
    PROFESSIONAL_SECTIONS: editorHtml + guideHtml + readingHtml,
    ANCESTOR_DIALOGUE_SECTION: ancestorHtml,
    AUDIT_SECTION: auditSectionHtml,
    EXTREME_CHECK_RESULT: extremeText,
    EXTREME_CHECK_DETAIL: extremeDetail,
    DEFECT_DETAILS: defectsHtml,
    ADJUSTMENT_TRIGGER: hasAdjustments ? '高分段维度触发原创审慎校验下调' : '无需调整',
    ADJUSTMENT_ITEMS: adjItemsHtml,
    PENALTY_CALCULATION: penaltyHtml,
    LOWER_BOUNDS_REF: lowerBoundsHtml,
    FORTUNE_LEVEL: esc(div.grade || ''),
    FORTUNE_KEYWORD: esc(div.word || ''),
    FORTUNE_TEXT: esc(div.poem || ''),
    FORTUNE_SOURCE: esc(div.source || ''),
    CURRENT_DATE: dateStr,
    TOKEN_USAGE: tokenStr,
  };

  return { sections, dimData, layerAvgs, wcs: s.wcs, tier: s.tier };
}
