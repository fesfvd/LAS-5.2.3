const CIRCUMFERENCE = 201.062; // 2*PI*32

const WORKFLOW = [
  { step: '01', text: '接收文本，清洗格式噪声...' },
  { step: '02', text: '识别体裁，匹配权重策略...' },
  { step: '03', text: '加载十五级评分标尺坐标系...' },
  { step: '04', text: '解析 A层 · 语言与形式' },
  { step: '05', text: '解析 B层 · 叙事与内容' },
  { step: '06', text: '解析 C层 · 思想与意义' },
  { step: '07', text: '解析 D层 · 审美与影响' },
  { step: '08', text: '十六维标尺逐项比对基准序列...' },
  { step: '09', text: '生成主报告 · 结论与附录...' },
  { step: '10', text: '核算最终权重，生成评估报告' },
];

// Steps advance via backend progress events from LLM stream

App.register('/analyze', () => {
  const id = App.state.params.id;
  if (!id) { App.navigate('#/'); return; }

  _shownStepIndex = -1;
  _completed = false;
  _lastPct = 0;
  _pageEnter = Date.now();
  if (_stepTimer) { clearInterval(_stepTimer); _stepTimer = null; }
  if (_cursorTimer) { clearInterval(_cursorTimer); _cursorTimer = null; }
  _quoteActive = false;
  if (_quoteTimer) { clearTimeout(_quoteTimer); _quoteTimer = null; }

  const root = document.getElementById('spaApp');
  root.innerHTML = `
    <div class="analyze-page">
      <div class="analyze-container">


          <div style="display:flex;align-items:center;justify-content:space-between;gap:24px">
            <div>
              <span class="section-label">WORKFLOW ANALYSIS</span>
              <h1 class="serif" style="font-size:30px;font-weight:700;line-height:1.1;letter-spacing:0.03em;color:var(--ink);margin-top:2px">正在分析</h1>
            </div>
            <div class="progress-ring-container waiting" id="progressRing">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" stroke-width="5" fill="none" class="progress-bg" />
                <circle id="progressCircle" cx="40" cy="40" r="32" stroke-width="5" fill="none"
                        stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="191" class="progress-arc" />
              </svg>
              <span class="progress-percent" id="progressText" style="position:absolute;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--muted)">--</span>
            </div>
          </div>

          <hr class="rule" style="margin:24px 0">

          <div id="dynamicContent">
            <div id="analyzeLoader" style="padding:40px 0">
              <div class="pulse-bar"></div>
              <p class="mono text-xs" style="color:var(--muted);letter-spacing:1px;text-align:center;margin-top:16px">正在连接分析引擎...</p>
            </div>
          </div>

          <hr class="rule" style="margin:24px 0">

          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="analyze-status-line" id="statusText" style="color:var(--muted)">序列启动中...</span>
            <div style="display:flex;align-items:center;gap:14px">
              <button id="cancelAnalyze" class="mono text-xs" style="display:inline-block;padding:5px 14px;border:1px solid var(--rule-strong);border-radius:6px;background:transparent;color:var(--muted);cursor:pointer;transition:all .2s;font-family:'JetBrains Mono',monospace">ESC 取消</button>
              <span class="analyze-status-line" id="statusIndicator" style="color:var(--jade);display:none">&bull; 分析完成</span>
            </div>
          </div>

          <hr class="rule" style="margin:24px 0">

          <div style="text-align:center">
            <span class="section-label">LITERARY MUSES</span>
            <div class="rule-gold" style="margin:12px auto 20px"></div>
            <blockquote class="muse-quote" id="museQuote">
              <span class="quote-bracket">&#x300C;</span>
              <span id="quoteText"></span>
              <span class="quote-bracket">&#x300D;</span>
            </blockquote>
            <cite class="muse-source" id="quoteSource"></cite>
          </div>

          <p class="text-xs text-muted mt-1" id="moduleHint" style="display:none"></p>


      </div>
    </div>`;

  API.getWork(id).then(w => {
    if (w.ancestor_dialogue) {
      const hint = document.getElementById('moduleHint');
      if (hint) { hint.textContent = '已启用「先贤灵境」· 报告中将呈现文学先贤对谈'; hint.style.display = 'block'; }
    }
  }).catch(() => {});

  // Build all step DOM elements immediately
  buildAllSteps();

  // Cancel button
  var cancelBtn = document.getElementById('cancelAnalyze');
  cancelBtn.addEventListener('click', function() {
    if (window.__LAS_ANALYZE_CTRL) { window.__LAS_ANALYZE_CTRL.abort(); }
    if (_stepTimer) clearInterval(_stepTimer);
    if (_cursorTimer) clearInterval(_cursorTimer);
    if (_quoteTimer) clearTimeout(_quoteTimer);
    if (_elapsedTimer) clearInterval(_elapsedTimer);
    _quoteActive = false;
    _completed = true;
    App.navigate('#/works');
  });
  cancelBtn.addEventListener('mouseenter', function() { this.style.borderColor = 'var(--crimson)'; this.style.color = 'var(--crimson)'; });
  cancelBtn.addEventListener('mouseleave', function() { this.style.borderColor = 'var(--rule-strong)'; this.style.color = 'var(--muted)'; });

  startStream(id, window.__LAS_MODEL || '');
  startQuoteCarousel();

  window.addEventListener('beforeunload', () => {
    if (_stepTimer) clearInterval(_stepTimer);
    if (_cursorTimer) clearInterval(_cursorTimer);
    if (_quoteTimer) clearTimeout(_quoteTimer);
    if (window.__LAS_ANALYZE_CTRL) window.__LAS_ANALYZE_CTRL.abort();
  }, { once: true });
});

