// ===== BOOKINGS PAGE =====
import { renderLayout } from '../layout.js';
import { bookingsApi, roomsApi, roomTypesApi, ratePlansApi, rateRulesApi, guestsApi, paymentsApi, bookingItemsApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, formatDate, formatCurrency, initIcons, store, today, daysFromNow, handlePropertyNotFound } from '../utils.js';

let rooms = [], roomTypes = [], ratePlans = [];
// For create-booking multi-room form
let _newItems = [];
let _rulesByPlan = {}; // cached rules per plan id

export async function renderBookings() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'bookings');

    try {
        const [rRes, rtRes, rpRes] = await Promise.all([
            roomsApi.getByProperty(prop.id),
            roomTypesApi.getByProperty(prop.id),
            ratePlansApi.getByProperty(prop.id).catch(() => ({ data: [] })),
        ]);
        rooms = rRes.data || [];
        roomTypes = rtRes.data || [];
        ratePlans = rpRes.data || [];
    } catch (e) {
        if (handlePropertyNotFound(e)) return;
    }

    await renderBookingsList();
}

// ===== LIST VIEW =====
async function renderBookingsList() {
    const prop = store.getState().currentProperty;
    const pc = document.getElementById('page-content');
    pc.innerHTML = '<div class="loading-spinner"></div>';

    let bookings = [];
    let listAvailable = true;

    try {
        const res = await bookingsApi.getByProperty(prop.id);
        bookings = res.data || [];
    } catch (e) {
        listAvailable = false;
    }

    pc.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Bookings</h1><p>Manage reservations for ${prop.name}</p></div>
      <button class="btn btn-primary" id="btn-create"><i data-lucide="plus"></i> New Booking</button>
    </div>

    ${listAvailable ? renderBookingTable(bookings) : renderBookingLookupOnly()}

    <div class="card" style="margin-top: var(--space-6);">
      <div class="card-header">
        <h3 class="card-title">Lookup by Booking ID</h3>
      </div>
      <div style="display:flex; gap:var(--space-3); align-items:flex-end;">
        <div class="form-group" style="flex:1; margin-bottom:0;">
          <label class="form-label">Booking ID</label>
          <input type="number" class="form-input" id="booking-id-input" placeholder="Enter booking ID" />
        </div>
        <button class="btn btn-primary" id="btn-search-booking" style="height:42px;"><i data-lucide="search"></i> Search</button>
      </div>
      <div id="booking-result" style="margin-top: var(--space-6);"></div>
    </div>
    `;
    initIcons();

    document.getElementById('btn-create')?.addEventListener('click', showCreateBookingForm);
    document.getElementById('btn-search-booking')?.addEventListener('click', searchBooking);
    document.getElementById('booking-id-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBooking(); });

    if (listAvailable) setupListHandlers(bookings);
}

function renderBookingTable(bookings) {
    if (bookings.length === 0) {
        return `<div class="empty-state" style="margin-bottom:0;">
          <i data-lucide="calendar-x"></i>
          <h3>No bookings yet</h3>
          <p>Create your first booking to get started.</p>
        </div>`;
    }
    return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead><tr>
          <th>#</th><th>Status</th><th>Payment</th><th>Source</th>
          <th>Rooms</th><th>Check-in</th><th>Check-out</th>
          <th>Total</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${bookings.map(b => {
              const items = b.items || [];
              const checkin = items[0]?.checkinDate;
              const checkout = items[items.length - 1]?.checkoutDate;
              const roomNums = items.map(i => rooms.find(r => r.id === i.roomId)?.roomNumber || `#${i.roomId}`).join(', ');
              return `<tr>
                <td style="font-weight:700; color:var(--text-primary);">#${b.id}</td>
                <td>${statusBadge(b.status)}</td>
                <td>${statusBadge(b.paymentStatus)}</td>
                <td><span class="badge badge-neutral">${b.source || '—'}</span></td>
                <td style="color:var(--text-primary);">${roomNums || '—'}</td>
                <td>${formatDate(checkin)}</td>
                <td>${formatDate(checkout)}</td>
                <td style="font-weight:600; color:var(--success);">${formatCurrency(b.totalAmount, b.currency)}</td>
                <td><div class="table-actions">
                  ${b.status === 'CONFIRMED' ? `<button class="btn btn-success btn-sm btn-checkin" data-id="${b.id}" title="Check In"><i data-lucide="log-in"></i></button>` : ''}
                  ${b.status === 'CHECKED_IN' ? `<button class="btn btn-primary btn-sm btn-checkout" data-id="${b.id}" title="Check Out"><i data-lucide="log-out"></i></button>` : ''}
                  <button class="btn btn-ghost btn-sm btn-view" data-id="${b.id}" title="View Details"><i data-lucide="eye"></i></button>
                  <button class="btn btn-ghost btn-sm btn-edit" data-id="${b.id}" title="Edit"><i data-lucide="pencil"></i></button>
                  <button class="btn btn-ghost btn-sm btn-del" data-id="${b.id}" style="color:var(--danger);" title="Delete"><i data-lucide="trash-2"></i></button>
                </div></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderBookingLookupOnly() {
    return `<div class="card" style="background: var(--warning-bg); border: 1px solid var(--warning); border-radius: var(--radius-md); padding: var(--space-4);">
      <p style="color: var(--warning); font-size: var(--font-sm);">
        <strong>Note:</strong> Booking list endpoint not yet available. Use the lookup below to find bookings by ID.
      </p>
    </div>`;
}

function setupListHandlers(bookings) {
    document.querySelectorAll('.btn-checkin').forEach(btn => {
        btn.addEventListener('click', async () => {
            try { await bookingsApi.checkIn(btn.dataset.id); showToast('Checked in!', 'success'); await renderBookingsList(); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    });
    document.querySelectorAll('.btn-checkout').forEach(btn => {
        btn.addEventListener('click', async () => {
            try { await bookingsApi.checkOut(btn.dataset.id); showToast('Checked out!', 'success'); await renderBookingsList(); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    });
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('booking-id-input').value = btn.dataset.id;
            searchBooking();
            setTimeout(() => document.getElementById('booking-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
    });
    document.querySelectorAll('.btn-edit').forEach(btn => {
        const b = bookings.find(bk => bk.id == btn.dataset.id);
        if (b) btn.addEventListener('click', () => showEditBookingForm(b));
    });
    document.querySelectorAll('.btn-del').forEach(btn => {
        btn.addEventListener('click', () => {
            showConfirm('Delete Booking', `Delete booking #${btn.dataset.id}?`, async () => {
                try { await bookingsApi.delete(btn.dataset.id); showToast('Deleted', 'success'); await renderBookingsList(); }
                catch (e) { showToast('Error: ' + e.message, 'error'); }
            });
        });
    });
}

