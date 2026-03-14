// ===== GUESTS PAGE =====
import { renderLayout } from '../layout.js';
import { bookingsApi, guestsApi, selfCheckinApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, formatDate, initIcons, store, handlePropertyNotFound } from '../utils.js';

const BASE_URL = 'https://hmsapi.sohraa.com';

let _bookings = [];

export async function renderGuests() {
    const prop = store.getState().currentProperty;
    if (!prop) { window.location.hash = '#/properties'; return; }
    renderLayout('<div class="loading-spinner"></div>', 'guests');
    await loadGuests();
}

async function loadGuests() {
    const prop = store.getState().currentProperty;
    const pc = document.getElementById('page-content');
    pc.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const res = await bookingsApi.getByProperty(prop.id);
        _bookings = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
        if (handlePropertyNotFound(e)) return;
        _bookings = [];
    }

    try {
        renderGuestList();
    } catch (err) {
        const errPc = document.getElementById('page-content');
        if (errPc) errPc.innerHTML = `<div class="empty-state"><p style="color:var(--danger);">Failed to render guests: ${err.message}</p></div>`;
    }
}

function renderGuestList() {
    const prop = store.getState().currentProperty;
    const pc = document.getElementById('page-content');

    // Flatten all guests across all bookings
    const guestRows = [];
    for (const b of _bookings) {
        const guests = b.guests || [];
        const primaryGuest = guests.find(g => g.isPrimary) || guests[0];
        const items = b.items || [];
        const checkin = items[0]?.checkinDate;
        const checkout = items[items.length - 1]?.checkoutDate;
        guestRows.push({ booking: b, primaryGuest, checkin, checkout });
    }

    // Build checkin URL helper
    const checkinBase = `${window.location.origin}${window.location.pathname}#/checkin`;

    pc.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Guests</h1>
        <p>All guest records and check-in management for ${prop.name}</p>
      </div>
      <button class="btn btn-primary" id="btn-guest-lookup">
        <i data-lucide="search"></i> Lookup Guest
      </button>
    </div>

    <!-- QR / Self Check-in Section -->
    <div class="card" style="margin-bottom: var(--space-6); background: linear-gradient(135deg, rgba(14,165,233,0.06), rgba(14,165,233,0.02)); border: 1px solid rgba(14,165,233,0.2);">
      <div class="card-header" style="border-bottom: 1px solid rgba(14,165,233,0.15);">
        <h3 class="card-title" style="color: var(--accent-primary);">
          <i data-lucide="qr-code" style="width:18px;height:18px;display:inline;margin-right:6px;"></i>
          QR Self Check-in
        </h3>
      </div>
      <div style="padding: var(--space-4);">
        <p style="color: var(--text-secondary); font-size: var(--font-sm); margin-bottom: var(--space-4);">
          Generate a QR code for a specific booking so guests can self-register their details before arrival.
          Print or share the link — no login needed.
        </p>
        <div style="display: flex; gap: var(--space-3); align-items: flex-end; flex-wrap: wrap;">
          <div class="form-group" style="flex: 1; min-width: 180px; margin-bottom: 0;">
            <label class="form-label">Booking ID</label>
            <input type="number" class="form-input" id="qr-booking-id" placeholder="Enter booking ID" />
          </div>
          <button class="btn btn-primary" id="btn-gen-qr">
            <i data-lucide="qr-code"></i> Generate QR
          </button>
        </div>
        <div id="qr-result" style="margin-top: var(--space-4); display: none;">
          <div style="display: flex; gap: var(--space-6); align-items: flex-start; flex-wrap: wrap;">
            <div id="qr-image-box" style="flex-shrink: 0;"></div>
            <div style="flex: 1; min-width: 200px;">
              <div style="font-size: var(--font-sm); font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">
                Check-in link for booking <span id="qr-booking-label"></span>:
              </div>
              <div style="display: flex; gap: var(--space-2); align-items: center;">
                <input type="text" class="form-input" id="qr-link-input" readonly style="font-size: var(--font-xs); flex: 1;" />
                <button class="btn btn-secondary btn-sm" id="btn-copy-link">
                  <i data-lucide="copy"></i> Copy
                </button>
              </div>
              <p style="font-size: var(--font-xs); color: var(--text-muted); margin-top: var(--space-2);">
                Guest scans this QR or opens the link — no login required.
                Link submits details to the booking.
              </p>
              <button class="btn btn-secondary btn-sm" id="btn-print-qr" style="margin-top: var(--space-3);">
                <i data-lucide="printer"></i> Print QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Guest History Table -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Guest History <span class="badge badge-info" style="margin-left:6px;">${guestRows.length}</span></h3>
      </div>
      ${guestRows.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="users"></i>
          <h3>No guests yet</h3>
          <p>Guest records appear here once bookings are created with guest details.</p>
        </div>
      ` : `
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Guest</th>
                <th>Contact</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${guestRows.map(({ booking: b, primaryGuest, checkin, checkout }) => `
                <tr>
                  <td style="font-weight:700; color:var(--text-primary);">#${b.id}</td>
                  <td>
                    <div style="font-weight:600; color:var(--text-primary);">${primaryGuest?.name || '—'}</div>
                    ${b.guests && b.guests.length > 1 ? `<div style="font-size:var(--font-xs); color:var(--text-muted);">+${b.guests.length - 1} more guest(s)</div>` : ''}
                  </td>
                  <td>
                    ${primaryGuest?.phone ? `<div style="font-size:var(--font-sm);">${primaryGuest.phone}</div>` : ''}
                    ${primaryGuest?.email ? `<div style="font-size:var(--font-xs); color:var(--text-muted);">${primaryGuest.email}</div>` : ''}
                    ${!primaryGuest?.phone && !primaryGuest?.email ? '—' : ''}
                  </td>
                  <td>${formatDate(checkin)}</td>
                  <td>${formatDate(checkout)}</td>
                  <td>${statusBadge(b.status)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-ghost btn-sm btn-view-guests" data-bid="${b.id}" title="View guests">
                        <i data-lucide="users"></i>
                      </button>
                      <button class="btn btn-ghost btn-sm btn-qr-this" data-bid="${b.id}" title="Generate QR">
                        <i data-lucide="qr-code"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

    initIcons();

    // Guest phone lookup modal
    document.getElementById('btn-guest-lookup')?.addEventListener('click', () => showGuestLookupModal());

    // Quick QR buttons in table
    document.querySelectorAll('.btn-qr-this').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('qr-booking-id').value = btn.dataset.bid;
            document.getElementById('btn-gen-qr').click();
            document.getElementById('qr-result').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // View guests per booking
    document.querySelectorAll('.btn-view-guests').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = _bookings.find(bk => bk.id == btn.dataset.bid);
            if (b) showBookingGuestsModal(b);
        });
    });

    // QR generation — tries token endpoint first, falls back to bookingId mode
    document.getElementById('btn-gen-qr')?.addEventListener('click', async () => {
        const bid = document.getElementById('qr-booking-id').value.trim();
        if (!bid) { showToast('Enter a booking ID first', 'error'); return; }
        const btn = document.getElementById('btn-gen-qr');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Generating…';
        let checkinUrl;
        try {
            const res = await selfCheckinApi.generateToken(parseInt(bid));
            const token = res?.data?.token || res?.token;
            checkinUrl = token
                ? `${checkinBase}?token=${encodeURIComponent(token)}`
                : `${checkinBase}?bookingId=${bid}`;
        } catch (_e) {
            checkinUrl = `${checkinBase}?bookingId=${bid}`;
        }
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="qr-code"></i> Generate QR';
        initIcons();
        generateCheckinQR(bid, checkinUrl);
    });

    // Copy link
    document.getElementById('btn-copy-link')?.addEventListener('click', () => {
        const input = document.getElementById('qr-link-input');
        if (input) {
            navigator.clipboard.writeText(input.value).then(() => showToast('Link copied!', 'success'));
        }
    });

    // Print QR
    document.getElementById('btn-print-qr')?.addEventListener('click', () => {
        const qrBox = document.getElementById('qr-image-box');
        const link = document.getElementById('qr-link-input')?.value || '';
        const bid = document.getElementById('qr-booking-label')?.textContent || '';
        const win = window.open('', '_blank');
        win.document.write(`<!DOCTYPE html><html><head><title>Check-in QR</title></head><body style="text-align:center;font-family:sans-serif;padding:40px;">
          <h2>Self Check-in</h2>
          <p>Booking <strong>${bid}</strong></p>
          ${qrBox.innerHTML}
          <p style="word-break:break-all; font-size:12px; color:#666; margin-top:16px;">${link}</p>
          <p style="color:#999; font-size:11px;">Scan this QR code to complete your check-in details.</p>
        </body></html>`);
        win.document.close();
        win.print();
    });
}

function generateCheckinQR(bookingId, checkinUrl) {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(checkinUrl)}&bgcolor=ffffff&color=0c4a6e&margin=10`;

    document.getElementById('qr-booking-label').textContent = `#${bookingId}`;
    document.getElementById('qr-link-input').value = checkinUrl;
    document.getElementById('qr-image-box').innerHTML = `
      <img src="${qrApiUrl}" alt="QR Code" style="width:180px; height:180px; border-radius:12px; border:2px solid rgba(14,165,233,0.2);"
           onerror="this.parentElement.innerHTML='<div style=\\'padding:12px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; font-size:12px; color:#0284c7;\\'>QR image unavailable offline.<br/>Share the link directly.</div>'" />
    `;
    document.getElementById('qr-result').style.display = 'block';
}

function showGuestLookupModal() {
    showModal(`
    <div class="modal-header">
      <h2>Lookup Guest by Phone</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <div style="display:flex; gap:var(--space-2);">
          <input type="tel" class="form-input" id="gl-phone" placeholder="+91 98765 43210" style="flex:1;" />
          <button class="btn btn-primary" id="btn-gl-search"><i data-lucide="search"></i></button>
        </div>
      </div>
      <div id="gl-result" style="margin-top:var(--space-4);"></div>
    </div>
  `);
    initIcons();

    document.getElementById('btn-gl-search')?.addEventListener('click', async () => {
        const phone = document.getElementById('gl-phone').value.trim();
        if (!phone) return;
        const resultDiv = document.getElementById('gl-result');
        resultDiv.innerHTML = '<div class="loading-spinner"></div>';
        try {
            const res = await fetch(`${BASE_URL}/guests?phone=${encodeURIComponent(phone)}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                const guests = data.data || [];
                if (guests.length === 0) {
                    resultDiv.innerHTML = '<p style="color:var(--text-muted);">No guest found with this phone number.</p>';
                } else {
                    const g = guests[0];
                    resultDiv.innerHTML = `
                      <div style="background:var(--bg-primary); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:var(--space-4);">
                        <div style="font-weight:700; font-size:var(--font-md); color:var(--text-primary); margin-bottom:var(--space-2);">${g.name}</div>
                        ${g.phone ? `<div style="font-size:var(--font-sm); color:var(--text-secondary);">📱 ${g.phone}</div>` : ''}
                        ${g.email ? `<div style="font-size:var(--font-sm); color:var(--text-secondary);">✉ ${g.email}</div>` : ''}
                        ${g.nationality ? `<div style="font-size:var(--font-sm); color:var(--text-muted);">🌍 ${g.nationality}</div>` : ''}
                        ${g.idType ? `<div style="font-size:var(--font-sm); color:var(--text-muted);">${g.idType.replace(/_/g,' ')}: ${g.idNumber || '—'}</div>` : ''}
                        <div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:var(--space-2);">Booking ID: #${g.bookingId || '—'}</div>
                      </div>`;
                }
            } else {
                resultDiv.innerHTML = '<p style="color:var(--text-muted);">Guest lookup not available (backend endpoint needed).</p>';
            }
        } catch (e) {
            resultDiv.innerHTML = `<p style="color:var(--danger);">Error: ${e.message}</p>`;
        }
    });

    document.getElementById('gl-phone')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('btn-gl-search')?.click();
    });
}

async function showBookingGuestsModal(b) {
    showModal(`
    <div class="modal-header">
      <h2>Guests — Booking #${b.id}</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body" id="bgm-body">
      <div class="loading-spinner"></div>
    </div>
  `, { size: 'lg' });
    initIcons();

    try {
        const res = await guestsApi.getByBooking(b.id);
        const guests = res.data || [];
        const body = document.getElementById('bgm-body');
        if (!body) return;

        if (guests.length === 0) {
            body.innerHTML = `
              <p style="color:var(--text-muted); margin-bottom:var(--space-4);">No guests recorded for this booking.</p>
              <div style="background:rgba(14,165,233,0.06); border:1px solid rgba(14,165,233,0.2); border-radius:var(--radius-md); padding:var(--space-4);">
                <p style="font-size:var(--font-sm); color:var(--text-secondary); margin:0;">
                  Share the self check-in QR code so guests can register their details.
                </p>
              </div>`;
            return;
        }

        body.innerHTML = guests.map(g => `
          <div style="background:var(--bg-primary); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:var(--space-4); margin-bottom:var(--space-3);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-3);">
              <div>
                <div style="font-weight:700; color:var(--text-primary);">${g.name}</div>
                ${g.isPrimary ? '<span class="badge badge-success" style="margin-top:4px;">Primary</span>' : ''}
              </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-2); font-size:var(--font-sm);">
              ${g.phone ? `<div><span style="color:var(--text-muted);">Phone</span><br><strong>${g.phone}</strong></div>` : ''}
              ${g.email ? `<div><span style="color:var(--text-muted);">Email</span><br><strong>${g.email}</strong></div>` : ''}
            </div>
          </div>
        `).join('');
        initIcons();
    } catch (e) {
        const body = document.getElementById('bgm-body');
        if (body) body.innerHTML = `<p style="color:var(--danger);">Could not load guests: ${e.message}</p>`;
    }
}
