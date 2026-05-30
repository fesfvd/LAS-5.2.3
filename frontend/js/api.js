const API = {
  _base: '/api',

  _token() {
    return localStorage.getItem('las_token');
  },

  setToken(token) {
    localStorage.setItem('las_token', token);
  },

  clearToken() {
    localStorage.removeItem('las_token');
  },

  isLoggedIn() {
    return !!this._token();
  },

  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this._token();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  },

  async _req(method, path, body) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this._base + path, opts);
    if (res.status === 401 && !path.startsWith('/auth/')) {
      this.clearToken();
      window.location.hash = '#/login';
      throw new Error('登录已过期，请重新登录');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || err.message || '请求失败');
    }
    return res.json();
  },

  _fetch(path) { return this._req('GET', path); },
  _post(path, body) { return this._req('POST', path, body); },
  _delete(path) { return this._req('DELETE', path); },

  // Auth
  login(username, password) { return this._post('/auth/login', { username, password }); },
  register(data) { return this._post('/auth/register', data); },

  // Works
  getWorks() { return this._fetch('/works'); },
  getWorksPaginated(params) {
    const qs = new URLSearchParams();
    qs.set('limit', params.limit || 20);
    qs.set('offset', params.offset || 0);
    qs.set('sort_by', params.sort_by || 'date');
    qs.set('sort_order', params.sort_order || 'desc');
    if (params.mode) qs.set('mode', params.mode);
    qs.set('_t', Date.now()); // cache bust
    return this._fetch('/works?' + qs.toString());
  },
  createWork(data) { return this._post('/works', data); },
  getWork(id) { return this._fetch(`/works/${id}`); },
  deleteWork(id) { return this._delete(`/works/${id}`); },
  getReport(id) { return this._fetch(`/works/${id}/report`); },

  analyzeStream(id, model, signal) {
    const h = { 'Content-Type': 'application/json' };
    const t = this._token();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return fetch(`${this._base}/works/${id}/analyze`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ model: model || '' }),
      signal,
    });
  }
};
