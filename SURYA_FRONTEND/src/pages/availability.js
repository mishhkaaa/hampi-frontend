// ===== AVAILABILITY PAGE =====
import { renderLayout } from '../layout.js';
import { propertiesApi } from '../api.js';
import { showToast, initIcons, store, today, daysFromNow, formatDate } from '../utils.js';

export async function renderAvailability() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'availability');

    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Room Availability</h1><p>View availability calendar for ${prop.name}</p></div>
    </div>
    <div class="card">
      <div style="display:flex; gap:var(--space-3); align-items:flex-end; margin-bottom:var(--space-6); flex-wrap:wrap;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">From</label>
          <input type="date" class="form-input" id="avail-from" value="${today()}" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">To</label>
          <input type="date" class="form-input" id="avail-to" value="${daysFromNow(14)}" />
        </div>
        <button class="btn btn-primary" id="btn-check-avail" style="height:42px;"><i data-lucide="search"></i> Check</button>
      </div>
      <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-4);">
        <div style="display:flex; align-items:center; gap:6px; font-size:var(--font-xs); color:var(--text-secondary);">
          <div style="width:14px; height:14px; border-radius:3px; background:rgba(16,185,129,0.15);"></div> Available
        </div>
        <div style="display:flex; align-items:center; gap:6px; font-size:var(--font-xs); color:var(--text-secondary);">
          <div style="width:14px; height:14px; border-radius:3px; background:rgba(239,68,68,0.15);"></div> Occupied
        </div>
        <div style="display:flex; align-items:center; gap:6px; font-size:var(--font-xs); color:var(--text-secondary);">
          <div style="width:14px; height:14px; border-radius:3px; background:rgba(245,158,11,0.15);"></div> Maintenance
        </div>
      </div>
      <div id="avail-result"></div>
    </div>
  `;
    initIcons();

    document.getElementById('btn-check-avail').addEventListener('click', loadAvailability);
    loadAvailability();
}

async function loadAvailability() {
    const prop = store.getState().currentProperty;
    const from = document.getElementById('avail-from').value;
    const to = document.getElementById('avail-to').value;
    const resultDiv = document.getElementById('avail-result');

    if (!from || !to) { showToast('Please select date range', 'warning'); return; }
    resultDiv.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const res = await propertiesApi.getAvailability(prop.id, from, to);
        const data = res.data;

        if (!data || !data.roomTypes || data.roomTypes.length === 0) {
            resultDiv.innerHTML = '<div class="empty-state"><p>No room types found. Create room types and rooms first.</p></div>';
            return;
        }

        // Generate date columns
        const startDate = new Date(from);
        const endDate = new Date(to);
        const dates = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }

        let html = '';
        data.roomTypes.forEach(rt => {
            html += `<h4 style="font-weight:600; color:var(--text-primary); margin:var(--space-4) 0 var(--space-2);">${rt.roomTypeName}</h4>`;

            if (!rt.rooms || rt.rooms.length === 0) {
                html += '<p style="color:var(--text-muted); font-size:var(--font-sm); margin-bottom:var(--space-3);">No rooms for this type.</p>';
                return;
            }

            // Date headers
            html += '<div style="overflow-x:auto;">';
            html += '<div class="avail-room-row">';
            html += '<div class="avail-room-label"></div>';
            dates.forEach(d => {
                const day = d.getDate();
                const month = d.toLocaleString('en', { month: 'short' });
                html += `<div class="avail-cell header">${day}<br>${month}</div>`;
            });
            html += '</div>';

            rt.rooms.forEach(room => {
                const occupiedMap = {};
                (room.occupiedDates || []).forEach(od => {
                    occupiedMap[od.date] = od;
                });

                html += '<div class="avail-room-row">';
                html += `<div class="avail-room-label">${room.roomNumber}</div>`;
                dates.forEach(d => {
                    const dateStr = d.toISOString().split('T')[0];
                    const occ = occupiedMap[dateStr];
                    if (occ) {
                        const cls = occ.status === 'MAINTENANCE' ? 'maintenance' : 'occupied';
                        html += `<div class="avail-cell ${cls}" title="${occ.reason || occ.bookingStatus || occ.status}">${occ.status === 'MAINTENANCE' ? 'M' : 'B'}</div>`;
                    } else {
                        html += `<div class="avail-cell available">✓</div>`;
                    }
                });
                html += '</div>';
            });
            html += '</div>';
        });

        resultDiv.innerHTML = html;
    } catch (err) {
        resultDiv.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
}
