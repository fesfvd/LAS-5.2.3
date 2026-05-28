function esc(s) {
  if (s === null || s === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(s);
  return div.innerHTML;
}
function debracket(s) { return String(s||'').replace(/^《|》$/g, ''); }
function nl2p(text) {
  if (!text) return '';
  return text.split('\n').filter(function(l) { return l.trim(); }).map(function(l) { return '<p class="mb-2 last:mb-0">' + l + '</p>'; }).join('');
}

// ── Transition overlay quotes ──

var _transitionQuotes = [];
var _transitionReady = false;

(function() {
  fetch('/static/quotes.json')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (data && data.length) {
        _transitionQuotes = data;
        _transitionReady = true;
      }
    })
    .catch(function() {});
})();

function _pickQuote() {
  if (!_transitionQuotes.length) return { t: '观古今于须臾，抚四海于一瞬', s: '文赋' };
  var q = _transitionQuotes[Math.floor(Math.random() * _transitionQuotes.length)];
  return typeof q === 'string' ? { t: q, s: '' } : q;
}

function _showTransition(callback) {
  var existing = document.getElementById('transitionOverlay');
  if (existing) existing.remove();

  var q = _pickQuote();
  var text = (q.t || '').slice(0, 60);

  var overlay = document.createElement('div');
  overlay.id = 'transitionOverlay';
  overlay.innerHTML =
    '<div class="trans-bg">' +
      '<div class="trans-quote"><span>' + esc(text) + '</span></div>' +
      (q.s ? '<div class="trans-source">—— ' + esc(q.s) + '</div>' : '') +
    '</div>';
  document.body.appendChild(overlay);

  // Force reflow then animate in
  void overlay.offsetWidth;
  overlay.classList.add('show');

  setTimeout(function() {
    callback();
    // Keep overlay visible briefly after page renders
    setTimeout(function() {
      overlay.classList.remove('show');
      setTimeout(function() { overlay.remove(); }, 400);
    }, 200);
  }, 250);
}

// ── App router ──

const App = {
  state: { page: '', params: {} },
  routes: {},

  register: function(name, handler) { this.routes[name] = handler; },

  navigate: function(hash) {
    window.location.hash = hash;
    this._route();
  },

  _route: function() {
    var raw = window.location.hash.slice(1);
    var hash = raw || '/upload';
    var parts = hash.replace(/^\/+/, '').split('/');
    var path = '/' + (parts[0] || 'upload');
    this.state.params = { id: parts[1] || null };
    this.state.page = path;

    var self = this;
    var handler = this.routes[path];
    var isFastPage = path === '/login' || path === '/register';

    if (_transitionReady && !isFastPage) {
      _showTransition(function() {
        self._render(path, handler);
      });
    } else {
      this._render(path, handler);
    }
  },

  _render: function(path, handler) {
    var app = document.getElementById('spaApp');
    if (app) {
      app.classList.remove('page-enter');
      void app.offsetWidth;
      app.classList.add('page-enter');
    }

    this.updateNav();

    if (handler) handler();
  },

  updateNav: function() {
    var navLogin = document.getElementById('navLogin');
    var navUser = document.getElementById('navUser');
    if (!navLogin || !navUser) return;
    if (API.isLoggedIn()) {
      navLogin.style.display = 'none';
      navUser.style.display = '';
      navUser.innerHTML = '<a href="#/works" class="mono text-xs" style="color:var(--gold);text-decoration:none">' + esc(localStorage.getItem('las_username') || '用户') + '</a>';
    } else {
      navLogin.style.display = '';
      navUser.style.display = 'none';
    }
  },

  init: function() {
    var self = this;
    window.addEventListener('hashchange', function() { self._route(); });
    this._route();
  }
};
