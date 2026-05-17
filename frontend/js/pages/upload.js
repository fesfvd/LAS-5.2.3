App.register('/upload', () => {
  document.title = '提交作品 — LAS';
  const root = document.getElementById('spaApp');
  root.innerHTML = `
    <main class="max-w-2xl mx-auto px-6" style="padding-top:100px;padding-bottom:120px">

      <section class="fade-up d1">
        <p class="mono text-xs text-muted tracking-[4px] mb-3 uppercase">Submission Protocol</p>
        <h1 class="serif text-5xl font-black leading-[1.1] mb-4">提交作品</h1>
        <p class="text-muted text-sm mb-12" style="max-width:420px">作品初始文学价值为零。每一分都须通过证据和与基准作品的严格比较获得。</p>
      </section>

      <form id="workForm" class="fade-up d2">

        <div class="mb-8">
          <label class="mono text-xs tracking-widest uppercase text-muted mb-2 block">Work Title</label>
          <input class="input-underline" name="title" placeholder="作品名称" required maxlength="200">
        </div>

        <div class="mb-8">
          <label class="mono text-xs tracking-widest uppercase text-muted mb-2 block">Author (Optional)</label>
          <input class="input-underline" name="author" placeholder="作者（经典模式可由系统自动识别）" maxlength="100">
        </div>

        <div class="mb-8">
          <label class="mono text-xs tracking-widest uppercase text-muted mb-2 block">Analysis Mode</label>
          <div class="flex gap-4">
            <button type="button" class="mode-btn active" data-mode="original">Original</button>
            <button type="button" class="mode-btn" data-mode="classic">Classic</button>
          </div>
          <input type="hidden" name="mode" id="modeInput" value="original">
        </div>

        <div class="mb-8" id="contentArea">
          <label class="mono text-xs tracking-widest uppercase text-muted mb-2 block">Full Text</label>
          <textarea class="input-underline textarea" name="content" placeholder="粘贴或输入作品全文以供逐维度审查..." required></textarea>
          <p class="mono text-xs text-muted mt-2" style="font-size:10px;opacity:.7">// 原创模式要求提供完整正文，拒绝可读性致幻</p>
        </div>

        <label class="ancestor-toggle">
          <input type="checkbox" name="ancestor_dialogue" value="true">
          <div class="toggle-track"><div class="toggle-dot"></div></div>
          <div>
            <span class="mono text-xs text-gold tracking-wider">先贤灵境</span>
            <span class="text-xs text-muted ml-2">邀请文学先贤共读对谈</span>
          </div>
        </label>

        <div class="mt-16">
          <p id="uploadError" class="mono text-xs mb-4" style="color:var(--crimson);display:none"></p>
          <button type="submit" class="btn btn-primary">Initiate Analysis &rarr;</button>
        </div>

      </form>
    </main>`;

  const modeInput = document.getElementById('modeInput');
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      modeInput.value = mode;
      const ta = document.querySelector('textarea[name="content"]');
      const hint = document.querySelector('#contentArea .mono');
      if (mode === 'classic') {
        ta.removeAttribute('required');
        ta.style.minHeight = '80px';
        ta.placeholder = '经典模式：正文可留空。LLM 将基于知识库中的全文记忆进行分析。';
        if (hint) hint.textContent = '// 经典模式无需正文，仅凭作品名即可锚定谱系';
      } else {
        ta.setAttribute('required', '');
        ta.style.minHeight = '200px';
        ta.placeholder = '粘贴或输入作品全文以供逐维度审查...';
        if (hint) hint.textContent = '// 原创模式要求提供完整正文，拒绝可读性致幻';
      }
    });
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
      errEl.textContent = '> ERROR: 原创模式需要提供作品正文';
      errEl.style.display = 'block';
      return;
    }
    errEl.style.display = 'none';
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = 'Processing...';
    try {
      const work = await API.createWork(data);
      App.navigate('#/analyze/' + work.id);
    } catch (err) {
      errEl.textContent = '> ERROR: ' + err.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = 'Initiate Analysis &rarr;';
    }
  };
}
