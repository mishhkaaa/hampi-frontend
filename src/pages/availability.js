// ===== AVAILABILITY / CALENDAR PAGE =====
import { renderLayout } from '../layout.js';
import { propertiesApi, blocksApi, roomsApi, bookingsApi } from '../api.js';
import { showToast, initIcons, store, today, daysFromNow, formatDate } from '../utils.js';

export async function renderAvailability() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'availability');

    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Availability Calendar</h1>
        <p>View room availability by block for ${prop.name}</p>
      </div>
    </div>
    <div class="card">
      <div style="display:flex; gap:var(--space-3); align-items:flex-end; margin-bottom:var(--space-5); flex-wrap:wrap;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">From</label>
          <input type="date" class="form-input" id="avail-from" value="${today()}" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">To</label>
          <input type="date" class="form-input" id="avail-to" value="${daysFromNow(14)}" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Group by</label>
          <select class="form-select" id="avail-groupby">
            <option value="block" selected>Block</option>
            <option value="roomType">Room Type</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btn-check-avail" style="height:42px;">
          <i data-lucide="search"></i> Refresh
        </button>
      </div>

      <!-- Legend -->
      <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-4); flex-wrap:wrap;">
        <div class="avail-legend-item">
          <div class="avail-legend-dot" style="background:rgba(16,185,129,0.2); border:1px solid rgba(16,185,129,0.5);"></div>
          <span>Available</span>
        </div>
        <div class="avail-legend-item">
          <div class="avail-legend-dot" style="background:rgba(239,68,68,0.18); border:1px solid rgba(239,68,68,0.4);"></div>
          <span>Booked</span>
        </div>
        <div class="avail-legend-item">
          <div class="avail-legend-dot" style="background:rgba(14,165,233,0.18); border:1px solid rgba(14,165,233,0.4);"></div>
          <span>Checked In</span>
        </div>
        <div class="avail-legend-item">
          <div class="avail-legend-dot" style="background:rgba(245,158,11,0.18); border:1px solid rgba(245,158,11,0.5);"></div>
          <span>Maintenance</span>
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
    const groupBy = document.getElementById('avail-groupby').value;
    const resultDiv = document.getElementById('avail-result');

    if (!from || !to) { showToast('Please select a date range', 'warning'); return; }
    resultDiv.innerHTML = '<div class="loading-spinner"></div>';

    try {
        // Load availability data and block info in parallel
        const [availRes, blocksRes] = await Promise.all([
            propertiesApi.getAvailability(prop.id, from, to),
            blocksApi.getByProperty(prop.id).catch(() => ({ data: [] })),
        ]);

        const data = availRes.data;
        const blocks = blocksRes.data || [];

        if (!data || !data.roomTypes || data.roomTypes.length === 0) {
            resultDiv.innerHTML = `<div class="empty-state">
              <i data-lucide="calendar-x"></i>
              <h3>No data available</h3>
              <p>Add blocks, room types, and rooms to see availability.</p>
            </div>`;
            return;
        }

        // Build block map for lookup
        const blockMap = {};
        blocks.forEach(b => { blockMap[b.id] = b; });

        // Generate date columns
        const dates = [];
        for (let d = new Date(from); d <= new Date(to); d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }

        let html = '';

        if (groupBy === 'block') {
            // Group rooms by block
            const blockGroups = {};
            data.roomTypes.forEach(rt => {
                (rt.rooms || []).forEach(room => {
                    const bId = room.blockId || rt.blockId || 'unassigned';
                    if (!blockGroups[bId]) blockGroups[bId] = [];
                    blockGroups[bId].push({ ...room, roomTypeName: rt.roomTypeName, roomTypeId: rt.roomTypeId });
                });
            });

            const blockIds = Object.keys(blockGroups);
            if (blockIds.length === 0) {
                // Fallback to room-type grouping
                html = renderByRoomType(data.roomTypes, dates);
            } else {
                blockIds.forEach(bId => {
                    const block = bId === 'unassigned' ? null : blockMap[bId];
                    const blockRooms = blockGroups[bId];
                    const blockName = block ? block.name : (bId === 'unassigned' ? 'No Block' : `Block ${bId}`);
                    html += `
                    <div style="margin-bottom:var(--space-6);">
                      <div class="avail-block-header">
                        <i data-lucide="boxes" style="width:16px; height:16px;"></i>
                        <span>${blockName}</span>
                        <span class="badge badge-info" style="margin-left:8px;">${blockRooms.length} rooms</span>
                      </div>
                      ${renderRoomCalendar(blockRooms, dates)}
                    </div>`;
                });
            }
        } else {
            html = renderByRoomType(data.roomTypes, dates);
        }

        resultDiv.innerHTML = html || '<p style="color:var(--text-muted);">No room data found for the selected period.</p>';
        initIcons();

    } catch (err) {
        resultDiv.innerHTML = `<div class="error-state">
          <i data-lucide="alert-circle"></i>
          <p>Error loading availability: ${err.message}</p>
        </div>`;
    }
}

