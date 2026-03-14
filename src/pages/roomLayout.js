// ===== ROOM LAYOUT VISUALIZATION =====
import { renderLayout } from '../layout.js';
import { roomsApi, roomTypesApi, blocksApi, bookingsApi } from '../api.js';
import { store, showToast, initIcons, statusBadge, formatDate } from '../utils.js';

let rooms = [], roomTypes = [], blocks = [], bookings = [];
let selectedBlock = null;
let selectedFloor = null;

export async function renderRoomLayout() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'room-layout');

    try {
        const [rRes, rtRes, bRes] = await Promise.all([
            roomsApi.getByProperty(prop.id),
            roomTypesApi.getByProperty(prop.id),
            blocksApi.getByProperty(prop.id).catch(() => ({ data: [] })),
        ]);
        rooms = Array.isArray(rRes.data) ? rRes.data : [];
        roomTypes = Array.isArray(rtRes.data) ? rtRes.data : [];
        blocks = Array.isArray(bRes.data) ? bRes.data : [];

        try {
            const bkRes = await bookingsApi.getByProperty(prop.id);
            bookings = Array.isArray(bkRes.data) ? bkRes.data : [];
        } catch (e) { bookings = []; }
    } catch (err) {
        showToast('Error loading layout: ' + err.message, 'error');
    }

    selectedBlock = null;
    selectedFloor = null;
    try {
        renderLayoutPage();
    } catch (err) {
        const pc = document.getElementById('page-content');
        if (pc) pc.innerHTML = `<div class="empty-state"><p style="color:var(--danger);">Failed to render layout: ${err.message}</p></div>`;
    }
}

// Build room → active booking map
function getRoomBookingMap() {
    const map = {};
    bookings.forEach(b => {
        if (!['CHECKED_IN', 'CONFIRMED'].includes(b.status)) return;
        (b.items || []).forEach(item => {
            if (!map[item.roomId]) map[item.roomId] = { booking: b, item };
        });
    });
    return map;
}

