App.register('/login', () => buildAuth('login'));
App.register('/register', () => buildAuth('register'));
App.register('/forgot', () => buildAuth('forgot'));

function buildAuth(tab) {
  const isLogin = tab === 'login';
  const isRegister = tab === 'register';
  const isForgot = tab === 'forgot';

  document.title = (isLogin ? '登录' : isRegister ? '注册' : '忘记密码') + ' — LAS';
  const root = document.getElementById('spaApp');

  root.innerHTML = `
    <div class="submit-container">
      <div class="submit-header">
        <p class="mono text-xs text-muted tracking-[4px] mb-1">${isLogin ? 'AUTHENTICATION' : isRegister ? 'REGISTRATION' : 'RECOVERY'}</p>
        <h1 class="serif text-3xl font-black leading-[1.1]">${isLogin ? '登录' : isRegister ? '注册' : '重置密码'}</h1>
      </div>

      <form id="authForm" class="submit-form">

        ${!isForgot ? `
        <div class="field-group">
          <label class="field-label">${isLogin ? 'ACCOUNT' : 'USERNAME'} <span class="field-label-zh">${isLogin ? '用户名/邮箱' : '用户名'}</span></label>
          <input class="input-underline" name="username" placeholder="${isLogin ? '用户名或邮箱' : '2-50 个字符'}" required maxlength="${isLogin ? 100 : 50}" autocomplete="${isLogin ? 'username email' : 'username'}">
        </div>` : ''}

        ${(isRegister || isForgot) ? `
        <div class="field-group">
          <label class="field-label">EMAIL <span class="field-label-zh">邮箱</span></label>
          <div style="display:flex;gap:8px">
            <input class="input-underline" name="email" type="email" placeholder="${isForgot ? '输入注册时的邮箱' : '必填，用于验证和找回密码'}" required maxlength="100" autocomplete="email" style="flex:1">
            <button type="button" id="sendCodeBtn" style="font-size:12px;padding:8px 14px;border:1px solid var(--gold);border-radius:6px;background:transparent;color:var(--gold);cursor:pointer;white-space:nowrap;transition:all .2s">发送验证码</button>
          </div>
        </div>
        <div class="field-group" id="codeGroup" style="display:none">
          <label class="field-label">CODE <span class="field-label-zh">验证码</span></label>
          <input class="input-underline mono" name="code" placeholder="6 位数字" maxlength="6" style="letter-spacing:4px">
          <p class="text-xs" style="color:var(--muted);opacity:.6;margin-top:4px" id="codeHint">验证码已发送，10 分钟内有效</p>
        </div>
        ` : ''}

        ${!isForgot ? `
        <div class="field-group">
          <label class="field-label">PASSWORD <span class="field-label-zh">密码</span></label>
          <input class="input-underline" name="password" type="password" placeholder="${isLogin ? '输入密码' : '至少 6 位'}" required minlength="6" maxlength="100" autocomplete="${isLogin ? 'current-password' : 'new-password'}">
        </div>` : ''}

        ${isForgot ? `
        <div class="field-group" id="newPwdGroup" style="display:none">
          <label class="field-label">NEW PASSWORD <span class="field-label-zh">新密码</span></label>
          <input class="input-underline" name="new_password" type="password" placeholder="至少 6 位" minlength="6" maxlength="100" autocomplete="new-password">
        </div>` : ''}

        ${isRegister ? `
        <div class="field-group">
          <label class="field-label">INVITE CODE <span class="field-label-zh">邀请码</span> <span style="color:var(--muted);font-size:10px;font-family:'Noto Sans SC',sans-serif;font-weight:400">（选填）</span></label>
          <input class="input-underline mono" name="invite_code" placeholder="留空即为游客模式" maxlength="32" style="text-transform:uppercase;letter-spacing:2px">
          <p class="text-xs" style="color:var(--muted);opacity:.6;margin-top:4px">无邀请码将注册为游客 · 每日限 3 次分析</p>
        </div>` : ''}

        ${isLogin ? `
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:var(--muted)">
          <input type="checkbox" name="remember" style="accent-color:var(--gold)">
          <span>记住我（7 天免登录）</span>
        </label>` : ''}

        ${isRegister ? `
        <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;font-size:12px;color:var(--muted);line-height:1.6">
          <input type="checkbox" id="agreeTerms" required style="margin-top:3px;accent-color:var(--gold)">
          <span>我已阅读并同意 <a href="/privacy" target="_blank" style="color:var(--gold)">用户协议 & 隐私政策</a></span>
        </label>` : ''}

        <div class="submit-options" style="justify-content:flex-end">
          <span class="submit-error" id="authError"></span>
        </div>

        <div class="submit-action" style="justify-content:space-between;align-items:center">
          <span class="text-xs" style="color:var(--muted)">
            ${isLogin
              ? '<a href="#/forgot" style="color:var(--gold);text-decoration:none">忘记密码？</a> · 没有账号？<a href="#/register" style="color:var(--gold);text-decoration:none">注册</a>'
              : isRegister
                ? '已有账号？<a href="#/login" style="color:var(--gold);text-decoration:none">登录</a>'
                : '想起密码了？<a href="#/login" style="color:var(--gold);text-decoration:none">登录</a>'}
          </span>
          <div style="display:flex;gap:10px;align-items:center">
            ${!isForgot ? `
            <button type="button" id="guestBtn" class="btn" style="font-size:12px;padding:8px 16px;border-color:var(--rule-strong);color:var(--muted)">
              GUEST <span class="btn-zh">游客</span>
            </button>` : ''}
            <button type="submit" class="btn btn-primary">
              ${isLogin ? 'LOG IN <span class="btn-zh">登录</span>' : isRegister ? 'REGISTER <span class="btn-zh">注册</span>' : 'RESET <span class="btn-zh">重置密码</span>'}
            </button>
          </div>
        </div>
      </form>
    </div>`;

  const form = document.getElementById('authForm');
  const errEl = document.getElementById('authError');
  const guestBtn = document.getElementById('guestBtn');

  function showError(msg) {
    errEl.textContent = '> ERROR: ' + msg;
    errEl.classList.add('show');
  }

  // ── Send verification code ──
  var sendCodeBtn = document.getElementById('sendCodeBtn');
  var codeGroup = document.getElementById('codeGroup');
  var codeSent = false;
  var countdown = 0;

  if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', async function() {
      var email = (form.querySelector('[name="email"]') || {}).value;
      if (!email || email.indexOf('@') < 0) { showError('请先输入有效邮箱'); return; }
      sendCodeBtn.disabled = true;
      countdown = 60;
      sendCodeBtn.textContent = countdown + 's';
      var timer = setInterval(function() {
        countdown--;
        if (countdown <= 0) { clearInterval(timer); sendCodeBtn.textContent = '发送验证码'; sendCodeBtn.disabled = false; }
        else sendCodeBtn.textContent = countdown + 's';
      }, 1000);

      try {
        var purpose = isForgot ? 'reset' : 'register';
        await API._post('/auth/send-code', { email: email, purpose: purpose });
        codeSent = true;
        if (codeGroup) codeGroup.style.display = '';
        if (isForgot) {
          var npg = document.getElementById('newPwdGroup');
          if (npg) npg.style.display = '';
        }
      } catch (err) {
        showError(err.message);
        clearInterval(timer);
        sendCodeBtn.textContent = '发送验证码';
        sendCodeBtn.disabled = false;
      }
    });

    // Reset code state when email changes
    var emailInput = form.querySelector('[name="email"]');
    if (emailInput) {
      emailInput.addEventListener('input', function() {
        codeSent = false;
        if (codeGroup) codeGroup.style.display = 'none';
        if (isForgot) { var npg = document.getElementById('newPwdGroup'); if (npg) npg.style.display = 'none'; }
      });
    }
  }

  // ── Guest login ──
  if (guestBtn) {
    guestBtn.addEventListener('click', async function() {
      errEl.textContent = ''; errEl.classList.remove('show');
      guestBtn.disabled = true; guestBtn.textContent = '...';
      try {
        var res = await API._post('/auth/guest');
        API.setToken(res.access_token);
        localStorage.setItem('las_username', res.username);
        App.navigate('#/upload');
      } catch (err) {
        showError(err.message);
        guestBtn.disabled = false;
        guestBtn.innerHTML = 'GUEST <span class="btn-zh">游客</span>';
      }
    });
  }

  // ── Form submit ──
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    errEl.textContent = ''; errEl.classList.remove('show');
    var fd = new FormData(form);
    var data = Object.fromEntries(fd.entries());

    try {
      if (isRegister) {
        if (!codeSent) { showError('请先发送邮箱验证码'); return; }
        var code = (data.code || '').trim();
        if (code.length !== 6) { showError('请输入 6 位验证码'); return; }
        data.code = code;
        var invRaw = (form.querySelector('[name="invite_code"]') || {}).value || '';
        data.invite_code = invRaw.toUpperCase().replace(/\s/g, '');
        var res = await API._post('/auth/register', data);
        API.setToken(res.access_token);
        localStorage.setItem('las_username', res.username);
        App.navigate('#/upload');
      } else if (isForgot) {
        var emailVal = (data.email || '').trim();
        var codeVal = (data.code || '').trim();
        var newPwd = (data.new_password || '').trim();
        if (!codeSent) { showError('请先发送验证码'); return; }
        if (codeVal.length !== 6) { showError('请输入 6 位验证码'); return; }
        if (newPwd.length < 6) { showError('新密码至少 6 位'); return; }
        await API._post('/auth/reset-password', { email: emailVal, code: codeVal, new_password: newPwd });
        alert('密码已重置，请登录');
        App.navigate('#/login');
      } else {
        // Login
        var payload = { username: data.username, password: data.password, remember: !!data.remember };
        var res = await API._post('/auth/login', payload);
        API.setToken(res.access_token);
        localStorage.setItem('las_username', res.username);
        // Redirect to saved page or upload
        var back = sessionStorage.getItem('las_login_back');
        sessionStorage.removeItem('las_login_back');
        App.navigate(back || '#/upload');
      }
    } catch (err) {
      showError(err.message);
    }
  });
}
