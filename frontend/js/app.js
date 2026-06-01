function esc(s) {
  if (s === null || s === undefined) return '';
  var div = document.createElement('div');
  div.textContent = String(s);
  return div.innerHTML;
}
function debracket(s) { return String(s||'').replace(/^《|》$/g, ''); }
function nl2p(text) {
  if (!text) return '';
  return text.split('\n').filter(function(l) { return l.trim(); }).map(function(l) { return '<p class="mb-2 last:mb-0">' + l + '</p>'; }).join('');
}

// ── Transition state machine ──

var CHAPTER = {
  '/upload':  ['作品提交', 'SUBMISSION'],
  '/works':   ['作品管理', 'WORKSPACE'],
  '/report':  ['分析报告', 'REPORT'],
  '/analyze': ['分析中',   'ANALYSIS'],
  '/login':   ['登录',     'AUTH'],
  '/register':['注册',     'REGISTER'],
  '/profile': ['个人中心', 'PROFILE'],
  '/forgot':  ['忘记密码', 'RESET'],
  '/privacy': ['隐私政策', 'PRIVACY'],
  '/admin':   ['管理后台', 'ADMIN'],
  '/quotes':  ['金句广场', 'MUSES'],
  '/compare': ['作品对比', 'COMPARISON']
};

var _transitionPhase = 'idle';
var _pendingRoute = null;
var _initialLoad = true;

function _buildOverlay(zh, en) {
  var overlay = document.getElementById('transitionOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'transitionOverlay';
    overlay.innerHTML =
      '<div class="trans-inner">' +
        '<p class="trans-label mono">Chapter &mdash;</p>' +
        '<h2 class="trans-title serif"></h2>' +
        '<p class="trans-sub mono"></p>' +
      '</div>';
    document.body.appendChild(overlay);
  }
  overlay.querySelector('.trans-title').textContent = zh;
  overlay.querySelector('.trans-sub').textContent = en;
  overlay.classList.remove('exit');
  return overlay;
}

function _startTransition(targetHash, zh, en) {
  if (_transitionPhase !== 'idle') return;

  // Safety: force reset after 800ms in case animation stalls
  var safety = setTimeout(function() {
    if (_transitionPhase !== 'idle') {
      _transitionPhase = 'idle';
      var ov = document.getElementById('transitionOverlay');
      if (ov) { ov.classList.remove('enter', 'exit'); }
    }
  }, 800);

  // Phase: enter — slide overlay up from bottom
  _transitionPhase = 'enter';
  var overlay = _buildOverlay(zh, en);
  void overlay.offsetWidth;
  overlay.classList.add('enter');

  // Extract target path from hash
  var p = targetHash.replace(/^#\/?/, '').split('/');
  var renderPath = '/' + (p[0] || 'upload');
  var handler = App.routes[renderPath];

  setTimeout(function() {
    // Phase: covered — render page underneath overlay
    _transitionPhase = 'covered';
    App.state.params = { id: p[1] || null };
    App.state.page = renderPath;
    if (handler) App._render(renderPath, handler);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        // Phase: exit — slide overlay away
        _transitionPhase = 'exit';
        overlay.classList.remove('enter');
        overlay.classList.add('exit');

        setTimeout(function() {
          clearTimeout(safety);
          _transitionPhase = 'idle';
          overlay.classList.remove('exit');
          // Replay queued navigation
          if (_pendingRoute) {
            _pendingRoute = null;
            App._route();
          }
        }, 300);
      });
    });
  }, 350);
}

// ── App router ──

