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
    API.clearToken();
    localStorage.removeItem('las_username');
    App.navigate('#/login');
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
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;color:var(--muted)">
        <div><span class="text-xs mono" style="color:var(--ink)">邮箱</span><br>${esc(u.email || '未绑定')} ${u.email_verified ? '<span style="color:var(--jade);font-size:11px">✓已验证</span>' : '<span style="color:var(--crimson);font-size:11px">未验证</span>'}</div>
        <div><span class="text-xs mono" style="color:var(--ink)">注册时间</span><br>${(u.created_at||'').slice(0,10)}</div>
        <div><span class="text-xs mono" style="color:var(--ink)">分析次数</span><br>${u.analysis_count}</div>
        <div><span class="text-xs mono" style="color:var(--ink)">最高分</span><br>${u.best_score ? u.best_score.toFixed(1) + ' · ' + esc(u.best_tier || '') : '暂无'}</div>
      </div>
    </div>

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
          <button type="button" id="bindSendCode" class="mono text-xs" style="padding:8px 14px;border:1px solid var(--gold);border-radius:6px;background:transparent;color:var(--gold);cursor:pointer;white-space:nowrap">发送验证码</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <input class="input-underline mono" name="code" placeholder="6 位验证码" maxlength="6" style="width:140px;letter-spacing:4px">
          <button type="submit" class="btn" style="font-size:11px;padding:6px 18px">确认${u.email ? '更换' : '绑定'}</button>
          <span id="emailMsg" class="text-xs"></span>
        </div>
      </form>
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
  }
});
