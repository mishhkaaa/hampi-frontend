// ===== ROOM TYPES PAGE =====
import { renderLayout } from '../layout.js';
import { roomTypesApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, initIcons, store } from '../utils.js';

let roomTypes = [];

export async function renderRoomTypes() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'room-types');
    await loadData();
}

async function loadData() {
    const prop = store.getState().currentProperty;
    try {
        const res = await roomTypesApi.getByProperty(prop.id);
        roomTypes = res.data || [];
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
    renderList();
}

function renderList() {
    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Room Types</h1><p>Configure room categories for ${store.getState().currentProperty?.name}</p></div>
      <button class="btn btn-primary" id="btn-add"><i data-lucide="plus"></i> Add Room Type</button>
    </div>
    ${roomTypes.length > 0 ? `
      <div class="table-wrapper"><table class="data-table">
        <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Base Occ.</th><th>Max Occ.</th><th>Actions</th></tr></thead>
        <tbody>${roomTypes.map(rt => `
          <tr>
            <td>${rt.id}</td>
            <td style="color:var(--text-primary);font-weight:600;">${rt.name}</td>
            <td>${rt.description || '—'}</td>
            <td>${rt.baseOccupancy ?? '—'}</td>
            <td>${rt.maxOccupancy ?? '—'}</td>
            <td><div class="table-actions">
              <button class="btn btn-ghost btn-sm btn-edit" data-id="${rt.id}"><i data-lucide="pencil"></i></button>
              <button class="btn btn-ghost btn-sm btn-del" data-id="${rt.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button>
            </div></td>
          </tr>`).join('')}</tbody>
      </table></div>
    ` : `<div class="empty-state"><i data-lucide="layers"></i><h3>No room types</h3><p>Create room types to categorize rooms.</p>
      <button class="btn btn-primary" id="btn-add-e"><i data-lucide="plus"></i> Add Room Type</button></div>`}
  `;
    initIcons();
    document.getElementById('btn-add')?.addEventListener('click', () => showForm());
    document.getElementById('btn-add-e')?.addEventListener('click', () => showForm());
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => showForm(roomTypes.find(r => r.id == b.dataset.id))));
    document.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => {
        const rt = roomTypes.find(r => r.id == b.dataset.id);
        showConfirm('Delete Room Type', `Delete "${rt.name}"?`, async () => {
            try { await roomTypesApi.delete(rt.id); showToast('Deleted', 'success'); await loadData(); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
}

function showForm(existing = null) {
    const isEdit = !!existing;
    showModal(`
    <div class="modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Room Type</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="rt-form"><div class="modal-body">
      <div class="form-group"><label class="form-label">Name *</label>
        <input class="form-input" name="name" value="${existing?.name || ''}" required /></div>
      <div class="form-group"><label class="form-label">Description</label>
        <textarea class="form-textarea" name="description">${existing?.description || ''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Base Occupancy</label>
          <input type="number" class="form-input" name="baseOccupancy" value="${existing?.baseOccupancy ?? ''}" min="1" /></div>
        <div class="form-group"><label class="form-label">Max Occupancy</label>
          <input type="number" class="form-input" name="maxOccupancy" value="${existing?.maxOccupancy ?? ''}" min="1" /></div>
      </div>
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="rt-submit">${isEdit ? 'Update' : 'Create'}</button>
    </div></form>
  `);
    initIcons();
    document.getElementById('rt-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = {
            name: f.name.value,
            description: f.description.value || undefined,
            baseOccupancy: f.baseOccupancy.value ? parseInt(f.baseOccupancy.value) : undefined,
            maxOccupancy: f.maxOccupancy.value ? parseInt(f.maxOccupancy.value) : undefined,
        };
        const btn = document.getElementById('rt-submit'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
        try {
            if (isEdit) await roomTypesApi.update(existing.id, data); else await roomTypesApi.create(store.getState().currentProperty.id, data);
            showToast(isEdit ? 'Updated' : 'Created', 'success'); closeModal(); await loadData();
        } catch (e) { showToast('Error: ' + e.message, 'error'); btn.disabled = false; btn.innerHTML = isEdit ? 'Update' : 'Create'; }
    });
}