var App = {
  state: { page: '', params: {} },
  routes: {},

  register: function(name, handler) { this.routes[name] = handler; },

  navigate: function(hash) {
    console.log('[APP] navigate: ' + hash + ' _transitionPhase=' + _transitionPhase);
    if (_transitionPhase !== 'idle') return;

    // Update URL without triggering hashchange
    if (window.location.hash !== hash) {
      history.pushState(null, '', hash);
    }

    var raw = hash.slice(2);
    var parts = raw.replace(/^\/+/, '').split('/');
    var base = '/' + (parts[0] || 'upload');
    var chapter = CHAPTER[base] || ['', ''];

    _startTransition(hash, chapter[0], chapter[1]);
  },

  _route: function() {
    var raw = window.location.hash.slice(1);
    var hash = raw || '/upload';
    var parts = hash.replace(/^\/+/, '').split('/');
    var path = '/' + (parts[0] || 'upload');
    this.state.params = { id: parts[1] || null };
    this.state.page = path;

    var handler = this.routes[path];

    // Abort running SSE stream when leaving analyze page
    if (this.state.page === '/analyze' && path !== '/analyze') {
      if (window.__LAS_ANALYZE_CTRL) { window.__LAS_ANALYZE_CTRL.abort(); window.__LAS_ANALYZE_CTRL = null; }
      if (_elapsedTimer) { clearInterval(_elapsedTimer); _elapsedTimer = null; }
    }

    // Queue navigation if transition is in progress — replay when idle
    if (_transitionPhase !== 'idle') {
      _pendingRoute = '#' + hash;
      return;
    }

    // Initial load — direct render without transition
    if (_initialLoad) {
      _initialLoad = false;
      this._render(path, handler);
      return;
    }

    // All navigations go through transition for consistency
    if (handler) {
      var chapter = CHAPTER[path] || ['', ''];
      _startTransition('#' + hash, chapter[0], chapter[1]);
      return;
    }

    // Unknown route — redirect to upload
    this.navigate('#/upload');
  },

  _render: function(path, handler) {
    console.log('[APP] _render path=' + path + ' handler=' + (handler ? 'Y' : 'N') + ' routes=' + Object.keys(this.routes).join(','));
    if (!handler) { console.log('[APP] _render: no handler, redirect'); window.location.hash = '#/upload'; return; }
    this.updateNav();

    var app = document.getElementById('spaApp');
    // Animate frame: remove old class, let handler populate DOM, then re-add
    if (app) app.classList.remove('page-enter');

    var result;
    try {
      result = handler ? handler() : null;
    } catch (e) {
      console.error('[APP] _render handler ERROR:', e);
      return;
    }
    console.log('[APP] _render handler ok, result=' + (typeof result));
    // Wait for async handler to populate DOM before animating
    var self = this;
    function animateIn() {
      if (app) {
        void app.offsetWidth;
        app.classList.add('page-enter');
      }
    }
    if (result && typeof result.then === 'function') {
      result.then(animateIn).catch(animateIn);
    } else {
      // Sync handler or no content — animate on next frame
      requestAnimationFrame(animateIn);
    }
  },

  updateNav: function() {
    var navLogin = document.getElementById('navLogin');
    var navUser = document.getElementById('navUser');
    if (!navLogin || !navUser) return;
    if (API.isLoggedIn()) {
      navLogin.style.display = 'none';
      navUser.style.display = '';
      navUser.innerHTML = '<a href="#/profile" class="mono text-xs" style="color:var(--gold);text-decoration:none">' + esc(localStorage.getItem('las_username') || '用户') + '</a>';
    } else {
      navLogin.style.display = '';
      navUser.style.display = 'none';
    }
  },

  init: function() {
    var self = this;
    window.addEventListener('hashchange', function() { self._route(); });
    // Offline detection
    window.addEventListener('offline', function() {
      var banner = document.getElementById('offlineBanner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offlineBanner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2000;background:var(--crimson);color:var(--on-crimson);text-align:center;padding:8px;font-size:14px;font-family:Noto Sans SC,sans-serif';
        banner.textContent = '网络连接已断开，部分功能不可用';
        document.body.prepend(banner);
      }
    });
    window.addEventListener('online', function() {
      var banner = document.getElementById('offlineBanner');
      if (banner) banner.remove();
    });

    // Dev mode: auto-detect when backend skips auth (no token needed)
    if (!API.isLoggedIn()) {
      API._fetch('/users/me').then(function(data) {
        if (data.ok && data.user) {
          localStorage.setItem('las_token', 'dev-mode-auto');
          localStorage.setItem('las_username', data.user.username);
          self.updateNav();
        }
      }).catch(function() {});
    }

    this._route();
  }
};

