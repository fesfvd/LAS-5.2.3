function esc(s) { if (s === null || s === undefined) return ''; const div = document.createElement('div'); div.textContent = String(s); return div.innerHTML; }
function nl2p(text) { return (text || '').split('\n').filter(Boolean).map(l => l.trim()).join('<br>'); }

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

    const handler = this.routes[path];
    if (handler) handler();
  },

  init() {
    window.addEventListener('hashchange', () => this._route());
    this._route();
  },
};
