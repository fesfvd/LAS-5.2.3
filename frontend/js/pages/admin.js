App.register('/admin', async () => {
  document.title = '管理后台 — LAS';
  var root = document.getElementById('spaApp');

  // Check admin role
  try {
    var me = await API._fetch('/users/me?_t=' + Date.now());
    if (!me.ok || me.user.role !== 'admin') { App.navigate('#/upload'); return; }
  } catch (e) { App.navigate('#/upload'); return; }

  root.innerHTML = `
    <div class="submit-container">
      <div class="submit-header">
        <p class="mono text-xs text-muted tracking-[4px] mb-1">ADMIN</p>
        <h1 class="serif text-3xl font-black leading-[1.1]">管理后台</h1>
      </div>
      <hr class="rule" style="margin:16px 0">
      <div id="adminStats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        <div class="spinner mx-auto" style="margin-top:20px"></div>
      </div>
      <div class="glass-card" style="padding:20px;margin-bottom:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <p class="serif text-sm font-bold" style="color:var(--ink)">用户列表</p>
          <input id="userSearch" class="input-underline" placeholder="搜索用户名或邮箱..." style="width:200px;font-size:13px">
        </div>
        <div id="userTable" style="overflow-x:auto"><div class="spinner mx-auto" style="margin-top:20px"></div></div>
      </div>
      <div class="glass-card" style="padding:20px;margin-bottom:12px">
        <p class="serif text-sm font-bold mb-3" style="color:var(--ink)">生成邀请码</p>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <input id="inviteCount" type="number" min="1" max="100" value="5" style="width:64px;padding:6px 8px;border:1px solid var(--rule);border-radius:4px;background:transparent;font-size:13px;text-align:center;font-family:'JetBrains Mono',monospace">
          <button id="genInviteBtn" class="btn" style="font-size:11px;padding:6px 18px">GENERATE <span class="btn-zh">生成</span></button>
        </div>
        <div id="inviteResult" style="display:flex;flex-direction:column;gap:6px"></div>
      </div>
      <div class="glass-card" style="padding:20px">
        <p class="serif text-sm font-bold mb-3" style="color:var(--ink)">邀请码列表</p>
        <div id="inviteList" style="overflow-x:auto"><div class="spinner mx-auto" style="margin-top:20px"></div></div>
      </div>
    </div>`;

  // Load stats
  try {
    var stats = await API._fetch('/admin/stats');
    if (stats.ok) {
      var s = stats.stats;
      var cards = [
        { label: '用户总数', value: s.total_users, sub: s.guest_count + ' 游客' },
        { label: '作品总数', value: s.total_works, sub: '今日 +' + s.today_works },
        { label: '分析总数', value: s.total_analyses, sub: '今日 +' + s.today_analyses },
        { label: '可用邀请码', value: s.available_invites, sub: '' },
      ];
      document.getElementById('adminStats').innerHTML = cards.map(function(c) {
        return '<div class="glass-card" style="padding:16px;text-align:center"><span class="mono" style="font-size:28px;font-weight:700;color:var(--ink)">' + c.value + '</span><p class="text-xs" style="color:var(--muted);margin-top:4px">' + c.label + '</p>' + (c.sub ? '<p class="text-xs" style="color:var(--gold)">' + c.sub + '</p>' : '') + '</div>';
      }).join('');
    }
  } catch (e) { document.getElementById('adminStats').innerHTML = '<p class="text-xs" style="color:var(--crimson);text-align:center;padding:20px">加载统计失败</p>'; }

  // Load users
  async function loadUsers(search) {
    try {
      var data = await API._fetch('/admin/users?limit=50&search=' + encodeURIComponent(search || ''));
      if (!data.ok) return;
      var html = '<table style="width:100%;font-size:13px"><thead><tr style="border-bottom:2px solid var(--rule-strong)"><th style="text-align:left;padding:8px 6px;color:var(--muted);font-size:11px">用户名</th><th style="text-align:left;padding:8px 6px;color:var(--muted);font-size:11px">邮箱</th><th style="text-align:center;padding:8px 6px;color:var(--muted);font-size:11px">角色</th><th style="text-align:center;padding:8px 6px;color:var(--muted);font-size:11px">作品</th><th style="text-align:center;padding:8px 6px;color:var(--muted);font-size:11px">分析</th><th style="text-align:left;padding:8px 6px;color:var(--muted);font-size:11px">注册时间</th></tr></thead><tbody>';
      data.items.forEach(function(u) {
        var roleColors = { admin: 'var(--gold)', user: 'var(--jade)', guest: 'var(--muted)' };
        html += '<tr style="border-bottom:1px solid var(--rule)"><td style="padding:8px 6px;color:var(--ink)">' + esc(u.username) + '</td><td style="padding:8px 6px;color:var(--muted);font-size:12px">' + esc(u.email || '—') + (u.email_verified ? '' : ' <span style="color:var(--crimson);font-size:10px">未验证</span>') + '</td><td style="padding:8px 6px;text-align:center;font-size:12px;color:' + (roleColors[u.role] || 'var(--muted)') + '">' + esc(u.role) + '</td><td style="padding:8px 6px;text-align:center" class="mono text-xs">' + u.work_count + '</td><td style="padding:8px 6px;text-align:center" class="mono text-xs">' + u.analysis_count + '</td><td style="padding:8px 6px;font-size:11px;color:var(--muted)">' + (u.created_at || '').slice(0, 10) + '</td></tr>';
      });
      html += '</tbody></table>';
      if (!data.items.length) html = '<p class="text-sm" style="text-align:center;padding:20px;color:var(--muted)">无匹配用户</p>';
      document.getElementById('userTable').innerHTML = html;
    } catch (e) { document.getElementById('userTable').innerHTML = '<p class="text-xs" style="color:var(--crimson);text-align:center;padding:20px">加载失败</p>'; }
  }
  loadUsers('');

  var searchTimer = null;
  document.getElementById('userSearch').addEventListener('input', function() {
    clearTimeout(searchTimer);
    var v = this.value;
    searchTimer = setTimeout(function() { loadUsers(v); }, 300);
  });

  // Generate invite codes
  document.getElementById('genInviteBtn').addEventListener('click', async function() {
    var btn = this;
    var count = parseInt(document.getElementById('inviteCount').value) || 5;
    if (count < 1) count = 1; if (count > 100) count = 100;
    btn.disabled = true;
    btn.querySelector('.btn-zh').textContent = '生成中...';
    try {
      var res = await API._req('POST', '/admin/invite-codes?count=' + count);
      if (res.ok) {
        var container = document.getElementById('inviteResult');
        container.innerHTML = res.codes.map(function(c) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--rule);border-radius:8px;background:var(--surface-glass)">'
            + '<span class="mono" style="font-size:13px;color:var(--ink);flex:1">' + esc(c) + '</span>'
            + '<button class="copyCodeBtn" data-code="' + esc(c) + '" style="font-size:12px;padding:8px 16px;min-height:40px;border:1px solid var(--rule);border-radius:4px;background:transparent;cursor:pointer;color:var(--muted);white-space:nowrap;transition:all .2s">复制</button>'
            + '</div>';
        }).join('');
        // Bind copy buttons
        container.querySelectorAll('.copyCodeBtn').forEach(function(b) {
          b.addEventListener('click', function() {
            var code = this.dataset.code;
            navigator.clipboard.writeText(code).then(function() {
              b.textContent = '已复制';
              b.style.color = 'var(--jade)';
              b.style.borderColor = 'var(--jade)';
              setTimeout(function() { b.textContent = '复制'; b.style.color = 'var(--muted)'; b.style.borderColor = 'var(--rule)'; }, 1500);
            }).catch(function() {
              prompt('复制以下邀请码：', code);
            });
          });
          b.addEventListener('mouseenter', function() { if (this.textContent === '复制') { this.style.color = 'var(--ink)'; this.style.borderColor = 'var(--ink)'; } });
          b.addEventListener('mouseleave', function() { if (this.textContent === '复制') { this.style.color = 'var(--muted)'; this.style.borderColor = 'var(--rule)'; } });
        });
      }
    } catch (e) {
      document.getElementById('inviteResult').innerHTML = '<span class="text-xs" style="color:var(--crimson)">生成失败</span>';
    }
    btn.disabled = false;
    btn.querySelector('.btn-zh').textContent = '生成';
  });

  // Load invite code list
  async function loadInvites() {
    try {
      var res = await API._fetch('/admin/invite-codes');
      if (!res.ok) { document.getElementById('inviteList').innerHTML = '<p class="text-xs" style="color:var(--crimson);text-align:center;padding:20px">加载失败</p>'; return; }
      if (!res.items.length) {
        document.getElementById('inviteList').innerHTML = '<p class="text-sm" style="text-align:center;padding:20px;color:var(--muted)">暂无邀请码</p>';
        return;
      }
      var html = '<table style="width:100%;font-size:13px"><thead><tr style="border-bottom:2px solid var(--rule-strong)">'
        + '<th style="text-align:left;padding:8px 6px;color:var(--muted);font-size:11px">邀请码</th>'
        + '<th style="text-align:center;padding:8px 6px;color:var(--muted);font-size:11px;width:60px">状态</th>'
        + '<th style="text-align:left;padding:8px 6px;color:var(--muted);font-size:11px">使用者</th>'
        + '<th style="text-align:left;padding:8px 6px;color:var(--muted);font-size:11px">生成时间</th>'
        + '<th style="text-align:left;padding:8px 6px;color:var(--muted);font-size:11px">使用时间</th>'
        + '<th style="width:60px"></th>'
        + '</tr></thead><tbody>';
      res.items.forEach(function(c) {
        var statusColor = c.is_used ? 'var(--muted)' : 'var(--jade)';
        var statusText = c.is_used ? '已用' : '可用';
        html += '<tr style="border-bottom:1px solid var(--rule)">'
          + '<td class="mono" style="padding:8px 6px;font-size:12px;color:var(--ink)">' + esc(c.code) + '</td>'
          + '<td style="padding:8px 6px;text-align:center;font-size:11px;color:' + statusColor + '">' + statusText + '</td>'
          + '<td style="padding:8px 6px;font-size:12px;color:var(--muted)">' + esc(c.used_by || '—') + '</td>'
          + '<td style="padding:8px 6px;font-size:11px;color:var(--muted)">' + (c.created_at || '').slice(0, 16).replace('T',' ') + '</td>'
          + '<td style="padding:8px 6px;font-size:11px;color:var(--muted)">' + (c.used_at ? c.used_at.slice(0, 16).replace('T',' ') : '—') + '</td>'
          + '<td style="padding:8px 6px;text-align:center"><button class="copyListBtn" data-code="' + esc(c.code) + '" style="font-size:12px;padding:8px 16px;min-height:40px;border:1px solid var(--rule);border-radius:4px;background:transparent;cursor:pointer;color:var(--muted);white-space:nowrap">复制</button></td>'
          + '</tr>';
      });
      html += '</tbody></table>';
      document.getElementById('inviteList').innerHTML = html;
      document.getElementById('inviteList').querySelectorAll('.copyListBtn').forEach(function(b) {
        b.addEventListener('click', function() {
          var code = this.dataset.code;
          navigator.clipboard.writeText(code).then(function() {
            b.textContent = '已复制';
            b.style.color = 'var(--jade)';
            b.style.borderColor = 'var(--jade)';
            setTimeout(function() { b.textContent = '复制'; b.style.color = 'var(--muted)'; b.style.borderColor = 'var(--rule)'; }, 1500);
          }).catch(function() {
            prompt('复制以下邀请码：', code);
          });
        });
      });
    } catch (e) { document.getElementById('inviteList').innerHTML = '<p class="text-xs" style="color:var(--crimson);text-align:center;padding:20px">加载失败</p>'; }
  }
  loadInvites();
});
