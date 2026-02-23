// ===== RATE PLANS PAGE =====
import { renderLayout } from '../layout.js';
import { ratePlansApi, rateRulesApi, roomTypesApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, formatDate, formatCurrency, initIcons, store } from '../utils.js';

let ratePlans = [], roomTypes = [];

export async function renderRatePlans() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'rate-plans');
    await loadData();
}

async function loadData() {
    const prop = store.getState().currentProperty;
    try {
        const [rpRes, rtRes] = await Promise.all([
            ratePlansApi.getByProperty(prop.id),
            roomTypesApi.getByProperty(prop.id),
        ]);
        ratePlans = rpRes.data || [];
        roomTypes = rtRes.data || [];
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    renderList();
}

function renderList() {
    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Rate Plans</h1><p>Manage pricing plans</p></div>
      <button class="btn btn-primary" id="btn-add"><i data-lucide="plus"></i> Add Rate Plan</button>
    </div>
    ${ratePlans.length > 0 ? `
      <div class="table-wrapper"><table class="data-table">
        <thead><tr><th>ID</th><th>Name</th><th>Currency</th><th>Actions</th></tr></thead>
        <tbody>${ratePlans.map(rp => `
          <tr>
            <td>${rp.id}</td>
            <td style="color:var(--text-primary);font-weight:600;">${rp.name}</td>
            <td><span class="badge badge-info">${rp.currency}</span></td>
            <td><div class="table-actions">
              <button class="btn btn-ghost btn-sm btn-rules" data-id="${rp.id}" title="Rate Rules"><i data-lucide="list"></i></button>
              <button class="btn btn-ghost btn-sm btn-edit" data-id="${rp.id}"><i data-lucide="pencil"></i></button>
              <button class="btn btn-ghost btn-sm btn-del" data-id="${rp.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button>
            </div></td>
          </tr>`).join('')}</tbody>
      </table></div>
    ` : `<div class="empty-state"><i data-lucide="receipt"></i><h3>No rate plans</h3>
      <button class="btn btn-primary" id="btn-add-e"><i data-lucide="plus"></i> Add Rate Plan</button></div>`}
  `;
    initIcons();
    document.getElementById('btn-add')?.addEventListener('click', () => showRatePlanForm());
    document.getElementById('btn-add-e')?.addEventListener('click', () => showRatePlanForm());
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => showRatePlanForm(ratePlans.find(r => r.id == b.dataset.id))));
    document.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => {
        const rp = ratePlans.find(r => r.id == b.dataset.id);
        showConfirm('Delete', `Delete "${rp.name}"?`, async () => {
            try { await ratePlansApi.delete(rp.id); showToast('Deleted', 'success'); await loadData(); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
    document.querySelectorAll('.btn-rules').forEach(b => b.addEventListener('click', () => showRateRules(b.dataset.id)));
}

function showRatePlanForm(existing = null) {
    const isEdit = !!existing;
    showModal(`
    <div class="modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Rate Plan</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="rp-form"><div class="modal-body">
      <div class="form-group"><label class="form-label">Name *</label>
        <input class="form-input" name="name" value="${existing?.name || ''}" required /></div>
      <div class="form-group"><label class="form-label">Currency * (3 chars)</label>
        <input class="form-input" name="currency" value="${existing?.currency || 'INR'}" required maxlength="3" minlength="3" /></div>
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="rp-submit">${isEdit ? 'Update' : 'Create'}</button>
    </div></form>
  `);
    initIcons();
    document.getElementById('rp-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = { name: f.name.value, currency: f.currency.value };
        const btn = document.getElementById('rp-submit'); btn.disabled = true;
        try {
            if (isEdit) await ratePlansApi.update(existing.id, data); else await ratePlansApi.create(store.getState().currentProperty.id, data);
            showToast(isEdit ? 'Updated' : 'Created', 'success'); closeModal(); await loadData();
        } catch (e) { showToast('Error: ' + e.message, 'error'); btn.disabled = false; }
    });
}

async function showRateRules(ratePlanId) {
    const rp = ratePlans.find(r => r.id == ratePlanId);
    let rules = [];
    try {
        const res = await rateRulesApi.getByPlan(ratePlanId);
        rules = res.data || [];
    } catch (e) { showToast('Error loading rules: ' + e.message, 'error'); }

    showModal(`
    <div class="modal-header"><h2>Rate Rules — ${rp?.name || ''}</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <div class="modal-body">
      <button class="btn btn-primary btn-sm" id="btn-add-rule" style="margin-bottom:var(--space-4);"><i data-lucide="plus"></i> Add Rule</button>
      ${rules.length > 0 ? `
        <div class="table-wrapper" style="border:none;"><table class="data-table">
          <thead><tr><th>Room Type</th><th>Dates</th><th>Weekday</th><th>Weekend</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rules.map(r => `
            <tr>
              <td>${roomTypes.find(rt => rt.id === r.roomTypeId)?.name || '—'}</td>
              <td>${formatDate(r.startDate)} → ${formatDate(r.endDate)}</td>
              <td style="font-weight:600; color:var(--success);">${formatCurrency(r.weekdayPrice)}</td>
              <td style="font-weight:600; color:var(--warning);">${formatCurrency(r.weekendPrice)}</td>
              <td>${statusBadge(r.status)}</td>
              <td><div class="table-actions">
                <button class="btn btn-ghost btn-sm btn-edit-rule" data-id="${r.id}"><i data-lucide="pencil"></i></button>
                <button class="btn btn-ghost btn-sm btn-del-rule" data-id="${r.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button>
              </div></td>
            </tr>`).join('')}</tbody>
        </table></div>
      ` : '<p style="color:var(--text-muted);">No rate rules defined.</p>'}
    </div>
  `, { size: 'lg' });
    initIcons();

    document.getElementById('btn-add-rule')?.addEventListener('click', () => showRuleForm(ratePlanId));
    document.querySelectorAll('.btn-edit-rule').forEach(b => b.addEventListener('click', () => showRuleForm(ratePlanId, rules.find(r => r.id == b.dataset.id))));
    document.querySelectorAll('.btn-del-rule').forEach(b => b.addEventListener('click', () => {
        showConfirm('Delete Rule', 'Delete this rate rule?', async () => {
            try { await rateRulesApi.delete(b.dataset.id); showToast('Deleted', 'success'); showRateRules(ratePlanId); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
}

function showRuleForm(ratePlanId, existing = null) {
    const isEdit = !!existing;
    showModal(`
    <div class="modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Rate Rule</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="rule-form"><div class="modal-body">
      <div class="form-group"><label class="form-label">Room Type *</label>
        <select class="form-select" name="roomTypeId" required>
          <option value="">Select</option>
          ${roomTypes.map(rt => `<option value="${rt.id}" ${existing?.roomTypeId === rt.id ? 'selected' : ''}>${rt.name}</option>`).join('')}
        </select></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Start Date *</label><input type="date" class="form-input" name="startDate" value="${existing?.startDate || ''}" required /></div>
        <div class="form-group"><label class="form-label">End Date *</label><input type="date" class="form-input" name="endDate" value="${existing?.endDate || ''}" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Weekday Price *</label><input type="number" class="form-input" name="weekdayPrice" step="0.01" value="${existing?.weekdayPrice ?? ''}" required /></div>
        <div class="form-group"><label class="form-label">Weekend Price *</label><input type="number" class="form-input" name="weekendPrice" step="0.01" value="${existing?.weekendPrice ?? ''}" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Extra Adult Price</label><input type="number" class="form-input" name="extraAdultPrice" step="0.01" value="${existing?.extraAdultPrice ?? ''}" /></div>
        <div class="form-group"><label class="form-label">Extra Child Price</label><input type="number" class="form-input" name="extraChildPrice" step="0.01" value="${existing?.extraChildPrice ?? ''}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Min Nights</label><input type="number" class="form-input" name="minNights" min="1" value="${existing?.minNights ?? ''}" /></div>
        <div class="form-group"><label class="form-label">Priority</label><input type="number" class="form-input" name="priority" min="1" value="${existing?.priority ?? ''}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-select" name="status">
            <option value="ACTIVE" ${existing?.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
            <option value="INACTIVE" ${existing?.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
          </select></div>
        <div class="form-group"><label class="form-label">Notes</label><input class="form-input" name="notes" value="${existing?.notes || ''}" /></div>
      </div>
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="rl-submit">${isEdit ? 'Update' : 'Create'}</button>
    </div></form>
  `, { size: 'lg' });
    initIcons();
    document.getElementById('rule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = {
            roomTypeId: parseInt(f.roomTypeId.value),
            startDate: f.startDate.value, endDate: f.endDate.value,
            weekdayPrice: parseFloat(f.weekdayPrice.value), weekendPrice: parseFloat(f.weekendPrice.value),
            extraAdultPrice: f.extraAdultPrice.value ? parseFloat(f.extraAdultPrice.value) : undefined,
            extraChildPrice: f.extraChildPrice.value ? parseFloat(f.extraChildPrice.value) : undefined,
            minNights: f.minNights.value ? parseInt(f.minNights.value) : undefined,
            priority: f.priority.value ? parseInt(f.priority.value) : undefined,
            status: f.status.value, notes: f.notes.value || undefined,
        };
        const btn = document.getElementById('rl-submit'); btn.disabled = true;
        try {
            if (isEdit) await rateRulesApi.update(existing.id, data); else await rateRulesApi.create(ratePlanId, data);
            showToast(isEdit ? 'Updated' : 'Created', 'success'); closeModal(); showRateRules(ratePlanId);
        } catch (e) { showToast('Error: ' + e.message, 'error'); btn.disabled = false; }
    });
}
