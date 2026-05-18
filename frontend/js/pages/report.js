App.register('/report', async () => {
  const id = App.state.params.id;
  if (!id) { App.navigate('#/'); return; }
  const root = document.getElementById('spaApp');

  const showLoading = (msg) => {
    root.innerHTML = `<main class="max-w-3xl mx-auto px-6" style="padding-top:80px"><section class="pt-12 text-center fade-up d1">
      <div class="spinner mx-auto mb-4"></div>
      <p class="text-sm text-muted">${msg}</p>
    </section></main>`;
  };

  const showError = (title, detail, rawPreview, extra) => {
    root.innerHTML = `<main class="max-w-3xl mx-auto px-6" style="padding-top:80px;padding-bottom:80px">
      <section class="text-center fade-up d1">
        <p class="mono text-xs text-muted tracking-[4px] mb-2 uppercase">Report Error</p>
        <h1 class="serif text-2xl font-bold mb-3" style="color:var(--crimson)">${esc(title)}</h1>
        ${detail ? `<p class="text-sm text-muted mb-4">${esc(detail)}</p>` : ''}
        ${rawPreview ? '<div class="card" style="max-width:600px;margin:0 auto;text-align:left"><p class="text-xs text-muted">LLM 原始输出片段:</p><pre class="text-xs text-muted mt-2" style="white-space:pre-wrap;word-break:break-all;max-height:200px;overflow:auto">' + esc(rawPreview) + '</pre></div>' : ''}
        ${extra || ''}
        <a href="/app" class="btn mt-6" style="display:inline-block">返回首页</a>
      </section>
    </main>`;
  };

  showLoading('正在加载报告...');

  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const data = await API.getReport(id);
      const r = data.report;

      if (r && r.ok) {
        await renderFromTemplate(data, r);
        return;
      }
      if (r && !r.ok) {
        const errMsg = r.error || '未知错误';
        const rawPreview = r.raw_preview || r.raw || '';
        showError('报告生成失败', '状态: ' + (data.status || '?') + ' — ' + errMsg, rawPreview,
          '<p class="text-xs text-muted mt-6">analysis_id: ' + esc(data.analysis_id || '?') + '</p>');
        return;
      }
    } catch (err) {
      // Report not ready yet — silently retry
    }

    const wait = Math.min(2000 + attempt * 500, 8000);
    await new Promise(r => setTimeout(r, wait));
  }

  showError('报告加载超时', '分析可能仍在后台运行，请稍后刷新页面重试。');
});