async function searchBooking() {
    const id = document.getElementById('booking-id-input').value;
    if (!id) return;
    const resultDiv = document.getElementById('booking-result');
    resultDiv.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const res = await bookingsApi.getById(id);
        const b = res.data;
        if (!b) { resultDiv.innerHTML = '<p style="color:var(--text-muted);">No booking found.</p>'; return; }

        let guests = [], payments = [];
        try {
            const [gRes, pRes] = await Promise.all([
                guestsApi.getByBooking(b.id),
                paymentsApi.getByBooking(b.id),
            ]);
            guests = gRes.data || [];
            payments = pRes.data || [];
        } catch (e) { /* ignore */ }

        resultDiv.innerHTML = renderBookingDetail(b, guests, payments);
        initIcons();
        bindBookingDetailActions(b);
    } catch (err) {
        resultDiv.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
}

function renderBookingDetail(b, guests, payments) {
    return `
    <div class="card" style="margin-top: var(--space-4);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: var(--space-4); flex-wrap:wrap; gap:var(--space-3);">
        <div>
          <h3 style="font-size:var(--font-lg); font-weight:700; color:var(--text-primary);">Booking #${b.id}</h3>
          <div style="display:flex; gap:var(--space-3); margin-top:var(--space-2); flex-wrap:wrap;">
            ${statusBadge(b.status)} ${statusBadge(b.paymentStatus)}
            <span class="badge badge-neutral">${b.source || '—'}</span>
          </div>
        </div>
        <div class="table-actions">
          ${b.status === 'CONFIRMED' ? `<button class="btn btn-success btn-sm btn-checkin" data-id="${b.id}"><i data-lucide="log-in"></i> Check In</button>` : ''}
          ${b.status === 'CHECKED_IN' ? `<button class="btn btn-primary btn-sm btn-checkout" data-id="${b.id}"><i data-lucide="log-out"></i> Check Out</button>` : ''}
          <button class="btn btn-secondary btn-sm btn-edit-booking" data-id="${b.id}"><i data-lucide="pencil"></i> Edit</button>
          <button class="btn btn-danger btn-sm btn-del-booking" data-id="${b.id}"><i data-lucide="trash-2"></i> Delete</button>
        </div>
      </div>

      <div class="detail-grid" style="margin-bottom:var(--space-6);">
        <div class="detail-item"><label>Total Amount</label><p>${formatCurrency(b.totalAmount, b.currency)}</p></div>
        <div class="detail-item"><label>Advance</label><p>${formatCurrency(b.advanceAmount, b.currency)}</p></div>
        <div class="detail-item"><label>Currency</label><p>${b.currency || '—'}</p></div>
        <div class="detail-item"><label>Check-in Time</label><p>${b.checkinTime || '—'}</p></div>
        <div class="detail-item"><label>Checkout Time</label><p>${b.checkoutTime || '—'}</p></div>
        <div class="detail-item"><label>Notes</label><p>${b.notes || '—'}</p></div>
      </div>

      ${b.items && b.items.length > 0 ? `
        <h4 style="font-weight:600; margin-bottom:var(--space-3); color:var(--text-primary);">Room Items</h4>
        <div class="table-wrapper" style="margin-bottom:var(--space-4);">
          <table class="data-table">
            <thead><tr><th>Room</th><th>Type</th><th>Check-in</th><th>Check-out</th><th>Price/Night</th><th>Adults</th><th>Nights</th><th></th></tr></thead>
            <tbody>${b.items.map(item => {
                const nights = Math.max(1, Math.round((new Date(item.checkoutDate) - new Date(item.checkinDate)) / 86400000));
                return `<tr>
                  <td style="font-weight:600; color:var(--text-primary);">${rooms.find(r => r.id === item.roomId)?.roomNumber || `Room ${item.roomId}`}</td>
                  <td>${roomTypes.find(rt => rt.id === item.roomTypeId)?.name || '—'}</td>
                  <td>${formatDate(item.checkinDate)}</td>
                  <td>${formatDate(item.checkoutDate)}</td>
                  <td>${formatCurrency(item.pricePerNight, b.currency)}</td>
                  <td>${item.numAdults ?? '—'}</td>
                  <td>${nights}</td>
                  <td><button class="btn btn-ghost btn-sm btn-del-item" data-bid="${b.id}" data-iid="${item.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button></td>
                </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-add-item" data-bid="${b.id}"><i data-lucide="plus"></i> Add Room Item</button>
      ` : '<p style="color:var(--text-muted); margin-bottom:var(--space-4);">No room items.</p>'}

      <h4 style="font-weight:600; margin: var(--space-4) 0 var(--space-3); color:var(--text-primary);">Guests</h4>
      ${guests.length > 0 ? `
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:var(--space-4); margin-bottom:var(--space-4);">
          ${guests.map(g => `
          <div style="background:var(--bg-primary); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:var(--space-4);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-3);">
              <div>
                <div style="font-weight:700; color:var(--text-primary); font-size:var(--font-md);">${g.name}</div>
                ${g.isPrimary ? '<span class="badge badge-success" style="margin-top:4px;">Primary</span>' : ''}
              </div>
              ${g.nationality ? `<span class="badge badge-neutral">${g.nationality}</span>` : ''}
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-2); font-size:var(--font-sm);">
              ${g.phone ? `<div><span style="color:var(--text-muted);">Phone</span><br><strong>${g.phone}</strong></div>` : ''}
              ${g.email ? `<div><span style="color:var(--text-muted);">Email</span><br><strong>${g.email}</strong></div>` : ''}
              ${g.dateOfBirth ? `<div><span style="color:var(--text-muted);">Date of Birth</span><br><strong>${formatDate(g.dateOfBirth)}</strong></div>` : ''}
              ${g.idType ? `<div><span style="color:var(--text-muted);">${(g.idType||'').replace(/_/g,' ')}</span><br><strong>${g.idNumber || '—'}</strong></div>` : ''}
              ${g.address ? `<div style="grid-column:1/-1;"><span style="color:var(--text-muted);">Address</span><br><strong>${g.address}</strong></div>` : ''}
            </div>
          </div>`).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-add-guest" data-bid="${b.id}"><i data-lucide="user-plus"></i> Add Guest</button>
      ` : `
        <p style="color:var(--text-muted); margin-bottom:var(--space-3);">No guests recorded.</p>
        <button class="btn btn-secondary btn-sm" id="btn-add-guest" data-bid="${b.id}"><i data-lucide="user-plus"></i> Add Guest</button>
      `}

      <h4 style="font-weight:600; margin: var(--space-4) 0 var(--space-3); color:var(--text-primary);">Payments</h4>
      ${payments.length > 0 ? `
        <div class="table-wrapper" style="margin-bottom:var(--space-4);">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Amount</th><th>Method</th><th>Status</th><th>Transaction</th></tr></thead>
            <tbody>${payments.map(p => `
              <tr>
                <td>${p.id}</td>
                <td style="font-weight:600; color:var(--success);">${formatCurrency(p.amount, p.currency)}</td>
                <td><span class="badge badge-info">${(p.paymentMethod || '').replace(/_/g, ' ')}</span></td>
                <td>${statusBadge(p.status)}</td>
                <td>${p.transactionId || '—'}</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>
      ` : '<p style="color:var(--text-muted); margin-bottom:var(--space-3);">No payments recorded.</p>'}
      <button class="btn btn-secondary btn-sm" id="btn-add-payment" data-bid="${b.id}"><i data-lucide="credit-card"></i> Record Payment</button>
    </div>`;
}

function bindBookingDetailActions(b) {
    document.querySelector('.btn-checkin')?.addEventListener('click', async () => {
        try { await bookingsApi.checkIn(b.id); showToast('Checked in!', 'success'); searchBooking(); }
        catch (e) { showToast('Error: ' + e.message, 'error'); }
    });
    document.querySelector('.btn-checkout')?.addEventListener('click', async () => {
        try { await bookingsApi.checkOut(b.id); showToast('Checked out!', 'success'); searchBooking(); }
        catch (e) { showToast('Error: ' + e.message, 'error'); }
    });
    document.querySelector('.btn-edit-booking')?.addEventListener('click', () => showEditBookingForm(b));
    document.querySelector('.btn-del-booking')?.addEventListener('click', () => {
        showConfirm('Delete Booking', `Delete booking #${b.id}?`, async () => {
            try { await bookingsApi.delete(b.id); showToast('Deleted', 'success'); await renderBookingsList(); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    });
    document.querySelectorAll('.btn-del-item').forEach(btn => {
        btn.addEventListener('click', () => {
            showConfirm('Remove Item', 'Remove this room item?', async () => {
                try { await bookingItemsApi.remove(btn.dataset.bid, btn.dataset.iid); showToast('Item removed', 'success'); searchBooking(); }
                catch (e) { showToast('Error: ' + e.message, 'error'); }
            });
        });
    });
    document.getElementById('btn-add-item')?.addEventListener('click', () => showAddItemForm(b.id));
    document.getElementById('btn-add-payment')?.addEventListener('click', () => showPaymentForm(b.id));
    document.getElementById('btn-add-guest')?.addEventListener('click', () => showAddGuestForm(b.id));
}

// ===== ADD GUEST FORM =====
function showAddGuestForm(bookingId) {
    showModal(`
    <div class="modal-header"><h2>Add Guest</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button>
    </div>
    <form id="add-guest-form"><div class="modal-body">

      <!-- Phone lookup -->
      <div class="form-section-box" style="margin-bottom:var(--space-4);">
        <div class="form-section-title">Returning Guest Lookup</div>
        <div class="form-row" style="align-items:flex-end;">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Phone Number</label>
            <input class="form-input" id="guest-lookup-phone" placeholder="Enter phone to search existing guest" type="tel" />
          </div>
          <div class="form-group" style="flex:0 0 auto; margin-bottom:0;">
            <button type="button" class="btn btn-secondary" id="btn-guest-lookup" style="margin-top:auto;">
              <i data-lucide="search"></i> Lookup
            </button>
          </div>
        </div>
        <div id="guest-lookup-result" style="margin-top:var(--space-2); display:none;"></div>
      </div>

      <!-- Guest Details -->
      <div class="form-section-box">
        <div class="form-section-title">Guest Details</div>

        <!-- Photo upload -->
        <div style="display:flex; align-items:center; gap:var(--space-5); margin-bottom:var(--space-4);">
          <div style="position:relative; flex-shrink:0;">
            <div id="ag-photo-circle" style="width:84px; height:84px; border-radius:50%; background:var(--bg-input); border:2px solid var(--border-color); display:flex; align-items:center; justify-content:center; overflow:hidden; cursor:pointer;">
              <i data-lucide="user" style="width:38px; height:38px; color:var(--text-muted);" id="ag-photo-icon"></i>
              <img id="ag-photo-img" style="width:100%; height:100%; object-fit:cover; display:none;" alt="Guest photo" />
            </div>
            <div id="ag-photo-cam" style="position:absolute; bottom:0; right:0; width:26px; height:26px; border-radius:50%; background:var(--accent-primary); display:flex; align-items:center; justify-content:center; cursor:pointer; border:2px solid white;">
              <i data-lucide="camera" style="width:13px; height:13px; color:white;"></i>
            </div>
            <input type="file" id="ag-photo-input" accept="image/*" style="display:none;" />
          </div>
          <div style="flex:1;">
            <div style="font-size:var(--font-sm); font-weight:600; color:var(--text-primary); margin-bottom:4px;">Guest Photo</div>
            <div style="font-size:var(--font-xs); color:var(--text-muted); line-height:1.5;">Click the circle to upload a photo.<br/>JPG, PNG supported.</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input class="form-input" name="name" id="ag-name" required placeholder="Guest full name" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-input" name="phone" id="ag-phone" type="tel" placeholder="+91 98765 43210" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" name="email" id="ag-email" type="email" placeholder="guest@example.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Nationality</label>
            <input class="form-input" name="nationality" id="ag-nationality" placeholder="Indian" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date of Birth</label>
            <input class="form-input" name="dateOfBirth" id="ag-dob" type="date" />
          </div>
          <div class="form-group">
            <label class="form-label">Purpose of Visit</label>
            <select class="form-select" name="purposeOfVisit" id="ag-purpose">
              <option value="">— Select —</option>
              <option value="Business">Business</option>
              <option value="Tourism">Tourism / Leisure</option>
              <option value="Medical">Medical</option>
              <option value="Education">Education</option>
              <option value="Family">Family Visit</option>
              <option value="Wedding">Wedding / Event</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">ID Type</label>
            <select class="form-select" name="idType" id="ag-id-type">
              <option value="">— Select —</option>
              <option value="AADHAR">Aadhar Card</option>
              <option value="PASSPORT">Passport</option>
              <option value="DRIVING_LICENSE">Driving License</option>
              <option value="PAN_CARD">PAN Card</option>
              <option value="VOTER_ID">Voter ID</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ID Number</label>
            <input class="form-input" name="idNumber" id="ag-id-number" placeholder="ID document number" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Address</label>
          <textarea class="form-input" name="address" id="ag-address" rows="2" placeholder="Residential address"></textarea>
        </div>
        <div style="display:flex; align-items:center; gap:var(--space-2); margin-top:var(--space-2);">
          <input type="checkbox" id="ag-is-primary" name="isPrimary" style="width:16px; height:16px;" />
          <label for="ag-is-primary" style="margin:0; color:var(--text-secondary); font-size:var(--font-sm);">Mark as primary guest</label>
        </div>
      </div>

    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="ag-submit"><i data-lucide="user-plus"></i> Add Guest</button>
    </div></form>
  `);
    initIcons();

    // Photo upload handlers
    const photoCircle = document.getElementById('ag-photo-circle');
    const photoCam = document.getElementById('ag-photo-cam');
    const photoInput = document.getElementById('ag-photo-input');
    const triggerPhoto = () => photoInput.click();
    photoCircle.addEventListener('click', triggerPhoto);
    photoCam.addEventListener('click', triggerPhoto);
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('ag-photo-img').src = ev.target.result;
            document.getElementById('ag-photo-img').style.display = 'block';
            document.getElementById('ag-photo-icon').style.display = 'none';
        };
        reader.readAsDataURL(file);
    });

    // Phone lookup handler
    document.getElementById('btn-guest-lookup').addEventListener('click', async () => {
        const phone = document.getElementById('guest-lookup-phone').value.trim();
        if (!phone) { showToast('Enter a phone number to search', 'error'); return; }
        const resultDiv = document.getElementById('guest-lookup-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div class="loading-spinner" style="margin:var(--space-2) 0;"></div>';
        try {
            const res = await guestsApi.getByPhone(phone);
            const guests = res.data || [];
            if (guests.length === 0) {
                resultDiv.innerHTML = `<div style="color:var(--text-muted); font-size:var(--font-sm);">No existing guest found with this phone number.</div>`;
                document.getElementById('ag-phone').value = phone;
            } else {
                const g = guests[0];
                resultDiv.innerHTML = `
                  <div style="background:var(--success-bg,rgba(52,211,153,0.1)); border:1px solid var(--success); border-radius:var(--radius-md); padding:var(--space-3);">
                    <div style="display:flex; align-items:center; gap:var(--space-3);">
                      ${g.photoUrl ? `<img src="${g.photoUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;" />` : ''}
                      <div>
                        <div style="font-weight:600; color:var(--text-primary); margin-bottom:2px;"><i data-lucide="user-check" style="width:14px; height:14px; margin-right:4px;"></i> Found: ${g.name}</div>
                        <div style="font-size:var(--font-xs); color:var(--text-secondary);">${g.phone ? '📱 ' + g.phone : ''} ${g.email ? '✉ ' + g.email : ''} ${g.nationality ? '🌍 ' + g.nationality : ''}</div>
                      </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" id="btn-use-guest" style="margin-top:var(--space-2);">Use this guest</button>
                  </div>`;
                initIcons();
                document.getElementById('btn-use-guest').addEventListener('click', () => {
                    document.getElementById('ag-name').value = g.name || '';
                    document.getElementById('ag-phone').value = g.phone || '';
                    document.getElementById('ag-email').value = g.email || '';
                    document.getElementById('ag-nationality').value = g.nationality || '';
                    document.getElementById('ag-dob').value = g.dateOfBirth ? g.dateOfBirth.split('T')[0] : '';
                    document.getElementById('ag-purpose').value = g.purposeOfVisit || '';
                    document.getElementById('ag-id-type').value = g.idType || '';
                    document.getElementById('ag-id-number').value = g.idNumber || '';
                    document.getElementById('ag-address').value = g.address || '';
                    if (g.photoUrl) {
                        document.getElementById('ag-photo-img').src = g.photoUrl;
                        document.getElementById('ag-photo-img').style.display = 'block';
                        document.getElementById('ag-photo-icon').style.display = 'none';
                    }
                    resultDiv.innerHTML = `<div style="color:var(--success); font-size:var(--font-sm);">✓ Guest details pre-filled from existing record.</div>`;
                });
            }
        } catch (e) {
            resultDiv.innerHTML = `<div style="color:var(--danger); font-size:var(--font-sm);">Lookup failed: ${e.message}</div>`;
        }
    });

    // Form submit
    document.getElementById('add-guest-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const photoImg = document.getElementById('ag-photo-img');
        const data = {
            name: f.name.value,
            phone: f.phone.value || undefined,
            email: f.email.value || undefined,
            nationality: f.nationality.value || undefined,
            dateOfBirth: f.dateOfBirth.value || undefined,
            purposeOfVisit: f.purposeOfVisit.value || undefined,
            idType: f.idType.value || undefined,
            idNumber: f.idNumber.value || undefined,
            address: f.address.value || undefined,
            isPrimary: f.isPrimary.checked,
            photoUrl: (photoImg.style.display !== 'none' && photoImg.src) ? photoImg.src : undefined,
        };
        const btn = document.getElementById('ag-submit'); btn.disabled = true;
        try {
            await guestsApi.add(bookingId, data);
            showToast('Guest added successfully', 'success');
            closeModal();
            searchBooking();
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
            btn.disabled = false;
        }
    });
}

// ===== CREATE BOOKING FORM (multi-room + rate rules) =====
function showCreateBookingForm() {
    const prop = store.getState().currentProperty;
    _newItems = [{ id: Date.now(), roomTypeId: '', roomId: '', checkinDate: today(), checkoutDate: daysFromNow(1), pricePerNight: '', numAdults: 1 }];

    showModal(`
    <div class="modal-header">
      <h2>New Booking</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button>
    </div>
    <form id="booking-form">
    <div class="modal-body">

      <!-- Rate Plan Section -->
      <div class="form-section-box">
        <div class="form-section-title">Rate Plan</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Rate Plan${ratePlans.length === 0 ? ' <span style="color:var(--warning); font-weight:400; font-size:var(--font-xs);">(none configured)</span>' : ''}</label>
            <select class="form-select" id="rate-plan-select">
              <option value="">— Select to auto-fill price —</option>
              ${ratePlans.map(rp => `<option value="${rp.id}">${rp.name} (${rp.currency})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Rate Rule <span style="color:var(--text-muted); font-size:var(--font-xs);">(auto-fills price/night)</span></label>
            <select class="form-select" id="rate-rule-select" disabled>
              <option value="">— Select plan first —</option>
            </select>
          </div>
        </div>
        <div id="rule-preview" style="display:none; background:var(--bg-input); border-radius:var(--radius-md); padding:var(--space-3); font-size:var(--font-sm); color:var(--text-secondary); margin-top: var(--space-2);"></div>
        <p style="font-size:var(--font-xs); color:var(--text-muted); margin-top:var(--space-2);">
          Note: Rate rule ID will be sent to backend once supported. Currently uses prices to auto-fill room items.
        </p>
      </div>

      <!-- Room Items Section -->
      <div class="form-section-box" style="margin-top:var(--space-4);">
        <div class="form-section-title">Room Items</div>
        <div id="items-list"></div>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-add-room-item" style="margin-top:var(--space-3);">
          <i data-lucide="plus"></i> Add Another Room
        </button>
      </div>

      <!-- Auto-calculated Total -->
      <div style="margin-top:var(--space-4); padding:var(--space-4); background:var(--bg-input); border-radius:var(--radius-md); border: 1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:600; color:var(--text-primary);">Estimated Total</div>
            <div style="font-size:var(--font-xs); color:var(--text-muted);">Sum of price × nights for all rooms</div>
          </div>
          <div id="booking-total-display" style="font-size:var(--font-2xl); font-weight:700; color:var(--success);">₹0</div>
        </div>
      </div>

      <!-- Booking Details -->
      <div class="form-section-box" style="margin-top:var(--space-4);">
        <div class="form-section-title">Booking Details</div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Status *</label>
            <select class="form-select" name="status" required>
              ${['DRAFT', 'CONFIRMED', 'CHECKED_IN'].map(s => `<option value="${s}">${s.replace(/_/g, ' ')}</option>`).join('')}
            </select></div>
          <div class="form-group"><label class="form-label">Source *</label>
            <select class="form-select" name="source" required>
              ${['INTERNAL', 'WEBSITE', 'B2B', 'PHONE'].map(s => `<option value="${s}">${s}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Payment Status *</label>
            <select class="form-select" name="paymentStatus" required>
              ${['PENDING', 'PARTIAL', 'PAID', 'REFUNDED'].map(s => `<option value="${s}">${s}</option>`).join('')}
            </select></div>
          <div class="form-group"><label class="form-label">Currency *</label>
            <input class="form-input" name="currency" value="INR" required maxlength="3" id="booking-currency" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Total Amount *</label>
            <input type="number" class="form-input" name="totalAmount" id="total-amount-input" step="0.01" required /></div>
          <div class="form-group"><label class="form-label">Advance Amount</label>
            <input type="number" class="form-input" name="advanceAmount" step="0.01" /></div>
        </div>
        <div class="form-group"><label class="form-label">Notes</label>
          <textarea class="form-textarea" name="notes" rows="2"></textarea></div>
      </div>

      <!-- Guest Section -->
      <div class="form-section-box" style="margin-top:var(--space-4);">
        <div class="form-section-title">Primary Guest</div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Guest Name *</label>
            <input class="form-input" name="guestName" required placeholder="Full name" /></div>
          <div class="form-group"><label class="form-label">Phone *</label>
            <input class="form-input" name="guestPhone" required placeholder="+91 XXXXX XXXXX" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Email</label>
            <input type="email" class="form-input" name="guestEmail" placeholder="guest@email.com" /></div>
          <div class="form-group"><label class="form-label">Nationality</label>
            <input class="form-input" name="guestNationality" value="Indian" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Date of Birth</label>
            <input type="date" class="form-input" name="guestDob" /></div>
          <div class="form-group"><label class="form-label">ID Type</label>
            <select class="form-select" name="guestIdType">
              <option value="">— None —</option>
              ${['AADHAR', 'PASSPORT', 'DRIVING_LICENSE', 'PAN_CARD', 'VOTER_ID', 'OTHER'].map(t => `<option value="${t}">${t.replace(/_/g,' ')}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">ID Number</label>
            <input class="form-input" name="guestIdNumber" placeholder="ID / Document number" /></div>
          <div class="form-group"><label class="form-label">Adults in Group</label>
            <input type="number" class="form-input" name="guestGroupSize" value="1" min="1" /></div>
        </div>
        <div class="form-group"><label class="form-label">Address</label>
          <textarea class="form-textarea" name="guestAddress" rows="2" placeholder="Home address"></textarea></div>
      </div>

    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="bk-submit"><i data-lucide="calendar-check"></i> Create Booking</button>
    </div>
    </form>
    `, { size: 'xl' });

    initIcons();
    renderNewBookingItemsUI();
    setupCreateFormListeners(prop);
}

function renderNewBookingItemsUI() {
    const container = document.getElementById('items-list');
    if (!container) return;

    container.innerHTML = _newItems.map((item, idx) => `
    <div class="booking-item-card" id="item-card-${item.id}">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-3);">
        <span style="font-weight:600; color:var(--text-accent); font-size:var(--font-sm);">Room ${idx + 1}</span>
        ${_newItems.length > 1 ? `<button type="button" class="btn btn-ghost btn-sm btn-remove-item" data-itemid="${item.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i> Remove</button>` : ''}
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Room Type *</label>
          <select class="form-select item-room-type" data-itemid="${item.id}" required>
            <option value="">Select type</option>
            ${roomTypes.map(rt => `<option value="${rt.id}" ${item.roomTypeId == rt.id ? 'selected' : ''}>${rt.name}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Room *</label>
          <select class="form-select item-room" data-itemid="${item.id}" required>
            <option value="">Select room</option>
            ${rooms.map(r => `<option value="${r.id}" ${item.roomId == r.id ? 'selected' : ''}>${r.roomNumber}${r.floorNumber != null ? ' (Fl.'+r.floorNumber+')' : ''}</option>`).join('')}
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Check-in *</label>
          <input type="date" class="form-input item-checkin" data-itemid="${item.id}" value="${item.checkinDate}" required /></div>
        <div class="form-group"><label class="form-label">Check-out *</label>
          <input type="date" class="form-input item-checkout" data-itemid="${item.id}" value="${item.checkoutDate}" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Price / Night *</label>
          <input type="number" class="form-input item-price" data-itemid="${item.id}" value="${item.pricePerNight}" step="0.01" required placeholder="Auto-filled from rate rule" />
        </div>
        <div class="form-group"><label class="form-label">Adults</label>
          <input type="number" class="form-input item-adults" data-itemid="${item.id}" value="${item.numAdults}" min="1" /></div>
      </div>
      <div class="item-subtotal" id="subtotal-${item.id}" style="font-size:var(--font-sm); color:var(--text-muted); text-align:right; margin-top:var(--space-1);"></div>
    </div>
    `).join('');

    initIcons();
    bindItemCardListeners();
    recalculateTotal();
}

function bindItemCardListeners() {
    document.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            _newItems = _newItems.filter(it => it.id != btn.dataset.itemid);
            renderNewBookingItemsUI();
        });
    });
    document.querySelectorAll('.item-room-type').forEach(sel => {
        sel.addEventListener('change', () => {
            const it = _newItems.find(i => i.id == sel.dataset.itemid);
            if (it) it.roomTypeId = sel.value;
        });
    });
    document.querySelectorAll('.item-room').forEach(sel => {
        sel.addEventListener('change', () => {
            const it = _newItems.find(i => i.id == sel.dataset.itemid);
            if (it) it.roomId = sel.value;
        });
    });
    document.querySelectorAll('.item-checkin').forEach(inp => {
        inp.addEventListener('change', () => {
            const it = _newItems.find(i => i.id == inp.dataset.itemid);
            if (it) { it.checkinDate = inp.value; recalculateTotal(); }
        });
    });
    document.querySelectorAll('.item-checkout').forEach(inp => {
        inp.addEventListener('change', () => {
            const it = _newItems.find(i => i.id == inp.dataset.itemid);
            if (it) { it.checkoutDate = inp.value; recalculateTotal(); }
        });
    });
    document.querySelectorAll('.item-price').forEach(inp => {
        inp.addEventListener('input', () => {
            const it = _newItems.find(i => i.id == inp.dataset.itemid);
            if (it) { it.pricePerNight = inp.value; recalculateTotal(); }
        });
    });
    document.querySelectorAll('.item-adults').forEach(inp => {
        inp.addEventListener('change', () => {
            const it = _newItems.find(i => i.id == inp.dataset.itemid);
            if (it) it.numAdults = parseInt(inp.value) || 1;
        });
    });
}

function recalculateTotal() {
    let total = 0;
    _newItems.forEach(item => {
        const price = parseFloat(item.pricePerNight) || 0;
        const nights = item.checkinDate && item.checkoutDate
            ? Math.max(1, Math.round((new Date(item.checkoutDate) - new Date(item.checkinDate)) / 86400000))
            : 1;
        const subtotal = price * nights;
        total += subtotal;
        const el = document.getElementById(`subtotal-${item.id}`);
        if (el) el.textContent = price > 0 ? `${nights} night${nights > 1 ? 's' : ''} × ₹${price.toFixed(2)} = ₹${subtotal.toFixed(2)}` : '';
    });

    const display = document.getElementById('booking-total-display');
    if (display) display.textContent = `₹${total.toFixed(2)}`;
    const totalInput = document.getElementById('total-amount-input');
    if (totalInput && total > 0) totalInput.value = total.toFixed(2);
}

function applyRulePrice(weekdayPrice, weekendPrice) {
    _newItems.forEach(item => {
        // Use weekday price as default; could be enhanced to check actual dates
        item.pricePerNight = weekdayPrice;
    });
    renderNewBookingItemsUI();
}

function setupCreateFormListeners(prop) {
    // Rate plan dropdown
    const planSelect = document.getElementById('rate-plan-select');
    const ruleSelect = document.getElementById('rate-rule-select');

    planSelect?.addEventListener('change', async () => {
        const planId = planSelect.value;
        ruleSelect.disabled = true;
        ruleSelect.innerHTML = '<option value="">Loading rules…</option>';
        document.getElementById('rule-preview').style.display = 'none';

        if (!planId) {
            ruleSelect.innerHTML = '<option value="">— Select plan first —</option>';
            return;
        }

        try {
            let rules = _rulesByPlan[planId];
            if (!rules) {
                const res = await rateRulesApi.getByPlan(planId);
                rules = res.data || [];
                _rulesByPlan[planId] = rules;
            }
            ruleSelect.innerHTML = '<option value="">— Select rule —</option>' +
                rules.filter(r => r.status !== 'INACTIVE').map(r => {
                    const rt = roomTypes.find(x => x.id === r.roomTypeId)?.name || `Type ${r.roomTypeId}`;
                    return `<option value="${r.id}" data-weekday="${r.weekdayPrice}" data-weekend="${r.weekendPrice}">
                        ${rt} | ${formatDate(r.startDate)} → ${formatDate(r.endDate)} | Wd:${r.weekdayPrice} We:${r.weekendPrice}
                    </option>`;
                }).join('');
            ruleSelect.disabled = false;
        } catch (e) {
            ruleSelect.innerHTML = '<option value="">Error loading rules</option>';
            showToast('Could not load rate rules', 'error');
        }
    });

    ruleSelect?.addEventListener('change', () => {
        const opt = ruleSelect.options[ruleSelect.selectedIndex];
        const preview = document.getElementById('rule-preview');
        if (!opt.value) { preview.style.display = 'none'; return; }

        const weekday = parseFloat(opt.dataset.weekday) || 0;
        const weekend = parseFloat(opt.dataset.weekend) || 0;
        preview.style.display = 'block';
        preview.innerHTML = `
          <div style="display:flex; gap:var(--space-6);">
            <span><strong style="color:var(--text-primary);">Weekday:</strong> ₹${weekday}</span>
            <span><strong style="color:var(--text-primary);">Weekend:</strong> ₹${weekend}</span>
          </div>
          <div style="margin-top:var(--space-1); color:var(--text-muted); font-size:var(--font-xs);">Prices applied to all room items below (using weekday rate).</div>
        `;
        applyRulePrice(weekday, weekend);
    });

    // Add room button
    document.getElementById('btn-add-room-item')?.addEventListener('click', () => {
        _newItems.push({ id: Date.now(), roomTypeId: '', roomId: '', checkinDate: today(), checkoutDate: daysFromNow(1), pricePerNight: '', numAdults: 1 });
        renderNewBookingItemsUI();
        // Re-apply rule price if a rule is selected
        const ruleOpt = document.getElementById('rate-rule-select')?.options[document.getElementById('rate-rule-select')?.selectedIndex];
        if (ruleOpt?.value) {
            applyRulePrice(parseFloat(ruleOpt.dataset.weekday) || 0, parseFloat(ruleOpt.dataset.weekend) || 0);
        }
    });

    // Form submit
    document.getElementById('booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;

        if (_newItems.some(it => !it.roomId || !it.pricePerNight)) {
            showToast('Fill in all room items (room & price required)', 'error');
            return;
        }

        const data = {
            status: f.status.value,
            source: f.source.value,
            paymentStatus: f.paymentStatus.value,
            currency: f.currency.value,
            totalAmount: parseFloat(f.totalAmount.value),
            advanceAmount: f.advanceAmount.value ? parseFloat(f.advanceAmount.value) : undefined,
            notes: f.notes.value || undefined,
            items: _newItems.map(it => ({
                roomTypeId: it.roomTypeId ? parseInt(it.roomTypeId) : undefined,
                roomId: parseInt(it.roomId),
                checkinDate: it.checkinDate,
                checkoutDate: it.checkoutDate,
                pricePerNight: parseFloat(it.pricePerNight),
                numAdults: parseInt(it.numAdults) || 1,
                numChildren: 0,
            })),
            guests: [{
                name: f.guestName.value,
                phone: f.guestPhone.value || undefined,
                email: f.guestEmail.value || undefined,
                nationality: f.guestNationality.value || undefined,
                dateOfBirth: f.guestDob.value || undefined,
                idType: f.guestIdType.value || undefined,
                idNumber: f.guestIdNumber.value || undefined,
                address: f.guestAddress.value || undefined,
                isPrimary: true,
            }],
        };

        const btn = document.getElementById('bk-submit');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Creating…';
        try {
            const res = await bookingsApi.create(prop.id, data);
            showToast(`Booking #${res.data?.id} created!`, 'success');
            closeModal();
            await renderBookingsList();
            // Auto-load the new booking in the lookup
            if (res.data?.id) {
                document.getElementById('booking-id-input').value = res.data.id;
                searchBooking();
            }
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="calendar-check"></i> Create Booking';
            initIcons();
        }
    });
}

