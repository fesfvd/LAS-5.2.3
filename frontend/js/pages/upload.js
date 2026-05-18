App.register('/upload', () => {
  document.title = '提交作品 — LAS';
  const root = document.getElementById('spaApp');
  root.innerHTML = `
    <div class="submit-container">
      <div class="submit-header">
        <p class="mono text-xs text-muted tracking-[4px] mb-1">SUBMISSION 作品录入</p>
        <h1 class="serif text-3xl font-black leading-[1.1]">提交作品</h1>
      </div>

      <form id="workForm" class="submit-form">

        <div class="submit-row-2">
          <div class="field-group">
            <label class="field-label">TITLE <span class="field-label-zh">作品名称</span></label>
            <input class="input-underline" name="title" placeholder="必填" required maxlength="200">
          </div>
          <div class="field-group">
            <label class="field-label">AUTHOR <span class="field-label-zh">作者</span></label>
            <input class="input-underline" name="author" placeholder="经典模式可自动识别" maxlength="100">
          </div>
        </div>

        <div class="submit-row-2" style="align-items:flex-end">
          <div class="field-group">
            <label class="field-label">MODE <span class="field-label-zh">分析模式</span></label>
            <div class="mode-switch">
              <button type="button" class="mode-btn active" data-mode="original">ORIGINAL <span class="mode-btn-zh">原创</span></button>
              <button type="button" class="mode-btn" data-mode="classic">CLASSIC <span class="mode-btn-zh">经典</span></button>
            </div>
            <input type="hidden" name="mode" id="modeInput" value="original">
          </div>
          <div style="flex:1"></div>
        </div>

        <div class="textarea-group">
          <label class="field-label">TEXT <span class="field-label-zh">作品正文</span></label>
          <textarea class="input-underline textarea" name="content" placeholder="粘贴全文，系统将进行多维标尺分析..." required></textarea>
          <p class="mono text-xs text-muted mt-1" style="font-size:10px;opacity:.6" id="contentHint">// 原创模式必须提供完整正文</p>
        </div>

        <div class="submit-options">
          <label class="ancestor-toggle">
            <input type="checkbox" name="ancestor_dialogue" value="true">
            <div class="toggle-track"><div class="toggle-dot"></div></div>
            <div>
              <span class="mono text-xs tracking-wider" style="color:var(--gold)">ANCESTOR <span style="font-family:'Noto Sans SC';font-size:11px">先贤灵境</span></span>
            </div>
          </label>
          <span class="submit-error" id="uploadError">> ERROR: 正文不能为空</span>
        </div>

        <div class="submit-action">
          <button type="submit" class="btn btn-primary">INITIATE <span class="btn-zh">启动分析</span> &rarr;</button>
        </div>
      </form>

      <div class="submit-overlay" id="submitOverlay">
        <div class="submit-log" id="submitLog1"></div>
        <div class="submit-log" id="submitLog2"></div>
        <div class="submit-log" id="submitLog3" style="color:var(--gold)"></div>
      </div>
    </div>`;

  const modeInput = document.getElementById('modeInput');
  const textarea = document.querySelector('textarea[name="content"]');
  const contentHint = document.getElementById('contentHint');
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      modeInput.value = mode;
      if (mode === 'classic') {
        textarea.removeAttribute('required');
        textarea.placeholder = '经典模式正文可留空，系统将基于知识库记忆进行分析...';
        contentHint.textContent = '// 经典模式无需正文，仅凭作品名启动';
      } else {
        textarea.setAttribute('required', '');
        textarea.placeholder = '粘贴全文，系统将进行多维标尺分析...';
        contentHint.textContent = '// 原创模式必须提供完整正文';
      }
    });
  });

  bindSubmitHandler();
});

function bindSubmitHandler() {
  const form = document.getElementById('workForm');
  const errEl = document.getElementById('uploadError');
  const overlay = document.getElementById('submitOverlay');
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.ancestor_dialogue = form.querySelector('[name="ancestor_dialogue"]').checked;
    delete data[''];

    if (data.mode === 'original' && !data.content.trim()) {
      errEl.classList.add('show');
      setTimeout(() => errEl.classList.remove('show'), 3000);
      return;
    }
    errEl.classList.remove('show');

    // Show overlay with animated logs
    const formBody = form;
    formBody.style.opacity = '0.3';
    formBody.style.filter = 'blur(2px)';
    formBody.style.pointerEvents = 'none';
    setTimeout(() => overlay.classList.add('show'), 300);

    const logs = [
      { el: 'submitLog1', text: '> 正在接收文本数据...', delay: 400 },
      { el: 'submitLog2', text: '> 正在校验完整性...', delay: 1000 },
      { el: 'submitLog3', text: '> 分析准备就绪', delay: 1800 }
    ];
    logs.forEach(log => {
      setTimeout(() => {
        const el = document.getElementById(log.el);
        if (el) el.textContent = log.text;
      }, log.delay);
    });

    try {
      const work = await API.createWork(data);
      setTimeout(() => App.navigate('#/analyze/' + work.id), 2400);
    } catch (err) {
      overlay.classList.remove('show');
      formBody.style.opacity = '';
      formBody.style.filter = '';
      formBody.style.pointerEvents = '';
      logs.forEach(log => {
        const el = document.getElementById(log.el);
        if (el) el.textContent = '';
      });
      errEl.textContent = '> ERROR: ' + err.message;
      errEl.classList.add('show');
    }
  };
}
