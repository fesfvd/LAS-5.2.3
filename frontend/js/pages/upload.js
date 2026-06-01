App.register('/upload', () => {
  document.title = '提交作品 — LAS 文学分析';
  const root = document.getElementById('spaApp');
  var isGuest = (localStorage.getItem('las_username') || '').startsWith('guest_');
  var textMax = isGuest ? 50000 : 500000;
  var textHint = isGuest ? '粘贴全文，或点击上方按钮上传文件...（游客上限 5 万字）' : '粘贴全文，或点击上方按钮上传文件...（上限 50 万字）';
  root.innerHTML = `
    <div class="submit-container">
      <div class="submit-header">
        <p class="text-xs text-muted mb-1"><span class="mono tracking-[4px]">SUBMISSION</span> <span style="font-family:'Noto Sans SC',sans-serif;letter-spacing:0">作品录入</span></p>
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
            <input class="input-underline" name="author" placeholder="佚名" maxlength="100">
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
          <div class="field-group" style="position:relative">
            <label class="field-label">MODEL <span class="field-label-zh">推理模型</span></label>
            <div class="model-selector" id="modelSelector">
              <button type="button" class="model-selector-trigger" id="modelTrigger">
                <span id="modelLabel">DeepSeek V4 Flash</span>
                <span class="chevron">&#9660;</span>
              </button>
              <div class="model-selector-dropdown" id="modelDropdown">
                <div class="model-option" data-model="deepseek-v4-pro" id="proOption">DeepSeek V4 Pro <span style="font-size:9px;color:var(--gold);font-weight:600;letter-spacing:1px">高级</span><span class="pro-lock" style="font-size:9px;color:var(--muted);margin-left:4px;display:none">登录后可用</span></div>
                <div class="model-option selected" data-model="deepseek-v4-flash">DeepSeek V4 Flash</div>
              </div>
            </div>
            <div class="model-badge" id="modelBadge" style="display:none;width:300px;max-height:calc(100vh - 100px);overflow-y:auto;padding:24px;background:var(--paper);border:1px solid var(--rule);border-radius:12px"></div>
          </div>
        </div>

        <div class="textarea-group">
          <div class="flex items-center justify-between">
            <label class="field-label">TEXT <span class="field-label-zh">作品正文</span></label>
            <span id="wordCount"><span class="mono" style="font-size:10px;color:var(--muted)">0</span> <span style="font-size:10px;color:var(--muted)">字</span></span>
          </div>
          <div class="upload-bar">
            <input type="file" id="fileInput" accept=".txt,.md,.docx,.doc,.pdf,.json,.csv,.xml,.html" hidden>
            <button type="button" class="upload-btn" id="uploadBtn" style="display:inline-flex!important;align-items:center;padding:6px 16px;border:1px solid var(--gold);border-radius:4px;background:transparent;color:var(--gold);cursor:pointer;font-size:0.78rem;font-family:'JetBrains Mono',monospace"><i class="fas fa-folder-open mr-1.5" aria-label="上传文件"></i>上传 TXT / MD / Word</button>
            <span class="upload-hint" id="uploadHint">或拖拽文件到文本框</span>
            <span class="upload-done" id="uploadDone" style="display:none"><i class="fas fa-file-alt mr-1"></i><span id="uploadName"></span><span class="upload-clear" id="uploadClear">×</span></span>
          </div>
	          <div class="textarea-wrap"><textarea class="input-underline textarea" name="content" id="contentArea" placeholder="${textHint}" required maxlength="${textMax}"></textarea></div>
          <p class="text-xs text-muted mt-1" style="font-size:10px;opacity:.6" id="contentHint"><span class="mono">//</span> 原创模式不必提交完稿，未完结片段同样可以分析</p>
        </div>

        <div class="submit-options">
          <label class="ancestor-toggle">
            <input type="checkbox" name="ancestor_dialogue" value="true">
            <div class="toggle-track"><div class="toggle-dot"></div></div>
            <div>
              <span class="mono text-xs tracking-wider" style="color:var(--gold)">ANCESTOR <span style="font-family:'Noto Sans SC';font-size:11px">先贤灵境</span></span>
            </div>
          </label>
          <span class="submit-error" id="uploadError">> ⚠ ERROR: 正文不能为空</span>
        </div>

        <div class="submit-action">
          <div id="quotaInfo" style="text-align:center;margin-bottom:8px;font-size:11px;color:var(--muted)">加载中...</div>
          <button type="submit" class="btn btn-primary" id="submitBtn">INITIATE <span class="btn-zh">启动分析</span> &rarr;</button>
        </div>
      </form>

      <div class="submit-overlay" id="submitOverlay">
        <div class="submit-log" id="submitLog1"></div>
        <div class="submit-log" id="submitLog2"></div>
        <div class="submit-log" id="submitLog3" style="color:var(--gold)"></div>
      </div>
    </div>`;

  const modeInput = document.getElementById('modeInput');
  const textarea = document.getElementById('contentArea');
  const contentHint = document.getElementById('contentHint');
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      modeInput.value = mode;
      if (mode === 'classic') {
        textarea.removeAttribute('required');
        textarea.placeholder = isGuest ? '经典模式正文可留空，系统将基于知识库记忆进行分析...（游客上限 5 万字）' : '经典模式正文可留空，系统将基于知识库记忆进行分析...';
        contentHint.textContent = '// 经典模式无需正文，仅凭作品名启动';
      } else {
        textarea.setAttribute('required', '');
        textarea.placeholder = textHint;
        contentHint.textContent = '// 原创模式不必提交完稿，未完结片段同样可以分析';
      }
    });
  });

  // ── Model config (multi-vendor ready) ──
  const MODEL_CONFIG = {
    'deepseek-v4-pro': {
      name: 'DeepSeek V4 Pro',
      vendor: 'DeepSeek',
      tag: '深度推理旗舰',
      subtitle: '世界文学经典为锚点，执行逐维差值分析；擅长流派识别、技法拆解与意象系统挖掘。',
      badges: [
        { label: '流派识别', desc: '精准识别 40+ 文学流派，魔幻现实主义、意识流、元叙事……' },
        { label: '技法拆解', desc: '拆解视角转换、时间折叠、环形结构等高级叙事技法' },
        { label: '人物弧光', desc: '追踪成长轨迹、欲望位移、道德抉择' },
        { label: '意象系统', desc: '挖掘象征网络与隐喻层，构建作品主题图谱' },
      ],
      scene: '适用于长篇深度分析、经典文学对照式分析、复杂人物弧光的逐维评估。',
    },
    'deepseek-v4-flash': {
      name: 'DeepSeek V4 Flash',
      vendor: 'DeepSeek',
      tag: '敏捷推理引擎',
      subtitle: '同等分析工作量，显著缩短等待时间；支持单章试读、片段打磨、长篇通读三种模式，百万字上下文一次提交无需拆章。',
      badges: [
        { label: '单章试读', desc: '提交一章，快速验证叙事方向是否偏离主线' },
        { label: '片段打磨', desc: '粘贴关键段落，检查修辞密度与语言质地' },
        { label: '长篇通读', desc: '百万字级一次提交，自动处理不拆章' },
      ],
      scene: '适用于快速迭代写作中的片段打磨、网文长篇节奏自检、需要即时反馈的日常审稿。',
    },
  };

  window.__LAS_MODEL = 'deepseek-v4-flash';
  // Guests can only use Flash — hide Pro option
  if (isGuest) {
    var proOpt = document.getElementById('proOption');
    if (proOpt) { proOpt.style.opacity = '0.4'; proOpt.style.pointerEvents = 'none'; proOpt.style.cursor = 'not-allowed'; proOpt.querySelector('.pro-lock').style.display = 'inline'; }
  }

  const modelSel = document.getElementById('modelSelector');
  const modelTrigger = document.getElementById('modelTrigger');
  const modelLabel = document.getElementById('modelLabel');
  const modelDropdown = document.getElementById('modelDropdown');
  modelTrigger.addEventListener('click', (e) => { e.stopPropagation(); modelSel.classList.toggle('open'); });
  var _docClickHandler = function() { modelSel.classList.remove('open'); };
  document.addEventListener('click', _docClickHandler);

  // ── Style model badge as fixed right sidebar (stays in page DOM, cleaned on nav) ──
  (function() {
    var badge = document.getElementById('modelBadge');
    if (!badge) return;
    badge.style.cssText = 'position:fixed;right:max(24px,calc((100vw - 1440px) / 2));top:80px;width:280px;max-height:calc(100vh - 100px);overflow-y:auto;padding:24px;background:var(--paper);border:1px solid var(--rule);border-radius:12px;z-index:var(--z-raised,10);transition:opacity .35s,visibility .35s';
  })();

  var modelBadge = document.getElementById('modelBadge');

  function updateModelCard(modelId) {
    var cfg = MODEL_CONFIG[modelId];
    if (!cfg) { modelBadge.innerHTML = ''; return; }
    var visible = window.innerWidth >= 1200;
    var badgesHTML = cfg.badges.map(function(b) {
      return '<div style="margin-bottom:12px">'
        + '<span style="display:inline-block;font-size:11px;font-weight:600;color:var(--ink);margin-bottom:3px;letter-spacing:.5px">' + b.label + '</span>'
        + '<p style="font-size:12px;color:var(--muted);line-height:1.8;margin:0">' + b.desc + '</p>'
        + '</div>';
    }).join('');
    modelBadge.style.opacity = visible ? '1' : '0';
    modelBadge.style.visibility = visible ? 'visible' : 'hidden';
    modelBadge.style.pointerEvents = visible ? 'auto' : 'none';
    modelBadge.innerHTML = visible ? (
      // Header: vendor + name
      '<div style="margin-bottom:16px;display:flex;align-items:baseline;gap:8px;flex-wrap:nowrap">'
      + '<span style="font-size:10px;padding:2px 8px;border-radius:99px;background:var(--gold-soft);color:var(--gold);font-weight:500;white-space:nowrap;flex-shrink:0;font-family:\'JetBrains Mono\',monospace">' + cfg.vendor + '</span>'
      + '<span style="font-size:17px;font-weight:700;color:var(--ink);white-space:nowrap;font-family:\'JetBrains Mono\',monospace">' + cfg.name.replace(cfg.vendor + ' ', '') + '</span>'
      + '</div>'
      // Type tag
      + '<p style="font-size:11px;color:var(--gold);font-weight:600;margin-bottom:12px;letter-spacing:1px">' + cfg.tag + '</p>'
      // Subtitle
      + '<p style="font-size:13px;color:var(--ink);line-height:1.8;margin-bottom:20px">' + cfg.subtitle + '</p>'
      // Badges
      + badgesHTML
      // Scene
      + '<p style="font-size:11px;color:var(--muted);line-height:1.7;margin-top:8px;padding-top:12px;border-top:1px solid var(--rule)">' + cfg.scene + '</p>'
      + '</div>'
    ) : '';
  }
  updateModelCard('deepseek-v4-flash');
  window.addEventListener('resize', function() { updateModelCard(window.__LAS_MODEL); });

  // Load user quota
  async function loadQuota() {
    try {
      var me = await API._fetch('/users/me');
      if (!me.ok) return;
      var dq = me.user.daily_quota || 0;
      var pq = me.user.permanent_quota || 0;
      var total = dq + pq;
      var quotaEl = document.getElementById('quotaInfo');
      var submitBtn = document.getElementById('submitBtn');
      if (me.user.role === 'admin') {
        quotaEl.innerHTML = '<span style="color:var(--gold)">管理员 · 无限制</span>';
      } else if (total <= 0) {
        quotaEl.innerHTML = '<span style="color:var(--crimson)">今日额度已用完</span> · <span style="color:var(--gold);cursor:pointer;text-decoration:underline" onclick="LAS_showReward()">打赏获取更多次数</span>';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.4';
        submitBtn.style.cursor = 'not-allowed';
      } else {
        quotaEl.innerHTML = '今日剩余 <span class="mono" style="color:var(--gold)">' + dq + '</span> 次 · 永久剩余 <span class="mono" style="color:var(--gold)">' + pq + '</span> 次';
      }
    } catch(e) {
      quotaEl.innerHTML = '<span style="color:var(--muted)">无法获取配额信息，请刷新页面重试</span>';
    }
  }
  loadQuota();

  modelDropdown.querySelectorAll('.model-option').forEach(opt => {
    opt.addEventListener('click', () => {
      if (isGuest && opt.dataset.model === 'deepseek-v4-pro') return;  // guest locked to Flash
      window.__LAS_MODEL = opt.dataset.model;
      modelLabel.textContent = MODEL_CONFIG[opt.dataset.model].name;
      modelDropdown.querySelectorAll('.model-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      modelSel.classList.remove('open');
      updateModelCard(opt.dataset.model);
    });
  });

  // ── File upload & word count ──
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadHint = document.getElementById('uploadHint');
  const uploadDone = document.getElementById('uploadDone');
  const uploadName = document.getElementById('uploadName');
  const uploadClear = document.getElementById('uploadClear');
  const wordCount = document.getElementById('wordCount');

  uploadBtn.addEventListener('click', () => fileInput.click());
  uploadClear.addEventListener('click', () => {
    fileInput.value = '';
    uploadDone.style.display = 'none';
    uploadBtn.style.display = '';
    uploadHint.style.display = '';
    textarea.value = '';
    updateWordCount();
  });
  fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

  // Drag & drop onto textarea
  textarea.addEventListener('dragover', (e) => { e.preventDefault(); textarea.classList.add('dragover'); });
  textarea.addEventListener('dragleave', () => { textarea.classList.remove('dragover'); });
  textarea.addEventListener('drop', (e) => {
    e.preventDefault();
    textarea.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  });

  // Word count on input/paste
  textarea.addEventListener('input', updateWordCount);
  function updateWordCount() {
    const n = (textarea.value || '').replace(/\s/g, '').length;
    wordCount.textContent = n + ' 字';
  }

  function handleFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const nameNoExt = file.name.replace(/\.[^.]+$/, '');

    function onText(text) {
      textarea.value = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      updateWordCount();
      const titleInput = document.querySelector('input[name="title"]');
      if (titleInput && !titleInput.value.trim()) {
        const cleanName = nameNoExt.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanName) titleInput.value = cleanName;
      }
      uploadName.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
      uploadBtn.style.display = 'none';
      uploadHint.style.display = 'none';
      uploadDone.style.display = '';
    }

    function onErr() {
      const errEl = document.getElementById('uploadError');
      errEl.textContent = '> ⚠ ERROR: 文件读取失败';
      errEl.classList.add('show');
      setTimeout(() => errEl.classList.remove('show'), 3000);
    }

    if (ext === 'docx') {
      if (typeof mammoth === 'undefined') { onErr(); return; }
      mammoth.extractRawText({ arrayBuffer: file.arrayBuffer() })
        .then(r => onText(r.value))
        .catch(onErr);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onText(reader.result);
    reader.onerror = onErr;
    reader.readAsText(file);
  }

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
    if (data.mode === 'original' && (!data.author || !data.author.trim())) data.author = '佚名';

    if (data.mode === 'original' && !data.content.trim()) {
      errEl.classList.add('show');
      setTimeout(() => errEl.classList.remove('show'), 3000);
      return;
    }
    errEl.classList.remove('show');

    // Disable submit button during submission
    var submitBtn = form.querySelector('button[type="submit"]');
    var origHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'SUBMITTING <span class="btn-zh">提交中...</span>';

    // Show overlay with animated logs + cancel
    const formBody = form;
    formBody.style.opacity = '0.3';
    formBody.style.filter = 'blur(2px)';
    formBody.style.pointerEvents = 'none';
    // Abort controller for createWork request
    var createCtrl = new AbortController();
    var createTimeout = setTimeout(function() { createCtrl.abort(); }, 60000); // 60s timeout
    // Add cancel button to overlay
    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'mono text-xs';
    cancelBtn.style.cssText = 'margin-top:24px;padding:6px 20px;border:1px solid var(--rule-strong);border-radius:4px;background:transparent;color:var(--muted);cursor:pointer;transition:all .2s;font-family:JetBrains Mono,monospace;opacity:0';
    cancelBtn.addEventListener('click', function() {
      createCtrl.abort();
      clearTimeout(createTimeout);
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHTML;
      overlay.classList.remove('show');
      formBody.style.opacity = '';
      formBody.style.filter = '';
      formBody.style.pointerEvents = '';
      cancelBtn.remove();
    });
    overlay.appendChild(cancelBtn);
    setTimeout(() => overlay.classList.add('show'), 300);

    // First two logs show on timer (visual only), third waits for API
    var log1Timer = setTimeout(function() {
      var el = document.getElementById('submitLog1');
      if (el) el.textContent = '> 正在接收文本数据...';
    }, 400);
    // Fade in cancel button after first log
    setTimeout(function() { cancelBtn.style.opacity = '1'; }, 500);
    var log2Timer = setTimeout(function() {
      var el = document.getElementById('submitLog2');
      if (el) el.textContent = '> 正在校验完整性...';
    }, 1000);

    try {
      console.log('[UPLOAD] createWork start...');
      const work = await API.createWork(data, createCtrl.signal);
      console.log('[UPLOAD] createWork ok, id=' + (work.id || 'nil'));
      clearTimeout(createTimeout);
      var el3 = document.getElementById('submitLog3');
      if (el3) el3.textContent = '> 分析准备就绪';
      var target = '#/analyze/' + (work.id || '');
      console.log('[UPLOAD] nav to ' + target + ' in 300ms');
      setTimeout(function() {
        console.log('[UPLOAD] reset _transitionPhase=' + _transitionPhase);
        _transitionPhase = 'idle';
        _pendingRoute = null;
        var ov = document.getElementById('transitionOverlay');
        if (ov) ov.classList.remove('enter', 'exit');
        App.navigate(target);
        console.log('[UPLOAD] App.navigate done');
      }, 300);
    } catch (err) {
      console.log('[UPLOAD] createWork fail: ' + err.name + ' | ' + err.message);
      clearTimeout(createTimeout);
      if (err.name === 'AbortError') return;
      clearTimeout(log1Timer);
      clearTimeout(log2Timer);
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHTML;
      overlay.classList.remove('show');
      formBody.style.opacity = '';
      formBody.style.filter = '';
      formBody.style.pointerEvents = '';
      ['submitLog1','submitLog2','submitLog3'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = '';
      });
      errEl.textContent = '> ⚠ ERROR: ' + err.message;
      errEl.classList.add('show');
    }
  };
}
