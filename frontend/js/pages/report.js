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

  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
    try {
      const data = await API.getReport(id);
      const r = data.report;

      if (r && r.ok) {
        await renderFromTemplate(data, r, id);
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
      console.log('[LAS] 报告加载 ' + (attempt + 1) + '/8: ' + (err.message || err));
    }
  }

  showError('报告加载失败', '分析可能尚未完成，请稍后刷新页面重试。',
    null,
    '<a href="javascript:location.reload()" class="btn mt-4" style="display:inline-block">重新加载</a>');
});

// ── Report rendering pipeline ──

async function renderFromTemplate(data, r, id) {
  const mode = data.mode || 'original';
  const isOriginal = mode === 'original';
  const tplUrl = isOriginal ? '/templates/original.html' : '/templates/classic.html';
  let res; try { res = await fetch(tplUrl); } catch (e) { console.error('[LAS] 模板加载失败:', e); return; }
  if (!res.ok) { console.error('[LAS] 模板HTTP错误:', res.status); return; }
  let tpl = await res.text();

  const { sections, dimData, layerAvgs, wcs, tier } = buildReportSections(data, r, id);
  tpl = applyTemplate(tpl, sections);

  window.__LAS_REPORT_MODE = mode;

  const root = document.getElementById('spaApp');
  root.innerHTML = tpl;

  // Export toolbar (screenshot / PDF / Word)
  const exportHTML = `
    <div class="export-bar" id="exportBar">
      <button class="export-btn" id="ssBtn" title="保存截图"><i class="fas fa-camera"></i></button>
      <div class="ss-menu" id="ssMenu">
        <button class="ss-opt" data-scope="hero">仅首页</button>
        <button class="ss-opt" data-scope="full">全部报告</button>
      </div>
      <button class="export-btn" id="pdfBtn" title="导出 PDF"><i class="fas fa-file-pdf"></i></button>
      <button class="export-btn" id="wordBtn" title="导出 Word (.docx)"><i class="fas fa-file-word"></i></button>
    </div>`;
  root.insertAdjacentHTML('beforeend', exportHTML);

  // Screenshot — expand collapsibles, capture, restore
  document.getElementById('ssBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('ssMenu').classList.toggle('open');
  });
  document.querySelectorAll('.ss-opt').forEach(btn => {
    btn.addEventListener('click', async function (e) {
      e.stopPropagation();
      document.getElementById('ssMenu').classList.remove('open');
      const scope = this.dataset.scope;
      const btnEl = document.getElementById('ssBtn');
      btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      // Activate all .reveal elements (IntersectionObserver may not have fired for off-screen sections)
      const revealEls = document.querySelectorAll('.reveal');
      const savedReveal = [];
      revealEls.forEach(el => { savedReveal.push(el.classList.contains('visible')); el.classList.add('visible'); el.style.opacity = '1'; el.style.transform = 'none'; });

      // Expand all accordions/expand-rows before capture
      const accordions = document.querySelectorAll('.accordion-content');
      const expandRows = document.querySelectorAll('.expand-row');
      const accordionIcons = document.querySelectorAll('.accordion-icon');
      const savedAcc = [], savedEx = [], savedIcons = [];
      accordions.forEach(el => { savedAcc.push(el.classList.contains('open')); el.classList.add('open'); el.style.maxHeight = 'none'; el.style.overflow = 'visible'; });
      expandRows.forEach(el => { savedEx.push(el.classList.contains('open')); el.classList.add('open'); el.style.maxHeight = 'none'; el.style.overflow = 'visible'; });
      accordionIcons.forEach(el => { savedIcons.push(el.classList.contains('open')); el.classList.add('open'); });

      try {
        const main = document.querySelector('#spaApp main');
        const target = scope === 'hero' ? (document.getElementById('hero') || (main && main.querySelector('section:first-of-type')) || root.querySelector('section:first-of-type')) : (main || root);
        const canvas = await html2canvas(target, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#faf8f3',
          windowWidth: target.scrollWidth,
          windowHeight: scope === 'hero' ? Math.min(target.offsetHeight, 1200) : target.scrollHeight,
        });
        const link = document.createElement('a');
        link.download = `LAS_${(data.title||'report').slice(0,20)}_${scope}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (e) {
        console.error('[LAS] 截图失败:', e);
      }
      revealEls.forEach((el, i) => { if (!savedReveal[i]) { el.classList.remove('visible'); el.style.opacity = ''; el.style.transform = ''; } });
      accordions.forEach((el, i) => { if (!savedAcc[i]) { el.classList.remove('open'); el.style.maxHeight = ''; el.style.overflow = ''; } });
      expandRows.forEach((el, i) => { if (!savedEx[i]) { el.classList.remove('open'); el.style.maxHeight = ''; el.style.overflow = ''; } });
      accordionIcons.forEach((el, i) => { if (!savedIcons[i]) el.classList.remove('open'); });

      btnEl.innerHTML = '<i class="fas fa-camera"></i>';
    });
  });

  // PDF — expand collapsibles, auto-name via document.title, restore after print
  document.getElementById('pdfBtn').addEventListener('click', () => {
    const accordions = document.querySelectorAll('.accordion-content');
    const expandRows = document.querySelectorAll('.expand-row');
    const accordionIcons = document.querySelectorAll('.accordion-icon');
    const savedAcc = []; const savedEx = []; const savedIcons = [];

    accordions.forEach(el => { savedAcc.push(el.classList.contains('open')); el.classList.add('open'); el.style.maxHeight = 'none'; el.style.overflow = 'visible'; });
    expandRows.forEach(el => { savedEx.push(el.classList.contains('open')); el.classList.add('open'); el.style.maxHeight = 'none'; el.style.overflow = 'visible'; });
    accordionIcons.forEach(el => { savedIcons.push(el.classList.contains('open')); el.classList.add('open'); });

    const title = (data && data.title) ? data.title : 'Report';
    const safeName = title.slice(0, 30).replace(/[\\/:*?"<>|]/g, '');
    const origTitle = document.title;
    document.title = 'LAS_' + safeName;

    const onAfter = () => {
      revealEls.forEach((el, i) => { if (!savedReveal[i]) { el.classList.remove('visible'); el.style.opacity = ''; el.style.transform = ''; } });
      accordions.forEach((el, i) => { if (!savedAcc[i]) { el.classList.remove('open'); el.style.maxHeight = ''; el.style.overflow = ''; } });
      expandRows.forEach((el, i) => { if (!savedEx[i]) { el.classList.remove('open'); el.style.maxHeight = ''; el.style.overflow = ''; } });
      accordionIcons.forEach((el, i) => { if (!savedIcons[i]) el.classList.remove('open'); });
      document.title = origTitle;
      window.removeEventListener('afterprint', onAfter);
    };
    window.addEventListener('afterprint', onAfter);
    window.print();
  });

  // Word (.docx via docx library)
  document.getElementById('wordBtn').addEventListener('click', async () => {
    await exportDocx(data);
  });

  initReport(root, { dimData, layerAvgs, wcs, tier });
}

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
    `<span class="tag" style="background:rgba(184,134,11,.04);border:1px solid rgba(184,134,11,.12);color:var(--gold)">${esc(k)}</span>`
  ).join('');
  const spectralKW = (meta.spectral_keywords || []).map(k =>
    `<span class="tag" style="background:rgba(26,26,26,.03);border:1px solid rgba(26,26,26,.06);color:var(--muted)">${esc(k)}</span>`
  ).join('');
  const keywordsHtml = (genreKW || spectralKW) ? `<div class="flex flex-wrap gap-1.5 mb-4">${genreKW}${spectralKW}</div>` : '';

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
            <div><span class="font-semibold" style="color:var(--ink)">《${esc(debracket(b.title||''))}》</span> ${esc(b.author||'')}。${esc(b.reason||'')}</div>
          </div>`
        ).join('')}</div>
      </div>`;
  }

  // Verification data (original only)
  const defects = ds.defects || [];
  const defectsHtml = defects.length ? defects.map(d =>
    `<div class="glass-card rounded-lg p-3 text-sm" style="border-left:3px solid #dc2626">
      <p class="font-semibold text-xs mb-1" style="color:#dc2626">${esc(d.type || '')}</p>
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

  // Token usage (作品字数 + 生成报告；固定系统提示词 ~28K 不展示)
  const t = data.tokens || {};
  const tokenStr = (() => {
    if (!t.total) return '';
    const k = (v) => v >= 1000 ? (v / 1000).toFixed(1) + 'K' : String(v);
    const sysEst = 28000; // ~70KB system prompt estimate
    const variable = Math.max(0, t.total - sysEst);
    return '消耗 ' + k(variable) + ' tokens（作品 + 生成报告）';
  })();


  // ── Scoring Audit Log ──
  const sa = r.scoring_audit || {};
  let auditHtml = '';
  const sv = sa.strategy_verification || {};
  const svBestLayer = {A:'语言与形式',B:'叙事与内容',C:'思想与意义',D:'审美与影响'}[sv.best_layer] || '';
  if (sv.predicted !== undefined) {
    const matched = sv.predicted === sv.verified_strategy;
    auditHtml += `<div class="audit-item"><div class="audit-row"><span class="audit-label mono">策略校验</span><span class="audit-value">预判策略 ${sv.predicted || '?'} → 校验确认策略 ${sv.verified_strategy || '?'}</span><span class="audit-tag ${matched ? '' : 'updated'}">${matched ? '一致' : '已更新'}</span></div>${sv.best_layer ? `<p class="audit-sub">四层均分：A ${(sv.layer_avgs||{}).A||'?'} / B ${(sv.layer_avgs||{}).B||'?'} / C ${(sv.layer_avgs||{}).C||'?'} / D ${(sv.layer_avgs||{}).D||'?'} · 最优层：${svBestLayer}${sv.weight_updated === true ? ' · 权重已更新' : ''}</p>` : ''}</div>`;
  }
  const auditSectionHtml = auditHtml ? `<section id="auditLog" class="py-10 reveal"><hr class="rule-strong mb-6"><h2 class="text-2xl font-bold serif mb-5">评分决策日志</h2><div class="glass-card rounded-xl p-5 space-y-3">${auditHtml}</div></section>` : '';

  const sections = {
    WORK_TITLE: esc(data.title),
    WORK_AUTHOR: esc(data.author || ''),
    WORK_TAGS: tags,
    LAS_ID: esc(ac.report_id || 'LAS-'+now.getFullYear()+('0'+(now.getMonth()+1)).slice(-2)+('0'+now.getDate()).slice(-2)+'-'+(fallbackId||'').slice(0,3)),
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

function applyTemplate(tpl, sections) {
  for (const [key, value] of Object.entries(sections)) {
    tpl = tpl.replace(new RegExp('\\{\\{' + key + '\\}\\}', 'g'), String(value));
  }
  const residual = tpl.match(/\{\{[A-Z_]+\}\}/g);
  if (residual) console.warn('[LAS] 未替换的占位符:', [...new Set(residual)].join(', '));
  return tpl;
}

function initReport(root, { dimData, layerAvgs, wcs, tier }) {
  const mode = window.__LAS_REPORT_MODE || 'original';
  const isOriginal = mode === 'original';
  const LC = isOriginal ? ['#6b21a8','#2d6a4f','#b8860b','#1a1a1a'] : ['#8b0000','#2d6a4f','#b8860b','#1a1a1a'];
  const primaryColor = LC[0];

  window.__LAS_DATA = { dimData, LC, mode, primaryColor, wcs };

  initFontSize();
  initNav(isOriginal);
  initSectionNav(isOriginal);
  initScroll();
  initReveal();

  if (dimData.length === 0) {
    // LLM 拒评：隐藏无数据的交互元素，展示提示横幅
    const ring = document.getElementById('progressRing') || document.querySelector('.score-ring');
    if (ring) ring.style.display = 'none';
    const radar = document.getElementById('radarChart');
    if (radar) radar.style.display = 'none';
    const table = document.getElementById('table');
    if (table) table.style.display = 'none';
    const layerBars = document.getElementById('layerBars');
    if (layerBars) layerBars.style.display = 'none';

    const summary = document.getElementById('assessmentSummary');
    if (summary) {
      const banner = document.createElement('div');
      banner.className = 'glass-card';
      banner.style.cssText = 'padding:20px;margin-bottom:24px;border-left:3px solid var(--gold)';
      banner.innerHTML = '<div style="display:flex;align-items:flex-start;gap:12px">'
        + '<span style="font-size:24px;flex-shrink:0">&#9888;</span>'
        + '<div><p class="serif" style="font-size:16px;font-weight:700;color:var(--ink);margin-bottom:4px">无法完成十六维标尺评定</p>'
        + '<p class="text-sm" style="color:var(--muted);line-height:1.8">该作品经缺陷扫描与极端情况预审，被判定为<strong style="color:var(--ink)">未达到可评定的最低文学完成度</strong>（缺陷明显/严重瑕疵区间）。以下展示 LLM 对该作品的定性分析与诊断，供参考。</p></div></div>';
      summary.parentNode.insertBefore(banner, summary);
    }
    return;
  }

  initScoreRing(wcs);
  initRadarChart(dimData, LC, primaryColor);
  buildTable();
  initTableEvents();
}

// ── init helpers ──

function initFontSize() {
  const el = document.getElementById('goldenQuote');
  if (el) {
    const l = el.textContent.trim().length;
    if (l <= 15) { el.style.fontSize = '1.25rem'; el.style.fontWeight = '600'; }
    else if (l <= 25) { el.style.fontSize = '1.1rem'; el.style.fontWeight = '500'; }
    else if (l <= 40) { el.style.fontSize = '1rem'; el.style.fontWeight = '500'; }
    else if (l <= 60) { el.style.fontSize = '0.9rem'; el.style.fontWeight = '400'; }
    else { el.style.fontSize = '0.875rem'; el.style.fontWeight = '400'; }
  }
  const sc = document.getElementById('sharpComment');
  if (sc) {
    const l = sc.textContent.trim().length;
    if (l <= 20) { sc.style.fontSize = '1.35rem'; sc.style.fontWeight = '700'; }
    else if (l <= 35) { sc.style.fontSize = '1.2rem'; sc.style.fontWeight = '600'; }
    else if (l <= 50) { sc.style.fontSize = '1.1rem'; sc.style.fontWeight = '600'; }
    else if (l <= 70) { sc.style.fontSize = '1rem'; sc.style.fontWeight = '500'; }
    else if (l <= 100) { sc.style.fontSize = '0.9rem'; sc.style.fontWeight = '500'; }
    else { sc.style.fontSize = '0.875rem'; sc.style.fontWeight = '400'; }
  }
}

function initScoreRing(wcsScore) {
  const p = document.getElementById('heroProgress'), v = document.getElementById('heroValue');
  if (!p || !v) return;
  const score = wcsScore || 0, c = 2 * Math.PI * 42, o = c * (1 - score / 150);
  setTimeout(() => {
    p.style.strokeDashoffset = o;
    const d = 2000, start = performance.now();
    (function a(t) {
      const progress = Math.min((t - start) / d, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      v.textContent = (eased * score).toFixed(2);
      if (progress < 1) requestAnimationFrame(a);
    })(performance.now());
  }, 400);
}

function initRadarChart(dimData, LC, primaryColor) {
  const canvas = document.getElementById('radarChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const tgt = dimData.map(d => d.score), cur = new Array(16).fill(0);

  const lvlPlugin = {
    id: 'lvl',
    beforeDatasetsDraw(ch) {
      const { ctx: c, chartArea: { top, bottom, left, right }, scales: { r } } = ch;
      const cx = (left + right) / 2, cy = (top + bottom) / 2, da = r.drawingArea;
      [150, 120, 90, 60, 30].forEach((v, i) => {
        const rd = (v / 150) * da;
        c.save(); c.beginPath(); c.arc(cx, cy, rd, 0, 2 * Math.PI);
        c.strokeStyle = (primaryColor === '#6b21a8' ? 'rgba(107,33,168,' : 'rgba(139,0,0,') + (0.4 - i * 0.06).toFixed(2) + ')';
        c.lineWidth = 0.8; c.setLineDash([3, 4]); c.stroke(); c.setLineDash([]);
        c.fillStyle = 'rgba(26,26,26,.3)'; c.font = '9px "Noto Sans SC"';
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(v, cx + rd + 4, cy); c.restore();
      });
    }
  };

  const isPurple = primaryColor === '#6b21a8';
  const chartBg = isPurple ? 'rgba(107,33,168,0.06)' : 'rgba(139,0,0,0.06)';
  const chartBorder = isPurple ? 'rgba(107,33,168,0.5)' : 'rgba(139,0,0,0.5)';
  const chartPoint = isPurple ? 'rgba(107,33,168,0.7)' : 'rgba(139,0,0,0.7)';
  const tooltipBorder = isPurple ? 'rgba(107,33,168,0.1)' : 'rgba(139,0,0,0.1)';

  const chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: dimData.map(d => d.name),
      datasets: [{
        data: cur, fill: true,
        backgroundColor: chartBg, borderColor: chartBorder,
        pointBackgroundColor: chartPoint, pointBorderColor: '#faf8f5',
        pointBorderWidth: 1.5, pointRadius: 3, pointHoverRadius: 6, hoverRadius: 8, borderWidth: 1.5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: true },
      onHover: (e, el) => { e.native.target.style.cursor = el.length ? 'pointer' : 'default'; },
      onClick: (e, el) => { if (el.length) document.getElementById('table').scrollIntoView({ behavior: 'smooth' }); },
      scales: {
        r: {
          min: 0, max: 150, ticks: { display: false },
          grid: { color: 'rgba(26,26,26,.04)', circular: true },
          angleLines: { color: 'rgba(26,26,26,.04)' },
          pointLabels: { font: { size: 11, family: "'Noto Sans SC'", weight: '500' }, color: '#1a1a1a' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(26,26,26,0.88)', titleColor: '#faf8f3',
          bodyColor: 'rgba(250,248,245,0.8)', borderColor: 'rgba(184,134,11,0.3)', borderWidth: 1, padding: 10, cornerRadius: 6,
          titleFont: { family: "'Noto Serif SC'", weight: '700', size: 14 },
          bodyFont: { family: "'Noto Sans SC'", weight: '500', size: 12 },
          titleMarginBottom: 6,
          callbacks: {
            title: c => dimData[c[0].dataIndex].name,
            label: c => [
              dimData[c.dataIndex].score + ' / 150',
              '档位  ' + dimData[c.dataIndex].level,
              '权重  ' + dimData[c.dataIndex].weight
            ]
          }
        }
      },
      animation: { duration: 0 }
    },
    plugins: [lvlPlugin]
  });

  setTimeout(() => {
    const d = 2500, start = performance.now();
    (function a(t) {
      const progress = Math.min((t - start) / d, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      for (let i = 0; i < 16; i++) cur[i] = tgt[i] * eased;
      chart.update('none');
      if (progress < 1) requestAnimationFrame(a);
    })(performance.now());
  }, 600);
}

function buildTable(filter, query) {
  const D = window.__LAS_DATA;
  if (!D) return;
  const { dimData: DIM, LC, mode } = D;
  const isOriginal = mode === 'original';
  const hoverBg = isOriginal ? 'rgba(107,33,168,.03)' : 'rgba(139,0,0,.03)';
  const lowerRefColor = isOriginal ? 'rgba(107,33,168,.5)' : 'rgba(139,0,0,.5)';
  const topLevelColor = LC[0];
  const topLevelBg = isOriginal ? 'rgba(107,33,168,.08)' : 'rgba(139,0,0,.08)';

  const f = filter !== undefined ? filter : (document.getElementById('levelFilter') ? document.getElementById('levelFilter').value : 'all');
  const q = query !== undefined ? query : (document.getElementById('tableSearch') ? document.getElementById('tableSearch').value : '');

  const tb = document.getElementById('tableBody');
  if (!tb) return;
  tb.innerHTML = '';
  let n = 0;

  DIM.forEach((d, i) => {
    if (f !== 'all' && d.level !== f) return;
    if (q && !d.name.includes(q)) return;
    n++;

    const r = document.createElement('tr');
    r.style.cssText = 'border-bottom:1px solid var(--rule);cursor:pointer;transition:background .2s';
    r.onmouseenter = () => r.style.background = hoverBg;
    r.onmouseleave = () => r.style.background = '';

    const topTiers = {
      '文学之巅': 'color:' + topLevelColor + ';background:' + topLevelBg,
      '永恒殿堂': 'color:#b8860b;background:rgba(184,134,11,.08)',
      '不朽丰碑': 'color:#1a1a1a;background:rgba(26,26,26,.04)',
      '典范之作': 'color:#2d6a4f;background:rgba(45,106,79,.08)',
      '上乘佳作': 'color:#059669;background:rgba(5,150,105,.06)',
    };
    const lc = topTiers[d.level] || 'color:#8a8578;background:rgba(138,133,120,.06)';
    const adj = d.adjusted ? '<span class="text-[9px] text-gold/60 ml-0.5" title="已校验调整">*</span>' : '';

    r.innerHTML = '<td class="py-2.5 px-3 font-medium"><span class="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style="background:' + LC[d.layer] + '"></span>' + d.name + adj + '</td>'
      + '<td class="py-2.5 px-2 text-center mono text-muted text-xs">' + d.weight + '</td>'
      + '<td class="py-2.5 px-2 text-center mono font-bold">' + d.score + '</td>'
      + '<td class="py-2.5 px-2 text-center"><span class="text-[11px] px-2 py-0.5 rounded-full font-semibold" style="' + lc + '">' + d.level + '</span></td>'
      + '<td class="py-2.5 px-3 text-muted text-xs">' + d.benchmark + '</td>'
      + '<td class="py-2.5 px-2 text-center"><i class="fas fa-chevron-down text-muted/30 text-[10px] arr" id="arr' + i + '"></i></td>';
    r.onclick = () => toggleRow(i);
    tb.appendChild(r);

    const er = document.createElement('tr');
    er.id = 'er' + i;
    const gapContent = d.gapLevel
      ? '<p><strong class="text-ink/60">① 基准表现：</strong>' + (d.benchmarkPerf || '暂无') + '</p>'
        + '<p><strong class="text-ink/60">② 证据引用：</strong>' + (d.evidence || '暂无') + '</p>'
        + '<p><strong class="text-ink/60">③ 差距等级：</strong>' + d.gapLevel + '</p>'
        + (d.lowerRef ? '<p><strong style="color:' + lowerRefColor + '">④ 反向锚定：</strong>' + d.lowerRef + '</p>' : '')
        + '<p><strong class="text-ink/60">⑤ 结论：</strong>' + (d.compare || '暂无') + '</p>'
      : '<p><strong class="text-ink/60">关键证据：</strong>' + (d.evidence || '暂无') + '</p>'
        + '<p><strong class="text-ink/60">基准比较：</strong>' + (d.compare || '暂无') + '</p>'
        + (d.lowerRef ? '<p><strong style="color:' + lowerRefColor + '">反向锚定：</strong>' + d.lowerRef + '</p>' : '');
    er.innerHTML = '<td colspan="6" class="p-0"><div class="expand-row" id="ex' + i + '"><div class="px-6 py-3 text-sm text-muted leading-relaxed space-y-1.5 serif" style="background:rgba(26,26,26,.015)">'
      + gapContent + '</div></div></td>';
    tb.appendChild(er);
  });

  if (!n) {
    const e = document.createElement('tr');
    e.innerHTML = '<td colspan="6" class="py-8 text-center text-muted">无匹配结果</td>';
    tb.appendChild(e);
  }
}

function initTableEvents() {
  const search = document.getElementById('tableSearch');
  const filter = document.getElementById('levelFilter');
  if (search) search.addEventListener('input', () => buildTable());
  if (filter) filter.addEventListener('change', () => buildTable());
}

function initNav(isOriginal) {
  const secs = isOriginal
    ? ['hero','assessmentSummary','verification','table','coreBenchmarks','deepAnalysis','professional','conclusion','appendix']
    : ['hero','assessmentSummary','table','coreBenchmarks','deepAnalysis','professional','conclusion','appendix'];

  document.querySelectorAll('.nav-pip').forEach(p => p.addEventListener('click', () => scrollTo(p.dataset.target)));

  const sObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) document.querySelectorAll('.nav-pip').forEach(p => p.classList.toggle('active', p.dataset.target === e.target.id));
    });
  }, { threshold: 0.15, rootMargin: '-10% 0px -60% 0px' });

  secs.forEach(id => {
    const el = document.getElementById(id);
    if (el) sObs.observe(el);
  });
}