async function renderFromTemplate(data, r) {
  const mode = data.mode || 'original';
  const isOriginal = mode === 'original';
  const tplUrl = isOriginal ? '/templates/original.html' : '/templates/classic.html';
  const res = await fetch(tplUrl);
  let tpl = await res.text();

  const s = r.scoring || {};
  const ac = r.analysis_content || {};
  const dmap = r.dimensions || {};
  const dims = Object.values(dmap);
  const meta = r.metadata || {};
  const ds = r.defect_scan || {};

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
  const percentile = Math.min(Math.round((s.wcs || 0) / 150 * 100), 99);

  const tags = (ac.tags || []).map(t =>
    `<span class="tag" style="background:rgba(139,0,0,.06);border:1px solid rgba(139,0,0,.1);color:var(--crimson)">${esc(t)}</span>`
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

  // Assessment Summary: best/worst dimension
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
    return `<div class="flex items-center gap-3 p-3 rounded-lg hover:bg-crimson/5 transition cursor-default border" style="border-color:var(--rule)">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow flex-shrink-0" style="background:${benchColors[i]}">${k}</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold serif-text leading-tight truncate">${esc(b.work || '—')}</p>
        <p class="text-[10px]" style="color:var(--muted)">${b.dimension_id||''}.${b.dimension_name||''} · ${b.level||''} · ${benchNames[k]}</p>
      </div>
    </div>`;
  }).join('');
  const benchSectionHtml = benchHtml;

  // Deep analysis accordion
  const deepSections = [];
  if (ac.literary_position) deepSections.push(['📖', '文学坐标与谱系定位', ac.literary_position]);
  if (ac.tension_analysis) deepSections.push(['⚡', '张力、开放性与阐释空间', ac.tension_analysis]);
  if (ac.critical_consensus) deepSections.push(['📜', '批评共识与接受史', ac.critical_consensus]);
  const profileKey = isOriginal ? (ac.author_profile || '') : (ac.creation_background || '');
  if (profileKey) deepSections.push(['✍️', isOriginal ? '作者创作侧写' : '创作背景', profileKey]);
  if (ac.core_contribution) deepSections.push(['💡', '核心贡献', ac.core_contribution]);
  const deepHtml = deepSections.map(([emoji, title, text], idx) =>
    `<div class="glass-card rounded-xl overflow-hidden">
      <button class="accordion-trigger w-full flex items-center justify-between p-4 text-left" onclick="toggleAccordion(${idx})">
        <div class="flex items-center gap-3"><span class="text-base">${emoji}</span><span class="font-semibold serif-text text-sm">${title}</span></div>
        <i class="fas fa-chevron-down accordion-icon" style="color:var(--muted);font-size:10px;transition:transform .3s"></i>
      </button>
      <div class="accordion-content">
        <div class="px-4 pb-4 text-sm leading-relaxed" style="color:var(--muted)">${nl2p(esc(text))}</div>
      </div>
    </div>`
  ).join('');
  const deepSectionHtml = deepHtml;

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
      <div class="glass-card rounded-xl p-5 border-l-4" style="border-color:var(--jade)">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-edit" style="color:var(--jade);font-size:14px"></i>
          <h3 class="text-sm font-bold serif-text">编辑审稿建议</h3>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-jade/8" style="color:var(--jade);font-weight:500">原创模式</span>
        </div>
        <div class="text-sm leading-relaxed" style="color:var(--muted)">${ehtml}</div>
      </div>`;
  }
  if (isOriginal && ac.creative_guidance) {
    guideHtml = `
      <div class="glass-card rounded-xl p-5 border-l-4" style="border-color:var(--crimson)">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-lightbulb" style="color:var(--crimson);font-size:14px"></i>
          <h3 class="text-sm font-bold serif-text">创作导语</h3>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-crimson/8" style="color:var(--crimson);font-weight:500">原创模式</span>
        </div>
        <div class="text-sm leading-relaxed" style="color:var(--muted)">${nl2p(esc(ac.creative_guidance))}</div>
      </div>`;
  } else if (!isOriginal && ac.creative_inspiration) {
    guideHtml = `
      <div class="glass-card rounded-xl p-5 border-l-4" style="border-color:var(--jade)">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-book-reader" style="color:var(--jade);font-size:14px"></i>
          <h3 class="text-sm font-bold serif-text">创作启示</h3>
        </div>
        <div class="text-sm leading-relaxed" style="color:var(--muted)">${nl2p(esc(ac.creative_inspiration))}</div>
      </div>`;
  }
  const rs = ac.reading_suggestions || {};
  if (rs.general || rs.research) {
    readingHtml = `
      <div class="glass-card rounded-xl p-5 border-l-4" style="border-color:var(--jade)">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-book-reader" style="color:var(--jade);font-size:14px"></i>
          <h3 class="text-sm font-bold serif-text">阅读与研习建议</h3>
        </div>
        <div class="text-sm leading-relaxed" style="color:var(--muted)">
          ${rs.general ? `<p><strong style="color:var(--muted)">面向普通读者：</strong>${esc(rs.general)}</p>` : ''}
          ${rs.research ? `<p class="mt-1"><strong style="color:var(--muted)">面向研究者/教学者：</strong>${esc(rs.research)}</p>` : ''}
        </div>
      </div>`;
  }

  // Ancestor dialogue (conditional)
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
              ${esc(p.name)}（《${esc(p.work || '')}》）
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
    ['余音', 'fa-music', app.echoes, '#d97706'],
    ['联结', 'fa-link', app.connections, '#3b82f6'],
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
        <h3 class="text-sm font-bold serif-text mb-3 flex items-center"><i class="fas fa-book mr-2" style="color:#8b5cf6"></i>延伸阅读</h3>
        <div class="space-y-2">${extReadings.map(b =>
          `<div class="flex items-start gap-2 text-sm" style="color:var(--muted)">
            <span style="color:#8b5cf6;margin-top:2px"><i class="fas fa-book"></i></span>
            <div><span class="font-semibold" style="color:var(--ink)">《${esc(b.title||'')}》</span> ${esc(b.author||'')}。${esc(b.reason||'')}</div>
          </div>`
        ).join('')}</div>
      </div>`;
  }
  const appSectionHtml = appHtml || '';

  // Verification section (original only)
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
  const verifyHtml = isOriginal ? `
    <section id="verification" class="py-10 reveal">
      <hr class="rule-strong mb-6">
      <div class="flex items-center gap-3 mb-5">
        <h2 class="text-2xl font-bold serif">审慎校验记录</h2>
        <span class="text-[10px] px-2 py-0.5 rounded" style="background:rgba(184,134,11,.06);color:#8b6914;font-weight:500">原创模式特有</span>
      </div>
      <div class="mb-5">
        <h3 class="text-base font-bold serif mb-3 flex items-center"><i class="fas fa-shield-alt mr-2" style="color:var(--jade);font-size:14px"></i>一、极端情况筛查</h3>
        <div class="flex items-center gap-3 p-3 rounded" style="background:rgba(45,106,79,.04);border:1px solid rgba(45,106,79,.1)">
          <i class="fas fa-check-circle" style="color:var(--jade)"></i>
          <span class="text-sm" style="color:var(--muted)">筛查结果：<strong style="color:var(--jade)">${extremeText}</strong>${extremeDetail}</span>
        </div>
      </div>
      <div>
        <h3 class="text-base font-bold serif mb-3 flex items-center"><i class="fas fa-balance-scale mr-2" style="color:var(--gold);font-size:14px"></i>二、维度分数审慎下调</h3>
        <div class="p-3 mb-4 rounded" style="background:rgba(180,120,30,.04);border:1px solid rgba(180,120,30,.1)">
          <div class="flex items-start gap-2">
            <i class="fas fa-exclamation-triangle mt-0.5" style="color:var(--gold);font-size:13px"></i>
            <div class="text-xs" style="color:var(--muted)">
              <p class="font-semibold mb-0.5" style="color:#8b6914">下调触发条件</p>
              <p>${hasAdjustments ? '高分段维度触发原创审慎校验下调' : '无需调整'}</p>
            </div>
          </div>
        </div>
        <div class="space-y-2">${adjItemsHtml}</div>
      </div>
    </section>` : '';

  // Penalty calculation display (original mode only)
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

  // Do placeholder replacements
  tpl = tpl
    .replace(/\{\{WORK_TITLE\}\}/g, esc(data.title))
    .replace(/\{\{WORK_AUTHOR\}\}/g, esc(data.author || ''))
    .replace(/\{\{WORK_TAGS\}\}/g, tags)
    .replace(/\{\{LAS_ID\}\}/g, esc(ac.report_id || 'LAS-'+now.getFullYear()+('0'+(now.getMonth()+1)).slice(-2)+('0'+now.getDate()).slice(-2)+'-'+id.slice(0,3)))
    .replace(/\{\{WORK_TYPE\}\}/g, esc(meta.genre || ''))
    .replace(/\{\{WCS_SCORE\}\}/g, (s.wcs || 0).toFixed(2))
    .replace(/\{\{WORK_LEVEL\}\}/g, esc(s.tier || ''))
    .replace(/\{\{WORK_PERCENTILE\}\}/g, percentile)
    .replace(/\{\{WORK_TITLE_HONOR\}\}/g, esc(ac.nickname || ''))
    .replace(/\{\{WORK_SHARP_COMMENT\}\}/g, esc(ac.one_liner || ''))
    .replace(/\{\{WORK_OVERVIEW\}\}/g, nl2p(esc(ac.overview || '')))
    .replace(/\{\{GOLDEN_QUOTE\}\}/g, esc(ac.golden_quote || ''))
    .replace(/\{\{LITERARY_ECHO\}\}/g, esc(ac.literary_echo || ''))
    .replace(/\{\{LITERARY_ECHO_SOURCE\}\}/g, esc(ac.literary_echo_source || ''))
    .replace(/\{\{LAYER1_PERCENT\}\}/g, layerPct(layerAvgs.A))
    .replace(/\{\{LAYER1_AVG\}\}/g, layerAvgs.A.toFixed(2))
    .replace(/\{\{LAYER2_PERCENT\}\}/g, layerPct(layerAvgs.B))
    .replace(/\{\{LAYER2_AVG\}\}/g, layerAvgs.B.toFixed(2))
    .replace(/\{\{LAYER3_PERCENT\}\}/g, layerPct(layerAvgs.C))
    .replace(/\{\{LAYER3_AVG\}\}/g, layerAvgs.C.toFixed(2))
    .replace(/\{\{LAYER4_PERCENT\}\}/g, layerPct(layerAvgs.D))
    .replace(/\{\{LAYER4_AVG\}\}/g, layerAvgs.D.toFixed(2))
    .replace(/\{\{DIM_DATA_JSON\}\}/g, JSON.stringify(dimData).replace(/<\//g, '<\\/'))
    .replace(/\{\{ASSESSMENT_SUMMARY\}\}/g, assessmentHtml)
    .replace(/\{\{CORE_BENCHMARKS\}\}/g, benchSectionHtml)
    .replace(/\{\{DEEP_ANALYSIS_SECTIONS\}\}/g, deepSectionHtml)
    .replace(/\{\{CONCLUSION_CONTENT\}\}/g, conclusionHtml)
    .replace(/\{\{APPENDIX_SECTIONS\}\}/g, appSectionHtml)
    .replace(/\{\{EDITOR_REVIEW_SECTION\}\}/g, editorHtml)
    .replace(/\{\{CREATION_GUIDE_SECTION\}\}/g, guideHtml)
    .replace(/\{\{READING_RECOMMENDATIONS\}\}/g, readingHtml)
    .replace(/\{\{PROFESSIONAL_SECTIONS\}\}/g, editorHtml + guideHtml + readingHtml)
    .replace(/\{\{ANCESTOR_DIALOGUE_SECTION\}\}/g, ancestorHtml)
    .replace(/\{\{EXTREME_CHECK_RESULT\}\}/g, extremeText)
    .replace(/\{\{EXTREME_CHECK_DETAIL\}\}/g, extremeDetail)
    .replace(/\{\{ADJUSTMENT_TRIGGER\}\}/g, hasAdjustments ? '高分段维度触发原创审慎校验下调' : '无需调整')
    .replace(/\{\{ADJUSTMENT_ITEMS\}\}/g, adjItemsHtml)
    .replace(/\{\{PENALTY_CALCULATION\}\}/g, penaltyHtml)
    .replace(/\{\{FORTUNE_LEVEL\}\}/g, esc(div.grade || ''))
    .replace(/\{\{FORTUNE_KEYWORD\}\}/g, esc(div.word || ''))
    .replace(/\{\{FORTUNE_TEXT\}\}/g, esc(div.poem || ''))
    .replace(/\{\{FORTUNE_SOURCE\}\}/g, esc(div.source || ''))
    .replace(/\{\{CURRENT_DATE\}\}/g, dateStr)
    .replace(/\{\{TOKEN_USAGE\}\}/g, (() => {
      const t = data.tokens || {};
      if (!t.total) return '';
      const k = (v) => v >= 1000 ? (v / 1000).toFixed(1) + 'K' : String(v);
      return '消耗 ' + k(t.total) + ' tokens（提示 ' + k(t.prompt) + ' + 生成 ' + k(t.completion) + '）';
    })());

  // Insert into DOM
  const root = document.getElementById('spaApp');
  root.innerHTML = tpl;

  // Debug: capture script errors without breaking scope
  const scriptErrors = [];
  const prevOnError = window.onerror;
  window.onerror = function(msg, src, line, col, err) {
    scriptErrors.push((msg || '').toString().substring(0, 100));
    if (prevOnError) prevOnError.apply(this, arguments);
    return false;
  };

  // Re-execute inline scripts — each wrapped in a block scope so
  // const/let don't collide if renderFromTemplate is called again.
  root.querySelectorAll('script:not([src])').forEach(oldScript => {
    const newScript = document.createElement('script');
    newScript.textContent = '{\n' + oldScript.textContent + '\n}';
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });

  // Restore and show debug if data looks wrong
  window.onerror = prevOnError;
  if (dimData.length === 0 || scriptErrors.length > 0) {
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#1a1a1a;color:#e0e0e0;padding:12px 20px;font-size:11px;font-family:monospace;z-index:9999;max-height:160px;overflow:auto;border-top:2px solid var(--crimson)';
    debugDiv.innerHTML = '<strong style="color:var(--crimson)">[LAS DEBUG]</strong> ' +
      'dimData: ' + dimData.length + ' items | ' +
      'layerAvgs: ' + JSON.stringify(s.layer_avgs || {}) + ' | ' +
      'wcs: ' + (s.wcs || '?') + ' | ' +
      'tier: ' + (s.tier || '?') + ' | ' +
      (scriptErrors.length ? '<br>Script errors: ' + scriptErrors.join('; ') : '<br>No script errors detected') +
      '<br><span style="color:#888">If this bar is visible, something is wrong — dimData should have 16 items.</span>';
    root.appendChild(debugDiv);
  }
}

function esc(s) {
  if (s === null || s === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(s);
  return div.innerHTML;
}

function nl2p(text) {
  if (!text) return '';
  return text.split('\n').filter(l => l.trim()).map(l => `<p class="mb-2 last:mb-0">${l}</p>`).join('');
}