function renderByRoomType(roomTypes, dates) {
    let html = '';
    roomTypes.forEach(rt => {
        if (!rt.rooms || rt.rooms.length === 0) return;
        html += `
        <div style="margin-bottom:var(--space-6);">
          <div class="avail-block-header">
            <i data-lucide="layers" style="width:16px; height:16px;"></i>
            <span>${rt.roomTypeName}</span>
            <span class="badge badge-neutral" style="margin-left:8px;">${rt.rooms.length} rooms</span>
          </div>
          ${renderRoomCalendar(rt.rooms, dates)}
        </div>`;
    });
    return html;
}

function renderRoomCalendar(rooms, dates) {
    let html = '<div style="overflow-x:auto;">';

    // Date header row
    html += '<div class="avail-room-row">';
    html += '<div class="avail-room-label" style="min-width:90px;"><span style="font-size:var(--font-xs); color:var(--text-muted);">Room</span></div>';
    dates.forEach(d => {
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        html += `<div class="avail-cell header${isWeekend ? ' weekend' : ''}">${d.getDate()}<br><span style="font-size:9px;">${d.toLocaleString('en', { month: 'short' })}</span></div>`;
    });
    html += '</div>';

    // Room rows
    rooms.forEach(room => {
        const occupiedMap = {};
        (room.occupiedDates || []).forEach(od => { occupiedMap[od.date] = od; });

        const blockLabel = room.blockName || '';
        html += '<div class="avail-room-row">';
        html += `<div class="avail-room-label">
          <span style="font-weight:600; color:var(--text-primary);">${room.roomNumber}</span>
          ${room.roomTypeName ? `<span style="font-size:10px; color:var(--text-muted); display:block;">${room.roomTypeName}</span>` : ''}
          ${blockLabel ? `<span style="font-size:10px; color:var(--text-muted); display:block;">${blockLabel}</span>` : ''}
        </div>`;

        dates.forEach(d => {
            const dateStr = d.toISOString().split('T')[0];
            const occ = occupiedMap[dateStr];
            if (occ) {
                const isMaint = occ.status === 'MAINTENANCE';
                const isCheckedIn = occ.bookingStatus === 'CHECKED_IN';
                let cls = isMaint ? 'maintenance' : isCheckedIn ? 'checked-in' : 'occupied';
                // Guest info tooltip
                const guestInfo = occ.guestName ? occ.guestName : (occ.bookingId ? `#${occ.bookingId}` : '');
                const tooltipText = [
                    occ.guestName ? `Guest: ${occ.guestName}` : '',
                    occ.bookingId ? `Booking: #${occ.bookingId}` : '',
                    occ.reason || occ.bookingStatus || occ.status,
                ].filter(Boolean).join(' | ');

                html += `<div class="avail-cell ${cls}" title="${tooltipText}">
                  ${isMaint ? 'M' : (guestInfo ? `<span style="font-size:9px; display:block; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${guestInfo.length > 4 ? guestInfo.slice(0, 4) : guestInfo}</span>` : 'B')}
                </div>`;
            } else {
                html += `<div class="avail-cell available">✓</div>`;
            }
        });
        html += '</div>';
    });

    html += '</div>';
    return html;
}
