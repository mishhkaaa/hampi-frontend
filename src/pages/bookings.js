// ===== BOOKINGS PAGE =====
import { renderLayout } from '../layout.js';
import { bookingsApi, roomsApi, roomTypesApi, guestsApi, paymentsApi, bookingItemsApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, formatDate, formatCurrency, initIcons, store, today, daysFromNow } from '../utils.js';

let rooms = [], roomTypes = [];

export async function renderBookings() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'bookings');

    try {
        const [rRes, rtRes] = await Promise.all([
            roomsApi.getByProperty(prop.id),
            roomTypesApi.getByProperty(prop.id),
        ]);
        rooms = rRes.data || [];
        roomTypes = rtRes.data || [];
    } catch (e) { /* ignore */ }

    renderBookingHome();
}

function renderBookingHome() {
    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Bookings</h1><p>Manage reservations for ${store.getState().currentProperty?.name}</p></div>
      <div style="display:flex; gap:var(--space-3);">
        <button class="btn btn-secondary" id="btn-lookup"><i data-lucide="search"></i> Lookup Booking</button>
        <button class="btn btn-primary" id="btn-create"><i data-lucide="plus"></i> New Booking</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Booking Lookup</h3></div>
      <div style="display:flex; gap:var(--space-3); align-items:flex-end;">
        <div class="form-group" style="flex:1; margin-bottom:0;">
          <label class="form-label">Booking ID</label>
          <input type="number" class="form-input" id="booking-id-input" placeholder="Enter booking ID" />
        </div>
        <button class="btn btn-primary" id="btn-search-booking" style="height:42px;">Search</button>
      </div>
      <div id="booking-result" style="margin-top: var(--space-6);"></div>
    </div>
  `;
    initIcons();

    document.getElementById('btn-create')?.addEventListener('click', showCreateBookingForm);
    document.getElementById('btn-lookup')?.addEventListener('click', () => document.getElementById('booking-id-input').focus());

    document.getElementById('btn-search-booking')?.addEventListener('click', searchBooking);
    document.getElementById('booking-id-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBooking(); });
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

        // Load guests and payments
        let guests = [], payments = [];
        try {
            const [gRes, pRes] = await Promise.all([
                guestsApi.getByBooking(b.id),
                paymentsApi.getByBooking(b.id),
            ]);
            guests = gRes.data || [];
            payments = pRes.data || [];
        } catch (e) { /* ignore */ }

        resultDiv.innerHTML = `
      <div class="card" style="margin-top: var(--space-4);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-4);">
          <div>
            <h3 style="font-size:var(--font-lg); font-weight:700; color:var(--text-primary);">Booking #${b.id}</h3>
            <div style="display:flex; gap:var(--space-3); margin-top:var(--space-2);">
              ${statusBadge(b.status)}
              ${statusBadge(b.paymentStatus)}
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
              <thead><tr><th>Room</th><th>Type</th><th>Check-in</th><th>Check-out</th><th>Price/Night</th><th>Adults</th><th>Children</th><th>Actions</th></tr></thead>
              <tbody>${b.items.map(item => `
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">${rooms.find(r => r.id === item.roomId)?.roomNumber || `Room ${item.roomId}`}</td>
                  <td>${roomTypes.find(rt => rt.id === item.roomTypeId)?.name || '—'}</td>
                  <td>${formatDate(item.checkinDate)}</td>
                  <td>${formatDate(item.checkoutDate)}</td>
                  <td>${formatCurrency(item.pricePerNight, b.currency)}</td>
                  <td>${item.numAdults ?? '—'}</td>
                  <td>${item.numChildren ?? 0}</td>
                  <td><button class="btn btn-ghost btn-sm btn-del-item" data-bid="${b.id}" data-iid="${item.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button></td>
                </tr>`).join('')}</tbody>
            </table>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-add-item" data-bid="${b.id}"><i data-lucide="plus"></i> Add Room Item</button>
        ` : '<p style="color:var(--text-muted); margin-bottom:var(--space-4);">No room items.</p>'}

        ${guests.length > 0 ? `
          <h4 style="font-weight:600; margin: var(--space-4) 0 var(--space-3); color:var(--text-primary);">Guests</h4>
          <div class="table-wrapper" style="margin-bottom:var(--space-4);">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Primary</th></tr></thead>
              <tbody>${guests.map(g => `
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">${g.name}</td>
                  <td>${g.phone || '—'}</td>
                  <td>${g.email || '—'}</td>
                  <td>${g.isPrimary ? '<span class="badge badge-success">Yes</span>' : '—'}</td>
                </tr>`).join('')}</tbody>
            </table>
          </div>
        ` : ''}

        ${payments.length > 0 ? `
          <h4 style="font-weight:600; margin: var(--space-4) 0 var(--space-3); color:var(--text-primary);">Payments</h4>
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>ID</th><th>Amount</th><th>Method</th><th>Status</th><th>Transaction</th></tr></thead>
              <tbody>${payments.map(p => `
                <tr>
                  <td>${p.id}</td>
                  <td style="font-weight:600; color:var(--success);">${formatCurrency(p.amount, p.currency)}</td>
                  <td><span class="badge badge-info">${p.paymentMethod}</span></td>
                  <td>${statusBadge(p.status)}</td>
                  <td>${p.transactionId || '—'}</td>
                </tr>`).join('')}</tbody>
            </table>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-add-payment" data-bid="${b.id}" style="margin-top:var(--space-3);"><i data-lucide="plus"></i> Record Payment</button>
        ` : `<button class="btn btn-secondary btn-sm" id="btn-add-payment" data-bid="${b.id}" style="margin-top:var(--space-3);"><i data-lucide="credit-card"></i> Record Payment</button>`}
      </div>
    `;
        initIcons();

        // Bind action buttons
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
                try { await bookingsApi.delete(b.id); showToast('Deleted', 'success'); renderBookingHome(); }
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
    } catch (err) {
        resultDiv.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
}

