// ===== SIDEBAR & LAYOUT COMPONENT =====
import { store, initIcons } from './utils.js';
import { authApi } from './api.js';
import { showToast } from './utils.js';

export function renderLayout(pageContent, activeNav = '') {
    const app = document.getElementById('app');
    const user = store.getState().user;
    const prop = store.getState().currentProperty;

    const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

    app.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">S</div>
          <div class="sidebar-brand-text">
            <h2>Sohraa HMS</h2>
            <span>Hotel Management</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section-title">Main</div>
          <a href="#/" class="sidebar-link ${activeNav === 'dashboard' ? 'active' : ''}">
            <i data-lucide="layout-dashboard"></i>
            <span>Dashboard</span>
          </a>
          <a href="#/properties" class="sidebar-link ${activeNav === 'properties' ? 'active' : ''}">
            <i data-lucide="building-2"></i>
            <span>Properties</span>
          </a>

          ${prop ? `
          <div class="sidebar-section-title">${prop.name || 'Property'}</div>
          <a href="#/rooms" class="sidebar-link ${activeNav === 'rooms' ? 'active' : ''}">
            <i data-lucide="door-open"></i>
            <span>Rooms</span>
          </a>
          <a href="#/room-types" class="sidebar-link ${activeNav === 'room-types' ? 'active' : ''}">
            <i data-lucide="layers"></i>
            <span>Room Types</span>
          </a>
          <a href="#/blocks" class="sidebar-link ${activeNav === 'blocks' ? 'active' : ''}">
            <i data-lucide="boxes"></i>
            <span>Blocks</span>
          </a>
          <a href="#/bookings" class="sidebar-link ${activeNav === 'bookings' ? 'active' : ''}">
            <i data-lucide="calendar-check"></i>
            <span>Bookings</span>
          </a>
          <a href="#/availability" class="sidebar-link ${activeNav === 'availability' ? 'active' : ''}">
            <i data-lucide="calendar-range"></i>
            <span>Availability</span>
          </a>
          <a href="#/rate-plans" class="sidebar-link ${activeNav === 'rate-plans' ? 'active' : ''}">
            <i data-lucide="receipt"></i>
            <span>Rate Plans</span>
          </a>
          <a href="#/pricing-config" class="sidebar-link ${activeNav === 'pricing-config' ? 'active' : ''}">
            <i data-lucide="settings-2"></i>
            <span>Pricing Config</span>
          </a>
          <a href="#/maintenance" class="sidebar-link ${activeNav === 'maintenance' ? 'active' : ''}">
            <i data-lucide="wrench"></i>
            <span>Maintenance</span>
          </a>
          ` : ''}

          <div class="sidebar-section-title">Administration</div>
          <a href="#/users" class="sidebar-link ${activeNav === 'users' ? 'active' : ''}">
            <i data-lucide="users"></i>
            <span>Users</span>
          </a>
          <a href="#/roles" class="sidebar-link ${activeNav === 'roles' ? 'active' : ''}">
            <i data-lucide="shield"></i>
            <span>Roles & Permissions</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-user-avatar">${initials}</div>
            <div class="sidebar-user-info">
              <div class="name">${user?.name || 'User'}</div>
              <div class="role">${user?.roleName || 'Staff'}</div>
            </div>
            <button class="btn btn-ghost" id="btn-logout" title="Logout">
              <i data-lucide="log-out"></i>
            </button>
          </div>
        </div>
      </aside>

      <div class="main-content">
        <header class="topbar">
          <div class="topbar-left">
            <button class="btn btn-ghost" id="btn-toggle-sidebar" style="display:none;">
              <i data-lucide="menu"></i>
            </button>
            <div class="topbar-breadcrumb">
              <span>Sohraa HMS</span>
              ${prop ? `<span class="separator">›</span><span>${prop.name}</span>` : ''}
            </div>
          </div>
          <div class="topbar-right">
            ${prop ? `
              <select id="property-switcher" class="form-select" style="width:auto; padding: 6px 32px 6px 12px; font-size: 0.8125rem;">
              </select>
            ` : ''}
          </div>
        </header>

        <div class="page-content" id="page-content">
          ${pageContent}
        </div>
      </div>
    </div>
  `;

    // Initialize Lucide icons
    initIcons();

    // Logout handler
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
        try {
            await authApi.logout();
        } catch (e) { /* ignore */ }
        store.setState({ user: null, currentProperty: null });
        localStorage.removeItem('hms_user');
        localStorage.removeItem('hms_property');
        window.location.hash = '#/login';
        showToast('Logged out successfully', 'success');
    });
}
