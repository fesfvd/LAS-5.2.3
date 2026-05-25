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
          <input class="input-underline" name="email" type="email" placeholder="example@mail.com" required maxlength="100" autocomplete="email">
        </div>
        ` : ''}

        <div class="field-group">
          <label class="field-label">PASSWORD <span class="field-label-zh">密码</span></label>
          <input class="input-underline" name="password" type="password" placeholder="${isLogin ? '输入密码' : '至少 6 位'}" required minlength="6" maxlength="100" autocomplete="${isLogin ? 'current-password' : 'new-password'}">
        </div>

        ${!isLogin ? `
        <div class="field-group">
          <label class="field-label">INVITE CODE <span class="field-label-zh">邀请码</span></label>
          <input class="input-underline mono" name="invite_code" placeholder="LAS-XXXX-XXXX" required maxlength="32" style="text-transform:uppercase;letter-spacing:2px">
        </div>
        ` : ''}

        <div class="submit-options" style="justify-content:flex-end">
          <span class="submit-error" id="authError"></span>
        </div>

        <div class="submit-action" style="justify-content:space-between">
          <span class="text-xs" style="color:var(--muted)">
            ${isLogin
              ? '没有账号？<a href="#/register" style="color:var(--gold);text-decoration:none">注册</a>'
              : '已有账号？<a href="#/login" style="color:var(--gold);text-decoration:none">登录</a>'}
          </span>
          <button type="submit" class="btn btn-primary">
            ${isLogin ? 'LOG IN <span class="btn-zh">登录</span>' : 'REGISTER <span class="btn-zh">注册</span>'}
          </button>
        </div>
      </form>
    </div>`;

  const form = document.getElementById('authForm');
  const errEl = document.getElementById('authError');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errEl.textContent = '';
    errEl.classList.remove('show');

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    try {
      if (isLogin) {
        const res = await API.login(data.username, data.password);
        API.setToken(res.access_token);
        localStorage.setItem('las_username', res.username);
      } else {
        data.invite_code = (data.invite_code || '').toUpperCase().replace(/\s/g, '');
        const res = await API.register(data);
        API.setToken(res.access_token);
        localStorage.setItem('las_username', res.username);
      }
      App.navigate('#/upload');
    } catch (err) {
      errEl.textContent = '> ERROR: ' + err.message;
      errEl.classList.add('show');
    }
  });
}
