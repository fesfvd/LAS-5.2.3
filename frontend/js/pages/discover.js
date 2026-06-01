// discover.js — Public works discovery page
App.register('/discover', async () => {
  document.title = '发现 — LAS 文学分析';
  var root = document.getElementById('spaApp');

  root.innerHTML = `
    <div class="submit-container">
      <div class="submit-header">
        <p class="text-xs text-muted mb-1"><span class="mono tracking-[4px]">DISCOVER</span> <span style="font-family:'Noto Sans SC',sans-serif;letter-spacing:0">发现</span></p>
        <h1 class="serif text-3xl font-black leading-[1.1]">公开作品</h1>
      </div>
      <hr class="rule" style="margin:16px 0">
      <div id="discoverGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
        <div class="spinner mx-auto" style="margin-top:20px;grid-column:1/-1"></div>
      </div>
      <div id="discoverPager" style="text-align:center;margin-top:20px"></div>
    </div>`;

  var page = 0, limit = 24, total = 0;

  async function load(pageNum) {
    page = pageNum || 0;
    document.getElementById('discoverGrid').innerHTML = '<div class="spinner mx-auto" style="margin-top:20px;grid-column:1/-1"></div>';
    try {
      var res = await API._fetch('/public/works?limit=' + limit + '&offset=' + (page * limit));
      if (!res.ok) { document.getElementById('discoverGrid').innerHTML = '<p class="text-sm" style="text-align:center;padding:40px;color:var(--muted);grid-column:1/-1">加载失败</p>'; return; }
      total = res.total;
      if (!res.items.length) {
        document.getElementById('discoverGrid').innerHTML = '<p class="text-sm" style="text-align:center;padding:40px;color:var(--muted);grid-column:1/-1">还没有公开作品<br><br><span style="font-size:12px">在「作品管理」中点击 <i class="fas fa-lock"></i> 图标将分析完成的作品设为公开</span></p>';
        document.getElementById('discoverPager').innerHTML = '';
        return;
      }
      var html = '';
      var modeColors = { original: 'var(--purple)', classic: 'var(--crimson)' };
      res.items.forEach(function(w) {
        html += '<a href="#/report/' + esc(w.id) + '" class="glass-card" style="display:block;padding:20px;text-decoration:none;transition:all .2s;cursor:pointer">'
          + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">'
          + '<span class="serif" style="font-size:16px;font-weight:700;color:var(--ink);line-height:1.4">' + esc(w.title) + '</span>'
          + '<span style="font-family:JetBrains Mono,monospace;font-size:0.6rem;padding:2px 8px;border-radius:9999px;color:' + (modeColors[w.mode] || 'var(--muted)') + ';background:' + (w.mode === 'classic' ? 'rgba(139,0,0,.06)' : 'rgba(107,33,168,.06)') + ';white-space:nowrap;flex-shrink:0">' + (w.mode === 'classic' ? 'CLASSIC' : 'ORIGINAL') + '</span>'
          + '</div>'
          + '<p class="text-xs" style="color:var(--muted);margin-bottom:12px">' + esc(w.author || '佚名') + '</p>'
          + '<div style="display:flex;align-items:center;justify-content:space-between">'
          + (w.wcs_score != null ? '<span class="mono" style="font-size:28px;font-weight:700;color:var(--ink)">' + w.wcs_score.toFixed(1) + '</span>' : '<span class="text-xs" style="color:var(--muted)">暂无评分</span>')
          + (w.tier ? '<span class="text-xs" style="color:var(--gold)">' + esc(w.tier) + '</span>' : '')
          + '</div>'
          + (w.report_number ? '<p class="mono text-xs" style="color:var(--muted);margin-top:8px">LAS-' + String(w.report_number).padStart(6,'0') + '</p>' : '')
          + '</a>';
      });
      document.getElementById('discoverGrid').innerHTML = html;

      // Pager
      var pages = Math.ceil(total / limit);
      var pagerEl = document.getElementById('discoverPager');
      if (pages <= 1) { pagerEl.innerHTML = ''; return; }
      var pagerHTML = '<span class="text-xs" style="color:var(--muted)">共 ' + total + ' 篇 · </span>';
      pagerHTML += '<button data-p="0" style="font-size:11px;padding:8px 16px;min-height:40px;border:1px solid var(--rule);border-radius:4px;background:transparent;cursor:pointer;color:' + (page > 0 ? 'var(--ink)' : 'var(--muted)') + '" ' + (page <= 0 ? 'disabled' : '') + '>«</button> ';
      pagerHTML += '<span class="text-xs" style="color:var(--muted);margin:0 4px">' + (page + 1) + '/' + pages + '</span> ';
      pagerHTML += '<button data-p="' + (page + 1) + '" style="font-size:11px;padding:8px 16px;min-height:40px;border:1px solid var(--rule);border-radius:4px;background:transparent;cursor:pointer;color:' + (page < pages - 1 ? 'var(--ink)' : 'var(--muted)') + '" ' + (page >= pages - 1 ? 'disabled' : '') + '>»</button>';
      pagerEl.innerHTML = pagerHTML;
      pagerEl.querySelectorAll('button').forEach(function(b) { b.addEventListener('click', function() { load(parseInt(this.dataset.p)); }); });
    } catch (e) { document.getElementById('discoverGrid').innerHTML = '<p class="text-sm" style="text-align:center;padding:40px;color:var(--semantic-error);grid-column:1/-1">⚠ 加载失败 <button onclick="location.reload()" style="font-size:11px;padding:4px 12px;border:1px solid var(--rule);border-radius:4px;background:transparent;cursor:pointer;color:var(--muted);margin-left:8px">重试</button></p>'; }
  }
  load(0);
});
