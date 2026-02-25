// ===== MAINTENANCE PAGE =====
import { renderLayout } from '../layout.js';
import { maintenanceApi, roomsApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, formatDate, initIcons, store } from '../utils.js';

let rooms = [], maintenanceRecords = [], selectedRoomId = null;

export async function renderMaintenance() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'maintenance');

    try {
        const rRes = await roomsApi.getByProperty(prop.id);
        rooms = rRes.data || [];
    } catch (e) { showToast('Error: ' + e.message, 'error'); }

    // Check for roomId query param
    const hash = window.location.hash;
    const roomIdParam = hash.includes('roomId=') ? hash.split('roomId=')[1] : null;
    if (roomIdParam) {
        selectedRoomId = parseInt(roomIdParam);
        await loadMaintenanceForRoom(selectedRoomId);
    } else {
        renderRoomSelector();
    }
}

function renderRoomSelector() {
    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Room Maintenance</h1><p>Track maintenance schedules for rooms</p></div>
    </div>
    <div class="card">
      <div style="display:flex; gap:var(--space-3); align-items:flex-end;">
        <div class="form-group" style="flex:1; margin-bottom:0;">
          <label class="form-label">Select Room</label>
          <select class="form-select" id="maint-room-select">
            <option value="">Choose a room…</option>
            ${rooms.map(r => `<option value="${r.id}">${r.roomNumber} (Floor ${r.floorNumber ?? '—'})</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" id="btn-load-maint" style="height:42px;">View Maintenance</button>
      </div>
    </div>
  `;
    initIcons();

    document.getElementById('btn-load-maint')?.addEventListener('click', async () => {
        const roomId = document.getElementById('maint-room-select').value;
        if (!roomId) { showToast('Select a room first', 'warning'); return; }
        selectedRoomId = parseInt(roomId);
        await loadMaintenanceForRoom(selectedRoomId);
    });
}

async function loadMaintenanceForRoom(roomId) {
    try {
        const res = await maintenanceApi.getByRoom(roomId);
        maintenanceRecords = res.data || [];
    } catch (e) { maintenanceRecords = []; }
    renderMaintenanceList(roomId);
}

function renderMaintenanceList(roomId) {
    const room = rooms.find(r => r.id === roomId);
    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Maintenance — Room ${room?.roomNumber || roomId}</h1>
        <p>Maintenance records for this room</p>
      </div>
      <div style="display:flex; gap:var(--space-3);">
        <button class="btn btn-secondary" id="btn-back"><i data-lucide="arrow-left"></i> Back</button>
        <button class="btn btn-primary" id="btn-add"><i data-lucide="plus"></i> Schedule Maintenance</button>
      </div>
    </div>
    ${maintenanceRecords.length > 0 ? `
      <div class="table-wrapper"><table class="data-table">
        <thead><tr><th>ID</th><th>Start Date</th><th>End Date</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${maintenanceRecords.map(m => `
          <tr>
            <td>${m.id}</td>
            <td>${formatDate(m.startDate)}</td>
            <td>${formatDate(m.endDate)}</td>
            <td>${m.reason || '—'}</td>
            <td>${statusBadge(m.status)}</td>
            <td><div class="table-actions">
              <button class="btn btn-ghost btn-sm btn-edit" data-id="${m.id}"><i data-lucide="pencil"></i></button>
              <button class="btn btn-ghost btn-sm btn-del" data-id="${m.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button>
            </div></td>
          </tr>`).join('')}</tbody>
      </table></div>
    ` : '<div class="empty-state"><i data-lucide="wrench"></i><h3>No maintenance records</h3><p>Schedule maintenance for this room.</p></div>'}
  `;
    initIcons();

    document.getElementById('btn-back')?.addEventListener('click', () => { window.location.hash = '#/maintenance'; renderRoomSelector(); });
    document.getElementById('btn-add')?.addEventListener('click', () => showMaintForm(roomId));
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => showMaintForm(roomId, maintenanceRecords.find(m => m.id == b.dataset.id))));
    document.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => {
        showConfirm('Delete', 'Delete this maintenance record?', async () => {
            try { await maintenanceApi.delete(b.dataset.id); showToast('Deleted', 'success'); await loadMaintenanceForRoom(roomId); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
}

function showMaintForm(roomId, existing = null) {
    const isEdit = !!existing;
    showModal(`
    <div class="modal-header"><h2>${isEdit ? 'Edit' : 'Schedule'} Maintenance</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="maint-form"><div class="modal-body">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Start Date *</label><input type="date" class="form-input" name="startDate" value="${existing?.startDate || ''}" required /></div>
        <div class="form-group"><label class="form-label">End Date</label><input type="date" class="form-input" name="endDate" value="${existing?.endDate || ''}" /></div>
      </div>
      <div class="form-group"><label class="form-label">Reason</label><textarea class="form-textarea" name="reason">${existing?.reason || ''}</textarea></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-select" name="status">
          ${['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map(s => `<option value="${s}" ${existing?.status === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}
        </select></div>
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="mt-submit">${isEdit ? 'Update' : 'Create'}</button>
    </div></form>
  `);
    initIcons();
    document.getElementById('maint-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = { startDate: f.startDate.value, endDate: f.endDate.value || undefined, reason: f.reason.value || undefined, status: f.status.value };
        const btn = document.getElementById('mt-submit'); btn.disabled = true;
        try {
            if (isEdit) await maintenanceApi.update(existing.id, data); else await maintenanceApi.create(roomId, data);
            showToast(isEdit ? 'Updated' : 'Scheduled', 'success'); closeModal(); await loadMaintenanceForRoom(roomId);
        } catch (e) { showToast('Error: ' + e.message, 'error'); btn.disabled = false; }
    });
}