function initSectionNav(isOriginal) {
  const container = document.getElementById('sectionNavInner');
  if (!container) return;
  const secs = isOriginal
    ? ['hero','assessmentSummary','verification','table','coreBenchmarks','deepAnalysis','professional','conclusion','appendix']
    : ['hero','assessmentSummary','table','coreBenchmarks','deepAnalysis','professional','conclusion','appendix'];
  const labels = isOriginal
    ? ['概览','评估','校验','详表','基准','分析','专业','结论','附录']
    : ['概览','评估','详表','基准','分析','专业','结论','附录'];
  const enLabels = isOriginal
    ? ['HERO','ASSESS','VERIFY','TABLE','BENCH','DEEP','PRO','VERDICT','EXTRA']
    : ['HERO','ASSESS','TABLE','BENCH','DEEP','PRO','VERDICT','EXTRA'];

  secs.forEach((id, i) => {
    const btn = document.createElement('button');
    btn.className = 'section-nav-btn';
    btn.dataset.target = id;
    btn.innerHTML = '<span class="section-nav-en">' + enLabels[i] + '</span><span class="section-nav-zh">' + labels[i] + '</span>';
    btn.addEventListener('click', () => scrollTo(id));
    container.appendChild(btn);
  });

  const sObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        container.querySelectorAll('.section-nav-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.target === e.target.id);
        });
      }
    });
  }, { threshold: 0.2, rootMargin: '-80px 0px -60% 0px' });

  secs.forEach(id => {
    const el = document.getElementById(id);
    if (el) sObs.observe(el);
  });
}

