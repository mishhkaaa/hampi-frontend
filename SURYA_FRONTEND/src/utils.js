// ===== UTILITIES =====

// Toast notifications
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };

    toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 300)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// Modal dialog
export function showModal(content, options = {}) {
    const container = document.getElementById('modal-container');
    const sizeClass = options.size ? `modal-${options.size}` : '';

    container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal ${sizeClass}">
        ${content}
      </div>
    </div>
  `;

    // Close on overlay click
    container.querySelector('#modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') closeModal();
    });

    // Close on Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

export function closeModal() {
    document.getElementById('modal-container').innerHTML = '';
}

// Confirmation dialog  
export function showConfirm(title, message, onConfirm, type = 'danger') {
    const iconSvg = type === 'danger'
        ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>'
        : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

    showModal(`
    <div class="modal-body">
      <div class="confirm-content">
        <div class="icon ${type}">${iconSvg}</div>
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
      <button class="btn btn-${type}" id="confirm-ok">${type === 'danger' ? 'Delete' : 'Confirm'}</button>
    </div>
  `);

    document.getElementById('confirm-cancel').onclick = closeModal;
    document.getElementById('confirm-ok').onclick = () => {
        closeModal();
        onConfirm();
    };
}

// Format date  
export function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Format datetime
export function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Format currency
export function formatCurrency(amount, currency = 'INR') {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

// Status badge helper
export function statusBadge(status) {
    const map = {
        ACTIVE: 'success', INACTIVE: 'danger',
        AVAILABLE: 'success', OCCUPIED: 'info', MAINTENANCE: 'warning', OUT_OF_SERVICE: 'danger',
        DRAFT: 'neutral', CONFIRMED: 'info', CHECKED_IN: 'success', CHECKED_OUT: 'purple', CANCELLED: 'danger', NO_SHOW: 'warning',
        PENDING: 'warning', PARTIAL: 'info', PAID: 'success', REFUNDED: 'purple',
        SCHEDULED: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success',
        SUCCESS: 'success', FAILED: 'danger',
        DISABLED: 'danger', READ: 'info', WRITE: 'success',
    };
    const variant = map[status] || 'neutral';
    const display = (status || '').replace(/_/g, ' ');
    return `<span class="badge badge-${variant} badge-dot">${display}</span>`;
}

// Simple router
export class Router {
    constructor(routes) {
        this.routes = routes;
        window.addEventListener('hashchange', () => this.resolve());
    }

    resolve() {
        const hash = window.location.hash.slice(1) || '/';

        for (const route of this.routes) {
            const match = this.matchRoute(route.path, hash);
            if (match) {
                route.handler(match.params);
                return;
            }
        }

        // 404 → redirect to dashboard
        window.location.hash = '#/';
    }

    matchRoute(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length) return null;

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }
        return { params };
    }

    navigate(path) {
        window.location.hash = `#${path}`;
    }
}

// Debounce
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// Store for global state
class Store {
    constructor() {
        this.state = {
            user: JSON.parse(localStorage.getItem('hms_user') || 'null'),
            currentProperty: JSON.parse(localStorage.getItem('hms_property') || 'null'),
        };
        this.listeners = [];
    }

    getState() { return this.state; }

    setState(partial) {
        this.state = { ...this.state, ...partial };
        if (partial.user !== undefined) localStorage.setItem('hms_user', JSON.stringify(partial.user));
        if (partial.currentProperty !== undefined) localStorage.setItem('hms_property', JSON.stringify(partial.currentProperty));
        this.listeners.forEach(fn => fn(this.state));
    }

    subscribe(fn) {
        this.listeners.push(fn);
        return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    }
}

export const store = new Store();

// Lucide icons initialization
export function initIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Generate today's date string
export function today() {
    return new Date().toISOString().split('T')[0];
}

// Generate date N days from now
export function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}