let _shownStepIndex = -1;
let _completed = false;
let _pageEnter = 0;
let _stepTimer = null;
let _cursorTimer = null;
let _quoteTimer = null;
let _quotes = [];
let _quoteIdx = 0;
let _quoteActive = false;
let _stepEls = [];

function buildAllSteps() {
  const container = document.getElementById('dynamicContent');
  if (!container) return;
  _stepEls = WORKFLOW.map((w, i) => {
    const div = document.createElement('div');
    div.className = 'terminal-line';
    div.style.cssText = 'margin-bottom:6px;opacity:0.35;color:var(--muted);display:flex;align-items:center';
    div.innerHTML = '<span class="log-step" style="margin-right:8px;flex-shrink:0">' + w.step + '</span><span class="log-text" style="flex:1">' + w.text + '</span><span class="log-status" style="margin-left:auto;flex-shrink:0;font-size:11px"></span>';
    container.appendChild(div);
    return div;
  });
}

function advanceStep() {
  if (_completed) return;
  const next = _shownStepIndex + 1;
  if (next >= WORKFLOW.length) return;

  // Mark previous as done
  if (_shownStepIndex >= 0 && _stepEls[_shownStepIndex]) {
    _stepEls[_shownStepIndex].classList.add('done');
    _stepEls[_shownStepIndex].style.opacity = '0.55';
    _stepEls[_shownStepIndex].style.color = 'var(--muted)';
    const status = _stepEls[_shownStepIndex].querySelector('.log-status');
    if (status) status.textContent = '✓';
  }

  // Activate current
  _shownStepIndex = next;
  if (_stepEls[next]) {
    _stepEls[next].classList.add('show', 'active');
    _stepEls[next].style.opacity = '1';
    _stepEls[next].style.color = 'var(--ink)';
    startCursorPulse(_stepEls[next]);
  }
  updateRing();
}

function startCursorPulse(el) {
  const textSpan = el.querySelector('.log-text');
  if (!textSpan) return;
  if (_cursorTimer) clearInterval(_cursorTimer);
  let visible = true;
  _cursorTimer = setInterval(() => {
    if (_completed) { clearInterval(_cursorTimer); textSpan.textContent = textSpan.textContent.replace(' │', ''); return; }
    if (visible) {
      if (!textSpan.textContent.endsWith(' │')) textSpan.textContent += ' │';
    } else {
      textSpan.textContent = textSpan.textContent.replace(' │', '');
    }
    visible = !visible;
  }, 600);
}

var _lastPct = 0;
function updateRing() {
  const circle = document.getElementById('progressCircle');
  const text = document.getElementById('progressText');
  if (!circle || !text) return;
  // Guard against external DOM writes (e.g. legacy firstEvent setTimeout)
  if (text.textContent === '0%' && _lastPct > 0) { text.textContent = _lastPct + '%'; }
  // Restore if DOM was recreated mid-stream
  if (text.textContent === '--') { text.textContent = _lastPct + '%'; return; }
  const pct = Math.min(100, Math.round((_shownStepIndex + 1) / WORKFLOW.length * 100));
  if (pct <= _lastPct) return;
  _lastPct = pct;
  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct / 100);
  circle.style.strokeDashoffset = offset;
  text.textContent = pct + '%';
}

function onComplete() {
  _completed = true;
  if (_stepTimer) { clearTimeout(_stepTimer); _stepTimer = null; }
  if (_cursorTimer) { clearInterval(_cursorTimer); _cursorTimer = null; }

  // Mark all remaining steps as done
  for (let i = _shownStepIndex; i < WORKFLOW.length; i++) {
    if (_stepEls[i]) {
      _stepEls[i].classList.add('show', 'done');
      _stepEls[i].style.opacity = '0.55';
      _stepEls[i].style.color = 'var(--muted)';
      const textSpan = _stepEls[i].querySelector('.log-text');
      if (textSpan) textSpan.textContent = textSpan.textContent.replace(' │', '');
      const status = _stepEls[i].querySelector('.log-status');
      if (status) status.textContent = '✓';
    }
  }
  _shownStepIndex = WORKFLOW.length - 1;
  updateRing();

  // Stop quotes
  _quoteActive = false;
  if (_quoteTimer) { clearTimeout(_quoteTimer); _quoteTimer = null; }
  const mq = document.getElementById('museQuote');
  if (mq) mq.style.opacity = '0';

  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  if (statusText) { statusText.textContent = '分析完成，报告生成中...'; statusText.style.color = 'var(--jade)'; }
  if (statusIndicator) statusIndicator.style.display = 'block';
}

