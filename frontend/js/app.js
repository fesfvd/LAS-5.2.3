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

// Shared analyze state (used by analyze.js + nav cleanup)
let _shownStepIndex = -1;
let _completed = false;
let _pageEnter = 0;
let _stepTimer = null;
let _cursorTimer = null;
let _quoteTimer = null;
let _elapsedTimer = null;
