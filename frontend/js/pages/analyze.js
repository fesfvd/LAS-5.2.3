const LOGS = [
  { minChars: 0,    step: '01', msg: '接收作品文本，清洗格式噪声', type: '' },
  { minChars: 200,  step: '--', msg: 'AXIOM A: 严苛立场与严肃文学谱系归零审查已激活', type: 'axiom' },
  { minChars: 600,  step: '02', msg: '识别体裁属性，匹配权重策略', type: '' },
  { minChars: 1200, step: '03', msg: '建立坐标系：锚定十五级评分标尺', type: '' },
  { minChars: 2000, step: '--', msg: 'AXIOM C: 举证责任倒置。作品初始文学价值归零', type: 'axiom' },
  { minChars: 3500, step: '04', msg: '解析 A层 · 语言与形式', type: '' },
  { minChars: 5500, step: '05', msg: '解析 B层 · 叙事与内容', type: '' },
  { minChars: 7500, step: '--', msg: 'AXIOM B: 拒绝可读性致幻免疫。通顺不赋分', type: 'axiom' },
  { minChars: 9000, step: '06', msg: '解析 C层 · 思想与意义', type: '' },
  { minChars: 11000,step: '07', msg: '解析 D层 · 审美与影响', type: '' },
  { minChars: 13000,step: '08', msg: '十六维标尺逐项比对基准作品序列', type: '' },
  { minChars: 15000,step: '--', msg: 'AXIOM D: 拉开差距是职责。逃离均值陷阱', type: 'axiom' },
  { minChars: 17000,step: '09', msg: '校验维度间均衡性，抵抗全面平庸', type: '' },
  { minChars: 18500,step: '10', msg: '核算最终权重，生成评估报告', type: '' },
];

App.register('/analyze', () => {
  const id = App.state.params.id;
  if (!id) { App.navigate('#/'); return; }

  const root = document.getElementById('spaApp');
  root.innerHTML = `
    <main class="max-w-2xl mx-auto px-6" style="padding-top:80px;padding-bottom:80px">
      <p class="mono text-xs text-muted tracking-[4px] mb-3 uppercase">Analysis Workflow</p>
      <h1 class="serif text-4xl font-black leading-[1.1] mb-2">正在分析</h1>
      <p class="text-muted text-sm mb-10" style="max-width:420px">系统正在执行不可更改的审查协议，拒绝可读性致幻。</p>

      <div class="log-divider"></div>

      <div id="logBox"></div>

      <div class="log-divider"></div>

      <div id="statusBar" class="mt-8" style="display:none">
        <p class="mono text-xs text-gold tracking-wider">
          <span style="animation:pulse 1.2s infinite">&#9679;</span> 正在生成多维洞见...
        </p>
      </div>

      <p class="text-xs text-muted mt-3" id="moduleHint" style="display:none"></p>
    </main>`;

  API.getWork(id).then(w => {
    if (w.ancestor_dialogue) {
      const hint = document.getElementById('moduleHint');
      if (hint) { hint.textContent = '已启用「先贤灵境」· 报告中将呈现文学先贤对谈'; hint.style.display = 'block'; }
    }
  }).catch(() => {});

  startStream(id);
});

let _shownLogs = 0;

function showLogsUpTo(charTotal) {
  const logBox = document.getElementById('logBox');
  if (!logBox) return;

  let count = 0;
  LOGS.forEach((log, i) => { if (charTotal >= log.minChars) count = i + 1; });
  if (count <= _shownLogs) return;

  for (let i = _shownLogs; i < count; i++) {
    const log = LOGS[i];
    const div = document.createElement('div');
    div.className = 'log-line';
    if (log.type === 'axiom') {
      div.innerHTML = `<span class="log-step" style="color:var(--muted)">${log.step}</span><span class="log-msg axiom">${log.msg}</span>`;
    } else {
      div.innerHTML = `<span class="log-step">${log.step}</span><span class="log-msg">${log.msg}</span>`;
    }
    logBox.appendChild(div);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => div.classList.add('show'));
    });
  }
  _shownLogs = count;
}

function showComplete() {
  const statusBar = document.getElementById('statusBar');
  if (statusBar) statusBar.style.display = 'block';
  // Show any remaining logs
  _shownLogs = 0;
  showLogsUpTo(99999);
}

async function startStream(workId) {
  try {
    const res = await API.analyzeStream(workId);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let charTotal = 0;
    let lastUpdate = 0;

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
              showLogsUpTo(charTotal);
            }
          } else if (event.type === 'done') {
            showComplete();
            const result = event.result || {};
            if (!result.ok) {
              const logBox = document.getElementById('logBox');
              if (logBox) {
                const div = document.createElement('div');
                div.className = 'log-line show';
                div.innerHTML = `<span class="log-step" style="color:var(--crimson)">!!</span><span class="log-msg" style="color:var(--crimson)">分析引擎返回了错误，正在尝试加载诊断报告...</span>`;
                logBox.appendChild(div);
              }
            }
            setTimeout(() => App.navigate('#/report/' + workId), 900);
            return;
          }
        } catch (e) { /* skip */ }
      }
    }
  } catch (err) {
    const root = document.getElementById('spaApp');
    root.innerHTML = `
      <main class="max-w-2xl mx-auto px-6" style="padding-top:80px;text-align:center">
        <p class="mono text-xs text-muted tracking-[4px] mb-3 uppercase">Connection Error</p>
        <h1 class="serif text-2xl font-bold mb-4" style="color:var(--crimson)">连接中断</h1>
        <p class="text-sm text-muted mb-6">${esc(err.message)}</p>
        <button class="btn btn-primary" onclick="location.reload()" style="font-size:13px">重试</button>
      </main>`;
  }
}
