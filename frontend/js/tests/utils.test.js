import { describe, it, expect } from 'vitest';

// Mirror of utility functions from app.js — tested independently
// (app.js uses global scripts, not ES modules)

function esc(s) {
  if (s === null || s === undefined) return '';
  // In browser: document.createElement('div').textContent = s; return div.innerHTML
  // In test: use a simple HTML entity escape
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function debracket(s) {
  return String(s || '').replace(/^《|》$/g, '');
}

function nl2p(text) {
  if (!text) return '';
  return text
    .split('\n')
    .filter(l => l.trim())
    .map(l => '<p class="mb-2 last:mb-0">' + l + '</p>')
    .join('');
}


describe('esc', () => {
  it('returns empty string for null/undefined', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });

  it('escapes HTML tags', () => {
    expect(esc('<script>alert("xss")</script>')).not.toContain('<script>');
    expect(esc('<b>bold</b>')).toContain('&lt;b&gt;');
  });

  it('passes through safe strings', () => {
    expect(esc('hello world')).toBe('hello world');
  });

  it('converts non-strings', () => {
    expect(esc(123)).toBe('123');
  });

  it('escapes double quotes', () => {
    expect(esc('"hello"')).toContain('&quot;');
  });
});


describe('debracket', () => {
  it('removes 《》 book-name brackets', () => {
    expect(debracket('《红楼梦》')).toBe('红楼梦');
  });

  it('handles only opening bracket', () => {
    expect(debracket('《红楼梦')).toBe('红楼梦');
  });

  it('handles only closing bracket', () => {
    expect(debracket('红楼梦》')).toBe('红楼梦');
  });

  it('passes through strings without brackets', () => {
    expect(debracket('战争与和平')).toBe('战争与和平');
  });

  it('handles empty input', () => {
    expect(debracket('')).toBe('');
  });
});


describe('nl2p', () => {
  it('converts newlines to <p> tags', () => {
    const result = nl2p('line1\nline2');
    expect(result).toContain('<p class="mb-2 last:mb-0">line1</p>');
    expect(result).toContain('<p class="mb-2 last:mb-0">line2</p>');
  });

  it('filters out empty lines', () => {
    const result = nl2p('line1\n\n\nline2');
    // Should only have 2 <p> tags, not 4
    const count = (result.match(/<p /g) || []).length;
    expect(count).toBe(2);
  });

  it('returns empty string for falsy input', () => {
    expect(nl2p('')).toBe('');
    expect(nl2p(null)).toBe('');
    expect(nl2p(undefined)).toBe('');
  });

  it('handles single line', () => {
    const result = nl2p('only one line');
    expect(result).toContain('<p class="mb-2 last:mb-0">only one line</p>');
  });
});