// Privacy route
App.register('/privacy', function() {
  var root = document.getElementById('spaApp');
  root.innerHTML = '<main class="max-w-3xl mx-auto px-6" style="padding-top:80px;padding-bottom:80px">'
    + '<section class="glass-card" style="max-width:640px;margin:0 auto">'
    + '<h1 class="serif text-2xl font-bold mb-6" style="color:var(--ink)">用户协议 & 隐私政策</h1>'
    + '<div class="text-sm" style="color:var(--muted);line-height:2">'
    + '<p class="mb-4">LAS 文学分析系统尊重并保护您的隐私。</p>'
    + '<p class="mb-2 font-bold" style="color:var(--ink)">信息收集</p>'
    + '<p class="mb-4">我们仅收集您主动提交的作品文本和基本账号信息（用户名、邮箱），用于提供文学分析服务。不会收集您的浏览历史、位置信息或其他个人敏感数据。</p>'
    + '<p class="mb-2 font-bold" style="color:var(--ink)">信息使用</p>'
    + '<p class="mb-4">您的作品内容仅用于生成分析报告，不会被用于训练 AI 模型、出售给第三方或公开披露。分析完成后，您可随时删除作品及其关联数据。</p>'
    + '<p class="mb-2 font-bold" style="color:var(--ink)">数据安全</p>'
    + '<p class="mb-4">我们采用行业标准的安全措施保护您的数据。密码经加密存储，邮箱仅用于账号验证与找回。</p>'
    + '<p class="mb-2 font-bold" style="color:var(--ink)">联系我们</p>'
    + '<p>如有隐私相关问题，请联系：lasystem@163.com</p>'
    + '</div>'
    + '<a href="javascript:history.back()" class="btn mt-8" style="display:inline-block">返回</a>'
    + '</section></main>';
});

// ── Analyze route (moved inline from reader.js to avoid extension blocking) ──

const CIRCUMFERENCE = 201.062;
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

let _shownStepIndex = -1;
let _completed = false;
let _pageEnter = 0;
let _stepTimer = null;
let _cursorTimer = null;
let _quoteTimer = null;
let _elapsedTimer = null;
let _quotes = [];
let _quoteIdx = 0;
let _quoteActive = false;
let _stepEls = [];
let _lastPct = 0;

