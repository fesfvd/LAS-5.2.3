const CIRCUMFERENCE = 150.796; // 2*PI*24

const WORKFLOW = [
  { step: '01', text: '接收文本，清洗格式噪声...' },
  { step: '02', text: '识别体裁，匹配权重策略...' },
  { step: '03', text: '加载十五级评分标尺坐标系...' },
  { step: '04', text: '解析 A层 · 语言与形式' },
  { step: '05', text: '解析 B层 · 叙事与内容' },
  { step: '06', text: '解析 C层 · 思想与意义' },
  { step: '07', text: '解析 D层 · 审美与影响' },
  { step: '08', text: '十六维标尺逐项比对基准序列...' },
  { step: '09', text: '校验维度均衡性，抵抗全面平庸...' },
  { step: '10', text: '核算最终权重，生成评估报告' },
];

// Steps advance via backend progress events from LLM stream

App.register('/analyze', () => {
  const id = App.state.params.id;
  if (!id) { App.navigate('#/'); return; }

  _shownStepIndex = -1;
  _completed = false;
  if (_stepTimer) { clearInterval(_stepTimer); _stepTimer = null; }
  if (_cursorTimer) { clearInterval(_cursorTimer); _cursorTimer = null; }
  _quoteActive = false;
  if (_quoteTimer) { clearTimeout(_quoteTimer); _quoteTimer = null; }

  const root = document.getElementById('spaApp');
  root.innerHTML = `
    <div class="analyze-container">
      <div class="analyze-header">
        <div>
          <p class="mono text-xs text-muted tracking-[4px] mb-1">WORKFLOW 分析推演</p>
          <h1 class="serif text-3xl font-black leading-[1.1]">正在分析</h1>
        </div>
        <div class="progress-ring-container">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" stroke-width="2" fill="none" stroke="var(--rule)" />
            <circle id="progressCircle" cx="28" cy="28" r="24" stroke-width="2" fill="none"
                    stroke="var(--gold)" stroke-linecap="round" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}" />
          </svg>
          <span class="progress-percent" id="progressText">0%</span>
        </div>
      </div>

      <div class="terminal-window" id="logBox">
        <div id="dynamicContent"></div>
      </div>

      <div class="analyze-status">
        <p class="mono text-xs text-muted" id="statusText">序列启动中...</p>
        <p class="mono text-xs" id="statusIndicator" style="color:var(--gold);display:none">&bull; 分析完成</p>
      </div>

      <div class="quote-carousel" id="quoteCarousel">
        <p class="quote-label mono">文心拾贝</p>
        <div class="quote-body">
          <span class="quote-mark">&#x300C;</span>
          <span class="quote-text serif" id="quoteText"></span>
          <span class="quote-mark">&#x300D;</span>
        </div>
        <p class="quote-source serif" id="quoteSource"></p>
      </div>

      <p class="text-xs text-muted mt-1" id="moduleHint" style="display:none"></p>
    </div>`;

  API.getWork(id).then(w => {
    if (w.ancestor_dialogue) {
      const hint = document.getElementById('moduleHint');
      if (hint) { hint.textContent = '已启用「先贤灵境」· 报告中将呈现文学先贤对谈'; hint.style.display = 'block'; }
    }
  }).catch(() => {});

  // Build all step DOM elements immediately
  buildAllSteps();

  startStream(id);
  startQuoteCarousel();

  window.addEventListener('beforeunload', () => {
    if (_stepTimer) clearInterval(_stepTimer);
    if (_cursorTimer) clearInterval(_cursorTimer);
    if (_quoteTimer) clearTimeout(_quoteTimer);
  });
});

let _shownStepIndex = -1;
let _completed = false;
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
    div.className = 'log-line';
    div.innerHTML = `<span class="log-step">${w.step}</span><span class="log-text">${w.text}</span><span class="log-status"></span>`;
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
    const status = _stepEls[_shownStepIndex].querySelector('.log-status');
    if (status) status.textContent = '✓';
  }

  // Activate current
  _shownStepIndex = next;
  if (_stepEls[next]) {
    _stepEls[next].classList.add('show', 'active');
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

function updateRing() {
  const circle = document.getElementById('progressCircle');
  const text = document.getElementById('progressText');
  if (!circle || !text) return;
  const pct = Math.min(100, Math.round((_shownStepIndex + 1) / WORKFLOW.length * 100));
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
  const qc = document.getElementById('quoteCarousel');
  const qb = document.querySelector('.quote-body');
  if (qb) { qb.style.opacity = '0'; qb.style.transform = 'translateY(-8px)'; }
  if (qc) qc.style.opacity = '0';

  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  if (statusText) statusText.textContent = '分析完成，报告生成中...';
  if (statusIndicator) statusIndicator.style.display = 'block';
}

async function startStream(workId) {
  const statusText = document.getElementById('statusText');

  if (statusText) statusText.textContent = 'CONNECTING...';

  try {
    const res = await API.analyzeStream(workId);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    if (statusText) statusText.textContent = 'EXECUTING...';

    let lastProgressStep = -1;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const event = JSON.parse(data);
          if (event.type === 'progress') {
            const step = event.step;
            if (step > lastProgressStep) {
              for (let s = lastProgressStep + 1; s <= step; s++) {
                advanceStep();
              }
              lastProgressStep = step;
            }
          } else if (event.type === 'done') {
            onComplete();
            await waitForReport(workId);
            App.navigate('#/report/' + workId);
            return;
          }
        } catch (e) { /* skip */ }
      }

      if (done) {
        onComplete();
        await waitForReport(workId);
        App.navigate('#/report/' + workId);
        return;
      }
    }
  } catch (err) {
    console.error('[LAS] 分析流异常:', err);
    if (statusText) statusText.textContent = '连接失败，请重试';
  }
}

// ── Quote carousel ──

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
  const body = document.querySelector('.quote-body');
  const el = document.getElementById('quoteText');
  const container = document.getElementById('quoteCarousel');
  if (!el || !body || !container || !_quotes.length) return;

  body.style.opacity = '0';
  body.style.transform = 'translateY(12px)';

  setTimeout(() => {
    const q = _quotes[_quoteIdx % _quotes.length];
    const src = document.getElementById('quoteSource');
    el.textContent = typeof q === 'string' ? q : q.t;
    if (src) src.textContent = typeof q === 'string' ? '' : '—— ' + q.s;
    _quoteIdx++;
    body.style.opacity = '1';
    body.style.transform = 'translateY(0)';
    container.classList.add('visible');
  }, 500);

  _quoteTimer = setTimeout(() => {
    body.style.opacity = '0';
    body.style.transform = 'translateY(-8px)';
    _quoteTimer = setTimeout(() => cycleQuote(), 500);
  }, 10000);
}

async function waitForReport(workId) {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, i === 0 ? 200 : 2000));
    try {
      const data = await API.getReport(workId);
      if (data.report && data.report.ok) return true;
      if (data.status === 'failed') return true; // navigate to show error
    } catch (e) {
      console.log('[LAS] 报告轮询 ' + (i + 1) + '/30: ' + (e.message || e));
    }
  }
  return false; // exhausted — navigate anyway
}
