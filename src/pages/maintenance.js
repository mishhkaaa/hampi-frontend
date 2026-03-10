// ===== MAINTENANCE PAGE =====
import { renderLayout } from '../layout.js';
import { maintenanceApi, roomsApi, blocksApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, formatDate, initIcons, store, handlePropertyNotFound } from '../utils.js';

let rooms = [], blocks = [], allRecords = [];

export async function renderMaintenance() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'maintenance');

    try {
        const [rRes, bRes] = await Promise.all([
            roomsApi.getByProperty(prop.id),
            blocksApi.getByProperty(prop.id).catch(() => ({ data: [] })),
        ]);
        rooms = rRes.data || [];
        blocks = bRes.data || [];
    } catch (e) {
        if (handlePropertyNotFound(e)) return;
        showToast('Error loading rooms: ' + e.message, 'error');
        rooms = []; blocks = [];
    }

    // Check for roomId query param
    const hash = window.location.hash;
    const roomIdParam = hash.includes('roomId=') ? hash.split('roomId=')[1] : null;
    if (roomIdParam) {
        await loadMaintenanceForRoom(parseInt(roomIdParam));
    } else {
        await loadAllMaintenance();
    }
}

// ===== LOAD ALL MAINTENANCE ACROSS ALL ROOMS =====
async function loadAllMaintenance() {
    const pc = document.getElementById('page-content');
    pc.innerHTML = '<div class="loading-spinner"></div>';

    allRecords = [];
    await Promise.all(rooms.map(async (room) => {
        try {
            const res = await maintenanceApi.getByRoom(room.id);
            const records = res.data || [];
            records.forEach(r => {
                r._roomId = room.id;
                r._roomNumber = room.roomNumber;
                r._blockId = room.blockId;
            });
            allRecords.push(...records);
        } catch (_e) { /* room may have no records */ }
    }));

    allRecords.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    renderAllMaintenanceList();
}