async function startStream(workId, model) {
  const statusText = document.getElementById('statusText');
  if (statusText) statusText.textContent = 'CONNECTING...';

  const controller = new AbortController();
  window.__LAS_ANALYZE_CTRL = controller;

  try {
    const res = await API.analyzeStream(workId, model || '', controller.signal);
    if (!res.ok) {
      if (res.status === 429) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || '请求过于频繁，请 5 分钟后再试');
      }
      if (res.status === 401) throw new Error('请先登录');
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || '服务器异常 (HTTP ' + res.status + ')');
    }
    if (statusText) statusText.textContent = 'EXECUTING...';

    let firstEvent = true;
    let lastProgressStep = -1;
    let receivedDone = false;
    let parseErrors = 0;
    let lastEventTime = Date.now();
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const IDLE_WARN = 60000;    // 60s no event → warn
    const IDLE_GIVEUP = 300000;  // 5min no event → give up
    const READ_TIMEOUT = 45000;  // 45s per read() call (heartbeat every 15s, 3x margin)
    const FIRST_BYTE_WARN = 30000; // 30s no first token → show progress hint

    // Show elapsed timer
    var _startTime = Date.now();
    var _elapsedTimer = setInterval(function() {
      var elapsed = Math.floor((Date.now() - _startTime) / 1000);
      if (statusText && elapsed > 10 && !firstEvent) {
        statusText.textContent = '等待 LLM 响应... (' + elapsed + 's)';
      }
    }, 5000);

    while (true) {
      let result;
      try {
        result = await Promise.race([
          reader.read(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('READ_TIMEOUT')), READ_TIMEOUT))
        ]);
      } catch (readErr) {
        if (readErr.message === 'READ_TIMEOUT') {
          // Check idle duration
          const idle = Date.now() - lastEventTime;
          if (idle >= IDLE_GIVEUP) {
            console.warn('[LAS] 流读取超时超过 5 分钟，已放弃');
            if (_elapsedTimer) clearInterval(_elapsedTimer);
            if (statusText) { statusText.textContent = '分析超时，请重试'; statusText.style.color = 'var(--semantic-warning)'; }
            return;
          }
          // First byte warning: no data at all within FIRST_BYTE_WARN
          if (firstEvent && idle >= FIRST_BYTE_WARN && !document.getElementById('firstByteWarn')) {
            var w2 = document.createElement('p');
            w2.id = 'firstByteWarn';
            w2.className = 'analyze-status-line';
            w2.style.cssText = 'color:var(--semantic-warning);margin-top:4px';
            w2.textContent = 'LLM 尚未返回数据，可能文本较长或模型负载较高，请耐心等待...';
            document.getElementById('dynamicContent').parentNode.appendChild(w2);
          }
          if (idle >= IDLE_WARN && !document.getElementById('idleWarn')) {
            const w = document.createElement('p');
            w.id = 'idleWarn';
            w.className = 'analyze-status-line';
            w.style.cssText = 'color:var(--semantic-warning);margin-top:4px';
            w.textContent = '分析耗时较长，请耐心等待...';
            document.getElementById('dynamicContent').parentNode.appendChild(w);
          }
          continue; // keep trying
        }
        throw readErr;
      }

      const { done, value } = result;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        lastEventTime = Date.now();
      }

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const event = JSON.parse(raw);
          // Skip heartbeats before firstEvent gate
          if (event.type === 'heartbeat') continue;
          if (firstEvent) {
            firstEvent = false;
            if (_elapsedTimer) { clearInterval(_elapsedTimer); _elapsedTimer = null; }
            var cancelBtn = document.getElementById('cancelAnalyze');
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            const loader = document.getElementById('analyzeLoader');
            if (loader) { loader.style.opacity = '0'; loader.style.transition = 'opacity .4s'; setTimeout(() => loader.remove(), 400); }
            const elapsed = Date.now() - _pageEnter;
            const minDelay = Math.max(0, 800 - elapsed);
            setTimeout(() => {
              const ring = document.getElementById('progressRing');
              if (ring) ring.classList.remove('waiting');
              // updateRing() handles the percentage — don't overwrite it here
            }, minDelay);
          }
          if (event.type === 'progress') {
            const step = event.step;
            if (step > lastProgressStep) {
              for (let s = lastProgressStep + 1; s <= step; s++) advanceStep();
              lastProgressStep = step;
            }
          } else if (event.type === 'done') {
            receivedDone = true;
            onComplete();
            if (statusText) { statusText.textContent = '报告生成中...'; statusText.style.color = 'var(--gold)'; }
            await waitForReport(workId);
            if (statusText) statusText.textContent = '报告就绪，正在加载...';
            App.navigate('#/report/' + workId);
            return;
          }
        } catch (e) {
          parseErrors++;
          if (parseErrors <= 3) console.warn('[LAS] SSE 解析失败:', e.message || e, 'raw:', raw.slice(0, 80));
          if (parseErrors === 10) {
            console.error('[LAS] 连续 10 次 SSE 解析失败，流可能已损坏');
            if (statusText) { statusText.textContent = '数据传输异常'; statusText.style.color = 'var(--semantic-warning)'; }
          }
        }
      }

      if (done) {
        if (!receivedDone) {
          console.warn('[LAS] 流在收到 done 事件前断开');
          if (statusText) { statusText.textContent = '连接意外中断'; statusText.style.color = 'var(--semantic-warning)'; }
          // Still try to navigate — report may have been saved server-side
          const ok = await waitForReport(workId);
          if (ok) { App.navigate('#/report/' + workId); }
        }
        return;
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') { console.log('[LAS] 分析流已取消'); return; }
    console.error('[LAS] 分析流异常:', err);
    if (statusText) { statusText.textContent = '连接失败，请重试'; statusText.style.color = 'var(--semantic-error)'; }
    var retryBtn = document.createElement('button');
    retryBtn.textContent = '重新连接';
    retryBtn.className = 'mono text-xs';
    retryBtn.style.cssText = 'margin-left:12px;padding:4px 12px;border:1px solid var(--gold);border-radius:4px;background:transparent;color:var(--gold);cursor:pointer;transition:all .2s;font-family:JetBrains Mono,monospace';
    retryBtn.addEventListener('click', function() {
      if (retryBtn.parentNode) retryBtn.remove();
      startStream(workId, model);
    });
    if (statusText && statusText.parentNode) statusText.parentNode.insertBefore(retryBtn, statusText.nextSibling);
    if (_elapsedTimer) clearInterval(_elapsedTimer);
  } finally {
    window.__LAS_ANALYZE_CTRL = null;
  }
}

