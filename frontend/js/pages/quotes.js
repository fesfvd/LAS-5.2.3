App.register('/quotes', async () => {
  document.title = '金句广场 — LAS';
  var root = document.getElementById('spaApp');
  root.innerHTML = `
    <div class="submit-container">
      <div class="submit-header">
        <p class="mono text-xs text-muted tracking-[4px] uppercase mb-1">MUSES</p>
        <h1 class="serif text-3xl font-black leading-[1.1]">金句广场</h1>
      </div>
      <hr class="rule" style="margin:16px 0">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <button class="filter-chip active" data-mode="">全部</button>
        <button class="filter-chip" data-mode="original">原创</button>
        <button class="filter-chip" data-mode="classic">经典</button>
        <button id="refreshBtn" class="text-xs" style="margin-left:auto;padding:4px 12px;border:1px solid var(--gold);border-radius:4px;background:transparent;color:var(--gold);cursor:pointer">换一批</button>
      </div>
      <div id="quoteGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
        <div class="spinner mx-auto" style="margin-top:40px"></div>
      </div>
    </div>`;

  var currentMode = '';
  async function loadQuotes(mode) {
    document.getElementById('quoteGrid').innerHTML = '<div class="spinner mx-auto" style="margin-top:40px"></div>';
    try {
      var data = await fetch('/api/quotes?random=30&mode=' + encodeURIComponent(mode));
      if (!data.ok) return;
      var res = await data.json();
      var quotes = res.quotes || [];
      document.getElementById('quoteGrid').innerHTML = quotes.map(function(q) {
        var modeLabel = q.m === 'original' ? '原创' : '经典';
        var modeColor = q.m === 'original' ? 'var(--purple)' : 'var(--crimson)';
        return '<div class="glass-card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between">'
          + '<blockquote class="serif" style="font-size:16px;line-height:1.8;color:var(--ink);margin-bottom:12px">「' + esc(q.t) + '」</blockquote>'
          + '<div style="display:flex;align-items:center;justify-content:space-between"><cite class="text-xs" style="color:var(--muted);font-style:normal">—— ' + esc(q.s || '佚名') + '</cite><span class="text-xs" style="padding:2px 8px;border-radius:99px;font-size:10px;color:' + modeColor + ';background:' + modeColor.replace(')', ',.08)') + '">' + modeLabel + '</span></div>'
          + '</div>';
      }).join('');
      if (!quotes.length) document.getElementById('quoteGrid').innerHTML = '<p class="text-sm" style="text-align:center;padding:40px;color:var(--muted)">暂无金句</p>';
    } catch (e) {
      document.getElementById('quoteGrid').innerHTML = '<p class="text-sm" style="text-align:center;padding:40px;color:var(--crimson)">加载失败</p>';
    }
  }
  loadQuotes('');

  document.querySelectorAll('.filter-chip').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-chip').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      loadQuotes(currentMode);
    });
  });
  document.getElementById('refreshBtn').addEventListener('click', function() { loadQuotes(currentMode); });
});