function renderAllMaintenanceList() {
    const pc = document.getElementById('page-content');
    pc.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Room Maintenance</h1>
        <p>All maintenance records — ${rooms.length} rooms total</p>
      </div>
      <div style="display:flex; gap:var(--space-3); flex-wrap:wrap; align-items:center;">
        <select class="form-select" id="maint-filter-status" style="width:auto;">
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <button class="btn btn-secondary" id="btn-select-room"><i data-lucide="door-open"></i> By Room</button>
        <button class="btn btn-primary" id="btn-add-global"><i data-lucide="plus"></i> Schedule Maintenance</button>
      </div>
    </div>

    <!-- Summary cards -->
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:var(--space-4); margin-bottom:var(--space-6);">
      <div class="stat-card-v2" style="border-left:4px solid var(--warning);">
        <div class="stat-value">${allRecords.filter(r => r.status === 'SCHEDULED').length}</div>
        <div class="stat-label">Scheduled</div>
      </div>
      <div class="stat-card-v2" style="border-left:4px solid var(--accent-primary);">
        <div class="stat-value">${allRecords.filter(r => r.status === 'IN_PROGRESS').length}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-card-v2" style="border-left:4px solid var(--success);">
        <div class="stat-value">${allRecords.filter(r => r.status === 'COMPLETED').length}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card-v2" style="border-left:4px solid var(--danger);">
        <div class="stat-value">${rooms.filter(r => r.status === 'MAINTENANCE').length}</div>
        <div class="stat-label">Rooms Out of Service</div>
      </div>
    </div>

    <div id="maint-list-container">
      ${renderMaintenanceTable(allRecords)}
    </div>
  `;
    initIcons();

    document.getElementById('btn-select-room')?.addEventListener('click', renderRoomSelector);
    document.getElementById('btn-add-global')?.addEventListener('click', () => showMaintForm(null));
    document.getElementById('maint-filter-status')?.addEventListener('change', (e) => {
        const status = e.target.value;
        const filtered = status ? allRecords.filter(r => r.status === status) : allRecords;
        document.getElementById('maint-list-container').innerHTML = renderMaintenanceTable(filtered);
        initIcons();
        bindMaintenanceTableActions();
    });
    bindMaintenanceTableActions();
}

function renderMaintenanceTable(records) {
    if (records.length === 0) {
        return `<div class="empty-state">
          <i data-lucide="wrench"></i>
          <h3>No maintenance records</h3>
          <p>Schedule maintenance for rooms using the button above.</p>
        </div>`;
    }
    return `
    <div class="table-wrapper"><table class="data-table">
      <thead><tr>
        <th>Room</th><th>Block</th><th>Start Date</th><th>End Date</th><th>Reason</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${records.map(m => {
          const block = m._blockId ? blocks.find(b => b.id === m._blockId) : null;
          return `<tr>
            <td>
              <a href="#" class="maint-room-link" data-roomid="${m._roomId}"
                style="font-weight:600; color:var(--accent-primary); text-decoration:none;">
                ${m._roomNumber || `Room ${m._roomId}`}
              </a>
            </td>
            <td>${block ? `<span class="badge badge-info">${block.name}</span>` : '<span style="color:var(--text-muted);">—</span>'}</td>
            <td>${formatDate(m.startDate)}</td>
            <td>${m.endDate ? formatDate(m.endDate) : '—'}</td>
            <td style="color:var(--text-secondary); max-width:200px;">${m.reason || '—'}</td>
            <td>${statusBadge(m.status)}</td>
            <td><div class="table-actions">
              <button class="btn btn-ghost btn-sm btn-edit-maint" data-id="${m.id}" data-roomid="${m._roomId}">
                <i data-lucide="pencil"></i>
              </button>
              <button class="btn btn-ghost btn-sm btn-del-maint" data-id="${m.id}" style="color:var(--danger);">
                <i data-lucide="trash-2"></i>
              </button>
            </div></td>
          </tr>`;
      }).join('')}</tbody>
    </table></div>`;
}

function bindMaintenanceTableActions() {
    document.querySelectorAll('.maint-room-link').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            loadMaintenanceForRoom(parseInt(a.dataset.roomid));
        });
    });
    document.querySelectorAll('.btn-edit-maint').forEach(b => {
        const record = allRecords.find(m => m.id == b.dataset.id);
        if (record) b.addEventListener('click', () => showMaintForm(parseInt(b.dataset.roomid), record));
    });
    document.querySelectorAll('.btn-del-maint').forEach(b => b.addEventListener('click', () => {
        showConfirm('Delete Maintenance', 'Delete this maintenance record?', async () => {
            try {
                await maintenanceApi.delete(b.dataset.id);
                showToast('Deleted', 'success');
                await loadAllMaintenance();
            } catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
}

// ===== ROOM CARD SELECTOR VIEW =====
function renderRoomSelector() {
    const pc = document.getElementById('page-content');
    pc.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Room Maintenance</h1><p>Select a room to view its maintenance history</p></div>
      <button class="btn btn-secondary" id="btn-back-overview"><i data-lucide="arrow-left"></i> Overview</button>
    </div>
    ${rooms.length === 0 ? '<div class="empty-state"><i data-lucide="door-open"></i><h3>No rooms found</h3></div>' : ''}
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:var(--space-4);">
      ${rooms.map(r => {
          const block = r.blockId ? blocks.find(b => b.id === r.blockId) : null;
          const hasMaint = r.status === 'MAINTENANCE';
          return `<button class="card btn-select-room-card" data-roomid="${r.id}"
            style="text-align:left; cursor:pointer; border:2px solid ${hasMaint ? 'var(--warning)' : 'var(--border-color)'}; background:var(--bg-card); padding:var(--space-4); transition:border-color 0.2s, box-shadow 0.2s;">
            <div style="font-weight:700; color:var(--text-primary); font-size:var(--font-md);">${r.roomNumber}</div>
            ${block ? `<div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:2px;">${block.name}</div>` : ''}
            <div style="margin-top:8px;">${statusBadge(r.status)}</div>
          </button>`;
      }).join('')}
    </div>
  `;
    initIcons();
    document.getElementById('btn-back-overview')?.addEventListener('click', loadAllMaintenance);
    document.querySelectorAll('.btn-select-room-card').forEach(btn => {
        btn.addEventListener('click', () => loadMaintenanceForRoom(parseInt(btn.dataset.roomid)));
    });
}

// ===== SINGLE ROOM MAINTENANCE VIEW =====
async function loadMaintenanceForRoom(roomId) {
    const pc = document.getElementById('page-content');
    pc.innerHTML = '<div class="loading-spinner"></div>';
    let records = [];
    try {
        const res = await maintenanceApi.getByRoom(roomId);
        records = res.data || [];
    } catch (_e) { records = []; }
    renderMaintenanceList(roomId, records);
}

