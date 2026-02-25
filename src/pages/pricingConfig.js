// ===== PRICING CONFIG PAGE =====
import { renderLayout } from '../layout.js';
import { pricingConfigApi } from '../api.js';
import { showToast, initIcons, store } from '../utils.js';

export async function renderPricingConfig() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'pricing-config');

    let config = null;
    try {
        const res = await pricingConfigApi.get(prop.id);
        config = res.data;
    } catch (e) { /* no config yet */ }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekendDays = config?.weekendDays || [false, false, false, false, false, true, true]; // default: Sat & Sun

    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Pricing Configuration</h1><p>Set weekend days for ${prop.name}</p></div>
    </div>
    <div class="card" style="max-width:600px;">
      <div class="card-header"><h3 class="card-title">Weekend Days</h3></div>
      <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-6);">
        Select which days are considered weekends for pricing calculation. Weekend prices from rate rules will apply on these days.
      </p>
      <form id="pricing-form">
        ${days.map((day, i) => `
          <label class="form-checkbox" style="margin-bottom:var(--space-3); padding:var(--space-3); border-radius:var(--radius-md); border:1px solid var(--border-color); transition: all var(--transition-fast);">
            <input type="checkbox" name="day${i}" ${weekendDays[i] ? 'checked' : ''} />
            <span style="font-weight:500; color:var(--text-primary);">${day}</span>
          </label>
        `).join('')}
        <button type="submit" class="btn btn-primary" id="pc-submit" style="margin-top:var(--space-4); width:100%; justify-content:center;">
          <i data-lucide="save"></i> Save Configuration
        </button>
      </form>
    </div>
  `;
    initIcons();

    document.getElementById('pricing-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const weekendDaysArr = days.map((_, i) => document.querySelector(`[name="day${i}"]`).checked);
        const btn = document.getElementById('pc-submit'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...';
        try {
            await pricingConfigApi.update(prop.id, { weekendDays: weekendDaysArr });
            showToast('Pricing config saved', 'success');
            btn.innerHTML = '<i data-lucide="save"></i> Save Configuration'; btn.disabled = false;
            initIcons();
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
            btn.innerHTML = '<i data-lucide="save"></i> Save Configuration'; btn.disabled = false;
            initIcons();
        }
    });
}
