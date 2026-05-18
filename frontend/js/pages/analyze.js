const CIRCUMFERENCE = 150.796; // 2*PI*24

const WORKFLOW = [
  { step: '01', text: '接收文本，清洗格式噪声...', type: 'text', minChars: 0 },
  { step: '02', text: '识别体裁，匹配权重策略...', type: 'text', minChars: 600 },
  { step: '03', text: '加载十五级评分标尺坐标系...', type: 'text', minChars: 1200 },
  { step: '04', text: '解析 A层 · 语言与形式', type: 'progress', minChars: 2500 },
  { step: '05', text: '解析 B层 · 叙事与内容', type: 'progress', minChars: 5000 },
  { step: '06', text: '解析 C层 · 思想与意义', type: 'progress', minChars: 7500 },
  { step: '07', text: '解析 D层 · 审美与影响', type: 'progress', minChars: 10000 },
  { step: '08', text: '十六维标尺逐项比对基准序列...', type: 'text', minChars: 13500 },
  { step: '09', text: '校验维度均衡性，抵抗全面平庸...', type: 'text', minChars: 16000 },
  { step: '10', text: '核算最终权重，生成评估报告', type: 'text', minChars: 18000 },
];

App.register('/analyze', () => {
  const id = App.state.params.id;
  if (!id) { App.navigate('#/'); return; }

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

      <p class="text-xs text-muted mt-1" id="moduleHint" style="display:none"></p>
    </div>`;

  API.getWork(id).then(w => {
    if (w.ancestor_dialogue) {
      const hint = document.getElementById('moduleHint');
      if (hint) { hint.textContent = '已启用「先贤灵境」· 报告中将呈现文学先贤对谈'; hint.style.display = 'block'; }
    }
  }).catch(() => {});

  startStream(id);
});

let _shownStepIndex = -1;
let _activeProgressBar = null;
let _progressInterval = null;

function updateRing(stepIndex) {
  const circle = document.getElementById('progressCircle');
  const text = document.getElementById('progressText');
  if (!circle || !text) return;
  const pct = Math.min(100, Math.round((stepIndex + 1) / WORKFLOW.length * 100));
  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct / 100);
  circle.style.strokeDashoffset = offset;
  text.textContent = pct + '%';
}

function addLogLine(config) {
  const dynamicContent = document.getElementById('dynamicContent');
  const logBox = document.getElementById('logBox');
  if (!dynamicContent) return;

  const lineDiv = document.createElement('div');
  lineDiv.className = 'log-line';
  dynamicContent.appendChild(lineDiv);
  requestAnimationFrame(() => lineDiv.classList.add('show'));

  const stepSpan = document.createElement('span');
  stepSpan.className = 'log-step';
  stepSpan.textContent = config.step;
  lineDiv.appendChild(stepSpan);

  if (config.type === 'text') {
    const textSpan = document.createElement('span');
    textSpan.textContent = config.text;
    lineDiv.appendChild(textSpan);
    _activeProgressBar = null;
  } else if (config.type === 'progress') {
    const textSpan = document.createElement('span');
    textSpan.textContent = config.text + ' ';
    lineDiv.appendChild(textSpan);

    const barContainer = document.createElement('span');
    barContainer.className = 'log-progress';
    barContainer.innerHTML = '<span class="progress-bar"><span class="progress-fill"></span></span><span class="progress-text">0%</span>';
    lineDiv.appendChild(barContainer);

    const fillEl = barContainer.querySelector('.progress-fill');
    const textEl = barContainer.querySelector('.progress-text');
    _activeProgressBar = { fillEl, textEl, startTime: Date.now(), duration: 8000 };

    if (_progressInterval) clearInterval(_progressInterval);
    _progressInterval = setInterval(() => {
      if (!_activeProgressBar) { clearInterval(_progressInterval); return; }
      const elapsed = Date.now() - _activeProgressBar.startTime;
      const p = Math.min(95, Math.round(elapsed / _activeProgressBar.duration * 100));
      _activeProgressBar.fillEl.style.width = p + '%';
      _activeProgressBar.textEl.textContent = p + '%';
    }, 200);
  }

  if (logBox) logBox.scrollTop = logBox.scrollHeight;
}

function showStepsUpTo(charTotal) {
  const statusText = document.getElementById('statusText');
  let idx = 0;
  WORKFLOW.forEach((w, i) => { if (charTotal >= w.minChars) idx = i; });
  if (idx <= _shownStepIndex) return;

  for (let i = _shownStepIndex + 1; i <= idx; i++) {
    addLogLine(WORKFLOW[i]);
  }
  _shownStepIndex = idx;
  updateRing(idx);
  if (statusText) statusText.textContent = 'EXECUTING...';
}

function finishProgressBar() {
  if (_progressInterval) clearInterval(_progressInterval);
  if (_activeProgressBar) {
    _activeProgressBar.fillEl.style.width = '100%';
    _activeProgressBar.fillEl.style.background = 'var(--gold)';
    _activeProgressBar.textEl.textContent = 'DONE';
    _activeProgressBar = null;
  }
}

function onComplete() {
  finishProgressBar();
  if (_progressInterval) clearInterval(_progressInterval);
  // Show remaining steps
  for (let i = _shownStepIndex + 1; i < WORKFLOW.length; i++) {
    addLogLine(WORKFLOW[i]);
  }
  _shownStepIndex = WORKFLOW.length - 1;
  updateRing(WORKFLOW.length - 1);

  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  if (statusText) statusText.textContent = '';
  if (statusIndicator) statusIndicator.style.display = 'block';
}

async function startStream(workId) {
  const statusText = document.getElementById('statusText');
  try {
    const res = await API.analyzeStream(workId);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let charTotal = 0;
    let lastUpdate = 0;

    if (statusText) statusText.textContent = 'EXECUTING...';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data) continue;

        try {
          const event = JSON.parse(data);

          if (event.type === 'token') {
            charTotal += (event.text || '').length;
            if (charTotal - lastUpdate > 500) {
              lastUpdate = charTotal;
              showStepsUpTo(charTotal);
            }
          } else if (event.type === 'done') {
            onComplete();
            setTimeout(() => App.navigate('#/report/' + workId), 1000);
            return;
          }
        } catch (e) { /* skip */ }
      }
    }
  } catch (err) {
    const root = document.getElementById('spaApp');
    root.innerHTML = `
      <div class="analyze-container" style="text-align:center;padding-top:80px">
        <p class="mono text-xs text-muted tracking-[4px] mb-3">Connection Error</p>
        <h1 class="serif text-2xl font-bold mb-4" style="color:var(--crimson)">连接中断</h1>
        <p class="text-sm text-muted mb-6">${esc(err.message)}</p>
        <button class="btn btn-primary" onclick="location.reload()" style="font-size:13px">重试</button>
      </div>`;
  }
}