function renderLayoutPage() {
    const prop = store.getState().currentProperty;
    const roomBookingMap = getRoomBookingMap();

    // Group rooms by block, then floor
    const noBlock = rooms.filter(r => !r.blockId);
    const blockRooms = {};
    blocks.forEach(b => { blockRooms[b.id] = rooms.filter(r => r.blockId === b.id); });

    const allBlockSections = [
        ...blocks.map(b => ({ block: b, rooms: blockRooms[b.id] || [] })),
        ...(noBlock.length > 0 ? [{ block: { id: null, name: 'Unassigned', blockType: 'OTHER' }, rooms: noBlock }] : []),
    ];

    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Room Layout</h1>
        <p>Visual 2D layout of rooms in ${prop.name}</p>
      </div>
      <div style="display:flex; gap:var(--space-3);">
        ${selectedBlock || selectedFloor ? `<button class="btn btn-secondary" id="btn-layout-back"><i data-lucide="arrow-left"></i> Back</button>` : ''}
        <a href="#/rooms" class="btn btn-secondary btn-sm"><i data-lucide="settings"></i> Manage Rooms</a>
      </div>
    </div>

    <!-- Legend -->
    <div style="display:flex; gap:var(--space-4); flex-wrap:wrap; margin-bottom:var(--space-6);">
      ${[
        { cls: 'layout-room-vacant', label: 'Available' },
        { cls: 'layout-room-occupied', label: 'Occupied' },
        { cls: 'layout-room-dueout', label: 'Due Out' },
        { cls: 'layout-room-arrived', label: 'Arrived' },
        { cls: 'layout-room-maintenance', label: 'Maintenance' },
        { cls: 'layout-room-blocked', label: 'Blocked' },
      ].map(l => `
        <div style="display:flex; align-items:center; gap:var(--space-2);">
          <div class="layout-room-cell ${l.cls}" style="width:28px; height:28px; font-size:10px; pointer-events:none;"></div>
          <span style="font-size:var(--font-sm); color:var(--text-secondary);">${l.label}</span>
        </div>`).join('')}
    </div>

    <div id="layout-main">
      ${selectedBlock !== null ? renderFloorView(selectedBlock, roomBookingMap) : renderBlocksView(allBlockSections, roomBookingMap)}
    </div>

    <!-- Room Detail Panel -->
    <div id="room-detail-panel"></div>
    `;

    initIcons();
    bindLayoutEvents(allBlockSections, roomBookingMap);
}

function renderBlocksView(allBlockSections, roomBookingMap) {
    if (allBlockSections.length === 0) {
        return `<div class="empty-state"><i data-lucide="boxes"></i><h3>No blocks configured</h3>
          <p><a href="#/blocks">Add blocks</a> to organize your rooms.</p></div>`;
    }

    return `
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:var(--space-6);">
      ${allBlockSections.map(({ block, rooms: bRooms }) => {
        const floors = [...new Set(bRooms.map(r => r.floorNumber ?? 0))].sort((a, b) => b - a);
        const occupied = bRooms.filter(r => r.status === 'OCCUPIED').length;
        const vacant = bRooms.filter(r => r.status === 'AVAILABLE').length;
        const typeLabel = block.blockType ? block.blockType.replace(/_/g, ' ') : '';

        return `
        <div class="layout-block-card" data-block-id="${block.id ?? 'null'}" style="cursor:pointer;">
          <div class="layout-block-header">
            <div>
              <div style="font-size:var(--font-lg); font-weight:700; color:var(--text-primary);">${block.name}</div>
              <div style="font-size:var(--font-xs); color:var(--text-muted);">${typeLabel}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:var(--font-xl); font-weight:700; color:var(--accent-primary);">${bRooms.length}</div>
              <div style="font-size:var(--font-xs); color:var(--text-muted);">rooms</div>
            </div>
          </div>

          <!-- Floors preview -->
          <div class="layout-block-body">
            ${floors.length > 0 ? floors.map(floor => {
                const floorRooms = bRooms.filter(r => (r.floorNumber ?? 0) === floor);
                return `
                <div class="layout-floor-preview">
                  <div style="font-size:var(--font-xs); color:var(--text-secondary); margin-bottom:var(--space-1); font-weight:600;">
                    ${floor === 0 ? 'Ground Floor' : `Floor ${floor}`}
                  </div>
                  <div style="display:flex; flex-wrap:wrap; gap:4px;">
                    ${floorRooms.map(r => {
                        const entry = roomBookingMap[r.id];
                        const cls = getRoomCellClass(r, entry);
                        return `<div class="layout-room-cell ${cls}" title="${r.roomNumber}">${r.roomNumber}</div>`;
                    }).join('')}
                  </div>
                </div>`;
            }).join('') : `<div style="color:var(--text-muted); font-size:var(--font-sm);">No floors/rooms assigned</div>`}
          </div>

          <div style="padding: var(--space-3) var(--space-4); border-top: 1px solid var(--border-color); display:flex; gap:var(--space-4);">
            <span style="font-size:var(--font-xs); color:var(--success);">● ${vacant} vacant</span>
            <span style="font-size:var(--font-xs); color:var(--danger);">● ${occupied} occupied</span>
            <span style="font-size:var(--font-xs); color:var(--text-muted);">Click to expand →</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function renderFloorView(blockId, roomBookingMap) {
    const blockData = blockId === 'null'
        ? { block: { id: null, name: 'Unassigned', blockType: 'OTHER' }, rooms: rooms.filter(r => !r.blockId) }
        : (() => {
            const block = blocks.find(b => b.id == blockId);
            return { block, rooms: rooms.filter(r => r.blockId == blockId) };
          })();

    const { block, rooms: bRooms } = blockData;
    const floors = [...new Set(bRooms.map(r => r.floorNumber ?? 0))].sort((a, b) => b - a);

    return `
    <div>
      <div style="margin-bottom:var(--space-4);">
        <h2 style="font-size:var(--font-xl); font-weight:700; color:var(--text-primary);">${block?.name || 'Block'}</h2>
        <p style="color:var(--text-muted); font-size:var(--font-sm);">${block?.blockType?.replace(/_/g, ' ') || ''} · ${bRooms.length} rooms · ${floors.length} floor(s)</p>
      </div>

      ${selectedFloor !== null ? renderSingleFloor(bRooms, selectedFloor, roomBookingMap) : renderAllFloors(bRooms, floors, roomBookingMap)}
    </div>`;
}

function renderAllFloors(bRooms, floors, roomBookingMap) {
    if (floors.length === 0) {
        return `<div class="empty-state"><i data-lucide="layers"></i><h3>No rooms in this block</h3></div>`;
    }

    return `
    <div style="display:flex; flex-direction:column; gap:var(--space-4);">
      ${floors.map(floor => {
        const floorRooms = bRooms.filter(r => (r.floorNumber ?? 0) === floor);
        const floorLabel = floor === 0 ? 'Ground Floor' : `Floor ${floor}`;
        return `
        <div class="layout-floor-section" data-floor="${floor}">
          <div class="layout-floor-header">
            <div>
              <span style="font-weight:700; color:var(--text-primary);">${floorLabel}</span>
              <span style="margin-left:var(--space-3); font-size:var(--font-xs); color:var(--text-muted);">${floorRooms.length} rooms</span>
            </div>
            <button class="btn btn-ghost btn-sm btn-expand-floor" data-floor="${floor}" style="font-size:var(--font-xs);">
              <i data-lucide="maximize-2"></i> Expand
            </button>
          </div>
          <div class="layout-floor-rooms">
            ${floorRooms.map(r => renderRoomCell(r, roomBookingMap)).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function renderSingleFloor(bRooms, floor, roomBookingMap) {
    const floorRooms = bRooms.filter(r => (r.floorNumber ?? 0) === floor);
    const floorLabel = floor === 0 ? 'Ground Floor' : `Floor ${floor}`;

    return `
    <div>
      <div style="display:flex; align-items:center; gap:var(--space-3); margin-bottom:var(--space-4);">
        <button class="btn btn-secondary btn-sm" id="btn-back-to-floors"><i data-lucide="arrow-left"></i> All Floors</button>
        <h3 style="font-size:var(--font-lg); font-weight:600; color:var(--text-primary);">${floorLabel} — ${floorRooms.length} rooms</h3>
      </div>
      <div class="layout-floor-rooms layout-floor-rooms-lg">
        ${floorRooms.map(r => renderRoomCell(r, roomBookingMap, true)).join('')}
      </div>
    </div>`;
}

function renderRoomCell(room, roomBookingMap, large = false) {
    const entry = roomBookingMap[room.id];
    const cls = getRoomCellClass(room, entry);
    const rtName = roomTypes.find(rt => rt.id === room.roomTypeId)?.name || '';
    const todayStr = new Date().toISOString().split('T')[0];
    const booking = entry?.booking;
    const item = entry?.item;

    const tooltip = [
        `Room ${room.roomNumber}`,
        rtName,
        booking ? `Booking #${booking.id}` : '',
        item?.checkinDate ? `${item.checkinDate} → ${item.checkoutDate}` : '',
        item?.numAdults ? `${item.numAdults} adult(s)` : '',
    ].filter(Boolean).join(' | ');

    if (large) {
        return `
        <div class="layout-room-cell-lg ${cls}" data-room-id="${room.id}" title="${tooltip}">
          <div class="layout-room-number">${room.roomNumber}</div>
          <div class="layout-room-type">${rtName}</div>
          ${booking ? `<div class="layout-room-booking">Bk#${booking.id}</div>` : ''}
          ${item?.checkinDate ? `<div class="layout-room-dates">${new Date(item.checkinDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})} → ${new Date(item.checkoutDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>` : ''}
        </div>`;
    }

    return `<div class="layout-room-cell ${cls}" data-room-id="${room.id}" title="${tooltip}">${room.roomNumber}</div>`;
}

function getRoomCellClass(room, entry) {
    if (room.status === 'MAINTENANCE') return 'layout-room-maintenance';
    if (room.status === 'OUT_OF_SERVICE') return 'layout-room-blocked';
    if (!entry) return 'layout-room-vacant';

    const todayStr = new Date().toISOString().split('T')[0];
    const item = entry.item;
    if (item?.checkoutDate === todayStr) return 'layout-room-dueout';
    if (item?.checkinDate === todayStr) return 'layout-room-arrived';
    return 'layout-room-occupied';
}

function bindLayoutEvents(allBlockSections, roomBookingMap) {
    // Block click → expand
    document.querySelectorAll('.layout-block-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedBlock = card.dataset.blockId;
            selectedFloor = null;
            renderLayoutPage();
        });
    });

    // Back button
    document.getElementById('btn-layout-back')?.addEventListener('click', () => {
        if (selectedFloor !== null) {
            selectedFloor = null;
        } else {
            selectedBlock = null;
        }
        renderLayoutPage();
    });

    // Expand floor
    document.querySelectorAll('.btn-expand-floor').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedFloor = parseInt(btn.dataset.floor);
            renderLayoutPage();
        });
    });

    // Back to all floors
    document.getElementById('btn-back-to-floors')?.addEventListener('click', () => {
        selectedFloor = null;
        renderLayoutPage();
    });

    // Room cell click → show detail
    document.querySelectorAll('[data-room-id]').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            showRoomDetail(parseInt(cell.dataset.roomId), roomBookingMap);
        });
    });
}

function showRoomDetail(roomId, roomBookingMap) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const rtName = roomTypes.find(rt => rt.id === room.roomTypeId)?.name || '—';
    const block = blocks.find(b => b.id === room.blockId);
    const entry = roomBookingMap[roomId];
    const { booking, item } = entry || {};

    const panel = document.getElementById('room-detail-panel');
    panel.innerHTML = `
    <div class="card" style="margin-top: var(--space-6); border: 2px solid var(--accent-primary);">
      <div class="card-header" style="justify-content:space-between;">
        <h3 class="card-title">Room ${room.roomNumber}</h3>
        <button class="btn btn-ghost btn-sm" id="btn-close-detail"><i data-lucide="x"></i></button>
      </div>
      <div class="detail-grid">
        <div class="detail-item"><label>Room Number</label><p>${room.roomNumber}</p></div>
        <div class="detail-item"><label>Floor</label><p>${room.floorNumber ?? '—'}</p></div>
        <div class="detail-item"><label>Type</label><p>${rtName}</p></div>
        <div class="detail-item"><label>Block</label><p>${block?.name || '—'}</p></div>
        <div class="detail-item"><label>Status</label><p>${statusBadge(room.status)}</p></div>
        ${booking ? `
        <div class="detail-item"><label>Booking #</label><p>${booking.id}</p></div>
        <div class="detail-item"><label>Booking Status</label><p>${statusBadge(booking.status)}</p></div>
        <div class="detail-item"><label>Check-in</label><p>${formatDate(item?.checkinDate)}</p></div>
        <div class="detail-item"><label>Check-out</label><p>${formatDate(item?.checkoutDate)}</p></div>
        <div class="detail-item"><label>Guests</label><p>${item?.numAdults || 0} adult(s), ${item?.numChildren || 0} child(ren)</p></div>
        ` : ''}
      </div>
      <div style="display:flex; gap:var(--space-3); margin-top:var(--space-4);">
        <a href="#/maintenance?roomId=${room.id}" class="btn btn-secondary btn-sm"><i data-lucide="wrench"></i> Maintenance</a>
        ${booking ? `<a href="#/bookings" class="btn btn-primary btn-sm" id="btn-view-bk" data-id="${booking.id}"><i data-lucide="eye"></i> View Booking</a>` : ''}
        <a href="#/rooms" class="btn btn-ghost btn-sm"><i data-lucide="pencil"></i> Edit Room</a>
      </div>
    </div>`;

    initIcons();
    panel.scrollIntoView({ behavior: 'smooth' });

    document.getElementById('btn-close-detail')?.addEventListener('click', () => { panel.innerHTML = ''; });
    document.getElementById('btn-view-bk')?.addEventListener('click', () => {
        window.location.hash = '#/bookings';
        setTimeout(() => {
            const inp = document.getElementById('booking-id-input');
            if (inp) { inp.value = booking.id; inp.dispatchEvent(new Event('change')); }
        }, 300);
    });
}