function showCreateBookingForm() {
    const prop = store.getState().currentProperty;
    showModal(`
    <div class="modal-header"><h2>Create Booking</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="booking-form"><div class="modal-body">
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
          <input class="form-input" name="currency" value="INR" required maxlength="3" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Total Amount *</label>
          <input type="number" class="form-input" name="totalAmount" step="0.01" required /></div>
        <div class="form-group"><label class="form-label">Advance Amount</label>
          <input type="number" class="form-input" name="advanceAmount" step="0.01" /></div>
      </div>
      <div class="form-group"><label class="form-label">Notes</label>
        <textarea class="form-textarea" name="notes"></textarea></div>

      <h4 style="font-weight:600; margin:var(--space-4) 0 var(--space-2); color:var(--text-primary);">Room Item *</h4>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Room Type *</label>
          <select class="form-select" name="roomTypeId" required>
            <option value="">Select</option>
            ${roomTypes.map(rt => `<option value="${rt.id}">${rt.name}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Room *</label>
          <select class="form-select" name="roomId" required>
            <option value="">Select</option>
            ${rooms.map(r => `<option value="${r.id}">${r.roomNumber}</option>`).join('')}
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Check-in Date *</label>
          <input type="date" class="form-input" name="checkinDate" value="${today()}" required /></div>
        <div class="form-group"><label class="form-label">Check-out Date *</label>
          <input type="date" class="form-input" name="checkoutDate" value="${daysFromNow(1)}" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Price/Night *</label>
          <input type="number" class="form-input" name="pricePerNight" step="0.01" required /></div>
        <div class="form-group"><label class="form-label">Adults</label>
          <input type="number" class="form-input" name="numAdults" value="1" min="1" /></div>
      </div>

      <h4 style="font-weight:600; margin:var(--space-4) 0 var(--space-2); color:var(--text-primary);">Primary Guest *</h4>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Guest Name *</label>
          <input class="form-input" name="guestName" required /></div>
        <div class="form-group"><label class="form-label">Phone</label>
          <input class="form-input" name="guestPhone" /></div>
      </div>
      <div class="form-group"><label class="form-label">Guest Email</label>
        <input type="email" class="form-input" name="guestEmail" /></div>
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="bk-submit">Create Booking</button>
    </div></form>
  `, { size: 'lg' });
    initIcons();

    document.getElementById('booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = {
            status: f.status.value,
            source: f.source.value,
            paymentStatus: f.paymentStatus.value,
            currency: f.currency.value,
            totalAmount: parseFloat(f.totalAmount.value),
            advanceAmount: f.advanceAmount.value ? parseFloat(f.advanceAmount.value) : undefined,
            notes: f.notes.value || undefined,
            items: [{
                roomTypeId: parseInt(f.roomTypeId.value),
                roomId: parseInt(f.roomId.value),
                checkinDate: f.checkinDate.value,
                checkoutDate: f.checkoutDate.value,
                pricePerNight: parseFloat(f.pricePerNight.value),
                numAdults: f.numAdults.value ? parseInt(f.numAdults.value) : 1,
                numChildren: 0,
            }],
            guests: [{
                name: f.guestName.value,
                phone: f.guestPhone.value || undefined,
                email: f.guestEmail.value || undefined,
                isPrimary: true,
            }],
        };
        const btn = document.getElementById('bk-submit'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
        try {
            const res = await bookingsApi.create(prop.id, data);
            showToast(`Booking #${res.data?.id} created!`, 'success');
            closeModal();
            document.getElementById('booking-id-input').value = res.data?.id;
            searchBooking();
        } catch (e) {
            showToast('Error: ' + e.message, 'error');
            btn.disabled = false; btn.innerHTML = 'Create Booking';
        }
    });
}

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
      <div class="form-group"><label class="form-label">Payment Status</label>
        <select class="form-select" name="paymentStatus">
          ${['PENDING', 'PARTIAL', 'PAID', 'REFUNDED'].map(s => `<option value="${s}" ${b.paymentStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Notes</label>
        <textarea class="form-textarea" name="notes">${b.notes || ''}</textarea></div>
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
