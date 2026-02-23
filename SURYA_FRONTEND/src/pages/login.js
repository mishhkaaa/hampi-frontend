// ===== LOGIN PAGE =====
import { authApi, usersApi } from '../api.js';
import { showToast, store, initIcons } from '../utils.js';

export function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <h1>Sohraa HMS</h1>
          <p>Hotel Management System</p>
        </div>
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="login-email" placeholder="Enter your email" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="login-password" placeholder="Enter your password" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%; justify-content:center; margin-top: 8px;" id="login-btn">
            Sign In
          </button>
          <p style="text-align:center; margin-top:16px; font-size:0.8125rem; color:var(--text-muted);">
            Authorized personnel only
          </p>
        </form>
      </div>
    </div>
  `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        btn.innerHTML = '<span class="spinner"></span> Signing in...';
        btn.disabled = true;

        try {
            await authApi.login(email, password);

            // Fetch user list to find logged-in user info
            let userData = { name: email.split('@')[0], email, roleName: 'User' };
            try {
                const usersRes = await usersApi.getAll();
                if (usersRes.success && usersRes.data) {
                    const foundUser = usersRes.data.find(u => u.email === email);
                    if (foundUser) userData = foundUser;
                }
            } catch (e) { /* ignore */ }

            store.setState({ user: userData });
            showToast(`Welcome back, ${userData.name}!`, 'success');
            window.location.hash = '#/';
        } catch (err) {
            showToast(err.message || 'Invalid credentials', 'error');
            btn.innerHTML = 'Sign In';
            btn.disabled = false;
        }
    });
}