// ===== EDIT BOOKING FORM =====
function showEditBookingForm(b) {
    showModal(`
    <div class="modal-header"><h2>Edit Booking #${b.id}</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="edit-bk-form"><div class="modal-body">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-select" name="status">
            ${['DRAFT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].map(s => `<option value="${s}" ${b.status === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Source</label>
          <select class="form-select" name="source">
            ${['INTERNAL', 'WEBSITE', 'B2B', 'PHONE'].map(s => `<option value="${s}" ${b.source === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Payment Status</label>
          <select class="form-select" name="paymentStatus">
            ${['PENDING', 'PARTIAL', 'PAID', 'REFUNDED'].map(s => `<option value="${s}" ${b.paymentStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Notes</label>
          <input class="form-input" name="notes" value="${b.notes || ''}" /></div>
      </div>
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="ebk-submit">Update</button>
    </div></form>
  `);
    initIcons();
    document.getElementById('edit-bk-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = { status: f.status.value, source: f.source.value, paymentStatus: f.paymentStatus.value, notes: f.notes.value || undefined };
        const btn = document.getElementById('ebk-submit'); btn.disabled = true;
        try { await bookingsApi.update(b.id, data); showToast('Updated', 'success'); closeModal(); searchBooking(); }
        catch (err) { showToast('Error: ' + err.message, 'error'); btn.disabled = false; }
    });
}

// ===== ADD ROOM ITEM TO EXISTING BOOKING =====
function showAddItemForm(bookingId) {
    showModal(`
    <div class="modal-header"><h2>Add Room Item</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="item-form"><div class="modal-body">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Room Type *</label>
          <select class="form-select" name="roomTypeId" required><option value="">Select</option>
            ${roomTypes.map(rt => `<option value="${rt.id}">${rt.name}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Room *</label>
          <select class="form-select" name="roomId" required><option value="">Select</option>
            ${rooms.map(r => `<option value="${r.id}">${r.roomNumber}</option>`).join('')}
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Check-in *</label><input type="date" class="form-input" name="checkinDate" value="${today()}" required /></div>
        <div class="form-group"><label class="form-label">Check-out *</label><input type="date" class="form-input" name="checkoutDate" value="${daysFromNow(1)}" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Price/Night *</label><input type="number" class="form-input" name="pricePerNight" step="0.01" required /></div>
        <div class="form-group"><label class="form-label">Adults</label><input type="number" class="form-input" name="numAdults" value="1" min="1" /></div>
      </div>
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="ai-submit">Add Item</button>
    </div></form>
  `);
    initIcons();
    document.getElementById('item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = {
            roomTypeId: parseInt(f.roomTypeId.value), roomId: parseInt(f.roomId.value),
            checkinDate: f.checkinDate.value, checkoutDate: f.checkoutDate.value,
            pricePerNight: parseFloat(f.pricePerNight.value),
            numAdults: parseInt(f.numAdults.value) || 1, numChildren: 0,
        };
        const btn = document.getElementById('ai-submit'); btn.disabled = true;
        try { await bookingItemsApi.add(bookingId, data); showToast('Item added', 'success'); closeModal(); searchBooking(); }
        catch (err) { showToast('Error: ' + err.message, 'error'); btn.disabled = false; }
    });
}

// ===== PAYMENT FORM =====
function showPaymentForm(bookingId) {
    showModal(`
    <div class="modal-header"><h2>Record Payment</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="pay-form"><div class="modal-body">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Amount *</label>
          <input type="number" class="form-input" name="amount" step="0.01" required /></div>
        <div class="form-group"><label class="form-label">Method *</label>
          <select class="form-select" name="paymentMethod" required>
            ${['CASH', 'UPI', 'INTERNET_BANKING', 'CARD', 'OTHER'].map(m => `<option value="${m}">${m.replace(/_/g, ' ')}</option>`).join('')}
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Transaction ID</label>
        <input class="form-input" name="transactionId" /></div>
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="pay-submit">Record Payment</button>
    </div></form>
  `);
    initIcons();
    document.getElementById('pay-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = { amount: parseFloat(f.amount.value), paymentMethod: f.paymentMethod.value, transactionId: f.transactionId.value || undefined };
        const btn = document.getElementById('pay-submit'); btn.disabled = true;
        try { await paymentsApi.record(bookingId, data); showToast('Payment recorded', 'success'); closeModal(); searchBooking(); }
        catch (err) { showToast('Error: ' + err.message, 'error'); btn.disabled = false; }
    });
}
