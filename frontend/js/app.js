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

const App = {
  state: { page: '', params: {} },
  routes: {},

  register(name, handler) { this.routes[name] = handler; },

  navigate(hash) {
    window.location.hash = hash;
    this._route();
  },

  _route() {
    const raw = window.location.hash.slice(1);
    const hash = raw || '/upload';
    const parts = hash.replace(/^\/+/, '').split('/');
    const path = '/' + (parts[0] || 'upload');
    this.state.params = { id: parts[1] || null };
    this.state.page = path;

    // Page transition
    const app = document.getElementById('spaApp');
    if (app) {
      app.classList.remove('page-enter');
      void app.offsetWidth; // force reflow
      app.classList.add('page-enter');
    }

    this.updateNav();

    const handler = this.routes[path];
    if (handler) handler();
  },

  updateNav() {
    const navLogin = document.getElementById('navLogin');
    const navUser = document.getElementById('navUser');
    if (!navLogin || !navUser) return;
    if (API.isLoggedIn()) {
      navLogin.style.display = 'none';
      navUser.style.display = '';
      navUser.innerHTML = `<a href="#/works" class="mono text-xs" style="color:var(--gold);text-decoration:none">${esc(localStorage.getItem('las_username') || '用户')}</a>`;
    } else {
      navLogin.style.display = '';
      navUser.style.display = 'none';
    }
  },

  init() {
    window.addEventListener('hashchange', () => this._route());
    this._route();
  },
};
