App.register('/login', () => buildAuth('login'));
App.register('/register', () => buildAuth('register'));

function buildAuth(tab) {
  const isLogin = tab === 'login';
  document.title = (isLogin ? '登录' : '注册') + ' — LAS';
  const root = document.getElementById('spaApp');

  root.innerHTML = `
    <div class="submit-container">
      <div class="submit-header">
        <p class="mono text-xs text-muted tracking-[4px] mb-1">${isLogin ? 'AUTHENTICATION' : 'REGISTRATION'}</p>
        <h1 class="serif text-3xl font-black leading-[1.1]">${isLogin ? '登录' : '注册'}</h1>
      </div>

      <form id="authForm" class="submit-form">
        <div class="field-group">
          <label class="field-label">USERNAME <span class="field-label-zh">用户名</span></label>
          <input class="input-underline" name="username" placeholder="2-50 个字符" required maxlength="50" autocomplete="username">
        </div>

        ${!isLogin ? `
        <div class="field-group">
          <label class="field-label">EMAIL <span class="field-label-zh">邮箱</span></label>
          <input class="input-underline" name="email" type="email" placeholder="选填" maxlength="100" autocomplete="email">
        </div>
        ` : ''}

        <div class="field-group">
          <label class="field-label">PASSWORD <span class="field-label-zh">密码</span></label>
          <input class="input-underline" name="password" type="password" placeholder="${isLogin ? '输入密码' : '至少 6 位'}" required minlength="6" maxlength="100" autocomplete="${isLogin ? 'current-password' : 'new-password'}">
        </div>

        ${!isLogin ? `
        <div class="field-group">
          <label class="field-label">INVITE CODE <span class="field-label-zh">邀请码</span> <span style="color:var(--muted);font-size:10px;font-family:'Noto Sans SC',sans-serif;font-weight:400">（选填）</span></label>
          <input class="input-underline mono" name="invite_code" placeholder="留空即为游客模式" maxlength="32" style="text-transform:uppercase;letter-spacing:2px">
          <p class="text-xs" style="color:var(--muted);opacity:.6;margin-top:4px">无邀请码将注册为游客 · 每日限 3 次分析 · 仅可用快速模型</p>
        </div>
        ` : ''}

        ${!isLogin ? `
        <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;font-size:12px;color:var(--muted);line-height:1.6">
          <input type="checkbox" id="agreeTerms" required style="margin-top:3px;accent-color:var(--gold)">
          <span>我已阅读并同意 <a href="/privacy" target="_blank" style="color:var(--gold)">用户协议 & 隐私政策</a></span>
        </label>
        ` : ''}

        <div class="submit-options" style="justify-content:flex-end">
          <span class="submit-error" id="authError"></span>
        </div>

        <div class="submit-action" style="justify-content:space-between;align-items:center">
          <span class="text-xs" style="color:var(--muted)">
            ${isLogin
              ? '没有账号？<a href="#/register" style="color:var(--gold);text-decoration:none">注册</a>'
              : '已有账号？<a href="#/login" style="color:var(--gold);text-decoration:none">登录</a>'}
          </span>
          <div style="display:flex;gap:10px;align-items:center">
            <button type="button" id="guestBtn" class="btn" style="font-size:12px;padding:8px 16px;border-color:var(--rule-strong);color:var(--muted)">
              GUEST <span class="btn-zh">游客</span>
            </button>
            <button type="submit" class="btn btn-primary">
              ${isLogin ? 'LOG IN <span class="btn-zh">登录</span>' : 'REGISTER <span class="btn-zh">注册</span>'}
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

  guestBtn.addEventListener('click', async () => {
    errEl.textContent = '';
    errEl.classList.remove('show');
    guestBtn.disabled = true;
    guestBtn.textContent = '...';
    try {
      const res = await API._post('/auth/guest');
      API.setToken(res.access_token);
      localStorage.setItem('las_username', res.username);
      App.navigate('#/upload');
    } catch (err) {
      showError(err.message);
      guestBtn.disabled = false;
      guestBtn.innerHTML = 'GUEST <span class="btn-zh">游客</span>';
    }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errEl.textContent = '';
    errEl.classList.remove('show');

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    if (data.invite_code) data.invite_code = data.invite_code.toUpperCase().replace(/\s/g, '');

    try {
      if (isLogin) {
        const res = await API.login(data.username, data.password);
        API.setToken(res.access_token);
        localStorage.setItem('las_username', res.username);
      } else {
        const res = await API.register(data);
        API.setToken(res.access_token);
        localStorage.setItem('las_username', res.username);
      }
      App.navigate('#/upload');
    } catch (err) {
      showError(err.message);
    }
  });
}
