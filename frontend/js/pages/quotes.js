App.register('/quotes', async () => {
  document.title = '金句广场 — LAS';
  var root = document.getElementById('spaApp');
  root.innerHTML = `
    <div class="submit-container">
      <div class="submit-header">
        <p class="mono text-xs text-muted tracking-[4px] uppercase mb-1">MUSES</p>
        <h1 class="serif" style="font-size:30px;font-weight:700;line-height:1.1">金句广场</h1>
      </div>
      <hr class="rule" style="margin:16px 0">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
        <button class="quote-chip active" data-mode="">全部</button>
        <button class="quote-chip" data-mode="original">原创</button>
        <button class="quote-chip" data-mode="classic">经典</button>
        <button id="refreshBtn" class="btn-refresh mono text-xs">换一批</button>
      </div>
      <div id="quoteGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px">
        <div class="spinner mx-auto" style="margin-top:40px"></div>
      </div>
      <div id="quoteLightbox" role="dialog" aria-modal="true" aria-label="金句详情" style="display:none;position:fixed;inset:0;z-index:var(--z-overlay,1000);background:rgba(26,26,26,.65);align-items:center;justify-content:center;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)">
        <button id="qlClose" aria-label="关闭" class="ql-close-btn">&times;</button>
        <div style="position:relative;width:90vw;max-width:800px;height:82vh;display:flex;flex-direction:column">
          <div id="qlStage" style="flex:1;overflow:hidden;position:relative">
            <div id="qlTrack" class="ql-track"></div>
          </div>
          <span id="qlCounter" class="mono text-xs" style="text-align:center;padding:10px 0;color:rgba(255,255,255,.25)"></span>
        </div>
      </div>
    </div>
    <style>
      /* ── Filter chips ── */
      .quote-chip {
        font-family:'Noto Sans SC',Helvetica,sans-serif;font-size:12px;
        padding:6px 16px;min-height:40px;
        border:1px solid var(--rule);border-radius:9999px;
        background:transparent;color:var(--muted);cursor:pointer;
        transition:all var(--duration-fast);
      }
      .quote-chip:hover { border-color:var(--rule-strong);color:var(--ink); }
      .quote-chip.active { border-color:var(--gold);color:var(--gold);background:var(--gold-soft); }
      .quote-chip:focus-visible { outline:2px solid var(--gold);outline-offset:2px; }

      /* ── Refresh button ── */
      .btn-refresh {
        margin-left:auto;padding:8px 20px;min-height:40px;
        border:1px solid var(--gold);border-radius:var(--rounded-sm);
        background:transparent;color:var(--gold);cursor:pointer;
        letter-spacing:1px;transition:all var(--duration-fast);
      }
      .btn-refresh:hover { background:var(--gold);color:var(--paper); }
      .btn-refresh:focus-visible { outline:2px solid var(--gold);outline-offset:2px; }

      /* ── Quote cards ── */
      .quote-card { padding:20px !important; }
      .quote-card:hover { border-color:var(--rule-strong) !important; }
      .quote-card:focus-visible { outline:2px solid var(--gold);outline-offset:2px; }

      /* ── Lightbox ── */
      .ql-close-btn {
        position:fixed;top:20px;right:20px;z-index:1;
        width:44px;height:44px;border-radius:50%;
        border:1px solid rgba(255,255,255,.15);background:transparent;
        cursor:pointer;color:rgba(255,255,255,.45);font-size:18px;
        display:flex;align-items:center;justify-content:center;
        transition:all var(--duration-fast);
      }
      .ql-close-btn:hover { border-color:rgba(255,255,255,.4);color:rgba(255,255,255,.85); }
      .ql-close-btn:focus-visible { outline:2px solid var(--gold);outline-offset:2px; }
      .ql-track {
        transition:transform .55s cubic-bezier(.22,1,.36,1);
        will-change:transform;
      }

      /* ── Empty / Error states ── */
      .quote-empty, .quote-error {
        grid-column:1 / -1;
        text-align:center;padding:48px 24px;
        background:var(--paper);border:1px solid var(--rule);
        border-radius:var(--rounded-lg,12px);
      }
      .quote-retry-btn {
        margin-top:16px;padding:8px 20px;min-height:40px;
        border:1px solid var(--gold);border-radius:var(--rounded-sm);
        background:transparent;color:var(--gold);cursor:pointer;
        font-family:'Noto Sans SC',Helvetica,sans-serif;font-size:13px;
        transition:all var(--duration-fast);
      }
      .quote-retry-btn:hover { background:var(--gold);color:var(--paper); }
      .quote-retry-btn:focus-visible { outline:2px solid var(--gold);outline-offset:2px; }

      /* ── Accessibility ── */
      @media (prefers-reduced-motion:reduce) {
        .ql-track { transition:none !important; }
      }
    </style>`;

  function fmtSource(s) {
    if (!s || s.startsWith('《')) return s || '佚名';
    var sp = s.indexOf(' ');
    return sp > 0 ? '《' + s.slice(0, sp) + '》' + s.slice(sp) : '《' + s + '》';
  }

  function renderCard(q, idx) {
    var isOrig = q.m === 'original';

    return ''
      + '<div class="glass-card quote-card" data-quote-idx="' + idx + '" tabindex="0" style="position:relative;display:flex;flex-direction:column;cursor:pointer;'
        + 'transition:border-color 200ms cubic-bezier(.4,0,.2,1)">'

        + '<blockquote class="serif" style="'
          + 'font-size:18px;font-weight:500;line-height:1.625;letter-spacing:.03em;font-style:italic;'
          + 'color:var(--ink);border-left:2px solid var(--gold);'
          + 'padding:0 0 0 16px;margin:0 0 20px">'
          + esc(q.t)
        + '</blockquote>'

        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto">'
          + '<span style="font-family:\'Noto Sans SC\',Helvetica,sans-serif;font-size:12px;line-height:1.5;color:var(--muted)">'
            + '—— ' + esc(fmtSource(q.s))
          + '</span>'
          + (isOrig
            ? '<span style="font-family:\'Noto Sans SC\',Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:1px;padding:3px 10px;border-radius:9999px;color:var(--purple);border:1px solid rgba(107,33,168,0.25);background:transparent">原创</span>'
            : '')
        + '</div>'
      + '</div>';
  }

  var currentMode = '';
  var lightboxQuotes = [];
  var lightboxIdx = 0;
  var _qlSliding = false;
  var _qlWheelAccum = 0;
  var _qlWheelTimer = 0;
  var _qlTouchStartY = 0;
  var _qlStageH = 0;

  function renderLightboxQuote(q) {
    var isOrig = q.m === 'original';
    var h = _qlStageH || window.innerHeight;
    var src = (q.s || '佚名').trim();
    return '<div style="width:100%;height:' + h + 'px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;padding:8vh 10%">'
      // Opening ornament
      + '<div style="margin-bottom:6vh">'
        + '<span class="serif" style="font-size:72px;line-height:1;color:var(--gold);opacity:.25;display:block;text-align:center;user-select:none">&ldquo;</span>'
      + '</div>'
      // Quote
      + '<blockquote class="serif" style="'
        + 'font-size:clamp(22px,2.8vw,30px);font-weight:500;line-height:1.85;letter-spacing:.04em;font-style:italic;'
        + 'color:rgba(255,255,255,.92);text-align:center;max-width:600px;margin:0 auto 6vh">'
        + esc(q.t)
      + '</blockquote>'
      // Divider
      + '<div style="width:48px;height:1px;background:var(--gold);opacity:.4;margin-bottom:3vh"></div>'
      // Source
      + '<div style="text-align:center">'
        + '<span style="font-family:\'Noto Serif SC\',Georgia,serif;font-size:15px;color:rgba(255,255,255,.55);letter-spacing:.04em">' + esc(src) + '</span>'
        + (isOrig ? '<span style="font-family:\'Noto Sans SC\',Helvetica,sans-serif;font-size:10px;font-weight:600;margin-left:12px;padding:2px 8px;border-radius:9999px;color:var(--purple);opacity:.7;border:1px solid rgba(107,33,168,.3);background:transparent;vertical-align:middle">原创</span>' : '')
      + '</div>'
      + '</div>';
  }

  function openLightbox(idx) {
    lightboxIdx = idx;
    _qlSliding = false;
    var lb = document.getElementById('quoteLightbox');
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    _qlStageH = document.getElementById('qlStage').offsetHeight;
    var track = document.getElementById('qlTrack');
    track.style.transition = 'none';
    track.style.transform = 'translateY(0)';
    track.innerHTML = renderLightboxQuote(lightboxQuotes[idx]);
    document.getElementById('qlCounter').textContent = (idx + 1) + ' / ' + lightboxQuotes.length;
    document.addEventListener('keydown', onLightboxKey);
    lb.addEventListener('wheel', onLightboxWheel, { passive: false });
    lb.addEventListener('touchstart', onLightboxTouchStart, { passive: true });
    lb.addEventListener('touchend', onLightboxTouchEnd, { passive: true });
    document.getElementById('qlClose').focus();
  }

  function slideLightbox(dir) {
    if (_qlSliding || lightboxQuotes.length < 2) return;
    _qlSliding = true;
    lightboxIdx = dir > 0
      ? (lightboxIdx + 1) % lightboxQuotes.length
      : (lightboxIdx - 1 + lightboxQuotes.length) % lightboxQuotes.length;

    var track = document.getElementById('qlTrack');
    var stage = document.getElementById('qlStage');
    var h = stage.offsetHeight;
    _qlStageH = h;

    var newHtml = renderLightboxQuote(lightboxQuotes[lightboxIdx]);
    if (dir > 0) {
      track.insertAdjacentHTML('beforeend', newHtml);
      track.style.transition = 'none';
      track.style.transform = 'translateY(0)';
      requestAnimationFrame(function() {
        track.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1)';
        track.style.transform = 'translateY(-' + h + 'px)';
      });
    } else {
      track.insertAdjacentHTML('afterbegin', newHtml);
      track.style.transition = 'none';
      track.style.transform = 'translateY(-' + h + 'px)';
      requestAnimationFrame(function() {
        track.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1)';
        track.style.transform = 'translateY(0)';
      });
    }

    document.getElementById('qlCounter').textContent = (lightboxIdx + 1) + ' / ' + lightboxQuotes.length;

    setTimeout(function() {
      if (!document.body.contains(track)) return;
      _qlSliding = false;
      track.style.transition = 'none';
      track.style.transform = 'translateY(0)';
      var children = track.children;
      while (children.length > 1) {
        track.removeChild(children[dir > 0 ? 0 : 1]);
      }
    }, 580);
  }

  function onLightboxKey(e) {
    if (!document.getElementById('quoteLightbox')) { document.removeEventListener('keydown', onLightboxKey); return; }
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')    { e.preventDefault(); slideLightbox(-1); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); slideLightbox(1); }
    if (e.key === 'Tab') { e.preventDefault(); document.getElementById('qlClose').focus(); }
  }

  function onLightboxWheel(e) {
    e.preventDefault();
    var now = Date.now();
    // Accumulate wheel delta — only trigger when enough and not currently sliding
    if (now - _qlWheelTimer > 700) _qlWheelAccum = 0;
    _qlWheelTimer = now;
    _qlWheelAccum += Math.abs(e.deltaY);
    if (_qlWheelAccum < 80 || _qlSliding) return;
    _qlWheelAccum = 0;
    slideLightbox(e.deltaY > 0 ? 1 : -1);
  }

  function onLightboxTouchStart(e) { _qlTouchStartY = e.touches[0].clientY; }
  function onLightboxTouchEnd(e) {
    var dy = _qlTouchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 50) slideLightbox(dy > 0 ? 1 : -1);
  }

  function closeLightbox() {
    var lb = document.getElementById('quoteLightbox');
    lb.style.display = 'none';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onLightboxKey);
    lb.removeEventListener('wheel', onLightboxWheel);
    lb.removeEventListener('touchstart', onLightboxTouchStart);
    lb.removeEventListener('touchend', onLightboxTouchEnd);
  }

  async function loadQuotes(mode) {
    document.getElementById('quoteGrid').innerHTML = '<div class="spinner mx-auto" style="margin-top:40px"></div>';
    try {
      var data = await fetch('/api/quotes?random=30&mode=' + encodeURIComponent(mode));
      if (!data.ok) throw new Error('HTTP ' + data.status);
      var res = await data.json();
      var quotes = res.quotes || [];
      lightboxQuotes = quotes;
      if (!quotes.length) {
        document.getElementById('quoteGrid').innerHTML = ''
          + '<div class="quote-empty">'
            + '<p class="serif" style="font-size:16px;color:var(--ink);margin-bottom:8px">这里还没有金句</p>'
            + '<p class="text-xs" style="color:var(--muted);margin-bottom:4px">该模式下暂无收录，换个模式看看</p>'
            + '<button class="quote-retry-btn" onclick="document.querySelector(\'.quote-chip[data-mode=\\\'\\\']\').click()">查看全部</button>'
          + '</div>';
        return;
      }
      document.getElementById('quoteGrid').innerHTML = quotes.map(function(q, i) {
        return renderCard(q, i);
      }).join('');
    } catch (e) {
      document.getElementById('quoteGrid').innerHTML = ''
        + '<div class="quote-error">'
          + '<p class="text-xs" style="color:var(--semantic-error);margin-bottom:12px">⚠ 加载失败，请检查网络后重试</p>'
          + '<button class="quote-retry-btn" id="quoteRetryBtn">重新加载</button>'
        + '</div>';
      document.getElementById('quoteRetryBtn').addEventListener('click', function() { loadQuotes(currentMode); });
    }
  }
  loadQuotes('');

  // Event delegation: card clicks & keyboard (registered once, not inside loadQuotes)
  document.getElementById('quoteGrid').addEventListener('click', function(e) {
    var card = e.target.closest('.quote-card');
    if (card) openLightbox(parseInt(card.dataset.quoteIdx));
  });
  document.getElementById('quoteGrid').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var card = e.target.closest('.quote-card');
      if (card) openLightbox(parseInt(card.dataset.quoteIdx));
    }
  });

  // Lightbox controls
  document.getElementById('qlClose').addEventListener('click', closeLightbox);
  document.getElementById('quoteLightbox').addEventListener('click', function(e) { if (e.target === this) closeLightbox(); });

  document.querySelectorAll('.quote-chip').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.quote-chip').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      loadQuotes(currentMode);
    });
  });
  document.getElementById('refreshBtn').addEventListener('click', function() { loadQuotes(currentMode); });
});