App.register('/analyze', () => {
  const id = App.state.params.id;
  console.log('[LAS] analyze 路由已加载, id=' + JSON.stringify(id));
  if (!id) { console.log('[LAS] 无 id, 跳回首页'); App.navigate('#/'); return; }

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
                <circle id="progressCircle" cx="40" cy="40" r="32" stroke-width="5" fill="none" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="191" class="progress-arc" />
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
          <div id="errorBox" style="display:none;margin-top:16px;padding:16px 20px;border-radius:8px;background:var(--surface-warning);border:1px solid var(--rule-strong)"></div>
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

  buildAllSteps();

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
  if (_shownStepIndex >= 0 && _stepEls[_shownStepIndex]) {
    _stepEls[_shownStepIndex].classList.add('done');
    _stepEls[_shownStepIndex].style.opacity = '0.55';
    _stepEls[_shownStepIndex].style.color = 'var(--muted)';
    const status = _stepEls[_shownStepIndex].querySelector('.log-status');
    if (status) status.textContent = '✓';
  }
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

function updateRing() {
  const circle = document.getElementById('progressCircle');
  const text = document.getElementById('progressText');
  if (!circle || !text) return;
  if (text.textContent === '0%' && _lastPct > 0) { text.textContent = _lastPct + '%'; }
  if (text.textContent === '--') { text.textContent = _lastPct + '%'; return; }
  const pct = Math.min(100, Math.round((_shownStepIndex + 1) / WORKFLOW.length * 100));
  if (pct <= _lastPct) return;
  _lastPct = pct;
  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct / 100);
  circle.style.strokeDashoffset = offset;
  text.textContent = pct + '%';
}

// ── Error display ──
var ERROR_SUGGEST = {
  E001: 'LLM 返回了无法解析的格式，系统已尝试自动修复。若持续出现请缩短文本后重试。',
  E002: '模型判断当前文本无法完成有效分析，请尝试缩短文本或更换模型。',
  E003: '后端评分计算时发生异常，原始分析数据已保存，请重试或联系管理员。',
  E004: '报告写入数据库失败，可能是磁盘空间不足，请联系管理员。',
  E005: 'API 超过 120 秒无响应，可能是文本过长或模型负载过高，建议缩短文本或稍后重试。',
  E008: '与分析服务的连接意外中断，报告可能已部分生成，请返回作品页查看。',
  E009: '无法连接到服务器，请检查网络连接后重试。',
  E010: '服务器内部错误，请稍后重试。若持续出现请联系管理员。',
  E000: '未知错误，请截图此页面反馈给管理员。',
};

function showError(code, detail) {
  var box = document.getElementById('errorBox');
  if (!box) return;
  var suggest = ERROR_SUGGEST[code] || ERROR_SUGGEST['E000'];
  var copyText = '[' + code + '] ' + detail + ' — ' + suggest;
  box.style.display = 'block';
  box.innerHTML = '<div style="display:flex;align-items:flex-start;gap:12px">'
    + '<span class="mono" style="font-size:13px;font-weight:700;color:var(--semantic-error);white-space:nowrap">' + code + '</span>'
    + '<div style="flex:1"><p style="font-size:13px;color:var(--ink);font-weight:600;margin-bottom:4px">' + esc(detail) + '</p>'
    + '<p style="font-size:12px;color:var(--muted);line-height:1.6">' + suggest + '</p></div>'
    + '<button class="copyErrBtn" data-text="' + esc(copyText) + '" style="flex-shrink:0;font-size:11px;padding:8px 16px;min-height:40px;border:1px solid var(--rule);border-radius:4px;background:transparent;cursor:pointer;color:var(--muted);white-space:nowrap;transition:all .2s;font-family:\'JetBrains Mono\',monospace" title="一键复制错误信息">COPY</button>'
    + '</div>';
  var btn = box.querySelector('.copyErrBtn');
  if (btn) {
    btn.addEventListener('click', function() {
      var t = this.dataset.text;
      navigator.clipboard.writeText(t).then(function() {
        btn.textContent = '已复制';
        btn.style.color = 'var(--jade)';
        btn.style.borderColor = 'var(--jade)';
        setTimeout(function() { btn.textContent = 'COPY'; btn.style.color = 'var(--muted)'; btn.style.borderColor = 'var(--rule)'; }, 1500);
      }).catch(function() {
        prompt('复制以下错误信息：', t);
      });
    });
    btn.addEventListener('mouseenter', function() { if (this.textContent === 'COPY') { this.style.color = 'var(--ink)'; this.style.borderColor = 'var(--ink)'; } });
    btn.addEventListener('mouseleave', function() { if (this.textContent === 'COPY') { this.style.color = 'var(--muted)'; this.style.borderColor = 'var(--rule)'; } });
    btn.addEventListener('mousedown', function() { this.style.transform = 'scale(0.97)'; });
    btn.addEventListener('mouseup', function() { this.style.transform = ''; });
    btn.addEventListener('mouseout', function() { this.style.transform = ''; });
  }
}

function onComplete() {
  _completed = true;
  if (_stepTimer) { clearTimeout(_stepTimer); _stepTimer = null; }
  if (_cursorTimer) { clearInterval(_cursorTimer); _cursorTimer = null; }
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
        showError('E006', err.detail || '今日分析次数已用完');
        throw new Error(err.detail || '请求过于频繁，请 5 分钟后再试');
      }
      if (res.status === 401) { showError('E007', '请先登录后再进行分析'); throw new Error('请先登录'); }
      const err = await res.json().catch(() => ({}));
      showError('E010', err.detail || '服务器异常 (HTTP ' + res.status + ')');
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

    const IDLE_WARN = 60000;
    const IDLE_GIVEUP = 300000;
    const READ_TIMEOUT = 45000;
    const FIRST_BYTE_WARN = 30000;

    var _startTime = Date.now();
    _elapsedTimer = setInterval(function() {
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
          const idle = Date.now() - lastEventTime;
          if (idle >= IDLE_GIVEUP) {
            console.warn('[LAS] 流读取超时超过 5 分钟，已放弃');
            if (_elapsedTimer) clearInterval(_elapsedTimer);
            if (statusText) { statusText.textContent = '分析超时，请重试'; statusText.style.color = 'var(--semantic-warning)'; }
            return;
          }
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
          continue;
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
          if (event.type === 'heartbeat') continue;
          if (event.type === 'error') {
            var code = event.error_code || 'E000';
            var msg = event.text || '分析过程发生未知错误';
            showError(code, msg);
            if (statusText) { statusText.textContent = '分析失败 [' + code + ']'; statusText.style.color = 'var(--semantic-error)'; }
            if (_elapsedTimer) clearInterval(_elapsedTimer);
            var retryBtn2 = document.createElement('button');
            retryBtn2.textContent = '重试';
            retryBtn2.className = 'mono text-xs';
            retryBtn2.style.cssText = 'margin-left:12px;padding:8px 16px;min-height:40px;border:1px solid var(--gold);border-radius:4px;background:transparent;color:var(--gold);cursor:pointer;transition:all .2s;font-family:JetBrains Mono,monospace';
            retryBtn2.addEventListener('click', function() { if (retryBtn2.parentNode) retryBtn2.remove(); startStream(workId, model); });
            if (statusText && statusText.parentNode) statusText.parentNode.insertBefore(retryBtn2, statusText.nextSibling);
            return;
          }
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
            var reportReady = await waitForReport(workId);
            if (!reportReady) {
              if (statusText) { statusText.textContent = '报告生成超时，请返回重试'; statusText.style.color = 'var(--semantic-error)'; }
              return;
            }
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
            var retryBtn = document.createElement('button');
            retryBtn.textContent = '重新连接';
            retryBtn.className = 'text-xs';
            retryBtn.style.cssText = 'margin-left:12px;padding:4px 12px;border:1px solid var(--gold);border-radius:4px;background:transparent;color:var(--gold);cursor:pointer;transition:all .2s';
            retryBtn.addEventListener('click', function() {
              if (retryBtn.parentNode) retryBtn.remove();
              App.navigate('#/upload');
            });
            if (statusText && statusText.parentNode) statusText.parentNode.insertBefore(retryBtn, statusText.nextSibling);
          }
        }
      }

      if (done) {
        if (!receivedDone) {
          console.warn('[LAS] 流在收到 done 事件前断开');
          showError('E008', '与分析服务的连接意外中断');
          if (statusText) { statusText.textContent = '连接意外中断'; statusText.style.color = 'var(--semantic-warning)'; }
          const ok = await waitForReport(workId);
          if (ok) { App.navigate('#/report/' + workId); }
        }
        return;
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') { console.log('[LAS] 分析流已取消'); return; }
    console.error('[LAS] 分析流异常:', err);
    if (statusText) { statusText.textContent = '分析失败'; statusText.style.color = 'var(--semantic-error)'; }
    showError('E009', err.message || '网络连接失败，请检查网络后重试');
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

async function startQuoteCarousel() {
  try {
    const res = await fetch('/api/quotes');
    if (!res.ok) return;
    const data = await res.json();
    _quotes = data.quotes || [];
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
  const curH = mq.offsetHeight;
  mq.style.height = curH + 'px';
  mq.style.opacity = '0';
  setTimeout(() => {
    const q = _quotes[_quoteIdx % _quotes.length];
    const src = document.getElementById('quoteSource');
    el.textContent = typeof q === 'string' ? q : q.t;
    if (src) src.textContent = typeof q === 'string' ? '' : '—— ' + q.s;
    _quoteIdx++;
    mq.style.height = 'auto';
    const newH = mq.offsetHeight;
    mq.style.height = curH + 'px';
    requestAnimationFrame(() => { mq.style.height = newH + 'px'; });
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
  var maxRetries = 90;
  for (let i = 0; i < maxRetries; i++) {
    const delay = i === 0 ? 0 : i <= 5 ? 500 : i <= 20 ? 1000 : 2000;
    await new Promise(r => setTimeout(r, delay));
    try {
      const data = await API.getReport(workId);
      if (data.report && data.report.ok) return true;
      if (data.status === 'failed') return false;
    } catch (e) {
      if (i <= 3 || i % 5 === 0) console.log('[LAS] 报告轮询 ' + (i + 1) + ': ' + (e.message || e));
    }
  }
  return false;
}
