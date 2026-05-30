App.register('/profile', async () => {
  document.title = '个人中心 — LAS';
  var root = document.getElementById('spaApp');

  root.innerHTML = `
    <div class="submit-container">
      <div class="submit-header" style="display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <p class="mono text-xs text-muted tracking-[4px] uppercase mb-1">PROFILE</p>
          <h1 class="serif text-3xl font-black leading-[1.1]">个人中心</h1>
        </div>
        <button class="btn" style="font-size:11px;padding:8px 16px" id="logoutBtn">LOGOUT <span class="btn-zh">退出</span></button>
      </div>
      <hr class="rule" style="margin:16px 0">
      <div id="profileContent"><div class="spinner mx-auto" style="margin-top:40px"></div></div>
    </div>`;

  document.getElementById('logoutBtn').addEventListener('click', function() {
    // Confirm modal
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:var(--z-overlay);background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = '<div class="glass-card" style="padding:24px;max-width:320px;text-align:center">'
      + '<p class="serif text-lg font-bold mb-2" style="color:var(--ink)">确认退出</p>'
      + '<p class="text-sm mb-6" style="color:var(--muted)">确定要退出登录吗？</p>'
      + '<div style="display:flex;gap:10px;justify-content:center">'
      + '<button id="logoutCancel" class="mono text-xs" style="padding:8px 24px;border:1px solid var(--rule-strong);border-radius:4px;background:transparent;color:var(--muted);cursor:pointer">取消</button>'
      + '<button id="logoutConfirm" class="mono text-xs" style="padding:8px 24px;border:1px solid var(--crimson);border-radius:4px;background:transparent;color:var(--crimson);cursor:pointer">退出</button>'
      + '</div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#logoutCancel').addEventListener('click', function() { overlay.remove(); });
    overlay.querySelector('#logoutConfirm').addEventListener('click', function() {
      API.clearToken();
      localStorage.removeItem('las_username');
      App.navigate('#/login');
    });
  });

  try {
    var data = await API._fetch('/users/me');
    if (!data.ok) throw new Error('加载失败');
    var u = data.user;
    renderProfile(u);
  } catch (e) {
    document.getElementById('profileContent').innerHTML =
      '<p class="text-sm" style="color:var(--crimson);text-align:center;padding:40px 0">加载失败: ' + esc(e.message || '') + '</p>';
  }

  function renderProfile(u) {
    var roleNames = { user: '正式用户', guest: '游客', admin: '管理员' };
    var roleBadge = u.role === 'guest'
      ? 'background:rgba(138,133,120,.08);color:var(--muted)'
      : u.role === 'admin'
        ? 'background:rgba(184,134,11,.08);color:var(--gold)'
        : 'background:rgba(45,106,79,.08);color:var(--jade)';

    var stats = [
      { label: '作品总数', value: u.total_works ?? '—', icon: '📚' },
      { label: '分析次数', value: u.analysis_count ?? '—', icon: '🔬' },
      { label: '平均分', value: u.avg_score != null ? u.avg_score.toFixed(1) : '—', icon: '📊' },
      { label: '最高分', value: u.best_score ? u.best_score.toFixed(1) : '—', sub: u.best_tier || '', icon: '🏆' },
    ];

    var recentHTML = '';
    if (u.recent_works && u.recent_works.length) {
      recentHTML = '<p class="serif text-sm font-bold mb-3" style="color:var(--ink)">最近作品</p>'
        + u.recent_works.map(function(w) {
          var sIcon = w.status === 'done' ? '<span style="color:var(--jade)">✓</span>'
            : w.status === 'running' ? '<span style="color:#d97706">◌</span>'
            : w.status === 'failed' ? '<span style="color:var(--semantic-error)">✕</span>'
            : '<span style="color:var(--muted)">—</span>';
          var score = w.score != null ? '<span class="mono" style="font-size:14px;font-weight:700;color:var(--ink)">' + w.score.toFixed(1) + '</span>' : '<span class="mono text-xs" style="color:var(--muted)">—</span>';
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--rule)">'
            + '<div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">'
            + sIcon
            + '<span class="serif text-sm" style="color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(w.title) + '</span>'
            + '<span class="mono text-xs" style="color:var(--muted)">' + (w.mode === 'classic' ? '经典' : '原创') + '</span>'
            + '</div>'
            + '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:12px">'
            + score
            + '<span class="text-xs" style="color:var(--muted)">' + esc(w.tier || '') + '</span>'
            + '</div></div>';
        }).join('');
    }

    var html = `
    <div class="glass-card" style="padding:24px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
        <div style="width:48px;height:48px;border-radius:50%;background:rgba(184,134,11,.1);display:flex;align-items:center;justify-content:center">
          <span class="serif" style="font-size:22px;font-weight:700;color:var(--gold)">${esc((u.username||'?')[0].toUpperCase())}</span>
        </div>
        <div>
          <span class="serif" style="font-size:18px;font-weight:700;color:var(--ink)">${esc(u.username)}</span>
          <span class="mono text-xs" style="padding:2px 10px;border-radius:99px;margin-left:8px;${roleBadge};font-weight:500">${roleNames[u.role] || u.role}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        ${stats.map(function(s) {
          return '<div style="text-align:center;padding:12px 8px;background:var(--card-tint-gold);border-radius:8px">'
            + '<span style="font-size:20px">' + s.icon + '</span>'
            + '<p class="mono" style="font-size:20px;font-weight:700;line-height:1.2;color:var(--ink);margin-top:4px">' + s.value + '</p>'
            + (s.sub ? '<p class="text-xs" style="color:var(--muted);margin-top:2px">' + esc(s.sub) + '</p>' : '')
            + '<p class="text-xs" style="color:var(--muted);margin-top:2px">' + s.label + '</p>'
            + '</div>';
        }).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;color:var(--muted);padding-top:12px;border-top:1px solid var(--rule)">
        <div><span class="text-xs" style="color:var(--ink);font-weight:500">邮箱</span><br>${esc(u.email || '未绑定')} ${u.email_verified ? '<span style="color:var(--jade);font-size:11px">✓已验证</span>' : '<span style="color:var(--crimson);font-size:11px">未验证</span>'}</div>
        <div><span class="text-xs" style="color:var(--ink);font-weight:500">注册时间</span><br>${(u.created_at||'').slice(0,10)}</div>
      </div>
    </div>

    ${recentHTML ? '<div class="glass-card" style="padding:20px;margin-bottom:12px">' + recentHTML + '</div>' : ''}

    <div class="glass-card" style="padding:20px;margin-bottom:12px">
      <p class="serif text-sm font-bold mb-3" style="color:var(--ink)">修改密码</p>
      <form id="pwdForm">
        <div class="field-group" style="margin-bottom:10px">
          <input class="input-underline" name="current_password" type="password" placeholder="当前密码" required maxlength="100">
        </div>
        <div class="field-group" style="margin-bottom:12px">
          <input class="input-underline" name="new_password" type="password" placeholder="新密码（至少 6 位）" required minlength="6" maxlength="100">
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <button type="submit" class="btn" style="font-size:11px;padding:6px 18px">修改密码</button>
          <span id="pwdMsg" class="text-xs"></span>
        </div>
      </form>
    </div>

    <div class="glass-card" style="padding:20px;margin-bottom:12px">
      <p class="serif text-sm font-bold mb-3" style="color:var(--ink)">${u.email ? '更换邮箱' : '绑定邮箱'}</p>
      <form id="emailForm">
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <input class="input-underline" name="email" type="email" placeholder="新邮箱地址" required maxlength="100" style="flex:1">
          <button type="button" id="bindSendCode" style="font-size:12px;padding:8px 14px;border:1px solid var(--gold);border-radius:6px;background:transparent;color:var(--gold);cursor:pointer;white-space:nowrap">发送验证码</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <input class="input-underline mono" name="code" placeholder="6 位验证码" maxlength="6" style="width:140px;letter-spacing:4px">
          <button type="submit" class="btn" style="font-size:11px;padding:6px 18px">确认${u.email ? '更换' : '绑定'}</button>
          <span id="emailMsg" class="text-xs"></span>
        </div>
      </form>
    </div>

    ${u.role === 'guest' ? `
    <div class="glass-card" style="padding:20px;margin-bottom:12px">
      <p class="serif text-sm font-bold mb-3" style="color:var(--ink)">升级正式用户</p>
      <form id="upgradeForm">
        <div style="display:flex;align-items:center;gap:10px">
          <input class="input-underline mono" name="invite_code" placeholder="邀请码" maxlength="32" style="width:200px;text-transform:uppercase;letter-spacing:2px">
          <button type="submit" class="btn" style="font-size:11px;padding:6px 18px">升级</button>
          <span id="upgradeMsg" class="text-xs"></span>
        </div>
      </form>
    </div>` : ''}

    <div class="glass-card" style="padding:20px;margin-bottom:12px">
      <p class="serif text-sm font-bold mb-3" style="color:var(--ink)">修改用户名</p>
      <form id="usernameForm">
        <div style="display:flex;align-items:center;gap:10px">
          <input class="input-underline" name="username" placeholder="2-50 个字符" required minlength="2" maxlength="50" style="width:200px" value="${esc(u.username)}">
          <button type="submit" class="btn" style="font-size:11px;padding:6px 18px">保存</button>
          <span id="usernameMsg" class="text-xs"></span>
        </div>
      </form>
    </div>

    <div class="glass-card" style="padding:20px;margin-bottom:12px">
      <p class="serif text-sm font-bold mb-3" style="color:var(--crimson)">注销账号</p>
      <p class="text-xs" style="color:var(--muted);margin-bottom:12px">注销后 7 天内可联系恢复，到期将永久删除所有数据</p>
      <button id="deleteAccountBtn" class="btn" style="font-size:11px;padding:6px 18px;border-color:var(--crimson);color:var(--crimson)">注销账号</button>
    </div>`;

    document.getElementById('profileContent').innerHTML = html;

    // ── Password change ──
    document.getElementById('pwdForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      var fd = new FormData(this);
      var msg = document.getElementById('pwdMsg');
      msg.style.color = 'var(--muted)';
      msg.textContent = '...';
      try {
        await API._req('PUT', '/users/password', {
          current_password: fd.get('current_password'),
          new_password: fd.get('new_password')
        });
        msg.style.color = 'var(--jade)';
        msg.textContent = '密码已修改';
        this.reset();
      } catch (err) {
        msg.style.color = 'var(--crimson)';
        msg.textContent = err.message;
      }
    });

    // ── Email change ──
    var bindSent = false;
    var bindCountdown = 0;
    document.getElementById('bindSendCode').addEventListener('click', async function() {
      var email = document.querySelector('#emailForm [name="email"]').value;
      if (!email || email.indexOf('@') < 0) {
        document.getElementById('emailMsg').textContent = '请输入有效邮箱';
        document.getElementById('emailMsg').style.color = 'var(--crimson)';
        return;
      }
      var btn = this;
      btn.disabled = true;
      bindCountdown = 60;
      btn.textContent = bindCountdown + 's';
      var timer = setInterval(function() {
        bindCountdown--;
        if (bindCountdown <= 0) { clearInterval(timer); btn.textContent = '发送验证码'; btn.disabled = false; }
        else btn.textContent = bindCountdown + 's';
      }, 1000);
      try {
        await API._post('/auth/send-code', { email: email, purpose: 'bind' });
        bindSent = true;
      } catch (err) {
        document.getElementById('emailMsg').textContent = err.message;
        document.getElementById('emailMsg').style.color = 'var(--crimson)';
        clearInterval(timer);
        btn.textContent = '发送验证码';
        btn.disabled = false;
      }
    });

    document.getElementById('emailForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      var fd = new FormData(this);
      var msg = document.getElementById('emailMsg');
      if (!bindSent) { msg.textContent = '请先发送验证码'; msg.style.color = 'var(--crimson)'; return; }
      msg.style.color = 'var(--muted)';
      msg.textContent = '...';
      try {
        await API._req('PUT', '/users/email', { email: fd.get('email'), code: fd.get('code') });
        msg.style.color = 'var(--jade)';
        msg.textContent = '邮箱已更新';
        bindSent = false;
      } catch (err) {
        msg.style.color = 'var(--crimson)';
        msg.textContent = err.message;
      }
    });

    // ── Guest upgrade ──
    var upgradeForm = document.getElementById('upgradeForm');
    if (upgradeForm) {
      upgradeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var code = new FormData(this).get('invite_code').trim();
        if (!code) return;
        var msg = document.getElementById('upgradeMsg');
        msg.textContent = '...'; msg.style.color = 'var(--muted)';
        try {
          var res = await API._post('/auth/upgrade', { invite_code: code });
          msg.style.color = 'var(--jade)';
          msg.textContent = res.message;
          setTimeout(function() { location.reload(); }, 1500);
        } catch (err) {
          msg.style.color = 'var(--crimson)';
          msg.textContent = err.message;
        }
      });
    }

    // ── Username change ──
    document.getElementById('usernameForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      var fd = new FormData(this);
      var msg = document.getElementById('usernameMsg');
      msg.style.color = 'var(--muted)'; msg.textContent = '...';
      try {
        var res = await API._req('PUT', '/users/username', { username: fd.get('username') });
        msg.style.color = 'var(--jade)';
        msg.textContent = '已更新';
        localStorage.setItem('las_username', res.username);
      } catch (err) {
        msg.style.color = 'var(--crimson)';
        msg.textContent = err.message;
      }
    });

    // ── Account deletion ──
    document.getElementById('deleteAccountBtn').addEventListener('click', function() {
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:var(--z-overlay);background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center';
      overlay.innerHTML = '<div class="glass-card" style="padding:24px;max-width:360px;text-align:center">'
        + '<p class="serif text-lg font-bold mb-2" style="color:var(--crimson)">确认注销</p>'
        + '<p class="text-sm mb-6" style="color:var(--muted)">注销后所有数据标记删除，7 天后永久清除。此操作不可撤销。</p>'
        + '<div style="display:flex;gap:10px;justify-content:center">'
        + '<button id="delCancel" class="mono text-xs" style="padding:8px 24px;border:1px solid var(--rule-strong);border-radius:4px;background:transparent;color:var(--muted);cursor:pointer">取消</button>'
        + '<button id="delConfirm" class="mono text-xs" style="padding:8px 24px;border:1px solid var(--crimson);border-radius:4px;background:transparent;color:var(--crimson);cursor:pointer">确认注销</button>'
        + '</div></div>';
      document.body.appendChild(overlay);
      overlay.querySelector('#delCancel').addEventListener('click', function() { overlay.remove(); });
      overlay.querySelector('#delConfirm').addEventListener('click', async function() {
        try {
          await API._req('DELETE', '/users/me');
          overlay.remove();
          API.clearToken();
          localStorage.removeItem('las_username');
          App.navigate('#/login');
        } catch (err) {
          overlay.querySelector('#delConfirm').textContent = '失败';
        }
      });
    });
  }
});
