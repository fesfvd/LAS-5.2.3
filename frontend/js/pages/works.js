App.register('/works', async () => {
  document.title = '作品列表 — LAS 文学分析';
  const root = document.getElementById('spaApp');
  root.innerHTML = `
    <div style="max-width:960px;margin:0 auto;padding:32px 24px 24px;width:100%;box-sizing:border-box">
      <div class="submit-header" style="display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <p class="mono text-xs text-muted tracking-[4px] uppercase mb-1">WORKSPACE</p>
          <h1 class="serif" style="font-size:30px;font-weight:700;line-height:1.1;letter-spacing:0.03em">我的作品</h1>
        </div>
        <a href="#/upload" class="btn" style="white-space:nowrap;margin-top:4px">+ NEW</a>
      </div>

      <hr class="rule" style="margin:16px 0">

      <div id="worksStats" style="margin-bottom:16px">
        <button id="statsToggle" class="mono" style="font-size:11px;padding:6px 18px;border:1px solid var(--gold);border-radius:4px;background:transparent;color:var(--gold);cursor:pointer;transition:all .2s;letter-spacing:1px">STATS <span style="font-family:'Noto Sans SC',sans-serif;font-size:12px">展开统计</span></button>
        <div id="statsCharts" style="display:none;margin-top:16px">
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <div class="glass-card" style="flex:1;min-width:340px;padding:24px">
              <p class="mono text-xs" style="color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px">分数走势</p>
              <div id="scoreChartWrap" style="width:100%;height:240px"><canvas id="scoreHistoryChart"></canvas></div>
            </div>
            <div class="glass-card" style="flex:1;min-width:320px;padding:24px">
              <p class="mono text-xs" style="color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px">评级分布</p>
              <div id="tierChartWrap" style="width:100%;position:relative"><canvas id="tierPieChart" style="max-height:320px"></canvas></div>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 0 6px">
        <input class="input-underline" id="worksSearch" placeholder="搜索作品名称..." style="flex:1;min-width:160px;max-width:280px;font-size:14px">
        <select id="scoreMin" style="font-size:12px;padding:6px 8px;border:1px solid var(--rule);border-radius:4px;background:transparent;color:var(--muted);font-family:'JetBrains Mono',monospace;cursor:pointer">
          <option value="">最低分</option>
          <option value="0">≥ 0</option><option value="30">≥ 30</option><option value="60">≥ 60</option><option value="90">≥ 90</option><option value="120">≥ 120</option>
        </select>
        <select id="scoreMax" style="font-size:12px;padding:6px 8px;border:1px solid var(--rule);border-radius:4px;background:transparent;color:var(--muted);font-family:'JetBrains Mono',monospace;cursor:pointer">
          <option value="">最高分</option>
          <option value="30">≤ 30</option><option value="60">≤ 60</option><option value="90">≤ 90</option><option value="120">≤ 120</option><option value="150">≤ 150</option>
        </select>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:8px 0 12px">
        <div style="display:flex;align-items:center;gap:6px">
          <span id="selectBar" style="display:none;align-items:center;gap:8px">
            <span class="text-xs" id="selectCount" style="color:var(--gold)">已选 0 项</span>
            <button class="mono text-xs" id="selectConfirmBtn" style="padding:8px 16px;border-radius:4px;cursor:pointer"></button>
            <button class="mono text-xs" id="selectCancelBtn" style="padding:8px 16px;border:1px solid var(--rule-strong);border-radius:4px;background:transparent;color:var(--muted);cursor:pointer">取消</button>
          </span>
          <span id="actionBtns" style="display:flex;align-items:center;gap:6px">
            <button class="mono text-xs" id="enterCompareBtn" style="padding:8px 16px;border:1px solid var(--gold);border-radius:4px;background:transparent;color:var(--gold);cursor:pointer">作品对比</button>
            <button class="mono text-xs" id="enterDeleteBtn" style="padding:8px 16px;border:1px solid var(--crimson);border-radius:4px;background:transparent;color:var(--crimson);cursor:pointer">批量删除</button>
          </span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
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

      <div id="worksList" style="width:100%">
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
      // Reload stats if charts are visible and mode changed
      if (chip.dataset.mode !== undefined && statsLoaded) {
        loadStats();
      }
    });
  });

  // Stats toggle + charts
  var statsLoaded = false;
  document.getElementById('statsToggle').addEventListener('click', function() {
    var charts = document.getElementById('statsCharts');
    var btn = this;
    if (charts.style.display === 'none') {
      charts.style.display = 'flex';
      btn.textContent = '收起统计';
      if (!statsLoaded) { loadStats(); statsLoaded = true; }
    } else {
      charts.style.display = 'none';
      btn.textContent = '展开统计';
    }
  });

  async function loadStats() {
    try {
      var modeParam = currentMode ? '&mode=' + currentMode : '';
      var s = await API._fetch('/works/stats?t=' + Date.now() + modeParam);
      if (!s.ok) { showStatsFallback('加载统计数据失败'); return; }
      var tierDist = s.tier_distribution || [];
      var scoreHist = s.score_history || [];

      if (!tierDist.length && !scoreHist.length) {
        showStatsFallback('暂无已完成分析的作品');
        return;
      }

      setTimeout(function() {
        // Tier doughnut chart — legend below, use backend colors
        if (typeof Chart !== 'undefined' && tierDist.length) {
          var pieCtx = document.getElementById('tierPieChart');
          if (pieCtx && pieCtx.getContext) {
            new Chart(pieCtx, {
              type: 'doughnut',
              data: {
                labels: tierDist.map(function(t){ return t.tier; }),
                datasets: [{
                  data: tierDist.map(function(t){ return t.count; }),
                  backgroundColor: tierDist.map(function(t){ return t.color; }),
                  borderColor: '#faf8f3', borderWidth: 2
                }]
              },
              options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      font: { family: "'Noto Sans SC'", size: 11 }, color: '#1a1a1a',
                      padding: 8, usePointStyle: true, pointStyleWidth: 8,
                      generateLabels: function(chart) {
                        var data = chart.data;
                        return data.labels.map(function(label, i) {
                          return {
                            text: label + ' · ' + data.datasets[0].data[i],
                            fillStyle: data.datasets[0].backgroundColor[i],
                            strokeStyle: data.datasets[0].backgroundColor[i],
                            pointStyle: 'circle',
                            index: i
                          };
                        });
                      }
                    }
                  }
                }
              }
            });
          }
        }

        // Score history line chart
        if (typeof Chart !== 'undefined' && scoreHist.length > 1) {
          var lineCtx = document.getElementById('scoreHistoryChart');
          if (lineCtx && lineCtx.getContext) {
            var reversed = scoreHist.slice().reverse();
            new Chart(lineCtx, {
              type: 'line',
              data: {
                labels: reversed.map(function(_,i){ return '#' + (i+1); }),
                datasets: [{
                  data: reversed.map(function(d){ return d.score; }),
                  borderColor: '#b8860b', backgroundColor: 'rgba(184,134,11,.06)',
                  fill: true, borderWidth: 2, pointRadius: 2, pointBackgroundColor: '#b8860b',
                  tension: 0.3
                }]
              },
              options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 10, family: "'JetBrains Mono'" }, color: 'rgba(26,26,26,.3)' } },
                  y: { min: 0, max: 150, grid: { color: 'rgba(26,26,26,.04)' }, ticks: { font: { size: 10, family: "'JetBrains Mono'" }, color: 'rgba(26,26,26,.3)', stepSize: 30 } }
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(26,26,26,0.88)', titleColor: '#faf8f3',
                    bodyColor: 'rgba(250,248,245,0.8)', borderColor: 'rgba(184,134,11,0.3)', borderWidth: 1, padding: 8, cornerRadius: 6,
                    callbacks: { label: function(c){ return c.raw + ' / 150'; } }
                  }
                }
              }
            });
          }
        } else if (scoreHist.length <= 1) {
          var wrap = document.getElementById('scoreChartWrap');
          if (wrap) wrap.innerHTML = '<p class="text-sm" style="text-align:center;padding:60px 0;color:var(--muted)">需要至少 2 部已完成分析的作品</p>';
        }
      }, 200);
    } catch(e) {}
  }

  function showStatsFallback(msg) {
    var w1 = document.getElementById('scoreChartWrap');
    var w2 = document.getElementById('tierChartWrap');
    if (w1) w1.innerHTML = '<p class="text-sm" style="text-align:center;padding:60px 0;color:var(--muted)">' + msg + '</p>';
    if (w2) w2.innerHTML = '<p class="text-sm" style="text-align:center;padding:60px 0;color:var(--muted)">' + msg + '</p>';
  }

  // Search with debounce
  var searchTimer = null;
  var currentSearch = '';
  document.getElementById('worksSearch').addEventListener('input', function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = this.value.trim();
      loadPage(0);
    }, 300);
  });

  // Score range
  var scoreMin = null, scoreMax = null;
  document.getElementById('scoreMin').addEventListener('change', function() {
    scoreMin = this.value ? parseFloat(this.value) : null;
    loadPage(0);
  });
  document.getElementById('scoreMax').addEventListener('change', function() {
    scoreMax = this.value ? parseFloat(this.value) : null;
    loadPage(0);
  });

  // Selection state
  var selectMode = null; // null | 'compare' | 'delete'
  var selectedIds = new Set();

  function enterSelectMode(mode) {
    selectMode = mode;
    selectedIds.clear();
    document.getElementById('actionBtns').style.display = 'none';
    var bar = document.getElementById('selectBar');
    bar.style.display = 'flex';
    var btn = document.getElementById('selectConfirmBtn');
    if (mode === 'delete') {
      btn.textContent = '删除选中';
      btn.style.border = '1px solid var(--crimson)';
      btn.style.background = 'transparent';
      btn.style.color = 'var(--crimson)';
    } else {
      btn.textContent = '对比';
      btn.style.border = '1px solid var(--gold)';
      btn.style.background = 'transparent';
      btn.style.color = 'var(--gold)';
    }
    updateSelectUI();
    loadPage(currentOffset); // re-render to show checkboxes
  }

  function exitSelectMode() {
    selectMode = null;
    selectedIds.clear();
    document.getElementById('actionBtns').style.display = 'flex';
    document.getElementById('selectBar').style.display = 'none';
    loadPage(currentOffset); // re-render to hide checkboxes
  }

  function updateSelectUI() {
    var n = selectedIds.size;
    document.getElementById('selectCount').textContent = '已选 ' + n + ' 项';
  }

  function toggleSelect(id, checked) {
    if (checked) selectedIds.add(id);
    else selectedIds.delete(id);
    updateSelectUI();
    var card = document.querySelector('.work-item[data-id="' + id + '"]');
    if (card) {
      if (checked) {
        card.style.borderColor = 'var(--gold)';
        card.style.background = 'var(--gold-soft)';
      } else {
        card.style.borderColor = '';
        card.style.background = '';
      }
    }
  }

  // Enter compare mode
  document.getElementById('enterCompareBtn').addEventListener('click', function() {
    enterSelectMode('compare');
  });

  // Enter delete mode
  document.getElementById('enterDeleteBtn').addEventListener('click', function() {
    enterSelectMode('delete');
  });

  // Cancel selection
  document.getElementById('selectCancelBtn').addEventListener('click', function() {
    exitSelectMode();
  });

  // Confirm button (compare or delete depending on mode)
  document.getElementById('selectConfirmBtn').addEventListener('click', async function() {
    if (selectedIds.size === 0) return;

    if (selectMode === 'compare') {
      if (selectedIds.size < 2) { alert('请选择 2-3 个作品进行对比'); return; }
      var ids = Array.from(selectedIds).join(',');
      try {
        var cdata = await API._fetch('/works/compare?ids=' + ids + '&_t=' + Date.now());
        if (!cdata.ok || !cdata.works || cdata.works.length < 2) { alert('所选作品无有效分析报告'); return; }
        exitSelectMode();
        showComparePanel(cdata.works);
      } catch (e) { alert('对比加载失败: ' + (e.message || '')); }
      return;
    }

    if (selectMode === 'delete') {
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:var(--z-overlay);background:rgba(26,26,26,.3);display:flex;align-items:center;justify-content:center';
      overlay.innerHTML = '<div class="glass-card" style="padding:24px;max-width:320px;text-align:center">'
        + '<p class="serif text-lg font-bold mb-2" style="color:var(--ink)">确认删除</p>'
        + '<p class="text-sm mb-6" style="color:var(--muted)">确定要删除选中的 ' + selectedIds.size + ' 部作品吗？此操作不可撤销。</p>'
        + '<div style="display:flex;gap:10px;justify-content:center">'
        + '<button id="bdelCancel" class="mono text-xs" style="padding:8px 24px;border:1px solid var(--rule-strong);border-radius:4px;background:transparent;color:var(--muted);cursor:pointer">取消</button>'
        + '<button id="bdelConfirm" class="mono text-xs" style="padding:8px 24px;border:1px solid var(--crimson);border-radius:4px;background:transparent;color:var(--crimson);cursor:pointer">删除</button>'
        + '</div></div>';
      document.body.appendChild(overlay);
      overlay.querySelector('#bdelCancel').addEventListener('click', function() { overlay.remove(); });
      overlay.querySelector('#bdelConfirm').addEventListener('click', async function() {
        overlay.querySelector('#bdelConfirm').textContent = '...';
        try {
          await API._req('POST', '/works/batch-delete', Array.from(selectedIds));
          overlay.remove();
          exitSelectMode();
          loadPage(0);
        } catch (err) {
          overlay.querySelector('#bdelConfirm').textContent = '失败';
        }
      });
    }
  });

  function showComparePanel(works) {
    // Store in global for the compare page to read
    window.__LAS_COMPARE_DATA = works;
    App.navigate('#/compare');
  }

  await loadPage(0);

  async function loadPage(offset) {
    const list = document.getElementById('worksList');
    list.style.transition = 'opacity .15s ease';
    // Dim existing content during load instead of replacing with spinner (avoids flash)
    if (list.children.length > 0) {
      list.style.opacity = '0.5';
    } else {
      list.innerHTML = '<div class="spinner mx-auto" style="margin-top:40px"></div>';
    }

    try {
      const [sortBy, sortOrder] = currentSort.split('-');
      const params = { limit, offset, sort_by: sortBy, sort_order: sortOrder };
      if (currentMode) params.mode = currentMode;
      const data = await API.getWorksPaginated(params);
      renderList(data.items, data.total);
      list.style.opacity = '1';
      currentOffset = offset;
      renderPager(data.total, offset);
    } catch (e) {
      list.style.opacity = '0';
      setTimeout(function() {
        list.innerHTML = '<p class="text-sm" style="text-align:center;padding:40px 0">⚠ 加载失败: <span style="color:var(--semantic-error)">' + esc(e.message || '') + '</span></p>'
          + '<p style="text-align:center;margin-top:12px"><button onclick="location.reload()" class="text-xs" style="padding:6px 18px;border:1px solid var(--gold);border-radius:4px;background:transparent;color:var(--gold);cursor:pointer">重试</button></p>';
        list.style.opacity = '1';
      }, 160);
    }
  }

  function renderList(items, total) {
    const list = document.getElementById('worksList');
    if (!items.length) {
      var hint;
      if (currentSearch) {
        hint = '未找到包含"' + esc(currentSearch) + '"的作品';
      } else if (scoreMin != null || scoreMax != null) {
        hint = '当前分数范围内暂无作品，试试放宽范围';
      } else if (currentMode) {
        hint = '当前模式下暂无作品';
      } else {
        hint = '提交你的第一部作品，开始文学分析之旅';
      }
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

      const isFailed = w.latest_status === 'failed';
      const isDone = w.latest_status === 'done';
      const isRunning = w.latest_status === 'running';
      const isNone = !w.latest_status;
      const isRejected = isDone && w.latest_wcs_score != null && w.latest_wcs_score === 0;

      // Status badge
      let statusBadge = '';
      if (isRunning) {
        statusBadge = '<span style="font-size:11px;color:#d97706;font-family:\'Noto Sans SC\',sans-serif">分析中…</span>';
      } else if (isFailed) {
        statusBadge = '<span style="font-size:11px;color:var(--semantic-error);font-family:\'Noto Sans SC\',sans-serif">分析失败</span>';
      } else if (isRejected) {
        statusBadge = '<span style="font-size:11px;color:var(--semantic-warning);font-family:\'Noto Sans SC\',sans-serif">未达标</span>';
      } else if (isNone) {
        statusBadge = '<span style="font-size:11px;color:var(--muted);font-family:\'Noto Sans SC\',sans-serif">未分析</span>';
      }

      html +=
        '<div class="glass-card work-item" style="padding:16px 20px;margin-bottom:8px;' + ((isDone && !isRejected) ? 'cursor:pointer;' : '') + 'transition:all .2s;' + ((isFailed || isRejected) ? 'opacity:.6;' : '') + '" data-id="' + esc(w.id) + '">'
        + '<div style="display:flex;align-items:center;gap:14px">'
        + (selectMode ? '<input type="checkbox" class="work-check" data-id="' + esc(w.id) + '" style="width:18px;height:18px;cursor:pointer;accent-color:var(--gold);flex-shrink:0" ' + (selectedIds.has(w.id) ? 'checked' : '') + '>' : '')
        + '<div style="flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:16px">'
        + '<div style="flex:1;min-width:0">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">'
        + '<span class="serif" style="font-size:16px;font-weight:700;letter-spacing:0.03em;color:var(--ink)">' + esc(w.title) + '</span>'
        + '<span style="font-family:JetBrains Mono,monospace;font-size:0.6rem;padding:1px 7px;border-radius:9999px;color:' + (isClassic ? 'var(--crimson)' : 'var(--purple)') + ';background:' + (isClassic ? 'rgba(139,0,0,0.06)' : 'rgba(107,33,168,0.06)') + ';white-space:nowrap;letter-spacing:0.5px;text-transform:uppercase">' + (isClassic ? 'CLASSIC' : 'ORIGINAL') + '</span>'
        + statusBadge
        + (w.ancestor_dialogue ? '<span style="font-family:JetBrains Mono,monospace;font-size:0.6rem;padding:1px 7px;border-radius:9999px;background:rgba(184,134,11,0.08);color:var(--gold);white-space:nowrap;letter-spacing:0.5px">SAGE</span>' : '')
        + '</div>'
        + '<div style="display:flex;align-items:center;gap:12px">'
        + '<span class="text-xs" style="color:var(--muted)">' + esc(w.author || '佚名') + '</span>'
        + '<span class="mono" style="font-size:12px;color:var(--muted)">' + dateStr + '</span>'
        + statusIcon
        + '</div></div>'
        + '<div style="display:flex;align-items:center;gap:16px;flex-shrink:0">'
        + '<div style="text-align:right">'
        + (isRejected ? '<span class="mono" style="font-size:14px;font-weight:700;line-height:1;color:var(--semantic-warning)">未达标</span>' : '<span class="mono" style="font-size:24px;font-weight:700;line-height:1;color:var(--ink)">' + score + '</span>')
        + '<p class="mono" style="font-size:10px;color:var(--muted);margin-top:2px">' + badge + ' ' + esc(w.latest_tier || '—') + '</p>'
        + '</div>'
        + '<div style="display:flex;gap:4px">'
        + (isDone ? '<button class="work-btn view" data-id="' + esc(w.id) + '" title="查看报告"><i class="fas fa-file-alt"></i></button>' : '')
        + ((isDone || isFailed || isRejected) ? '<button class="work-btn redo" data-id="' + esc(w.id) + '" title="重新分析"><i class="fas fa-redo"></i></button>' : '')
        + (isDone ? '<button class="work-btn publish" data-id="' + esc(w.id) + '" title="' + (w.is_public ? '设为私密' : '设为公开') + '" style="' + (w.is_public ? 'color:var(--jade);border-color:var(--jade)' : '') + '"><i class="fas fa-' + (w.is_public ? 'globe' : 'lock') + '"></i></button>' : '')
        + '<button class="work-btn del" data-id="' + esc(w.id) + '" title="删除"><i class="fas fa-trash"></i></button>'
        + '</div></div></div></div></div>';
    });

    list.innerHTML = html;

    if (selectMode) {
      list.querySelectorAll('.work-check').forEach(cb => {
        cb.addEventListener('change', function() {
          toggleSelect(this.dataset.id, this.checked);
        });
      });
    }

    list.querySelectorAll('.work-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('input[type="checkbox"]') || e.target.tagName === 'I') return;
        if (selectMode) {
          var cb = card.querySelector('.work-check');
          if (cb) { cb.checked = !cb.checked; toggleSelect(card.dataset.id, cb.checked); }
          return;
        }
        if (e.currentTarget.querySelector('.redo')) {
          App.navigate('#/report/' + card.dataset.id);
        }
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
    list.querySelectorAll('.publish').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        var res = await API._req('PUT', '/works/' + btn.dataset.id + '/publish');
        if (res.ok) {
          btn.querySelector('i').className = 'fas fa-' + (res.is_public ? 'globe' : 'lock');
          btn.title = res.is_public ? '设为私密' : '设为公开';
          btn.style.color = res.is_public ? 'var(--jade)' : '';
          btn.style.borderColor = res.is_public ? 'var(--jade)' : '';
        }
      });
    });
    list.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        // Custom modal instead of native confirm()
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:var(--z-overlay);background:rgba(26,26,26,.3);display:flex;align-items:center;justify-content:center';
        overlay.innerHTML = '<div class="glass-card" style="max-width:360px;text-align:center;padding:32px">'
          + '<p class="serif text-lg font-bold mb-3" style="color:var(--ink)">确认删除</p>'
          + '<p class="text-sm mb-6" style="color:var(--muted)">此操作不可撤销，确定删除此作品？</p>'
          + '<div style="display:flex;gap:12px;justify-content:center">'
          + '<button class="mono text-xs" id="modalCancel" style="padding:8px 24px;border:1px solid var(--rule-strong);border-radius:4px;background:transparent;color:var(--muted);cursor:pointer;font-family:JetBrains Mono,monospace">取消</button>'
          + '<button class="mono text-xs" id="modalConfirm" style="padding:8px 24px;border:1px solid var(--crimson);border-radius:4px;background:transparent;color:var(--crimson);cursor:pointer;font-family:JetBrains Mono,monospace">删除</button>'
          + '</div></div>';
        document.body.appendChild(overlay);
        overlay.querySelector('#modalCancel').addEventListener('click', function() { overlay.remove(); });
        overlay.querySelector('#modalConfirm').addEventListener('click', async function() {
          overlay.remove();
          try { await API.deleteWork(btn.dataset.id); loadPage(currentOffset); }
          catch (err) { alert('删除失败: ' + (err.message || '')); }
        });
      });
    });
  }

  function renderPager(total, offset) {
    const pager = document.getElementById('worksPager');
    const pages = Math.ceil(total / limit);
    if (pages <= 1) { pager.style.display = 'none'; return; }
    pager.style.display = 'flex';
    pager.textContent = '';
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

// ═══════════════════════════════════════════
// Compare page — full-page comparison view
// ═══════════════════════════════════════════
App.register('/compare', function() {
  var works = window.__LAS_COMPARE_DATA;
  if (!works || !works.length) { App.navigate('#/works'); return; }

  document.title = '作品对比 — LAS';
  var root = document.getElementById('spaApp');
  var compareColors = [
    { hex: '#b8860b', soft: 'rgba(184,134,11,0.06)', fill: 'rgba(184,134,11,0.08)' },
    { hex: '#8b0000', soft: 'rgba(139,0,0,0.06)', fill: 'rgba(139,0,0,0.08)' },
    { hex: '#6b21a8', soft: 'rgba(107,33,168,0.06)', fill: 'rgba(107,33,168,0.08)' }
  ];

  function tierBadge(score) {
    if (score >= 140) return ['文学之巅','👑'];
    if (score >= 125) return ['永恒殿堂','🏆'];
    if (score >= 115) return ['不朽丰碑','🏛️'];
    if (score >= 105) return ['传世经典','📜'];
    if (score >= 95)  return ['典范之作','⭐'];
    if (score >= 85)  return ['上乘佳作','✨'];
    if (score >= 75)  return ['中等之作','🎯'];
    if (score >= 65)  return ['准文学级','📚'];
    if (score >= 55)  return ['合格文本','✅'];
    return ['—',''];
  }

  var dimNames = {}, dimIds = [];
  works.forEach(function(w) { for (var k in w.dimensions) dimNames[k] = w.dimensions[k].name; });
  dimIds = Object.keys(dimNames).sort(function(a,b){ return parseInt(a)-parseInt(b); });
  var layers = { A: [1,2,3,4], B: [5,6,7,8], C: [9,10,11,12], D: [13,14,15,16] };
  var layerLabels = { A: '语言与形式', B: '叙事与内容', C: '思想与意义', D: '审美与影响' };
  var layerColors = { A: 'var(--crimson)', B: 'var(--jade)', C: 'var(--gold)', D: 'var(--ink)' };

  // ── overview cards ──
  var overviewHTML = works.map(function(w, i) {
    var c = compareColors[i];
    var badge = tierBadge(w.wcs);
    return '<div class="glass-card" style="flex:1;min-width:220px;padding:24px;text-align:center">'
      + '<p class="serif" style="font-size:18px;font-weight:700;color:var(--ink);margin-bottom:2px">' + esc(w.title) + '</p>'
      + '<p class="text-xs" style="color:var(--muted);margin-bottom:14px">' + esc(w.author) + ' · ' + (w.mode === 'classic' ? '经典' : '原创') + '</p>'
      + '<span class="mono" style="font-size:40px;font-weight:700;line-height:1;color:' + c.hex + '">' + w.wcs.toFixed(1) + '</span>'
      + '<p style="margin-top:6px"><span class="text-xs" style="display:inline-block;padding:3px 14px;border-radius:99px;background:' + c.soft + ';color:' + c.hex + ';font-weight:600">' + badge[0] + ' ' + badge[1] + '</span></p>'
      + '</div>';
  }).join('');

  // ── table ──
  var diffHeader = works.length === 2 ? '<th style="text-align:center;padding:8px;color:var(--muted);font-size:11px;width:72px">Δ 差异</th>' : '';
  var tableHeaders = works.map(function(w, i) {
    return '<th style="text-align:center;padding:10px 8px;color:' + compareColors[i].hex + ';font-size:12px;font-weight:600">' + esc(w.title) + '</th>';
  }).join('');

  var tableRows = dimIds.map(function(did) {
    var layer = did <= 4 ? 'A' : did <= 8 ? 'B' : did <= 12 ? 'C' : 'D';
    var scores = works.map(function(w, i) {
      var d = w.dimensions[did];
      if (!d) return '<td style="text-align:center;color:var(--muted)">—</td>';
      return '<td style="text-align:center;padding:10px 8px"><span class="mono" style="font-size:16px;font-weight:700;color:' + compareColors[i].hex + '">' + d.score.toFixed(1) + '</span><br><span class="text-xs" style="color:var(--muted)">' + esc(d.tier) + '</span></td>';
    }).join('');
    var diffHTML = '';
    if (works.length === 2) {
      var a = works[0].dimensions[did], b = works[1].dimensions[did];
      if (a && b) {
        var delta = (a.score - b.score).toFixed(1);
        var abs = Math.abs(parseFloat(delta));
        var winner = delta > 0 ? 0 : delta < 0 ? 1 : -1;
        var dc = winner >= 0 ? compareColors[winner === -1 ? 0 : winner].hex : 'var(--muted)';
        diffHTML = '<td style="text-align:center;padding:10px 8px"><span class="mono text-xs" style="font-weight:600;color:' + dc + '">' + (delta > 0 ? '+' : '') + delta + '</span></td>';
      } else {
        diffHTML = '<td style="text-align:center;color:var(--muted)">—</td>';
      }
    }
    return '<tr style="border-bottom:1px solid var(--rule)"><td style="padding:10px 12px"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:8px;background:' + layerColors[layer] + '"></span><span style="font-size:13px;color:var(--ink)">' + esc(dimNames[did]) + '</span></td>' + scores + diffHTML + '</tr>';
  }).join('');

  // ── layer summary ──
  var layerSummary = '';
  ['A','B','C','D'].forEach(function(l) {
    var totals = works.map(function(w) {
      return layers[l].reduce(function(sum, id) {
        var d = w.dimensions[id];
        return sum + (d ? d.score : 0);
      }, 0);
    });
    var max = Math.max.apply(null, totals);
    var winnerIdx = totals.indexOf(max);
    var runnerUp = Math.max.apply(null, totals.filter(function(_,i){ return i !== winnerIdx; }));
    var lead = (max - runnerUp).toFixed(1);
    var w = works[winnerIdx];
    layerSummary += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--rule)">'
      + '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + layerColors[l] + '"></span><span style="font-size:13px;font-weight:600;color:var(--ink)">' + l + '层 ' + layerLabels[l] + '</span></div>'
      + '<div style="text-align:right"><span class="serif text-sm" style="color:' + compareColors[winnerIdx].hex + ';font-weight:600">' + esc(w.title) + ' 胜出</span><span class="mono text-xs" style="color:var(--muted);margin-left:8px">+' + lead + '</span></div></div>';
  });

  // ── diff analysis (2 works only) ──
  var maxDiff = { dim: '', val: 0 }, minDiff = { dim: '', val: 999 };
  if (works.length === 2) {
    dimIds.forEach(function(did) {
      var a = works[0].dimensions[did], b = works[1].dimensions[did];
      if (a && b) {
        var d = Math.abs(a.score - b.score);
        if (d > maxDiff.val) maxDiff = { dim: dimNames[did], val: d };
        if (d < minDiff.val) minDiff = { dim: dimNames[did], val: d };
      }
    });
  }

  // ── render ──
  root.innerHTML = '<div style="max-width:960px;margin:0 auto;padding:32px 24px 24px;width:100%;box-sizing:border-box">'
    + '<div class="submit-header" style="display:flex;align-items:flex-start;justify-content:space-between">'
    + '<div><p class="mono text-xs text-muted tracking-[4px] uppercase mb-1">COMPARISON</p><h1 class="serif" style="font-size:30px;font-weight:700;line-height:1.1;letter-spacing:0.03em">作品对比</h1></div>'
    + '<a href="#/works" class="mono text-xs" style="padding:8px 16px;border:1px solid var(--rule-strong);border-radius:4px;background:transparent;color:var(--muted);cursor:pointer;text-decoration:none">← 返回</a>'
    + '</div>'
    + '<hr class="rule" style="margin:16px 0">'
    + '<div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">' + overviewHTML + '</div>'
    + '<hr class="rule-strong" style="margin-bottom:24px">'
    + '<h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">雷达图</h2>'
    + '<div class="glass-card" style="padding:28px;margin-bottom:24px"><canvas id="compareRadar" style="width:100%;height:520px"></canvas></div>'
    + '<hr class="rule-strong" style="margin-bottom:24px">'
    + '<h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">评分对比</h2>'
    + '<div class="glass-card" style="padding:4px 20px 20px;margin-bottom:24px;overflow-x:auto">'
    + '<table style="width:100%;font-size:13px;min-width:500px;border-collapse:collapse">'
    + '<thead><tr style="border-bottom:2px solid var(--rule-strong)">'
    + '<th style="text-align:left;padding:10px 12px;color:var(--muted);font-size:11px">维度</th>' + tableHeaders + diffHeader
    + '</tr></thead><tbody>' + tableRows + '</tbody></table>'
    + '</div>'
    + '<hr class="rule-strong" style="margin-bottom:24px">'
    + '<h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">层面总结</h2>'
    + '<div class="glass-card" style="padding:8px 24px 12px;margin-bottom:24px">' + layerSummary + '</div>';

  if (works.length === 2) {
    var container = root.querySelector('div[style*="max-width:960px"]');
    if (container) {
      container.insertAdjacentHTML('beforeend',
        '<hr class="rule-strong" style="margin-bottom:24px">'
        + '<h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">差异分析</h2>'
        + '<div class="glass-card" style="padding:24px;margin-bottom:24px"><div style="display:flex;gap:16px">'
        + '<div style="flex:1;padding:20px;background:var(--card-tint-warning);border:1px solid rgba(180,120,30,.1);border-radius:8px;text-align:center">'
        + '<p class="mono text-xs" style="color:var(--semantic-warning);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">最大差异维度</p>'
        + '<p class="serif" style="font-size:16px;font-weight:700;color:var(--ink);margin-bottom:6px">' + esc(maxDiff.dim) + '</p>'
        + '<p class="mono" style="font-size:28px;font-weight:700;color:var(--semantic-warning);line-height:1">Δ ' + maxDiff.val.toFixed(1) + '</p></div>'
        + '<div style="flex:1;padding:20px;background:var(--card-tint-jade);border:1px solid rgba(45,106,79,.1);border-radius:8px;text-align:center">'
        + '<p class="mono text-xs" style="color:var(--jade);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">最小差异维度</p>'
        + '<p class="serif" style="font-size:16px;font-weight:700;color:var(--ink);margin-bottom:6px">' + esc(minDiff.dim) + '</p>'
        + '<p class="mono" style="font-size:28px;font-weight:700;color:var(--jade);line-height:1">Δ ' + minDiff.val.toFixed(1) + '</p></div>'
        + '</div></div>');
    }
  }

  // ── radar chart ──
  if (typeof Chart !== 'undefined') {
    setTimeout(function() {
      var canvas = document.getElementById('compareRadar');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var dimLabels = dimIds.map(function(id) { return dimNames[id]; });
      var datasets = works.map(function(w, i) {
        var c = compareColors[i];
        return {
          label: w.title,
          data: dimIds.map(function(id) { var d = w.dimensions[id]; return d ? d.score : 0; }),
          fill: true, borderWidth: 2,
          backgroundColor: c.fill,
          borderColor: c.hex,
          pointBackgroundColor: c.hex,
          pointBorderColor: '#faf8f5', pointBorderWidth: 1.5,
          pointRadius: 3, pointHoverRadius: 6
        };
      });
      new Chart(ctx, {
        type: 'radar',
        data: { labels: dimLabels, datasets: datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            r: { min: 0, max: 150, ticks: { display: false },
              grid: { color: 'rgba(26,26,26,.04)', circular: true },
              angleLines: { color: 'rgba(26,26,26,.04)' },
              pointLabels: { font: { size: 11, family: "'Noto Sans SC'", weight: '500' }, color: '#1a1a1a' }
            }
          },
          plugins: {
            legend: { position: 'bottom', labels: { font: { family: "'Noto Sans SC'", size: 13, weight: '600' }, color: '#1a1a1a', padding: 20, usePointStyle: true, pointStyleWidth: 10 } },
            tooltip: {
              backgroundColor: 'rgba(26,26,26,0.88)', titleColor: '#faf8f3',
              bodyColor: 'rgba(250,248,245,0.8)', borderColor: 'rgba(184,134,11,0.3)', borderWidth: 1, padding: 10, cornerRadius: 6,
              titleFont: { family: "'Noto Serif SC'", weight: '700', size: 14 },
              bodyFont: { family: "'Noto Sans SC'", weight: '500', size: 12 },
            }
          },
          animation: { duration: 600 }
        }
      });
    }, 150);
  }
});
