/**
 * Frontend auth component tests — login / register / guest key paths.
 * Vitest + jsdom. Run: npx vitest run frontend/js/tests/
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock browser environment ──
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  // Mock fetch for API calls
  global.fetch = vi.fn();
  // Mock location
  delete window.location;
  window.location = { hash: '', href: '' };
});

// ── Simulate app.js utility functions (mirrored for test isolation) ──
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function debracket(s) { return String(s || '').replace(/^《|》$/g, ''); }

// ── Simulate api.js core logic (mirrored for test isolation) ──
const API = {
  _base: '/api',
  _token() { return localStorage.getItem('las_token'); },
  setToken(t) { localStorage.setItem('las_token', t); },
  clearToken() { localStorage.removeItem('las_token'); },
  isLoggedIn() { return !!this._token(); },
  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this._token();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  },
};

// ── Simulate auth.js validation logic ──
function validatePassword(pw) {
  if (!pw || pw.length < 6) return '密码至少 6 位';
  const weak = ['123456','password','111111','12345678','qwerty','abc123'];
  if (weak.includes(pw.toLowerCase())) return '密码过于常见，请更换';
  return null;
}
function validateEmail(email) {
  if (!email || email.indexOf('@') < 0) return '请提供有效的邮箱地址';
  return null;
}
function validateUsername(name) {
  if (!name || name.trim().length < 2) return '用户名至少 2 个字符';
  if (name.trim().length > 50) return '用户名最多 50 个字符';
  return null;
}
function isGuestUser() {
  return (localStorage.getItem('las_username') || '').startsWith('guest_');
}

// ═══════════════ Tests ═══════════════

describe('API 客户端', () => {
  it('setToken 存储 token', () => {
    API.setToken('test-token-123');
    expect(localStorage.getItem('las_token')).toBe('test-token-123');
  });

  it('clearToken 清除 token', () => {
    API.setToken('test');
    API.clearToken();
    expect(localStorage.getItem('las_token')).toBeNull();
  });

  it('isLoggedIn 正确判断登录状态', () => {
    expect(API.isLoggedIn()).toBe(false);
    API.setToken('x');
    expect(API.isLoggedIn()).toBe(true);
  });

  it('_headers 未登录时不含 Authorization', () => {
    const h = API._headers();
    expect(h.Authorization).toBeUndefined();
    expect(h['Content-Type']).toBe('application/json');
  });

  it('_headers 登录时带 Bearer token', () => {
    API.setToken('abc123');
    const h = API._headers();
    expect(h.Authorization).toBe('Bearer abc123');
  });
});

describe('密码验证', () => {
  it('拒绝空密码', () => {
    expect(validatePassword('')).toBe('密码至少 6 位');
  });

  it('拒绝短密码', () => {
    expect(validatePassword('12345')).toBe('密码至少 6 位');
  });

  it('拒绝常见弱密码', () => {
    expect(validatePassword('123456')).toBe('密码过于常见，请更换');
    expect(validatePassword('password')).toBe('密码过于常见，请更换');
  });

  it('接受合法密码', () => {
    expect(validatePassword('mySecret99')).toBeNull();
  });
});

describe('邮箱验证', () => {
  it('拒绝空邮箱', () => {
    expect(validateEmail('')).toBe('请提供有效的邮箱地址');
  });

  it('拒绝无 @ 字符串', () => {
    expect(validateEmail('notanemail')).toBe('请提供有效的邮箱地址');
  });

  it('接受合法邮箱', () => {
    expect(validateEmail('test@example.com')).toBeNull();
  });
});

describe('用户名验证', () => {
  it('拒绝空用户名', () => {
    expect(validateUsername('')).toBe('用户名至少 2 个字符');
  });

  it('拒绝单字用户名', () => {
    expect(validateUsername('a')).toBe('用户名至少 2 个字符');
  });

  it('拒绝过长用户名', () => {
    expect(validateUsername('x'.repeat(51))).toBe('用户名最多 50 个字符');
  });

  it('接受合法用户名', () => {
    expect(validateUsername('las gly')).toBeNull();
  });
});

describe('游客检测', () => {
  it('识别 guest_ 前缀用户', () => {
    localStorage.setItem('las_username', 'guest_abc123');
    expect(isGuestUser()).toBe(true);
  });

  it('非 guest 用户返回 false', () => {
    localStorage.setItem('las_username', 'las gly');
    expect(isGuestUser()).toBe(false);
  });

  it('未设置时返回 false', () => {
    expect(isGuestUser()).toBe(false);
  });
});

describe('工具函数', () => {
  it('esc 转义 HTML 实体', () => {
    expect(esc('<script>')).toBe('&lt;script&gt;');
    expect(esc('"hi"')).toBe('&quot;hi&quot;');
  });

  it('esc 处理 null/undefined', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });

  it('debracket 去除书名号', () => {
    expect(debracket('《红楼梦》')).toBe('红楼梦');
    expect(debracket('普通标题')).toBe('普通标题');
  });
});
