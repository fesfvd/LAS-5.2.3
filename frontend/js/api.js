const API = {
  _base: '/api',

  _headers() {
    return { 'Content-Type': 'application/json' };
  },

  async _req(method, path, body) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this._base + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || err.message || '请求失败');
    }
    return res.json();
  },

  _fetch(path) { return this._req('GET', path); },
  _post(path, body) { return this._req('POST', path, body); },
  _delete(path) { return this._req('DELETE', path); },

  getWorks() { return this._fetch('/works'); },
  createWork(data) { return this._post('/works', data); },
  getWork(id) { return this._fetch(`/works/${id}`); },
  deleteWork(id) { return this._delete(`/works/${id}`); },
  getReport(id) { return this._fetch(`/works/${id}/report`); },

  analyzeStream(id, model) {
    return fetch(`${this._base}/works/${id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || '' }),
    });
  }
};
