// ===== ROOMS PAGE =====
import { renderLayout } from '../layout.js';
import { roomsApi, roomTypesApi, blocksApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, initIcons, store } from '../utils.js';

let rooms = [], roomTypes = [], blocks = [];

export async function renderRooms() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'rooms');
    await loadRooms();
}

async function loadRooms() {
    const prop = store.getState().currentProperty;
    try {
        const [rRes, rtRes, bRes] = await Promise.all([
            roomsApi.getByProperty(prop.id),
            roomTypesApi.getByProperty(prop.id),
            blocksApi.getByProperty(prop.id).catch(() => ({ data: [] })),
        ]);
        rooms = rRes.data || [];
        roomTypes = rtRes.data || [];
        blocks = bRes.data || [];
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
    renderList();
}

function renderList() {
    const content = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Rooms</h1>
        <p>Manage rooms for ${store.getState().currentProperty?.name}</p>
      </div>
      <button class="btn btn-primary" id="btn-add-room"><i data-lucide="plus"></i> Add Room</button>
    </div>

    ${rooms.length > 0 ? `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Room Number</th><th>Floor</th><th>Room Type</th><th>Block</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${rooms.map(r => `
              <tr>
                <td>${r.id}</td>
                <td style="color:var(--text-primary); font-weight:600;">${r.roomNumber}</td>
                <td>${r.floorNumber ?? '—'}</td>
                <td>${roomTypes.find(rt => rt.id === r.roomTypeId)?.name || '—'}</td>
                <td>${blocks.find(b => b.id === r.blockId)?.name || '—'}</td>
                <td>${statusBadge(r.status)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-ghost btn-sm btn-edit" data-id="${r.id}" title="Edit"><i data-lucide="pencil"></i></button>
                    <button class="btn btn-ghost btn-sm btn-maint" data-id="${r.id}" title="Maintenance"><i data-lucide="wrench"></i></button>
                    <button class="btn btn-ghost btn-sm btn-delete" data-id="${r.id}" style="color:var(--danger);" title="Delete"><i data-lucide="trash-2"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="empty-state"><i data-lucide="door-open"></i><h3>No rooms yet</h3><p>Add rooms to this property.</p>
        <button class="btn btn-primary" id="btn-add-room-empty"><i data-lucide="plus"></i> Add Room</button>
      </div>
    `}
  `;

    document.getElementById('page-content').innerHTML = content;
    initIcons();

    document.getElementById('btn-add-room')?.addEventListener('click', () => showRoomForm());
    document.getElementById('btn-add-room-empty')?.addEventListener('click', () => showRoomForm());

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const room = rooms.find(r => r.id == btn.dataset.id);
            if (room) showRoomForm(room);
        });
    });

    document.querySelectorAll('.btn-maint').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.hash = `#/maintenance?roomId=${btn.dataset.id}`;
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const room = rooms.find(r => r.id == btn.dataset.id);
            if (room) showConfirm('Delete Room', `Delete room "${room.roomNumber}"?`, async () => {
                try { await roomsApi.delete(room.id); showToast('Room deleted', 'success'); await loadRooms(); }
                catch (err) { showToast('Error: ' + err.message, 'error'); }
            });
        });
    });
}

function showRoomForm(existing = null) {
    const isEdit = !!existing;
    const prop = store.getState().currentProperty;
    showModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Edit Room' : 'Add Room'}</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button>
    </div>
    <form id="room-form">
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Room Number *</label>
            <input type="text" class="form-input" name="roomNumber" value="${existing?.roomNumber || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Floor Number</label>
            <input type="number" class="form-input" name="floorNumber" value="${existing?.floorNumber ?? ''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Room Type *</label>
            <select class="form-select" name="roomTypeId" required>
              <option value="">Select type</option>
              ${roomTypes.map(rt => `<option value="${rt.id}" ${existing?.roomTypeId === rt.id ? 'selected' : ''}>${rt.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Block</label>
            <select class="form-select" name="blockId">
              <option value="">None</option>
              ${blocks.map(b => `<option value="${b.id}" ${existing?.blockId === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" name="status">
            <option value="AVAILABLE" ${existing?.status === 'AVAILABLE' ? 'selected' : ''}>Available</option>
            <option value="OCCUPIED" ${existing?.status === 'OCCUPIED' ? 'selected' : ''}>Occupied</option>
            <option value="MAINTENANCE" ${existing?.status === 'MAINTENANCE' ? 'selected' : ''}>Maintenance</option>
            <option value="OUT_OF_SERVICE" ${existing?.status === 'OUT_OF_SERVICE' ? 'selected' : ''}>Out of Service</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
        <button type="submit" class="btn btn-primary" id="room-submit">${isEdit ? 'Update' : 'Create'}</button>
      </div>
    </form>
  `);
    initIcons();

    document.getElementById('room-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = {
            roomNumber: f.roomNumber.value,
            floorNumber: f.floorNumber.value ? parseInt(f.floorNumber.value) : undefined,
            roomTypeId: parseInt(f.roomTypeId.value),
            blockId: f.blockId.value ? parseInt(f.blockId.value) : undefined,
            status: f.status.value,
        };
        const btn = document.getElementById('room-submit');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>';
        try {
            if (isEdit) {
                await roomsApi.update(existing.id, data);
                showToast('Room updated', 'success');
            } else {
                await roomsApi.create(prop.id, data);
                showToast('Room created', 'success');
            }
            closeModal(); await loadRooms();
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
            btn.disabled = false; btn.innerHTML = isEdit ? 'Update' : 'Create';
        }
    });
}
