App.register('/works', async () => {
  document.title = '作品列表 — LAS';
  const root = document.getElementById('spaApp');
  root.innerHTML = `
    <div class="submit-container">
      <div class="submit-header" style="display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <p class="mono text-xs text-muted tracking-[4px] uppercase mb-1">WORKSPACE</p>
          <h1 class="serif" style="font-size:30px;font-weight:700;line-height:1.1;letter-spacing:0.03em">我的作品</h1>
        </div>
        <a href="#/upload" class="btn" style="white-space:nowrap;margin-top:4px">+ NEW</a>
      </div>

      <hr class="rule" style="margin:16px 0">

      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:8px 0 12px">
        <div style="display:flex;align-items:center;gap:6px">
          <span class="mono" style="font-size:11px;color:var(--muted);letter-spacing:2px;text-transform:uppercase">MODE</span>
          <button class="filter-chip active" data-mode="">全部</button>
          <button class="filter-chip" data-mode="original">原创</button>
          <button class="filter-chip" data-mode="classic">经典</button>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="mono" style="font-size:11px;color:var(--muted);letter-spacing:2px;text-transform:uppercase">SORT</span>
          <button class="filter-chip active" data-sort="date-desc">时间 ↓</button>
          <button class="filter-chip" data-sort="date-asc">时间 ↑</button>
          <button class="filter-chip" data-sort="score-desc">分数 ↓</button>
          <button class="filter-chip" data-sort="score-asc">分数 ↑</button>
        </div>
      </div>

      <div id="worksList">
        <div class="spinner mx-auto" style="margin-top:40px"></div>
        <p class="text-xs text-muted" style="text-align:center;margin-top:8px">加载中...</p>
      </div>

      <div id="worksPager" style="display:none;justify-content:center;gap:8px;margin-top:24px"></div>
    </div>`;

  let currentOffset = 0;
  const limit = 20;
  let currentMode = '';
  let currentSort = 'date-desc';

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const parent = chip.parentElement;
      parent.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (chip.dataset.mode !== undefined) currentMode = chip.dataset.mode;
      if (chip.dataset.sort) currentSort = chip.dataset.sort;
      loadPage(0);
    });
  });

  await loadPage(0);

  async function loadPage(offset) {
    const list = document.getElementById('worksList');
    list.innerHTML = '<div class="spinner mx-auto" style="margin-top:40px"></div>';

    try {
      const [sortBy, sortOrder] = currentSort.split('-');
      let url = '/api/works?limit=' + limit + '&offset=' + offset
              + '&sort_by=' + sortBy + '&sort_order=' + sortOrder;
      if (currentMode) url += '&mode=' + currentMode;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      renderList(data.items, data.total);
      currentOffset = offset;
      renderPager(data.total, offset);
    } catch (e) {
      list.innerHTML = '<p class="text-sm" style="color:var(--crimson);text-align:center;padding:40px 0">加载失败: ' + esc(e.message || '') + '</p>';
    }
  }

  function renderList(items, total) {
    const list = document.getElementById('worksList');
    if (!items.length) {
      const hint = currentMode ? '当前筛选条件下暂无作品' : '提交你的第一部作品，开始文学分析之旅';
      list.innerHTML = `
        <div class="glass-card" style="padding:40px 20px;text-align:center">
          <p class="serif" style="font-size:18px;font-weight:600;line-height:1.3;letter-spacing:0.03em;margin-bottom:8px;color:var(--ink)">尚无作品</p>
          <p class="text-sm" style="color:var(--muted);margin-bottom:16px">${hint}</p>
          <a href="#/upload" class="btn" style="display:inline-flex">START</a>
        </div>`;
      return;
    }

    const tierBadges = {
      '文学之巅': '👑', '永恒殿堂': '🏆', '不朽丰碑': '🏛️',
      '传世经典': '📜', '典范之作': '⭐', '上乘佳作': '✨',
      '准文学级': '📚', '中等之作': '🎯', '合格文本': '✅',
    };

    let html = '<p class="text-xs" style="color:var(--muted);text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-family:\'JetBrains Mono\',monospace">共 ' + total + ' 部作品</p>';

    items.forEach(w => {
      const isClassic = w.mode === 'classic';
      const score = w.latest_wcs_score != null ? w.latest_wcs_score.toFixed(1) : '—';
      const badge = w.latest_tier && tierBadges[w.latest_tier] ? tierBadges[w.latest_tier] : '';
      const statusIcon = w.latest_status === 'running' ? '<span class="spinner-inline"></span>' :
                        w.latest_status === 'failed' ? '<span style="color:var(--semantic-error);font-size:11px">✕</span>' :
                        w.latest_status === 'done' ? '<span style="color:var(--jade);font-size:11px">✓</span>' : '';
      const dateStr = w.created_at ? w.created_at.slice(0, 10) : '';

      html += `
        <div class="glass-card work-item" style="padding:16px 20px;margin-bottom:8px;cursor:pointer;transition:all .2s" data-id="${esc(w.id)}">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
                <span class="serif" style="font-size:16px;font-weight:700;letter-spacing:0.03em;color:var(--ink)">${esc(w.title)}</span>
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;padding:1px 7px;border-radius:9999px;color:${isClassic ? 'var(--crimson)' : 'var(--purple)'};background:${isClassic ? 'rgba(139,0,0,0.06)' : 'rgba(107,33,168,0.06)'};white-space:nowrap;letter-spacing:0.5px;text-transform:uppercase">${isClassic ? 'CLASSIC' : 'ORIGINAL'}</span>
                ${w.ancestor_dialogue ? '<span style="font-family:\'JetBrains Mono\',monospace;font-size:0.6rem;padding:1px 7px;border-radius:9999px;background:rgba(184,134,11,0.08);color:var(--gold);white-space:nowrap;letter-spacing:0.5px">SAGE</span>' : ''}
              </div>
              <div style="display:flex;align-items:center;gap:12px">
                <span class="text-xs" style="color:var(--muted)">${esc(w.author || '佚名')}</span>
                <span class="mono" style="font-size:12px;color:var(--muted)">${dateStr}</span>
                ${statusIcon}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:16px;flex-shrink:0">
              <div style="text-align:right">
                <span class="mono" style="font-size:24px;font-weight:700;line-height:1;color:var(--ink)">${score}</span>
                <p class="mono" style="font-size:10px;color:var(--muted);margin-top:2px">${badge} ${esc(w.latest_tier || '—')}</p>
              </div>
              <div style="display:flex;gap:4px">
                ${w.latest_status === 'done' ? `<button class="work-btn view" data-id="${esc(w.id)}" title="查看报告"><i class="fas fa-file-alt"></i></button>` : ''}
                ${w.latest_status === 'done' ? `<button class="work-btn redo" data-id="${esc(w.id)}" title="重新分析"><i class="fas fa-redo"></i></button>` : ''}
                <button class="work-btn del" data-id="${esc(w.id)}" title="删除"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>`;
    });

    list.innerHTML = html;

    list.querySelectorAll('.work-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        App.navigate('#/report/' + card.dataset.id);
      });
    });

    list.querySelectorAll('.view').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); App.navigate('#/report/' + btn.dataset.id); });
    });
    list.querySelectorAll('.redo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.__LAS_MODEL = 'deepseek-v4-flash';
        App.navigate('#/analyze/' + btn.dataset.id);
      });
    });
    list.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('确认删除此作品？此操作不可撤销。')) return;
        try { await API.deleteWork(btn.dataset.id); loadPage(currentOffset); }
        catch (err) { alert('删除失败: ' + (err.message || '')); }
      });
    });
  }

  function renderPager(total, offset) {
    const pager = document.getElementById('worksPager');
    const pages = Math.ceil(total / limit);
    if (pages <= 1) { pager.style.display = 'none'; return; }
    pager.style.display = 'flex';
    for (let i = 0; i < pages; i++) {
      const off = i * limit;
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.className = 'pager-btn' + (offset === off ? ' active' : '');
      btn.addEventListener('click', () => loadPage(off));
      pager.appendChild(btn);
    }
  }
});