// ── Quote carousel (crossfade + height morph) ──

async function startQuoteCarousel() {
  try {
    const res = await fetch('/static/quotes.json');
    if (!res.ok) return;
    _quotes = await res.json();
    for (let i = _quotes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [_quotes[i], _quotes[j]] = [_quotes[j], _quotes[i]];
    }
    _quoteIdx = 0;
    _quoteActive = true;
    cycleQuote();
  } catch (e) { /* decorative only */ }
}

function cycleQuote() {
  if (!_quoteActive) return;
  if (_quoteTimer) clearTimeout(_quoteTimer);
  const mq = document.getElementById('museQuote');
  const el = document.getElementById('quoteText');
  if (!mq || !el || !_quotes.length) return;

  // Freeze current height
  const curH = mq.offsetHeight;
  mq.style.height = curH + 'px';
  mq.style.opacity = '0';

  setTimeout(() => {
    const q = _quotes[_quoteIdx % _quotes.length];
    const src = document.getElementById('quoteSource');
    el.textContent = typeof q === 'string' ? q : q.t;
    if (src) src.textContent = typeof q === 'string' ? '' : '—— ' + q.s;
    _quoteIdx++;

    // Measure new height
    mq.style.height = 'auto';
    const newH = mq.offsetHeight;

    // Animate from old to new height
    mq.style.height = curH + 'px';
    requestAnimationFrame(() => {
      mq.style.height = newH + 'px';
    });

    // Fade in after height transition, then release overflow
    setTimeout(() => {
      mq.style.height = 'auto';
      mq.style.opacity = '1';
      mq.classList.add('anim-done');
    }, 450);
  }, 350);

  _quoteTimer = setTimeout(() => {
    mq.style.opacity = '0';
    _quoteTimer = setTimeout(() => cycleQuote(), 500);
  }, 9000);
}

async function waitForReport(workId) {
  for (let i = 0; ; i++) {
    const delay = i === 0 ? 0 : i <= 5 ? 500 : i <= 20 ? 1000 : 2000;
    await new Promise(r => setTimeout(r, delay));
    try {
      const data = await API.getReport(workId);
      if (data.report && data.report.ok) return;
      if (data.status === 'failed') return;
    } catch (e) {
      if (i <= 3 || i % 5 === 0) console.log('[LAS] 报告轮询 ' + (i + 1) + ': ' + (e.message || e));
    }
  }
}
