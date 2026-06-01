// report.js — 报告页路由 + 渲染管线 + 模板 + 导出栏 + 贡献 + Docx导出
// 依赖: buildReportSections (report-sections.js), initReport 等 (report-charts.js)

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

  const showError = (title, detail, rawPreview, extra, errCode) => {
    var copyPayload = JSON.stringify({
      title: title,
      detail: detail || '',
      rawPreview: rawPreview || '',
      errorCode: errCode || '',
      analysisId: id,
      time: new Date().toISOString(),
      ua: navigator.userAgent
    }, null, 2);
    root.innerHTML = `<main class="max-w-3xl mx-auto px-6" style="padding-top:80px;padding-bottom:80px">
      <section class="text-center fade-up d1">
        <p class="mono text-xs text-muted tracking-[4px] mb-2 uppercase">Report Error${errCode ? ' [' + esc(errCode) + ']' : ''}</p>
        <h1 class="serif text-2xl font-bold mb-3" style="color:var(--crimson)">${esc(title)}</h1>
        ${detail ? `<p class="text-sm text-muted mb-4">${esc(detail)}</p>` : ''}
        ${rawPreview ? '<div class="card" style="max-width:600px;margin:0 auto;text-align:left"><p class="text-xs text-muted">LLM 原始输出片段:</p><pre class="text-xs text-muted mt-2" style="white-space:pre-wrap;word-break:break-all;max-height:200px;overflow:auto">' + esc(rawPreview) + '</pre></div>' : ''}
        ${extra || ''}
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px">
          <a href="javascript:App.navigate('#/upload')" class="btn" style="display:inline-block">返回首页</a>
          <button id="copyErrorBtn" class="btn" style="display:inline-block;border-color:var(--rule-strong);color:var(--muted);font-size:0.75rem;letter-spacing:1px" onclick="navigator.clipboard.writeText(this.dataset.payload).then(function(){var b=document.getElementById('copyErrorBtn');b.textContent='已复制';setTimeout(function(){b.textContent='复制错误信息'},2000)});">复制错误信息</button>
        </div>
      </section>
    </main>`;
    setTimeout(function() {
      var btn = document.getElementById('copyErrorBtn');
      if (btn) btn.dataset.payload = copyPayload;
    }, 50);
  };

  showLoading('正在加载报告...');

  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
    try {
      const data = await API.getReport(id);
      const r = data.report;

      if (r && r.ok) {
        try {
          var tplOk = await renderFromTemplate(data, r, id);
          if (tplOk === null) {
            showError('报告模板加载失败', '请检查网络连接后重试。', null, '', 'E005');
          }
        } catch (renderErr) {
          console.error('[LAS] 报告渲染异常:', renderErr);
          showError('报告渲染失败', renderErr.message || '渲染引擎异常，请稍后重试。', null, '', 'E005');
        }
        return;
      }
      if (r && !r.ok) {
        const errMsg = r.error || '未知错误';
        const rawPreview = r.raw_preview || r.raw || '';
        const errCode = r.error_code || '';
        showError('报告生成失败', '状态: ' + (data.status || '?') + ' [' + esc(errCode) + '] ' + esc(errMsg), rawPreview,
          '<p class="text-xs text-muted mt-6">analysis_id: ' + esc(data.analysis_id || '?') + '</p>'
          + (r.error_detail ? '<p class="text-xs text-muted mt-2">' + esc(r.error_detail) + '</p>' : ''),
          errCode);
        return;
      }
    } catch (err) {
      console.log('[LAS] 报告加载 ' + (attempt + 1) + '/8: ' + (err.message || err));
    }
  }

  showError('报告加载失败', '分析可能尚未完成，请稍后刷新页面重试。',
    null,
    '<a href="javascript:location.reload()" class="btn mt-4" style="display:inline-block">重新加载</a>'
    + '<a href="javascript:App.navigate(\'#/works\')" class="btn mt-4" style="display:inline-block;margin-left:12px;border-color:var(--rule-strong);color:var(--muted)">返回作品列表</a>',
    'E002');
});

