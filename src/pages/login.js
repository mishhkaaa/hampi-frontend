// ===== LOGIN PAGE =====
import { authApi, usersApi } from '../api.js';
import { showToast, store, initIcons } from '../utils.js';

export function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <div class="login-brand-icon">S</div>
          <h1>Sohraa HMS</h1>
          <p>Hotel Management System</p>
        </div>
        <form id="login-form" autocomplete="on">
          <div class="form-group">
            <label class="form-label" for="login-email">Email Address</label>
            <input type="email" class="form-input login-input" id="login-email" name="email"
              placeholder="you@company.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <div style="position:relative;">
              <input type="password" class="form-input login-input" id="login-password" name="password"
                placeholder="Enter your password" required autocomplete="current-password" />
              <button type="button" id="toggle-pw" tabindex="-1"
                style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);padding:0;display:flex;align-items:center;">
                <i data-lucide="eye" id="pw-icon"></i>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg login-btn" id="login-btn">
            <i data-lucide="log-in"></i> Sign In
          </button>
          <p class="login-footer-note">Authorized personnel only &mdash; all access is logged.</p>
        </form>
      </div>
    </div>
  `;

    initIcons();

    // Toggle password visibility
    document.getElementById('toggle-pw')?.addEventListener('click', () => {
        const pw = document.getElementById('login-password');
        const icon = document.getElementById('pw-icon');
        if (pw.type === 'password') {
            pw.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            pw.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        initIcons();
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        btn.innerHTML = '<span class="spinner"></span> Signing in…';
        btn.disabled = true;

        try {
            await authApi.login(email, password);

            // Fetch user info
            let userData = { name: email.split('@')[0], email, roleName: 'User' };
            try {
                const usersRes = await usersApi.getAll();
                if (usersRes.success && usersRes.data) {
                    const foundUser = usersRes.data.find(u => u.email === email);
                    if (foundUser) userData = foundUser;
                }
            } catch (_e) { /* ignore */ }

            store.setState({ user: userData });
            showToast(`Welcome back, ${userData.name}!`, 'success');
            window.location.hash = '#/';
        } catch (err) {
            showToast(err.message || 'Invalid credentials. Please try again.', 'error');
            btn.innerHTML = '<i data-lucide="log-in"></i> Sign In';
            btn.disabled = false;
            initIcons();
        }
    });
}