function renderMaintenanceList(roomId, maintenanceRecords) {
    const room = rooms.find(r => r.id === roomId);
    const block = room?.blockId ? blocks.find(b => b.id === room.blockId) : null;
    const pc = document.getElementById('page-content');

    pc.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Maintenance — Room ${room?.roomNumber || roomId}</h1>
        <p>${block ? `Block: <strong>${block.name}</strong> · ` : ''}Status: ${room?.status || '—'}</p>
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
            <td style="color:var(--text-muted);">#${m.id}</td>
            <td>${formatDate(m.startDate)}</td>
            <td>${m.endDate ? formatDate(m.endDate) : '—'}</td>
            <td style="color:var(--text-secondary);">${m.reason || '—'}</td>
            <td>${statusBadge(m.status)}</td>
            <td><div class="table-actions">
              <button class="btn btn-ghost btn-sm btn-edit" data-id="${m.id}"><i data-lucide="pencil"></i></button>
              <button class="btn btn-ghost btn-sm btn-del" data-id="${m.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button>
            </div></td>
          </tr>`).join('')}</tbody>
      </table></div>
    ` : `<div class="empty-state">
      <i data-lucide="wrench"></i>
      <h3>No maintenance records</h3>
      <p>Schedule maintenance for Room ${room?.roomNumber || roomId}.</p>
    </div>`}
  `;
    initIcons();

    document.getElementById('btn-back')?.addEventListener('click', loadAllMaintenance);
    document.getElementById('btn-add')?.addEventListener('click', () => showMaintForm(roomId));
    document.querySelectorAll('.btn-edit').forEach(b => {
        b.addEventListener('click', () => showMaintForm(roomId, maintenanceRecords.find(m => m.id == b.dataset.id)));
    });
    document.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => {
        showConfirm('Delete', 'Delete this maintenance record?', async () => {
            try {
                await maintenanceApi.delete(b.dataset.id);
                showToast('Deleted', 'success');
                await loadMaintenanceForRoom(roomId);
            } catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
}

// ===== MAINTENANCE FORM =====
function showMaintForm(roomId, existing = null) {
    const isEdit = !!existing;
    showModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Edit' : 'Schedule'} Maintenance</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button>
    </div>
    <form id="maint-form">
      <div class="modal-body">
        ${!roomId ? `
          <div class="form-group"><label class="form-label">Room *</label>
            <select class="form-select" name="roomId" required>
              <option value="">— Select a room —</option>
              ${rooms.map(r => {
                  const bl = r.blockId ? blocks.find(b => b.id === r.blockId) : null;
                  return `<option value="${r.id}">${bl ? bl.name + ' — ' : ''}${r.roomNumber}</option>`;
              }).join('')}
            </select>
          </div>
        ` : `<div style="background:var(--bg-input); border-radius:var(--radius-md); padding:var(--space-3); margin-bottom:var(--space-4); font-size:var(--font-sm);">
            Room: <strong>${rooms.find(r => r.id === roomId)?.roomNumber || roomId}</strong>
          </div>`}
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Start Date *</label>
            <input type="date" class="form-input" name="startDate" value="${existing?.startDate?.split('T')[0] || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input type="date" class="form-input" name="endDate" value="${existing?.endDate?.split('T')[0] || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Reason / Description</label>
          <textarea class="form-textarea" name="reason" rows="3" placeholder="Describe the maintenance work…">${existing?.reason || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" name="status">
            ${['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map(s =>
                `<option value="${s}" ${existing?.status === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
        <button type="submit" class="btn btn-primary" id="mt-submit">${isEdit ? 'Update' : 'Schedule'}</button>
      </div>
    </form>
  `);
    initIcons();
    document.getElementById('maint-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const targetRoomId = roomId || (f.roomId ? parseInt(f.roomId.value) : null);
        if (!targetRoomId) { showToast('Select a room', 'error'); return; }
        const data = {
            startDate: f.startDate.value,
            endDate: f.endDate.value || undefined,
            reason: f.reason.value || undefined,
            status: f.status.value,
        };
        const btn = document.getElementById('mt-submit');
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
        try {
            if (isEdit) await maintenanceApi.update(existing.id, data);
            else await maintenanceApi.create(targetRoomId, data);
            showToast(isEdit ? 'Updated' : 'Scheduled', 'success');
            closeModal();
            if (roomId) await loadMaintenanceForRoom(roomId);
            else await loadAllMaintenance();
        } catch (e) {
            showToast('Error: ' + e.message, 'error');
            btn.disabled = false; btn.innerHTML = isEdit ? 'Update' : 'Schedule';
        }
    });
}