function initScroll() {
  const bar = document.getElementById('stickyBar'), hero = document.getElementById('hero'), sn = document.getElementById('sectionNav');
  window.addEventListener('scroll', () => {
    if (bar && hero) { const show = hero.getBoundingClientRect().bottom < 0; bar.classList.toggle('show', show); if (sn) sn.classList.toggle('show', show); }
    const btn = document.getElementById('topBtn');
    if (btn) {
      const show = window.scrollY > 600;
      btn.style.opacity = show ? '1' : '0';
      btn.style.pointerEvents = show ? 'auto' : 'none';
    }
  }, { passive: true });
}

function initReveal() {
  const rObs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => rObs.observe(el));

  const bObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.bar-fill').forEach(b => b.style.width = b.dataset.width + '%');
        bObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  const lb = document.getElementById('layerBars');
  if (lb) bObs.observe(lb);
}

// esc/nl2p 定义在 app.js 中，全局可用

// ── Shared report interactivity (called from template & report.js generated HTML) ──

function toggleAdjustment(idx) {
  const items = document.querySelectorAll('#adjustmentList > div');
  items.forEach((item, i) => {
    const c = item.querySelector('.accordion-content'), a = item.querySelector('.accordion-icon');
    if (!c || !a) return;
    if (i === idx) { c.classList.toggle('open'); a.classList.toggle('open'); }
    else { c.classList.remove('open'); a.classList.remove('open'); }
  });
}

