const PHASES = [
  { minChars: 0,    label: '接收作品文本', desc: '正在读取并预处理作品内容' },
  { minChars: 600,  label: '体裁识别与基准匹配', desc: '识别文学体裁、匹配分析策略、选定比较基准' },
  { minChars: 3500, label: '十六维逐项评分', desc: '对语言、叙事、思想、审美四个层面逐维度分析打分' },
  { minChars: 11000,label: '生成分析报告', desc: '整合评分结果，撰写文学定位、张力分析、编辑建议等深度内容' },
  { minChars: 16000,label: '最终校验与输出', desc: '执行自检清单，确保报告完整性与一致性' },
];

App.register('/analyze', () => {
  const id = App.state.params.id;
  if (!id) { App.navigate('#/'); return; }

  const root = document.getElementById('spaApp');
  root.innerHTML = `
    <main class="max-w-2xl mx-auto px-6" style="padding-top:80px;padding-bottom:80px">
      <section class="fade-up d1 text-center">

        <p class="mono text-xs text-muted tracking-[4px] mb-2 uppercase">Analysis in Progress</p>
        <h1 class="serif text-3xl md:text-4xl font-black mb-8">正在分析</h1>

        <div class="card" style="padding:32px 28px 24px;max-width:480px;margin:0 auto">
          <div class="progress-track" id="progressTrack">
            <div class="progress-indeterminate" id="analyzeProgress"></div>
          </div>

          <div class="mb-2 mt-5" style="text-align:left">
            <p class="text-sm font-semibold serif mb-1" id="phaseLabel" style="transition:color .4s">${PHASES[0].label}</p>
            <p class="text-xs" style="color:var(--muted);line-height:1.6" id="phaseDesc">${PHASES[0].desc}</p>
          </div>

          <div class="mt-4 pt-3" style="border-top:1px solid var(--rule);text-align:left" id="checklist"></div>
        </div>

        <p class="text-xs text-muted mt-3" id="moduleHint" style="display:none"></p>
      </section>
    </main>`;

  API.getWork(id).then(w => {
    if (w.ancestor_dialogue) {
      const hint = document.getElementById('moduleHint');
      if (hint) { hint.textContent = '已启用「先贤灵境」· 分析完成后将在报告中呈现文学先贤对谈'; hint.style.display = 'block'; }
    }
  }).catch(() => {});

  startStream(id);
});

let _maxPhaseReached = -1;

function updateProgress(chars, forceDone) {
  const barEl = document.getElementById('analyzeProgress');
  const trackEl = document.getElementById('progressTrack');
  const phaseLabelEl = document.getElementById('phaseLabel');
  const phaseDescEl = document.getElementById('phaseDesc');
  const checklistEl = document.getElementById('checklist');

  if (forceDone) {
    if (trackEl) trackEl.classList.add('progress-done');
    if (barEl) barEl.classList.add('progress-done');
    if (phaseLabelEl) phaseLabelEl.textContent = '分析完成';
    if (phaseDescEl) phaseDescEl.textContent = '正在加载报告...';
    if (checklistEl) {
      checklistEl.innerHTML = PHASES.map(p =>
        `<div class="flex items-center gap-2 mb-1.5" style="font-size:12px;color:var(--jade)"><i class="fas fa-check-circle" style="color:var(--jade);font-size:12px"></i><span>${p.label}</span></div>`
      ).join('');
    }
    return;
  }

  let currentPhase = 0;
  PHASES.forEach((p, i) => { if (chars >= p.minChars) currentPhase = i; });
  if (currentPhase < _maxPhaseReached) currentPhase = _maxPhaseReached;
  _maxPhaseReached = currentPhase;

  const phase = PHASES[currentPhase];
  if (phaseLabelEl) phaseLabelEl.textContent = phase.label;
  if (phaseDescEl) phaseDescEl.textContent = phase.desc;

  if (checklistEl) {
    checklistEl.innerHTML = PHASES.map((p, i) => {
      const done = i < currentPhase;
      const active = i === currentPhase;
      const icon = done
        ? '<i class="fas fa-check-circle" style="color:var(--jade);font-size:12px"></i>'
        : active
        ? '<i class="fas fa-circle" style="color:var(--gold);font-size:6px;animation:pulse 1.2s ease-in-out infinite"></i>'
        : '<i class="far fa-circle" style="color:rgba(0,0,0,.12);font-size:11px"></i>';
      const cls = done ? '' : active ? '' : 'text-muted/40';
      return `<div class="flex items-center gap-2 mb-1.5 ${cls}" style="font-size:12px">${icon}<span>${p.label}</span></div>`;
    }).join('');
  }
}

async function startStream(workId) {
  updateProgress(0, false);

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
            if (charTotal - lastUpdate > 600) {
              lastUpdate = charTotal;
              updateProgress(charTotal, false);
            }
          } else if (event.type === 'done') {
            updateProgress(0, true);
            const result = event.result || {};
            if (!result.ok) {
              const checklistEl = document.getElementById('checklist');
              if (checklistEl) {
                checklistEl.innerHTML = `<p class="text-xs" style="color:var(--crimson)"><i class="fas fa-exclamation-triangle mr-1"></i>分析引擎返回了错误，正在尝试加载诊断报告...</p>`;
              }
            }
            setTimeout(() => App.navigate('#/report/' + workId), 900);
            return;
          }
        } catch (e) { /* skip */ }
      }
    }
  } catch (err) {
    const card = document.querySelector('.card');
    if (card) {
      card.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-exclamation-circle mb-3" style="font-size:28px;color:var(--crimson)"></i>
          <p class="text-sm font-semibold mb-1" style="color:var(--crimson)">连接中断</p>
          <p class="text-xs" style="color:var(--muted)">${esc(err.message)}</p>
          <button class="btn btn-primary mt-3" onclick="location.reload()" style="font-size:13px">重试</button>
        </div>`;
    }
  }
}
