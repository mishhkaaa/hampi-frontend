// ===== DASHBOARD PAGE =====
import { renderLayout } from '../layout.js';
import { propertiesApi, roomsApi, roomTypesApi, blocksApi, bookingsApi, usersApi } from '../api.js';
import { store, showToast, showModal, initIcons, formatDate, formatCurrency, statusBadge } from '../utils.js';

export async function renderDashboard() {
    renderLayout('<div class="loading-spinner"></div>', 'dashboard');

    const prop = store.getState().currentProperty;
    let properties = [], rooms = [], roomTypes = [], blocks = [], bookings = [], users = [];
    const todayStr = new Date().toISOString().split('T')[0];

    try {
        const [propRes, usersRes] = await Promise.all([
            propertiesApi.getAll(),
            usersApi.getAll().catch(() => ({ data: [] })),
        ]);
        properties = Array.isArray(propRes.data) ? propRes.data : [];
        users = Array.isArray(usersRes.data) ? usersRes.data : [];

        // Validate cached property against fetched list — fix stale IDs from localStorage
        const validProp = properties.find(p => p.id === prop?.id);
        if (!validProp) {
            store.setState({ currentProperty: properties[0] || null });
        }

        const activeProp = store.getState().currentProperty;
        if (activeProp) {
            const [roomsRes, rtRes, blocksRes] = await Promise.all([
                roomsApi.getByProperty(activeProp.id).catch(() => ({ data: [] })),
                roomTypesApi.getByProperty(activeProp.id).catch(() => ({ data: [] })),
                blocksApi.getByProperty(activeProp.id).catch(() => ({ data: [] })),
            ]);
            rooms = Array.isArray(roomsRes.data) ? roomsRes.data : [];
            roomTypes = Array.isArray(rtRes.data) ? rtRes.data : [];
            blocks = Array.isArray(blocksRes.data) ? blocksRes.data : [];

            // Try to load bookings for room card info
            try {
                const bkRes = await bookingsApi.getByProperty(activeProp.id);
                bookings = Array.isArray(bkRes.data) ? bkRes.data : [];
            } catch (e) { bookings = []; }
        }
    } catch (err) {
        showToast('Error loading dashboard: ' + err.message, 'error');
    }

    const activeProp = store.getState().currentProperty;

    // Build room → active booking map
    const roomBookingMap = {};
    bookings.forEach(b => {
        if (!['CHECKED_IN', 'CONFIRMED'].includes(b.status)) return;
        (b.items || []).forEach(item => {
            if (!roomBookingMap[item.roomId]) {
                roomBookingMap[item.roomId] = { booking: b, item };
            }
        });
    });

    // Compute stats
    const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
    const vacantRooms = rooms.filter(r => r.status === 'AVAILABLE').length;
    const blockedRooms = rooms.filter(r => ['MAINTENANCE', 'OUT_OF_SERVICE'].includes(r.status)).length;

    const expectedArrival = bookings.filter(b =>
        b.status === 'CONFIRMED' && (b.items || []).some(i => i.checkinDate === todayStr)
    ).length;
    const expectedDeparture = bookings.filter(b =>
        b.status === 'CHECKED_IN' && (b.items || []).some(i => i.checkoutDate === todayStr)
    ).length;
    const checkedInToday = bookings.filter(b =>
        b.status === 'CHECKED_IN' && (b.items || []).some(i => i.checkinDate === todayStr)
    ).length;
    const checkedOutToday = bookings.filter(b =>
        b.status === 'CHECKED_OUT' && (b.items || []).some(i => i.checkoutDate === todayStr)
    ).length;

    // Today's arrivals
    const todayArrivals = bookings.filter(b =>
        ['CONFIRMED', 'CHECKED_IN'].includes(b.status) && (b.items || []).some(i => i.checkinDate === todayStr)
    );

    const content = `
    <div class="page-header" style="margin-bottom: var(--space-4);">
      <div class="page-header-left">
        <h1>Dashboard</h1>
        <p>${activeProp ? activeProp.name : 'Select a property to begin'}</p>
      </div>
      <div style="display:flex; gap:var(--space-3); align-items:center;">
        ${properties.length > 1 ? `
          <select class="form-select" id="dash-prop-switch" style="width: auto;">
            ${properties.map(p => `<option value="${p.id}" ${p.id === activeProp?.id ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
        ` : ''}
        ${activeProp ? `
          <button class="btn btn-secondary btn-sm" id="btn-show-qr" title="Guest QR Check-in">
            <i data-lucide="qr-code"></i> QR Check-in
          </button>
        ` : ''}
      </div>
    </div>

    <!-- 6 Stat Cards -->
    <div class="stats-grid-6">
      <div class="stat-card-v2 stat-occupied">
        <div class="stat-v2-icon"><i data-lucide="bed-double"></i></div>
        <div class="stat-v2-info">
          <h3>${occupiedRooms}</h3>
          <p>Occupied Rooms</p>
        </div>
      </div>
      <div class="stat-card-v2 stat-vacant">
        <div class="stat-v2-icon"><i data-lucide="door-open"></i></div>
        <div class="stat-v2-info">
          <h3>${vacantRooms}</h3>
          <p>Vacant Rooms</p>
        </div>
      </div>
      <div class="stat-card-v2 stat-arrival">
        <div class="stat-v2-icon"><i data-lucide="plane-landing"></i></div>
        <div class="stat-v2-info">
          <h3>${expectedArrival}</h3>
          <p>Expected Arrival</p>
        </div>
      </div>
      <div class="stat-card-v2 stat-departure">
        <div class="stat-v2-icon"><i data-lucide="plane-takeoff"></i></div>
        <div class="stat-v2-info">
          <h3>${expectedDeparture}</h3>
          <p>Expected Departure</p>
        </div>
      </div>
      <div class="stat-card-v2 stat-checkedin">
        <div class="stat-v2-icon"><i data-lucide="log-in"></i></div>
        <div class="stat-v2-info">
          <h3>${checkedInToday}</h3>
          <p>Checked In</p>
        </div>
      </div>
      <div class="stat-card-v2 stat-checkedout">
        <div class="stat-v2-icon"><i data-lucide="log-out"></i></div>
        <div class="stat-v2-info">
          <h3>${checkedOutToday}</h3>
          <p>Checked Out</p>
        </div>
      </div>
    </div>

    <!-- Room Grid Section -->
    ${rooms.length > 0 ? `
    <div class="card" style="margin-top: var(--space-6);">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-4); flex-wrap:wrap; gap:var(--space-3);">
        <!-- Room status filters -->
        <div style="display:flex; gap:var(--space-2); flex-wrap:wrap; align-items:center;">
          <div class="filter-chips" id="room-filter-chips">
            <button class="filter-chip active" data-filter="all">All <span class="chip-count">${rooms.length}</span></button>
            <button class="filter-chip" data-filter="OCCUPIED">Occupied <span class="chip-count">${occupiedRooms}</span></button>
            <button class="filter-chip" data-filter="AVAILABLE">Vacant <span class="chip-count">${vacantRooms}</span></button>
            <button class="filter-chip" data-filter="blocked">Blocked <span class="chip-count">${blockedRooms}</span></button>
          </div>
          ${bookings.length > 0 ? `
          <div class="filter-chips" id="booking-filter-chips" style="margin-left:var(--space-3);">
            <button class="filter-chip filter-chip-booking active" data-bfilter="all">All</button>
            <button class="filter-chip filter-chip-booking" data-bfilter="arrived">Arrived</button>
            <button class="filter-chip filter-chip-booking" data-bfilter="stayover">Stay Over</button>
            <button class="filter-chip filter-chip-booking" data-bfilter="dueout">Due Out</button>
          </div>` : ''}
        </div>
        <!-- Search -->
        <div style="display:flex; gap:var(--space-2); align-items:center;">
          <input type="text" class="form-input" id="room-search" placeholder="Search room…" style="width:160px; height:36px;" />
          <button class="btn btn-ghost btn-sm" id="btn-refresh-dash" title="Refresh"><i data-lucide="refresh-cw"></i></button>
        </div>
      </div>

      <!-- Room Cards Grid -->
      <div class="room-cards-grid" id="room-cards-grid">
        ${rooms.map(room => renderRoomCard(room, roomTypes, roomBookingMap, todayStr)).join('')}
      </div>
    </div>
    ` : `<div class="empty-state" style="margin-top:var(--space-6);">
      <i data-lucide="door-open"></i>
      <h3>No rooms configured</h3>
      <p><a href="#/rooms">Add rooms</a> to see the room dashboard.</p>
    </div>`}

    <!-- Overview + Chart Row -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-top: var(--space-6);">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Overview</h3>
          <span style="font-size:var(--font-xs); color:var(--text-muted);">${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'})}</span>
        </div>
        <div style="display:flex; gap:var(--space-6);">
          <div style="flex:1;">
            ${[
              { label: 'In-house Guests', value: bookings.filter(b => b.status === 'CHECKED_IN').reduce((s,b) => s + (b.items||[]).reduce((a,i) => a + (i.numAdults||0), 0), 0), color: 'var(--info)' },
              { label: 'Active Bookings', value: bookings.filter(b => ['CONFIRMED','CHECKED_IN'].includes(b.status)).length, color: 'var(--success)' },
              { label: 'Total Rooms', value: rooms.length, color: 'var(--accent-primary)' },
              { label: 'Staff Members', value: users.length, color: 'var(--warning)' },
            ].map(s => `
              <div style="display:flex; align-items:center; gap:var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--border-color);">
                <div style="width:10px; height:10px; border-radius:50%; background:${s.color}; flex-shrink:0;"></div>
                <div style="flex:1;">
                  <div style="font-size:var(--font-2xl); font-weight:700; color:${s.color};">${s.value}</div>
                  <div style="font-size:var(--font-xs); color:var(--text-muted);">${s.label}</div>
                </div>
              </div>`).join('')}
          </div>
          <div style="display:flex; align-items:center; justify-content:center; flex:0 0 120px;">
            ${renderDonutChart(occupiedRooms, vacantRooms, blockedRooms, rooms.length)}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Room Types</h3>
        </div>
        ${roomTypes.length > 0 ? `
          <div class="table-wrapper" style="border:none;">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Rooms</th><th>Base Occ.</th><th>Max Occ.</th></tr></thead>
              <tbody>
                ${roomTypes.map(rt => {
                    const rtRooms = rooms.filter(r => r.roomTypeId === rt.id);
                    return `<tr>
                      <td style="color:var(--text-primary); font-weight:500;">${rt.name}</td>
                      <td><span class="badge badge-neutral">${rtRooms.length}</span></td>
                      <td>${rt.baseOccupancy || '—'}</td>
                      <td>${rt.maxOccupancy || '—'}</td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div class="empty-state" style="padding:var(--space-6) 0;"><p>No room types configured.</p></div>'}
      </div>
    </div>

    <!-- Today's Arrivals -->
    <div class="card" style="margin-top: var(--space-6);">
      <div class="card-header">
        <h3 class="card-title">Today's Arrivals</h3>
        <span class="badge badge-info">${todayArrivals.length}</span>
      </div>
      ${todayArrivals.length > 0 ? `
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Booking #</th>
                <th>Room(s)</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Adults</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${todayArrivals.map(b => {
                  const items = b.items || [];
                  const roomNums = items.map(i => rooms.find(r => r.id === i.roomId)?.roomNumber || `#${i.roomId}`).join(', ');
                  const adults = items.reduce((s, i) => s + (i.numAdults || 0), 0);
                  const checkin = items[0]?.checkinDate;
                  const checkout = items[items.length - 1]?.checkoutDate;
                  return `<tr>
                    <td style="font-weight:700; color:var(--text-primary);">#${b.id}</td>
                    <td>${roomNums || '—'}</td>
                    <td>${formatDate(checkin)}</td>
                    <td>${formatDate(checkout)}</td>
                    <td>${adults || '—'}</td>
                    <td>${statusBadge(b.status)}</td>
                    <td>
                      ${b.status === 'CONFIRMED' ? `<button class="btn btn-success btn-sm dash-checkin" data-id="${b.id}"><i data-lucide="log-in"></i> Check In</button>` : statusBadge(b.status)}
                    </td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : `<div class="empty-state" style="padding: var(--space-8) 0;">
        <i data-lucide="calendar-x"></i>
        <p>No arrivals scheduled for today.</p>
      </div>`}
    </div>
  `;

    try {
        document.getElementById('page-content').innerHTML = content;
    } catch (err) {
        document.getElementById('page-content').innerHTML = `<div class="empty-state"><p style="color:var(--danger);">Failed to render dashboard: ${err.message}</p></div>`;
        return;
    }
    initIcons();

    // Property switcher
    document.getElementById('dash-prop-switch')?.addEventListener('change', (e) => {
        const selectedProp = properties.find(p => p.id == e.target.value);
        if (selectedProp) { store.setState({ currentProperty: selectedProp }); renderDashboard(); }
    });

    // Refresh
    document.getElementById('btn-refresh-dash')?.addEventListener('click', () => renderDashboard());

    // QR Check-in modal
    document.getElementById('btn-show-qr')?.addEventListener('click', () => {
        const checkinUrl = `${window.location.origin}${window.location.pathname}#/checkin`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkinUrl)}`;
        showModal(`
          <div class="modal-header">
            <h2>Guest QR Check-in</h2>
            <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body" style="text-align:center;">
            <p style="color:var(--text-secondary); margin-bottom:var(--space-4);">
              Display this QR code at reception. Guests scan it to pre-register their details before check-in.
            </p>
            <div style="background:#fff; display:inline-block; padding:16px; border-radius:var(--radius-lg); border:2px solid var(--border-color); margin-bottom:var(--space-4);">
              <img src="${qrUrl}" alt="Check-in QR Code" width="220" height="220" />
            </div>
            <div style="margin-bottom:var(--space-4);">
              <div style="font-size:var(--font-xs); color:var(--text-muted); margin-bottom:var(--space-2);">Check-in link:</div>
              <div style="background:var(--bg-primary); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:var(--space-2) var(--space-3); font-family:monospace; font-size:var(--font-xs); word-break:break-all; color:var(--accent-primary);">
                ${checkinUrl}
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-copy-checkin-link">
              <i data-lucide="copy"></i> Copy Link
            </button>
          </div>
        `);
        initIcons();
        document.getElementById('btn-copy-checkin-link')?.addEventListener('click', () => {
            navigator.clipboard.writeText(checkinUrl).then(() => showToast('Link copied!', 'success'));
        });
    });

    // Room filter chips
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filterRoomCards(chip.dataset.filter, getCurrentBookingFilter());
        });
    });

    // Booking filter chips
    document.querySelectorAll('.filter-chip-booking[data-bfilter]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip-booking[data-bfilter]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filterRoomCards(getCurrentRoomFilter(), chip.dataset.bfilter);
        });
    });

    // Room search
    document.getElementById('room-search')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('.room-card').forEach(card => {
            const num = (card.dataset.roomNumber || '').toLowerCase();
            card.style.display = (q === '' || num.includes(q)) ? '' : 'none';
        });
    });

    // Room card view buttons
    document.querySelectorAll('.btn-view-booking').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.hash = '#/bookings';
            setTimeout(() => {
                const inp = document.getElementById('booking-id-input');
                if (inp) { inp.value = btn.dataset.bookingId; inp.dispatchEvent(new Event('change')); }
            }, 300);
        });
    });

    // Today's arrival check-in buttons
    document.querySelectorAll('.dash-checkin').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await bookingsApi.checkIn(btn.dataset.id);
                showToast('Checked in!', 'success');
                renderDashboard();
            } catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    });
}

function getCurrentRoomFilter() {
    return document.querySelector('.filter-chip[data-filter].active')?.dataset.filter || 'all';
}

function getCurrentBookingFilter() {
    return document.querySelector('.filter-chip-booking[data-bfilter].active')?.dataset.bfilter || 'all';
}

function filterRoomCards(roomFilter, bookingFilter) {
    document.querySelectorAll('.room-card').forEach(card => {
        const status = card.dataset.status || '';
        const bstatus = card.dataset.bookingStatus || '';

        let roomMatch = true;
        if (roomFilter === 'OCCUPIED') roomMatch = status === 'OCCUPIED';
        else if (roomFilter === 'AVAILABLE') roomMatch = status === 'AVAILABLE';
        else if (roomFilter === 'blocked') roomMatch = ['MAINTENANCE', 'OUT_OF_SERVICE'].includes(status);

        let bookingMatch = true;
        if (bookingFilter === 'arrived') bookingMatch = bstatus === 'arrived';
        else if (bookingFilter === 'stayover') bookingMatch = bstatus === 'stayover';
        else if (bookingFilter === 'dueout') bookingMatch = bstatus === 'dueout';

        card.style.display = (roomMatch && (bookingFilter === 'all' || bookingMatch)) ? '' : 'none';
    });
}

function getRoomCardStatus(room, entry, todayStr) {
    if (!entry) {
        if (room.status === 'MAINTENANCE') return 'maintenance';
        if (room.status === 'OUT_OF_SERVICE') return 'blocked';
        return 'vacant';
    }
    const { booking, item } = entry;
    if (item.checkoutDate === todayStr) return 'dueout';
    if (item.checkinDate === todayStr) return 'arrived';
    return 'occupied';
}

function renderRoomCard(room, roomTypes, roomBookingMap, todayStr) {
    const entry = roomBookingMap[room.id];
    const cardStatus = getRoomCardStatus(room, entry, todayStr);
    const rtName = roomTypes.find(rt => rt.id === room.roomTypeId)?.name || '—';
    const booking = entry?.booking;
    const item = entry?.item;

    let nights = '';
    if (item?.checkinDate && item?.checkoutDate) {
        const n = Math.max(1, Math.round((new Date(item.checkoutDate) - new Date(item.checkinDate)) / 86400000));
        const ci = new Date(item.checkinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const co = new Date(item.checkoutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        nights = `${ci} - ${co}`;
    }

    const statusLabels = {
        dueout: '<span class="room-status-badge badge-dueout">Due Out</span>',
        arrived: '<span class="room-status-badge badge-arrived">Arrived</span>',
        occupied: '<span class="room-status-badge badge-occupied">Stay Over</span>',
        vacant: '<span class="room-status-badge badge-vacant">Cleaned</span>',
        maintenance: '<span class="room-status-badge badge-maintenance">Maintenance</span>',
        blocked: '<span class="room-status-badge badge-blocked">Blocked</span>',
    };

    // Watermark icon based on status
    const watermark = cardStatus === 'vacant' || cardStatus === 'maintenance' || cardStatus === 'blocked'
        ? `<div class="room-card-watermark"><i data-lucide="bed-double"></i></div>`
        : `<div class="room-card-watermark"><i data-lucide="user"></i></div>`;

    return `
    <div class="room-card room-card-${cardStatus}" data-room-id="${room.id}" data-room-number="${room.roomNumber}" data-status="${room.status}" data-booking-status="${cardStatus}">
      ${watermark}
      <div class="room-card-inner">
        <div class="room-card-top">
          <div>
            <div class="room-card-number">${room.roomNumber}</div>
            <div class="room-card-type">${rtName}</div>
          </div>
          <div class="room-card-menu-area">
            ${booking ? `<span style="font-size:var(--font-xs); color:var(--text-muted);">#${booking.id}</span>` : ''}
          </div>
        </div>

        ${booking ? `
        <div class="room-card-guest">
          <div style="font-size:var(--font-sm); color:var(--text-primary); font-weight:600; margin-bottom:2px; display:flex; align-items:center; gap:4px;">
            <i data-lucide="user" style="width:13px; height:13px; flex-shrink:0;"></i>
            ${(() => {
                const primary = (booking.guests || []).find(g => g.isPrimary) || (booking.guests || [])[0];
                if (primary?.name) return `<span title="${primary.name}">${primary.name.split(' ')[0]}</span>${(item?.numAdults || 1) > 1 ? `<span style="color:var(--text-muted); font-weight:400;"> +${(item.numAdults) - 1}</span>` : ''}`;
                return `${item?.numAdults || 1} Guest${(item?.numAdults || 1) > 1 ? 's' : ''}`;
            })()}
          </div>
          <div style="font-size:var(--font-xs); color:var(--text-secondary);">${nights}</div>
        </div>` : `
        <div class="room-card-guest" style="opacity:0.4;">
          <div style="font-size:var(--font-sm); color:var(--text-muted);">No active booking</div>
        </div>`}

        <div class="room-card-footer">
          <div>${statusLabels[cardStatus] || statusBadge(room.status)}</div>
          <div class="room-card-actions">
            ${booking ? `<button class="btn btn-ghost btn-sm btn-view-booking" data-booking-id="${booking.id}" title="View Booking" style="padding:4px;"><i data-lucide="eye"></i></button>` : ''}
            <a href="#/maintenance?roomId=${room.id}" class="btn btn-ghost btn-sm" title="Maintenance" style="padding:4px;"><i data-lucide="wrench"></i></a>
          </div>
        </div>
      </div>
    </div>`;
}

function renderDonutChart(occupied, vacant, blocked, total) {
    if (total === 0) return `<div style="width:100px; height:100px; border-radius:50%; background:var(--bg-input);"></div>`;

    const segments = [
        { value: occupied, color: '#ef4444' },
        { value: vacant, color: '#10b981' },
        { value: blocked, color: '#64748b' },
        { value: Math.max(0, total - occupied - vacant - blocked), color: '#3b82f6' },
    ];

    let offset = 0;
    const r = 40, cx = 50, cy = 50;
    const circumference = 2 * Math.PI * r;
    const paths = segments.filter(s => s.value > 0).map(s => {
        const pct = s.value / total;
        const dash = pct * circumference;
        const path = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="12"
            stroke-dasharray="${dash} ${circumference - dash}"
            stroke-dashoffset="${-offset * circumference}"
            transform="rotate(-90 ${cx} ${cy})" />`;
        offset += pct;
        return path;
    });

    return `
    <svg viewBox="0 0 100 100" width="110" height="110">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-input)" stroke-width="12"/>
      ${paths.join('')}
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="var(--text-primary)" font-size="14" font-weight="700">${total}</text>
    </svg>`;
}
