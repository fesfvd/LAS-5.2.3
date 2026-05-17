App.register('/upload', () => {
  document.title = '提交作品 — LAS';
  const root = document.getElementById('spaApp');
  root.innerHTML = `
    <main class="max-w-3xl mx-auto px-6" style="padding-top:80px;padding-bottom:80px">
      <section class="fade-up d1">
        <p class="mono text-xs text-muted tracking-[4px] mb-2 uppercase">Submit Your Work</p>
        <h1 class="serif text-4xl md:text-5xl font-black leading-[1.1] mb-6">提交作品</h1>
        <form id="workForm" class="card" style="background:rgba(255,255,255,.5)">
          <input class="input mb-3" name="title" placeholder="作品名称" required maxlength="200">
          <input class="input mb-3" name="author" placeholder="作者（选填，经典模式可由系统自动识别）" maxlength="100">
          <div class="flex items-center gap-4 mb-3" style="flex-wrap:wrap">
            <select name="mode" id="modeSelect" class="input" style="width:auto;min-width:120px">
              <option value="original">原创模式</option>
              <option value="classic">经典模式</option>
            </select>
            <label class="flex items-center gap-2 cursor-pointer" style="user-select:none">
              <input type="checkbox" name="ancestor_dialogue" value="true" style="accent-color:var(--gold);width:16px;height:16px">
              <span class="text-sm text-muted">启用「先贤灵境」</span>
              <span class="text-xs text-muted/60" style="font-size:11px">邀请文学先贤共读对谈</span>
            </label>
          </div>
          <div id="contentArea">
            <textarea class="input mb-2" name="content" placeholder="粘贴或输入作品全文..." required style="min-height:200px"></textarea>
            <p class="text-xs text-muted mb-3" id="contentHint">原创模式下需要提供完整作品正文以供逐维度分析。</p>
          </div>
          <p id="uploadError" class="text-xs" style="color:var(--crimson);margin-bottom:12px;display:none"></p>
          <button type="submit" class="btn btn-primary">开始分析 &rarr;</button>
        </form>
      </section>
    </main>`;

  // Toggle content requirement based on mode
  const modeSelect = document.getElementById('modeSelect');
  const contentArea = document.getElementById('contentArea');
  const contentHint = document.getElementById('contentHint');
  modeSelect.addEventListener('change', () => {
    const isClassic = modeSelect.value === 'classic';
    if (isClassic) {
      contentArea.innerHTML = `
        <textarea class="input mb-2" name="content" placeholder="经典模式：可留空。LLM 将基于训练知识库中的全文记忆进行分析。" style="min-height:80px"></textarea>
        <p class="text-xs text-muted mb-3" id="contentHint">经典模式无需提供正文——仅凭作品名即可分析。也可粘贴部分文本辅助定位版本。</p>`;
    } else {
      contentArea.innerHTML = `
        <textarea class="input mb-2" name="content" placeholder="粘贴或输入作品全文..." required style="min-height:200px"></textarea>
        <p class="text-xs text-muted mb-3" id="contentHint">原创模式下需要提供完整作品正文以供逐维度分析。</p>`;
    }
  });

  bindUploadHandler();
});

function bindUploadHandler() {
  const form = document.getElementById('workForm');
  const errEl = document.getElementById('uploadError');
  if (!form) return;
  form.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.ancestor_dialogue = form.querySelector('[name="ancestor_dialogue"]').checked;
    delete data[''];
    if (data.mode === 'original' && !data.content.trim()) {
      errEl.textContent = '原创模式需要提供作品正文';
      errEl.style.display = 'block';
      return;
    }
    errEl.style.display = 'none';
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = '提交中...';
    try {
      const work = await API.createWork(data);
      App.navigate('#/analyze/' + work.id);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = '开始分析 →';
    }
  };
}
