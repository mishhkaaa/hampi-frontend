// ===== BLOCKS PAGE =====
import { renderLayout } from '../layout.js';
import { blocksApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, initIcons, store } from '../utils.js';

let blocks = [];

export async function renderBlocks() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'blocks');
    await loadData();
}

async function loadData() {
    try {
        const res = await blocksApi.getByProperty(store.getState().currentProperty.id);
        blocks = res.data || [];
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
    renderList();
}

function renderList() {
    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Property Blocks</h1><p>Manage building blocks/wings</p></div>
      <button class="btn btn-primary" id="btn-add"><i data-lucide="plus"></i> Add Block</button>
    </div>
    ${blocks.length > 0 ? `
      <div class="table-wrapper"><table class="data-table">
        <thead><tr><th>ID</th><th>Name</th><th>Block Type</th><th>Min Booking Unit</th><th>Actions</th></tr></thead>
        <tbody>${blocks.map(b => `
          <tr>
            <td>${b.id}</td>
            <td style="color:var(--text-primary);font-weight:600;">${b.name}</td>
            <td><span class="badge badge-purple">${(b.blockType || '').replace(/_/g, ' ')}</span></td>
            <td><span class="badge badge-info">${b.minBookingUnit || '—'}</span></td>
            <td><div class="table-actions">
              <button class="btn btn-ghost btn-sm btn-edit" data-id="${b.id}"><i data-lucide="pencil"></i></button>
              <button class="btn btn-ghost btn-sm btn-del" data-id="${b.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button>
            </div></td>
          </tr>`).join('')}</tbody>
      </table></div>
    ` : `<div class="empty-state"><i data-lucide="boxes"></i><h3>No blocks</h3><p>Add building blocks to organize rooms.</p>
      <button class="btn btn-primary" id="btn-add-e"><i data-lucide="plus"></i> Add Block</button></div>`}
  `;
    initIcons();
    document.getElementById('btn-add')?.addEventListener('click', () => showForm());
    document.getElementById('btn-add-e')?.addEventListener('click', () => showForm());
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => showForm(blocks.find(x => x.id == b.dataset.id))));
    document.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => {
        const bl = blocks.find(x => x.id == b.dataset.id);
        showConfirm('Delete Block', `Delete "${bl.name}"?`, async () => {
            try { await blocksApi.delete(bl.id); showToast('Deleted', 'success'); await loadData(); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
}

function showForm(existing = null) {
    const isEdit = !!existing;
    showModal(`
    <div class="modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Block</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="block-form"><div class="modal-body">
      <div class="form-group"><label class="form-label">Name *</label>
        <input class="form-input" name="name" value="${existing?.name || ''}" required /></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Block Type *</label>
          <select class="form-select" name="blockType" required>
            ${['APARTMENT', 'GLASS_HOUSE', 'TENT_CLUSTER', 'VILLA', 'OTHER'].map(t => `<option value="${t}" ${existing?.blockType === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Min Booking Unit *</label>
          <select class="form-select" name="minBookingUnit" required>
            <option value="ROOM" ${existing?.minBookingUnit === 'ROOM' ? 'selected' : ''}>Room</option>
            <option value="BLOCK" ${existing?.minBookingUnit === 'BLOCK' ? 'selected' : ''}>Block</option>
          </select></div>
      </div>
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="bl-submit">${isEdit ? 'Update' : 'Create'}</button>
    </div></form>
  `);
    initIcons();
    document.getElementById('block-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = { name: f.name.value, blockType: f.blockType.value, minBookingUnit: f.minBookingUnit.value };
        const btn = document.getElementById('bl-submit'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
        try {
            if (isEdit) await blocksApi.update(existing.id, data); else await blocksApi.create(store.getState().currentProperty.id, data);
            showToast(isEdit ? 'Updated' : 'Created', 'success'); closeModal(); await loadData();
        } catch (e) { showToast('Error: ' + e.message, 'error'); btn.disabled = false; btn.innerHTML = isEdit ? 'Update' : 'Create'; }
    });
}
