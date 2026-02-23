// ===== DASHBOARD PAGE =====
import { renderLayout } from '../layout.js';
import { propertiesApi, roomsApi, roomTypesApi, bookingsApi, usersApi } from '../api.js';
import { store, showToast, initIcons, formatCurrency, statusBadge } from '../utils.js';

export async function renderDashboard() {
    renderLayout('<div class="loading-spinner"></div>', 'dashboard');

    const prop = store.getState().currentProperty;
    let properties = [], rooms = [], roomTypes = [], users = [];

    try {
        const [propRes, usersRes] = await Promise.all([
            propertiesApi.getAll(),
            usersApi.getAll().catch(() => ({ data: [] })),
        ]);
        properties = propRes.data || [];
        users = usersRes.data || [];

        // If no current property selected, auto-select the first one
        if (!prop && properties.length > 0) {
            store.setState({ currentProperty: properties[0] });
        }

        const activeProp = store.getState().currentProperty;
        if (activeProp) {
            const [roomsRes, rtRes] = await Promise.all([
                roomsApi.getByProperty(activeProp.id).catch(() => ({ data: [] })),
                roomTypesApi.getByProperty(activeProp.id).catch(() => ({ data: [] })),
            ]);
            rooms = roomsRes.data || [];
            roomTypes = rtRes.data || [];
        }
    } catch (err) {
        showToast('Error loading dashboard data: ' + err.message, 'error');
    }

    const activeProp = store.getState().currentProperty;
    const availableRooms = rooms.filter(r => r.status === 'AVAILABLE').length;
    const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'MAINTENANCE').length;

    const content = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's an overview of your hotel management system.</p>
      </div>
      ${properties.length > 1 ? `
        <select class="form-select" id="dash-prop-switch" style="width: auto;">
          ${properties.map(p => `<option value="${p.id}" ${p.id === activeProp?.id ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      ` : ''}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon purple"><i data-lucide="building-2"></i></div>
        <div class="stat-info">
          <h3>${properties.length}</h3>
          <p>Properties</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="door-open"></i></div>
        <div class="stat-info">
          <h3>${rooms.length}</h3>
          <p>Total Rooms</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i data-lucide="check-circle"></i></div>
        <div class="stat-info">
          <h3>${availableRooms}</h3>
          <p>Available Rooms</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><i data-lucide="users"></i></div>
        <div class="stat-info">
          <h3>${users.length}</h3>
          <p>Staff Members</p>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Room Status Overview</h3>
        </div>
        <div style="display: flex; gap: var(--space-6); flex-wrap: wrap;">
          <div style="flex:1; min-width: 120px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <div style="width:10px; height:10px; border-radius:50%; background:var(--success);"></div>
              <span style="font-size:0.8125rem; color:var(--text-secondary);">Available</span>
            </div>
            <div style="font-size:1.5rem; font-weight:700; color:var(--success);">${availableRooms}</div>
          </div>
          <div style="flex:1; min-width: 120px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <div style="width:10px; height:10px; border-radius:50%; background:var(--info);"></div>
              <span style="font-size:0.8125rem; color:var(--text-secondary);">Occupied</span>
            </div>
            <div style="font-size:1.5rem; font-weight:700; color:var(--info);">${occupiedRooms}</div>
          </div>
          <div style="flex:1; min-width: 120px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <div style="width:10px; height:10px; border-radius:50%; background:var(--warning);"></div>
              <span style="font-size:0.8125rem; color:var(--text-secondary);">Maintenance</span>
            </div>
            <div style="font-size:1.5rem; font-weight:700; color:var(--warning);">${maintenanceRooms}</div>
          </div>
        </div>
        ${rooms.length > 0 ? `
          <div style="margin-top: var(--space-6); background: var(--bg-input); border-radius: var(--radius-md); height: 8px; overflow: hidden; display: flex;">
            <div style="width: ${(availableRooms / rooms.length * 100)}%; background: var(--success); transition: width 0.5s;"></div>
            <div style="width: ${(occupiedRooms / rooms.length * 100)}%; background: var(--info); transition: width 0.5s;"></div>
            <div style="width: ${(maintenanceRooms / rooms.length * 100)}%; background: var(--warning); transition: width 0.5s;"></div>
          </div>
        ` : ''}
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Room Types</h3>
        </div>
        ${roomTypes.length > 0 ? `
          <div class="table-wrapper" style="border:none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Base Occ.</th>
                  <th>Max Occ.</th>
                </tr>
              </thead>
              <tbody>
                ${roomTypes.map(rt => `
                  <tr>
                    <td style="color:var(--text-primary); font-weight:500;">${rt.name}</td>
                    <td>${rt.baseOccupancy || '—'}</td>
                    <td>${rt.maxOccupancy || '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div class="empty-state"><p>No room types configured yet.</p></div>'}
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-6);">
      <div class="card-header">
        <h3 class="card-title">Recent Rooms</h3>
        <a href="#/rooms" class="btn btn-secondary btn-sm">View All →</a>
      </div>
      ${rooms.length > 0 ? `
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Room #</th>
                <th>Floor</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rooms.slice(0, 8).map(r => `
                <tr>
                  <td style="color:var(--text-primary); font-weight:600;">${r.roomNumber}</td>
                  <td>${r.floorNumber ?? '—'}</td>
                  <td>${roomTypes.find(rt => rt.id === r.roomTypeId)?.name || '—'}</td>
                  <td>${statusBadge(r.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state"><p>No rooms found. <a href="#/rooms">Add rooms</a> to get started.</p></div>'}
    </div>
  `;

    document.getElementById('page-content').innerHTML = content;
    initIcons();

    // Property switcher
    document.getElementById('dash-prop-switch')?.addEventListener('change', (e) => {
        const selectedProp = properties.find(p => p.id == e.target.value);
        if (selectedProp) {
            store.setState({ currentProperty: selectedProp });
            renderDashboard();
        }
    });
}