function toggleAccordion(idx) {
  const items = document.querySelectorAll('#accordion > div');
  const c = items[idx].querySelector('.accordion-content'), a = items[idx].querySelector('.accordion-icon');
  c.classList.toggle('open'); a.classList.toggle('open');
}

function toggleRow(i) {
  const ex = document.getElementById('ex' + i), ar = document.getElementById('arr' + i);
  const open = ex.classList.contains('open');
  document.querySelectorAll('.expand-row').forEach(e => e.classList.remove('open'));
  document.querySelectorAll('.arr').forEach(a => a.style.transform = '');
  if (!open) { ex.classList.add('open'); ar.style.transform = 'rotate(180deg)'; }
}

function scrollTo(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function exportDocx(data) {
  const T = window.docx;
  if (!T) { console.error('[LAS] docx 库未加载'); return; }
  const title = (data && data.title) ? data.title : 'Report';
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = title.slice(0, 30).replace(/[\\/:*?"<>|]/g, '');

  // Clone entire report (not just <main>) to include fortune + footer
  const root = document.querySelector('#spaApp');
  if (!root) return;
  const clone = root.cloneNode(true);
  // Remove all nav / UI / interactive elements
  clone.querySelectorAll([
    '.nav-top','#stickyBar','#sectionNav','.side-nav','.mob-nav','#topBtn','.export-bar','#ssFloat',
    'button','canvas','svg','.fas','.far','.ss-opt','.ss-menu','#ssMenu',
    '.accordion-icon','.arr','.nav-pip',
    '#tableSearch','#levelFilter','label',
    'input','select'
  ].join(',')).forEach(el => el.remove());
  // Expand all collapsed content
  clone.querySelectorAll('.accordion-content,.expand-row').forEach(el => { el.classList.add('open'); el.style.maxHeight = 'none'; el.style.opacity = '1'; });
  // Remove expand-row wrapper TDs but keep inner content (to avoid nested table issues)
  clone.querySelectorAll('.expand-row').forEach(el => { const parent = el.parentNode; while (el.firstChild) parent.insertBefore(el.firstChild, el); el.remove(); });

  const children = [];
  const u = (s) => (s || '').replace(/[\s\n\r]+/g, ' ').trim();

  // ── Title ──
  children.push(new T.Paragraph({
    heading: T.HeadingLevel.TITLE, spacing: { after: 120 },
    children: [new T.TextRun({ text: title, bold: true, size: 44, font: 'Noto Serif SC' })]
  }));
  children.push(new T.Paragraph({
    spacing: { after: 200 },
    children: [new T.TextRun({ text: 'LAS 文学分析报告 · ' + dateStr, size: 20, font: 'Noto Sans SC', color: '888888' })]
  }));
  children.push(new T.Paragraph({
    spacing: { before: 80, after: 200 },
    border: { bottom: { style: T.BorderStyle.SINGLE, size: 1, color: 'cccccc', space: 4 } },
    children: []
  }));

  // ── Walk sections in document order ──
  const sections = clone.querySelectorAll('section, #workInfo + *, #table + *, #coreBenchmarks + *, #deepAnalysis + *, #professional + *, #conclusion + *, #appendix + *, #hero + *');
  const walked = new Set();

  function addHeading(text, level) {
    text = u(text); if (!text) return;
    children.push(new T.Paragraph({
      heading: level === 1 ? T.HeadingLevel.HEADING_1 : T.HeadingLevel.HEADING_2,
      spacing: { before: level === 1 ? 360 : 280, after: 160 },
      children: [new T.TextRun({ text, bold: true, size: level === 1 ? 36 : 30, font: 'Noto Serif SC' })]
    }));
  }

  function addPara(text, opts = {}) {
    text = u(text); if (!text) return;
    children.push(new T.Paragraph({
      spacing: { before: opts.before || 80, after: opts.after || 80 },
      alignment: opts.center ? T.AlignmentType.CENTER : T.AlignmentType.LEFT,
      children: [new T.TextRun({ text, size: opts.size || 21, font: opts.mono ? 'JetBrains Mono' : 'Noto Serif SC', italics: opts.italics || false, color: opts.color || '1a1a1a' })]
    }));
  }

  function addTable(node) {
    const rows = [];
    const allRows = node.querySelectorAll('tr');
    allRows.forEach((tr, ri) => {
      const cells = [];
      const tds = tr.querySelectorAll('th,td');
      // Skip rows with only 1 cell that's a colspan placeholder or expand content
      if (tds.length === 1 && tds[0].getAttribute('colspan')) {
        // This is an expand row — add its text content as a paragraph after the table
        const txt = u(tds[0].textContent);
        if (txt) rows.push(null); // placeholder — will add after table
        return;
      }
      tds.forEach((td, ci) => {
        // Skip last column if it's the expand arrow (usually empty or has only a chevron)
        const txt = u(td.textContent);
        if (ci === tds.length - 1 && !txt) return;
        cells.push(new T.TableCell({
          width: { size: ci === 0 ? 2800 : 1400, type: T.WidthType.DXA },
          children: [new T.Paragraph({
            children: [new T.TextRun({ text: txt, size: 18, font: ri === 0 ? 'Noto Sans SC' : 'Noto Serif SC', bold: ri === 0 })]
          })]
        }));
      });
      if (cells.length) rows.push(new T.TableRow({ children: cells }));
    });
    if (rows.length) children.push(new T.Table({ rows: rows.filter(r => r !== null), width: { size: 100, type: T.WidthType.PERCENTAGE } }));
    children.push(new T.Paragraph({ spacing: { before: 120 }, children: [] }));
  }

  function hasChildren(el) { return el && el.children && el.children.length > 0; }

  function walkSection(el) {
    if (!el || walked.has(el)) return;
    walked.add(el);
    const tag = el.tagName ? el.tagName.toLowerCase() : '';

    // Section headings (h2)
    const h2 = el.querySelector('h2');
    if (h2) addHeading(h2.textContent, 1);

    // Sub-headings (h3)
    el.querySelectorAll('h3').forEach(h => addHeading(h.textContent, 2));

    // Tables
    el.querySelectorAll('table').forEach(t => addTable(t));

    // Blockquotes
    el.querySelectorAll('blockquote').forEach(bq => {
      const txt = u(bq.textContent);
      if (txt) addPara(txt, { italics: true, before: 120, after: 120 });
    });

    // Collect remaining text paragraphs (not inside headings/tables/blockquotes)
    el.querySelectorAll('p, li, .text-lg, .text-sm, .text-xs, .leading-relaxed, [class*="text-"]').forEach(p => {
      if (p.closest('table') || p.closest('blockquote') || p.closest('h2') || p.closest('h3') || p.closest('thead') || p.closest('tbody')) return;
      const txt = u(p.textContent);
      if (!txt || txt.length < 2) return;
      if (/^(仅首页|全部报告|保存截图|导出|PDF|Word|截图|返回顶部|•|·)$/.test(txt)) return;

      // Detect sub-headings in LLM output (markdown / bracket / short topic lines)
      let display = txt;
      let isHeading = false;
      if (/^###\s/.test(txt)) { display = txt.replace(/^###\s*/, ''); isHeading = true; }
      else if (/^\*\*/.test(txt)) { display = txt.replace(/^\*\*|\*\*$/g, ''); isHeading = true; }
      else if (/^【/.test(txt)) { display = txt.replace(/^【|】$/g, ''); isHeading = true; }
      else if (txt.length <= 30 && /[：:]$/.test(txt) && !/[。！？]/.test(txt)) { isHeading = true; }
      else if (txt.length <= 20 && /^[^\s，。！？,…\.]{2,20}$/.test(txt) && p.tagName === 'P') {
        // Very short standalone phrase in its own paragraph — likely a sub-title
        const next = p.nextElementSibling;
        if (next && next.tagName === 'P' && u(next.textContent).length > 40) isHeading = true;
      }

      if (isHeading) {
        addPara(display, { bold: true, size: 24, before: 240, after: 60 });
      } else {
        addPara(txt);
      }
    });
  }

  // Process all sections in order
  clone.querySelectorAll('section').forEach(s => walkSection(s));

  // ── Fortune (outside <main>, after sections but before footer) ──
  const fortuneDiv = clone.querySelector('#spaApp > div:last-of-type > div.max-w-5xl:not(footer *)') ||
                     Array.from(clone.querySelectorAll('div')).find(d => {
                       const t = d.textContent || '';
                       return t.includes('文学签文') || (t.includes('签文') && d.querySelector('.text-lg'));
                     });
  if (fortuneDiv) {
    children.push(new T.Paragraph({ spacing: { before: 200 }, border: { bottom: { style: T.BorderStyle.SINGLE, size: 1, color: 'cccccc', space: 4 } }, children: [] }));
    addHeading('文学签文', 1);
    const texts = fortuneDiv.querySelectorAll('.text-lg, p');
    texts.forEach(el => {
      const txt = u(el.textContent);
      if (txt && txt.length > 1 && txt !== '文学签文') {
        const isCenter = el.classList.contains('text-lg') || el.closest('.text-center');
        addPara(txt, { center: !!isCenter, size: el.classList.contains('text-lg') ? 24 : 21 });
      }
    });
  }

  // ── Footer ──
  const footer = clone.querySelector('footer');
  if (footer) {
    children.push(new T.Paragraph({
      spacing: { before: 400 }, border: { bottom: { style: T.BorderStyle.SINGLE, size: 1, color: 'cccccc', space: 4 } }, children: []
    }));
    const footerTexts = [];
    footer.querySelectorAll('span,a').forEach(el => {
      const t = u(el.textContent);
      if (t && t.length > 1 && !footerTexts.includes(t)) footerTexts.push(t);
    });
    addPara(footerTexts.join(' · '), { size: 18, mono: true, color: '888888', center: true });
  }

  const doc = new T.Document({
    title: title,
    description: 'LAS 文学分析报告',
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children
    }]
  });

  const blob = await T.Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'LAS_' + safeName + '_' + dateStr + '.docx';
  a.click();
  URL.revokeObjectURL(a.href);
}