// ── Report rendering pipeline ──

async function renderFromTemplate(data, r, id) {
  const mode = data.mode || 'original';
  const isOriginal = mode === 'original';
  const tplUrl = (isOriginal ? '/templates/original.html' : '/templates/classic.html') + '?_=' + Date.now();
  let res; try { res = await fetch(tplUrl); } catch (e) { console.error('[LAS] 模板加载失败:', e); return null; }
  if (!res.ok) { console.error('[LAS] 模板HTTP错误:', res.status); return null; }
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
      <button class="export-btn" id="shareBtn" title="分享链接"><i class="fas fa-share-alt"></i></button>
    </div>`;
  root.insertAdjacentHTML('beforeend', exportHTML);

  // Screenshot
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

      const revealEls = document.querySelectorAll('.reveal');
      const savedReveal = [];
      revealEls.forEach(el => { savedReveal.push(el.classList.contains('visible')); el.classList.add('visible'); el.style.opacity = '1'; el.style.transform = 'none'; });

      const accordions = document.querySelectorAll('.accordion-content');
      const expandRows = document.querySelectorAll('.expand-row');
      const accordionIcons = document.querySelectorAll('.accordion-icon');
      const savedAcc = [], savedEx = [], savedIcons = [];
      accordions.forEach(el => { savedAcc.push(el.classList.contains('open')); el.classList.add('open'); el.style.maxHeight = 'none'; el.style.overflow = 'visible'; });
      expandRows.forEach(el => { savedEx.push(el.classList.contains('open')); el.classList.add('open'); el.style.maxHeight = 'none'; el.style.overflow = 'visible'; });
      accordionIcons.forEach(el => { savedIcons.push(el.classList.contains('open')); el.classList.add('open'); });

      try {
        if (typeof html2canvas === 'undefined') { console.error('[LAS] html2canvas 未加载'); btnEl.innerHTML = '<i class="fas fa-camera"></i>'; return; }
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

  // PDF
  document.getElementById('pdfBtn').addEventListener('click', () => {
    const accordions = document.querySelectorAll('.accordion-content');
    const expandRows = document.querySelectorAll('.expand-row');
    const accordionIcons = document.querySelectorAll('.accordion-icon');
    const revealEls = document.querySelectorAll('.reveal');
    const savedAcc = []; const savedEx = []; const savedIcons = []; const savedReveal = [];

    revealEls.forEach(el => { savedReveal.push(el.classList.contains('visible')); el.classList.add('visible'); el.style.opacity = '1'; el.style.transform = 'none'; });
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

  // Word
  document.getElementById('wordBtn').addEventListener('click', async () => {
    await exportDocx(data);
  });

  document.getElementById('shareBtn').addEventListener('click', () => {
    var aid = data.analysis_id || id;
    if (!aid) { alert('无法生成分享链接：缺少分析ID'); return; }
    var shareUrl = window.location.origin + '/share/' + aid;

    // Build share card
    var title = (data.title || '').replace(/</g,'&lt;');
    var author = (data.author || '').replace(/</g,'&lt;');
    var score = data.wcs_score != null ? parseFloat(data.wcs_score) : 0;
    var scoreFixed = score.toFixed(2);
    var tier = (data.tier || '').replace(/</g,'&lt;');
    var mode = data.mode || 'classic';
    var primaryColor = mode === 'original' ? '#6b21a8' : '#8b0000';
    var primaryRgb = mode === 'original' ? '107,33,168' : '139,0,0';
    var reportNumber = data.report_number != null ? 'LAS-' + String(data.report_number).padStart(6,'0') : 'LAS-' + String(aid || '000000').slice(0,6).toUpperCase();

    var ac = (r.analysis_content && typeof r.analysis_content === 'object') ? r.analysis_content : {};
    var honor = (ac.nickname || '').replace(/</g,'&lt;');
    var golden = (ac.golden_quote || '').replace(/</g,'&lt;');
    var div = ac.divination || {};
    var divGrade = (div.grade || '').replace(/</g,'&lt;');
    var divWord = (div.word || '').replace(/</g,'&lt;');
    var divPoem = (div.poem || '').replace(/</g,'&lt;');
    var divSource = (div.source || '').replace(/</g,'&lt;');

    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(window.location.origin);
    var homeUrl = window.location.origin;

    // SVG score ring
    var ringR = 48, ringC = 2 * Math.PI * ringR;
    var ringOffset = ringC * (1 - score / 150);
    var ringSvg = '<svg width="120" height="120" viewBox="0 0 120 120" style="display:block;margin:0 auto">'
      + '<circle cx="60" cy="60" r="' + ringR + '" fill="none" stroke="rgba(' + primaryRgb + ',.1)" stroke-width="5"/>'
      + '<circle cx="60" cy="60" r="' + ringR + '" fill="none" stroke="' + primaryColor + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + ringC.toFixed(1) + '" stroke-dashoffset="' + ringOffset.toFixed(1) + '" transform="rotate(-90 60 60)" opacity=".85"/>'
      + '<text x="60" y="56" text-anchor="middle" fill="' + primaryColor + '" font-family="\'JetBrains Mono\',monospace" font-size="22" font-weight="700">' + scoreFixed + '</text>'
      + '<text x="60" y="74" text-anchor="middle" fill="var(--muted,#6b6558)" font-family="\'JetBrains Mono\',monospace" font-size="9">/ 150</text>'
      + '</svg>';

    // Quote font sizing
    var qLen = golden.length;
    var qSize = qLen <= 30 ? '20px' : qLen <= 60 ? '17px' : qLen <= 100 ? '15px' : '14px';

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:var(--z-overlay,1000);background:rgba(26,26,26,.3);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeShare(); });

    var cardW = 500;
    var poemStyle = 'font-size:22px;font-weight:400;line-height:2.8;color:var(--ink,#1a1a1a);font-style:italic;writing-mode:vertical-rl;text-orientation:upright;letter-spacing:.12em;opacity:.6';

    // Build couplet columns as absolute-positioned side elements
    var coupletLeft = '', coupletRight = '';
    if (divPoem) {
      var parts = divPoem.split(/[，,]/);
      var c1 = (parts[0] || '').replace(/[。！？；.!?;]/g, '').trim();
      var c2 = (parts.length > 1 ? parts.slice(1).join('，').replace(/[。！？；.!?;]/g, '').trim() : '');
      coupletLeft = '<div style="position:absolute;left:28px;top:120px;bottom:0;display:flex;align-items:flex-start"><p style="' + poemStyle + '">' + c1 + '</p></div>';
      if (c2) {
        coupletRight = '<div style="position:absolute;right:28px;top:120px;bottom:0;display:flex;align-items:flex-start"><p style="' + poemStyle + '">' + c2 + '</p></div>';
      }
    }

    overlay.innerHTML =
      '<div style="background:var(--paper,#faf8f3);border:1px solid var(--rule);border-radius:12px;overflow:hidden;width:' + cardW + 'px;max-width:92vw;position:relative">'
      + '<div id="shareCard" style="padding:0;box-sizing:border-box;font-family:\'Noto Serif SC\',Georgia,serif;background:var(--paper,#faf8f3);color:var(--ink,#1a1a1a);position:relative">'

      // Brand
      + '<div style="text-align:center;padding:18px 28px 0">'
      + '<span class="mono" style="font-size:9px;color:var(--muted,#6b6558);letter-spacing:3px">LAS 文学分析系统</span>'
      + '</div>'

      // Divination header above ring
      + ((divGrade || divWord) ? '<div style="text-align:center;padding:12px 28px 2px"><p style="font-size:14px;font-weight:600;color:var(--gold,#b8860b);letter-spacing:.06em">' + [divGrade, divWord].filter(Boolean).join(' · ') + '</p></div>' : '')

      // Couplet absolute-positioned side elements
      + coupletLeft
      + coupletRight
      + '<div style="padding:0 36px">'

      // Score ring
      + '<div style="text-align:center;padding:12px 0 4px">'
      + ringSvg
      + '<div style="margin-top:8px"><span style="display:inline-block;padding:5px 18px;border-radius:99px;font-size:13px;font-weight:700;background:rgba(' + primaryRgb + ',.1);color:' + primaryColor + ';letter-spacing:.08em">' + tier + '</span></div>'
      + '</div>'

      // Title
      + '<div style="text-align:center;padding:10px 0 4px">'
      + '<p style="font-size:22px;font-weight:900;letter-spacing:.04em;line-height:1.25;color:var(--ink,#1a1a1a);margin-bottom:2px">《' + title + '》</p>'
      + '<p style="font-size:12px;color:var(--muted,#6b6558)">' + author + ' 著</p>'
      + '</div>'

      // Honor
      + (honor ? '<div style="text-align:center;padding:10px 4px 4px"><p style="font-size:9px;color:var(--muted,#6b6558);letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;">荣 誉 称 号</p><p style="font-size:16px;font-weight:700;color:' + primaryColor + ';line-height:1.4;letter-spacing:.04em">「' + honor + '」</p></div>' : '')

      // Golden quote
      + (golden ? '<div style="margin:10px 0;padding:14px 12px;background:var(--card-tint-gold);border-radius:8px;text-align:center">'
        + '<p style="font-size:9px;color:var(--muted,#6b6558);letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">金 句</p>'
        + '<p style="font-size:' + qSize + ';font-weight:500;line-height:1.8;color:var(--ink,#1a1a1a);font-style:italic">' + golden + '</p>'
        + '</div>' : '')

      // Divination source
      + (divSource ? '<p style="text-align:center;font-size:10px;color:var(--muted,#6b6558);padding:2px 0 6px">—— ' + divSource + '</p>' : '')

      // QR + URL
      + '<div style="display:flex;align-items:center;gap:12px;padding:10px 0 4px;border-top:1px solid var(--rule)">'
      + '<img src="' + qrUrl + '" alt="扫码体验LAS" style="width:64px;height:64px;border-radius:var(--rounded-sm,4px);flex-shrink:0" crossorigin="anonymous">'
      + '<div style="flex:1;min-width:0">'
      + '<p style="font-size:10px;color:var(--ink,#1a1a1a);font-weight:500;margin-bottom:2px">扫码体验 LAS 文学分析</p>'
      + '<p class="mono" style="font-size:9px;color:var(--muted,#6b6558);word-break:break-all;line-height:1.3">' + homeUrl + '</p>'
      + '</div>'
      + '</div>'

      // Footer
      + '<div style="text-align:center;padding:8px 0 16px">'
      + '<p style="font-size:8px;color:var(--muted,#6b6558);opacity:.5">LAS · 文学分析 · AI 生成仅供参考</p>'
      + '</div>'

      + '</div>'  // close center content

      + '</div>'  // close shareCard
      // Button bar
      + '<div style="display:flex;gap:10px;justify-content:center;padding:14px 28px;border-top:1px solid var(--rule)">'
      + '<button id="shareDlBtn" style="padding:8px 24px;border:1px solid ' + primaryColor + ';border-radius:var(--rounded-sm,4px);background:transparent;color:' + primaryColor + ';cursor:pointer;font-family:\'JetBrains Mono\',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;transition:all .15s">SAVE <span class="btn-zh">保存卡片</span></button>'
      + '<button id="shareCopyBtn" style="padding:8px 24px;border:1px solid var(--rule);border-radius:var(--rounded-sm,4px);background:transparent;color:var(--muted,#6b6558);cursor:pointer;font-family:\'JetBrains Mono\',monospace;font-size:11px;letter-spacing:1px;transition:all .15s">COPY <span class="btn-zh">复制链接</span></button>'
      + '<button id="shareCloseBtn" style="position:absolute;top:8px;right:12px;width:44px;height:44px;border-radius:50%;border:1px solid var(--rule);background:var(--paper,#faf8f3);cursor:pointer;color:var(--muted,#6b6558);font-size:16px;display:flex;align-items:center;justify-content:center">✕</button>'
      + '</div>'
      + '</div>';  // close outer container
    document.body.appendChild(overlay);

    function closeShare() {
      if (overlay.parentNode) document.body.removeChild(overlay);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') closeShare(); }

    document.getElementById('shareCloseBtn').addEventListener('click', closeShare);
    document.addEventListener('keydown', onKey);

    // Download as image
    document.getElementById('shareDlBtn').addEventListener('click', function() {
      var card = document.getElementById('shareCard');
      if (typeof html2canvas === 'undefined') {
        alert('html2canvas 未加载，请尝试截图保存');
        return;
      }
      html2canvas(card, { backgroundColor: '#faf8f3', scale: 2, useCORS: true }).then(function(canvas) {
        var link = document.createElement('a');
        link.download = 'LAS_' + reportNumber.replace(/\s/g,'_') + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(function() {
        alert('图片生成失败，请尝试截图保存');
      });
    });

    // Copy link
    document.getElementById('shareCopyBtn').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(shareUrl).then(function() {
        btn.innerHTML = 'COPIED <span class="btn-zh">已复制</span>';
        setTimeout(function() { btn.innerHTML = 'COPY <span class="btn-zh">复制链接</span>'; }, 2000);
      }).catch(function() {
        prompt('复制以下链接分享报告：', shareUrl);
      });
    });
  });

  initReport(root, { dimData, layerAvgs, wcs, tier });

  // ── Quote contribution (original mode only) ──
  var contributeBox = document.getElementById('contributeBox');
  if (contributeBox && isOriginal) {
    var qt = (r.analysis_content && r.analysis_content.golden_quote) || '';
    if (qt.length < 4) { contributeBox.style.display = 'none'; }
    else {
      // Track handled quotes per-quote — both "贡献" and "不了，谢谢" only affect this one
      var handledQuotes = [];
      try {
        handledQuotes = JSON.parse(localStorage.getItem('las_handled_quotes') || '[]');
      } catch (e) {}
      if (handledQuotes.indexOf(qt) !== -1) {
        contributeBox.style.display = 'none';
      } else {
      var preview = document.getElementById('contributeQuotePreview');
      if (preview) preview.textContent = qt;
      var qsrc = (data.title || '') + ' ' + (data.author || '');
      var qmode = data.mode || 'classic';
      contributeBox.style.display = '';
      document.getElementById('contributeBtn').addEventListener('click', function() {
        var btn = this;
        btn.disabled = true;
        btn.textContent = '提交中...';
        API._post('/quotes', { quote: qt, source: qsrc, mode: qmode }).then(function() {
          btn.style.display = 'none';
          document.getElementById('contributeDismiss').style.display = 'none';
          var msg = document.getElementById('contributeMsg');
          msg.textContent = '已添加到句子库，感谢分享';
          msg.style.display = '';
          handledQuotes.push(qt);
          try { localStorage.setItem('las_handled_quotes', JSON.stringify(handledQuotes)); } catch(e) {}
          setTimeout(function() {
            contributeBox.style.opacity = '0';
            contributeBox.style.transition = 'opacity .4s';
            setTimeout(function() { contributeBox.style.display = 'none'; }, 400);
          }, 2000);
        }).catch(function() {
          btn.disabled = false;
          btn.textContent = '贡献到句子库';
          var msg = document.getElementById('contributeMsg');
          msg.textContent = '添加失败，请稍后重试';
          msg.style.color = 'var(--crimson)';
          msg.style.display = '';
        });
      });
      document.getElementById('contributeDismiss').addEventListener('click', function() {
        contributeBox.style.display = 'none';
        handledQuotes.push(qt);
        try { localStorage.setItem('las_handled_quotes', JSON.stringify(handledQuotes)); } catch(e) {}
      });
      } // end else (not already handled)
    }
  }
}

// ── Template placeholder replacement ──

function applyTemplate(tpl, sections) {
  for (const [key, value] of Object.entries(sections)) {
    var safe = String(value ?? '');
    if (typeof value === 'string') safe = value.replace(/\$/g, '$$$$');
    tpl = tpl.replace(new RegExp('\\{\\{' + key + '\\}\\}', 'g'), safe);
  }
  const residual = tpl.match(/\{\{[A-Z_]+\}\}/g);
  if (residual) console.warn('[LAS] 未替换的占位符:', [...new Set(residual)].join(', '));
  return tpl;
}

// ── Word (.docx) export ──

async function exportDocx(data) {
  const T = window.docx;
  if (!T) { console.error('[LAS] docx 库未加载'); return; }
  const title = (data && data.title) ? data.title : 'Report';
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = title.slice(0, 30).replace(/[\\/:*?"<>|]/g, '');

  const root = document.querySelector('#spaApp');
  if (!root) return;
  const clone = root.cloneNode(true);
  clone.querySelectorAll([
    '.nav-top','#stickyBar','#sectionNav','.side-nav','.mob-nav','#topBtn','.export-bar','#ssFloat',
    'button','canvas','svg','.fas','.far','.ss-opt','.ss-menu','#ssMenu',
    '.accordion-icon','.arr','.nav-pip',
    '#tableSearch','#levelFilter','label',
    'input','select'
  ].join(',')).forEach(el => el.remove());
  clone.querySelectorAll('.accordion-content,.expand-row').forEach(el => { el.classList.add('open'); el.style.maxHeight = 'none'; el.style.opacity = '1'; });
  clone.querySelectorAll('.expand-row').forEach(el => { const parent = el.parentNode; while (el.firstChild) parent.insertBefore(el.firstChild, el); el.remove(); });

  const children = [];
  const u = (s) => (s || '').replace(/[\s\n\r]+/g, ' ').trim();

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
      if (tds.length === 1 && tds[0].getAttribute('colspan')) {
        const txt = u(tds[0].textContent);
        if (txt) rows.push(null);
        return;
      }
      tds.forEach((td, ci) => {
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

  function walkSection(el) {
    if (!el || walked.has(el)) return;
    walked.add(el);
    const h2 = el.querySelector('h2');
    if (h2) addHeading(h2.textContent, 1);
    el.querySelectorAll('h3').forEach(h => addHeading(h.textContent, 2));
    el.querySelectorAll('table').forEach(t => addTable(t));
    el.querySelectorAll('blockquote').forEach(bq => {
      const txt = u(bq.textContent);
      if (txt) addPara(txt, { italics: true, before: 120, after: 120 });
    });
    el.querySelectorAll('p, li, .text-lg, .text-sm, .text-xs, .leading-relaxed, [class*="text-"]').forEach(p => {
      if (p.closest('table') || p.closest('blockquote') || p.closest('h2') || p.closest('h3') || p.closest('thead') || p.closest('tbody')) return;
      const txt = u(p.textContent);
      if (!txt || txt.length < 2) return;
      if (/^(仅首页|全部报告|保存截图|导出|PDF|Word|截图|返回顶部|•|·)$/.test(txt)) return;
      let display = txt;
      let isHeading = false;
      if (/^###\s/.test(txt)) { display = txt.replace(/^###\s*/, ''); isHeading = true; }
      else if (/^\*\*/.test(txt)) { display = txt.replace(/^\*\*|\*\*$/g, ''); isHeading = true; }
      else if (/^【/.test(txt)) { display = txt.replace(/^【|】$/g, ''); isHeading = true; }
      else if (txt.length <= 30 && /[：:]$/.test(txt) && !/[。！？]/.test(txt)) { isHeading = true; }
      else if (txt.length <= 20 && /^[^\s，。！？,…\.]{2,20}$/.test(txt) && p.tagName === 'P') {
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

  clone.querySelectorAll('section').forEach(s => walkSection(s));

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
