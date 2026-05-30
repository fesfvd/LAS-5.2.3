// report-charts.js — 评分环 + 雷达图 + 16维表格 + 导航 + 滚动 + 交互
// 依赖: Chart.js (CDN), window.__LAS_DATA, window.__LAS_REPORT_MODE

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
      banner.style.cssText = 'padding:20px;margin-bottom:24px';
      banner.innerHTML = '<div style="background:var(--card-tint-gold);padding:16px;border-radius:8px">'
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

  if (typeof Chart === 'undefined') { console.error('[LAS] Chart.js 未加载'); return; }
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

  if (window.__LAS_NAV_OBSERVER) window.__LAS_NAV_OBSERVER.disconnect();
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

  if (window.__LAS_SECTION_OBSERVER) window.__LAS_SECTION_OBSERVER.disconnect();
  const sObs2 = new IntersectionObserver(es => {
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
    if (el) sObs2.observe(el);
  });
  window.__LAS_SECTION_OBSERVER = sObs2;
}

function initScroll() {
  const bar = document.getElementById('stickyBar'), hero = document.getElementById('hero'), sn = document.getElementById('sectionNav');
  if (window.__LAS_SCROLL_HANDLER) window.removeEventListener('scroll', window.__LAS_SCROLL_HANDLER);
  window.__LAS_SCROLL_HANDLER = function() {
    if (bar && hero) { const show = hero.getBoundingClientRect().bottom < 0; bar.classList.toggle('show', show); if (sn) sn.classList.toggle('show', show); }
    const btn = document.getElementById('topBtn');
    if (btn) {
      const show = window.scrollY > 600;
      btn.style.opacity = show ? '1' : '0';
      btn.style.pointerEvents = show ? 'auto' : 'none';
    }
  };
  window.addEventListener('scroll', window.__LAS_SCROLL_HANDLER, { passive: true });
}

function initReveal() {
  if (window.__LAS_REVEAL_OBSERVER) window.__LAS_REVEAL_OBSERVER.disconnect();
  if (window.__LAS_BAR_OBSERVER) window.__LAS_BAR_OBSERVER.disconnect();
  const rObs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => rObs.observe(el));
  window.__LAS_REVEAL_OBSERVER = rObs;

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

// ── Shared interactivity (called from template HTML onclick) ──

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
