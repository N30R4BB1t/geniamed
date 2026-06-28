(function initializeAuthClient() {
  const originalFetch = window.fetch.bind(window);
  let csrfToken = null;
  let currentUser = null;
  let loginPromise = null;

  window.fetch = async function secureFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;
    const sameOrigin = new URL(url, window.location.origin).origin === window.location.origin;
    const method = String(init.method || 'GET').toUpperCase();
    const headers = new Headers(init.headers || {});

    if (sameOrigin && csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    const response = await originalFetch(input, {
      ...init,
      headers,
      credentials: sameOrigin ? 'same-origin' : init.credentials
    });

    if (sameOrigin && response.status === 401 && !url.includes('/api/auth/')) {
      currentUser = null;
      csrfToken = null;
      await requireLogin();
    }

    return response;
  };

  async function start(options = {}) {
    const session = await readSession();
    if (session) {
      if (options.roles && !options.roles.includes(session.user.role)) {
        showForbidden();
        return null;
      }
      if (session.mustChangePassword) await forcePasswordChange();
      return session.user;
    }

    if (options.interactive === false) return null;
    const user = await requireLogin();
    if (options.roles && user && !options.roles.includes(user.role)) {
      showForbidden();
      return null;
    }
    return user;
  }

  async function readSession() {
    const response = await originalFetch('/api/auth/me', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    currentUser = data.user;
    csrfToken = data.csrfToken;
    return data;
  }

  function requireLogin() {
    if (loginPromise) return loginPromise;
    loginPromise = new Promise((resolve) => {
      const overlay = buildOverlay('Acesso restrito', 'Entre com seu usuario institucional.');
      const form = document.createElement('form');
      form.className = 'security-form';
      form.innerHTML = `
        <label>Usuario<input name="username" autocomplete="username" required maxlength="80"></label>
        <label>Senha<input name="password" type="password" autocomplete="current-password" required maxlength="120"></label>
        <p class="security-message" role="alert"></p>
        <button>Entrar</button>
      `;
      overlay.panel.appendChild(form);
      const message = form.querySelector('.security-message');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        message.textContent = '';
        const values = new FormData(form);
        const response = await originalFetch('/api/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: values.get('username'),
            password: values.get('password')
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          message.textContent = data.error || 'Nao foi possivel entrar.';
          return;
        }

        currentUser = data.user;
        csrfToken = data.csrfToken;
        overlay.element.remove();
        if (data.mustChangePassword) await forcePasswordChange();
        loginPromise = null;
        resolve(currentUser);
      });
      form.querySelector('input').focus();
    });
    return loginPromise;
  }

  async function forcePasswordChange() {
    return new Promise((resolve) => {
      const overlay = buildOverlay('Troca de senha obrigatoria', 'Crie uma senha exclusiva antes de continuar.');
      const form = document.createElement('form');
      form.className = 'security-form';
      form.innerHTML = `
        <label>Senha atual<input name="currentPassword" type="password" autocomplete="current-password" required></label>
        <label>Nova senha<input name="newPassword" type="password" autocomplete="new-password" required minlength="12"></label>
        <label>Confirmar nova senha<input name="confirmation" type="password" autocomplete="new-password" required minlength="12"></label>
        <small>Use 12 ou mais caracteres, com maiuscula, minuscula, numero e simbolo.</small>
        <p class="security-message" role="alert"></p>
        <button>Alterar senha</button>
      `;
      overlay.panel.appendChild(form);
      const message = form.querySelector('.security-message');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const values = new FormData(form);
        if (values.get('newPassword') !== values.get('confirmation')) {
          message.textContent = 'As novas senhas nao conferem.';
          return;
        }
        const response = await window.fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: values.get('currentPassword'),
            newPassword: values.get('newPassword')
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          message.textContent = data.error || 'Nao foi possivel alterar a senha.';
          return;
        }
        overlay.element.remove();
        resolve();
      });
    });
  }

  async function logout() {
    if (csrfToken) {
      await window.fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
    currentUser = null;
    csrfToken = null;
    window.location.reload();
  }

  function buildOverlay(title, subtitle) {
    document.querySelector('.security-overlay')?.remove();
    const element = document.createElement('div');
    element.className = 'security-overlay';
    const panel = document.createElement('section');
    panel.className = 'security-panel';
    const heading = document.createElement('h1');
    heading.textContent = title;
    const description = document.createElement('p');
    description.textContent = subtitle;
    panel.append(heading, description);
    element.appendChild(panel);
    document.body.appendChild(element);
    return { element, panel };
  }

  function showForbidden() {
    buildOverlay('Acesso nao autorizado', 'Seu perfil nao possui permissao para esta area.');
  }

  window.GeniamedAuth = {
    get user() { return currentUser; },
    logout,
    start
  };
})();
