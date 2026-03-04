// ===== PROPERTIES PAGE =====
import { renderLayout } from '../layout.js';
import { propertiesApi, roomTypesApi, roomsApi, blocksApi, ratePlansApi, rateRulesApi, bookingsApi, guestsApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, initIcons, store } from '../utils.js';

let properties = [];

export async function renderProperties() {
    renderLayout('<div class="loading-spinner"></div>', 'properties');
    await loadProperties();
}

async function loadProperties() {
    try {
        const res = await propertiesApi.getAll();
        properties = res.data || [];
    } catch (err) {
        showToast('Error loading properties: ' + err.message, 'error');
        properties = [];
    }
    renderList();
}

function renderList() {
    const content = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Properties</h1>
        <p>Manage your hotel properties</p>
      </div>
      <div style="display:flex; gap:var(--space-2);">
        <button class="btn btn-secondary" id="btn-demo-data"><i data-lucide="database"></i> Load Demo Data</button>
        <button class="btn btn-primary" id="btn-add-property">
          <i data-lucide="plus"></i> Add Property
        </button>
      </div>
    </div>

    ${properties.length > 0 ? `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>City</th>
              <th>State</th>
              <th>Country</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${properties.map(p => `
              <tr>
                <td>${p.id}</td>
                <td style="color:var(--text-primary); font-weight:600;">${p.name}</td>
                <td>${p.city || '—'}</td>
                <td>${p.state || '—'}</td>
                <td>${p.country || '—'}</td>
                <td>${statusBadge(p.status)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-ghost btn-sm btn-select-prop" data-id="${p.id}" title="Select as active">
                      <i data-lucide="check-circle"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm btn-edit-prop" data-id="${p.id}" title="Edit">
                      <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm btn-delete-prop" data-id="${p.id}" title="Delete" style="color:var(--danger);">
                      <i data-lucide="trash-2"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="empty-state">
        <i data-lucide="building-2"></i>
        <h3>No properties yet</h3>
        <p>Create your first property to get started, or load demo data to explore.</p>
        <div style="display:flex; gap:var(--space-3); justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-secondary" id="btn-add-property-empty"><i data-lucide="plus"></i> Add Property</button>
          <button class="btn btn-primary" id="btn-demo-data-empty"><i data-lucide="database"></i> Load Demo Data</button>
        </div>
      </div>
    `}
  `;

    document.getElementById('page-content').innerHTML = content;
    initIcons();

    // Event bindings
    document.getElementById('btn-add-property')?.addEventListener('click', () => showPropertyForm());
    document.getElementById('btn-add-property-empty')?.addEventListener('click', () => showPropertyForm());
    document.getElementById('btn-demo-data')?.addEventListener('click', () => loadDemoData());
    document.getElementById('btn-demo-data-empty')?.addEventListener('click', () => loadDemoData());

    document.querySelectorAll('.btn-edit-prop').forEach(btn => {
        btn.addEventListener('click', () => {
            const prop = properties.find(p => p.id == btn.dataset.id);
            if (prop) showPropertyForm(prop);
        });
    });

    document.querySelectorAll('.btn-delete-prop').forEach(btn => {
        btn.addEventListener('click', () => {
            const prop = properties.find(p => p.id == btn.dataset.id);
            if (prop) showConfirm('Delete Property', `Are you sure you want to delete "${prop.name}"?`, async () => {
                try {
                    await propertiesApi.delete(prop.id);
                    showToast('Property deleted', 'success');
                    if (store.getState().currentProperty?.id === prop.id) {
                        store.setState({ currentProperty: null });
                    }
                    await loadProperties();
                } catch (err) {
                    showToast('Error: ' + err.message, 'error');
                }
            });
        });
    });

    document.querySelectorAll('.btn-select-prop').forEach(btn => {
        btn.addEventListener('click', () => {
            const prop = properties.find(p => p.id == btn.dataset.id);
            if (prop) {
                store.setState({ currentProperty: prop });
                showToast(`Selected "${prop.name}" as active property`, 'success');
                renderProperties(); // Re-render to update sidebar
            }
        });
    });
}

function showPropertyForm(existing = null) {
    const isEdit = !!existing;
    showModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Edit Property' : 'Add Property'}</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''">
        <i data-lucide="x"></i>
      </button>
    </div>
    <form id="property-form">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Name *</label>
          <input type="text" class="form-input" name="name" value="${existing?.name || ''}" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">City *</label>
            <input type="text" class="form-input" name="city" value="${existing?.city || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">State</label>
            <input type="text" class="form-input" name="state" value="${existing?.state || ''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Country *</label>
            <input type="text" class="form-input" name="country" value="${existing?.country || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Postal Code</label>
            <input type="text" class="form-input" name="postalCode" value="${existing?.postalCode || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Address</label>
          <textarea class="form-textarea" name="address">${existing?.address || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Timezone</label>
            <input type="text" class="form-input" name="timezone" value="${existing?.timezone || 'Asia/Kolkata'}" placeholder="e.g. Asia/Kolkata" />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" name="status">
              <option value="ACTIVE" ${existing?.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
              <option value="INACTIVE" ${existing?.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>

        ${!isEdit ? `
        <hr style="border:none; border-top:1px solid var(--border-color); margin:var(--space-4) 0;" />
        <p style="font-size:var(--font-sm); color:var(--text-secondary); margin-bottom:var(--space-3);">
          <i data-lucide="layers" style="width:14px;height:14px;display:inline;vertical-align:middle;"></i>
          Auto-create rooms (optional)
        </p>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Number of Floors</label>
            <input type="number" class="form-input" name="numFloors" min="0" max="50" value="" placeholder="e.g. 3" />
          </div>
          <div class="form-group">
            <label class="form-label">Rooms per Floor</label>
            <input type="number" class="form-input" name="roomsPerFloor" min="0" max="50" value="" placeholder="e.g. 10" />
          </div>
        </div>
        <p style="font-size:var(--font-xs); color:var(--text-muted); margin-top:calc(var(--space-1)*-1);">
          Rooms will be named: 101, 102 … 201, 202 … etc. A "Standard" room type will be created automatically.
        </p>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
        <button type="submit" class="btn btn-primary" id="prop-submit-btn">${isEdit ? 'Update' : 'Create'}</button>
      </div>
    </form>
  `);
    initIcons();

    document.getElementById('property-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = {
            name: form.name.value,
            city: form.city.value,
            state: form.state.value || undefined,
            country: form.country.value,
            postalCode: form.postalCode.value || undefined,
            address: form.address.value || undefined,
            timezone: form.timezone.value || undefined,
            status: form.status.value,
        };

        const numFloors = !isEdit && form.numFloors?.value ? parseInt(form.numFloors.value) : 0;
        const roomsPerFloor = !isEdit && form.roomsPerFloor?.value ? parseInt(form.roomsPerFloor.value) : 0;

        const btn = document.getElementById('prop-submit-btn');
        btn.innerHTML = '<span class="spinner"></span>';
        btn.disabled = true;

        try {
            if (isEdit) {
                await propertiesApi.update(existing.id, data);
                showToast('Property updated', 'success');
            } else {
                const res = await propertiesApi.create(data);
                const newProp = res.data;
                if (numFloors > 0 && roomsPerFloor > 0 && newProp?.id) {
                    showToast('Property created — generating rooms…', 'info');
                    await bulkCreateRooms(newProp.id, numFloors, roomsPerFloor);
                    showToast(`Created ${numFloors * roomsPerFloor} rooms across ${numFloors} floor(s)`, 'success');
                } else {
                    showToast('Property created', 'success');
                }
            }
            closeModal();
            await loadProperties();
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
            btn.innerHTML = isEdit ? 'Update' : 'Create';
            btn.disabled = false;
        }
    });
}

async function bulkCreateRooms(propertyId, numFloors, roomsPerFloor) {
    // Create a default "Standard" room type first
    let roomTypeId;
    try {
        const rtRes = await roomTypesApi.create(propertyId, {
            name: 'Standard',
            description: 'Standard Room',
            basePrice: 1000,
            maxOccupancy: 2,
        });
        roomTypeId = rtRes.data?.id;
    } catch {
        // Room type creation failed — create rooms without a type
    }

    // Create all rooms in parallel
    const promises = [];
    for (let floor = 1; floor <= numFloors; floor++) {
        for (let room = 1; room <= roomsPerFloor; room++) {
            const roomNumber = `${floor}${String(room).padStart(2, '0')}`;
            const payload = { roomNumber, floorNumber: floor, status: 'AVAILABLE' };
            if (roomTypeId) payload.roomTypeId = roomTypeId;
            promises.push(roomsApi.create(propertyId, payload));
        }
    }
    await Promise.all(promises);
}

async function loadDemoData() {
    showModal(`
    <div class="modal-header">
      <h2>Load Demo Data</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-secondary); margin-bottom:var(--space-4);">
        This creates a fully populated demo hotel so every section of the app has real data to show.
      </p>
      <div style="background:var(--bg-input); border-radius:var(--radius-md); padding:var(--space-4); font-size:var(--font-sm); color:var(--text-secondary); line-height:1.9;">
        <strong style="color:var(--text-primary);">What gets created:</strong><br/>
        🏨 &nbsp;<strong>Grand Horizon Hotel</strong> (Mumbai, India)<br/>
        🏢 &nbsp;2 Blocks — Block A &amp; Block B<br/>
        🛏️ &nbsp;3 Room types — Standard, Deluxe, Suite<br/>
        🚪 &nbsp;15 rooms across 3 floors<br/>
        💰 &nbsp;Rate plan with per-night rules<br/>
        📅 &nbsp;3 Bookings (Confirmed, Checked-in, Checked-out)<br/>
        👥 &nbsp;5 Guests with full details &amp; phone numbers<br/>
        <span style="color:var(--accent-primary); margin-top:4px; display:block;">✓ Guests can be looked up via Web Check-in using their phone number</span>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="button" class="btn btn-primary" id="btn-confirm-demo"><i data-lucide="database"></i> Create Demo Data</button>
    </div>
  `);
    initIcons();

    document.getElementById('btn-confirm-demo').addEventListener('click', async () => {
        const btn = document.getElementById('btn-confirm-demo');
        btn.disabled = true;

        const steps = [
            'Creating property…',
            'Creating room types…',
            'Creating blocks…',
            'Creating rooms…',
            'Creating rate plan…',
            'Creating bookings & guests…',
            'Finishing up…',
        ];
        let stepIdx = 0;
        const setStep = (i) => {
            stepIdx = i;
            btn.innerHTML = `<span class="spinner"></span> ${steps[i]}`;
        };
        setStep(0);

        try {
            // 1. Property
            const propRes = await propertiesApi.create({
                name: 'Grand Horizon Hotel',
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                postalCode: '400001',
                address: '1 Marine Drive, Nariman Point',
                timezone: 'Asia/Kolkata',
                status: 'ACTIVE',
            });
            const prop = propRes.data;
            const pid = prop.id;

            // 2. Room Types
            setStep(1);
            const [rtStd, rtDlx, rtSuite] = await Promise.all([
                roomTypesApi.create(pid, { name: 'Standard', description: 'Cozy room with city view', basePrice: 2500, maxOccupancy: 2 }),
                roomTypesApi.create(pid, { name: 'Deluxe', description: 'Spacious deluxe room with sea view', basePrice: 4500, maxOccupancy: 3 }),
                roomTypesApi.create(pid, { name: 'Suite', description: 'Luxury suite with private lounge', basePrice: 8500, maxOccupancy: 4 }),
            ]);
            const stdId = rtStd.data?.id, dlxId = rtDlx.data?.id, suiteId = rtSuite.data?.id;

            // 3. Blocks
            setStep(2);
            const [blkA, blkB] = await Promise.all([
                blocksApi.create(pid, { name: 'Block A', description: 'Main wing — Standard & Deluxe rooms' }),
                blocksApi.create(pid, { name: 'Block B', description: 'Premium wing — Suites' }),
            ]);
            const blockAId = blkA.data?.id, blockBId = blkB.data?.id;

            // 4. Rooms (15 rooms: floors 1-2 in Block A, floor 3 in Block B)
            setStep(3);
            const roomPayloads = [
                // Block A — Floor 1 (Standard)
                { roomNumber: '101', floorNumber: 1, roomTypeId: stdId, blockId: blockAId, status: 'OCCUPIED' },
                { roomNumber: '102', floorNumber: 1, roomTypeId: stdId, blockId: blockAId, status: 'AVAILABLE' },
                { roomNumber: '103', floorNumber: 1, roomTypeId: stdId, blockId: blockAId, status: 'OCCUPIED' },
                { roomNumber: '104', floorNumber: 1, roomTypeId: stdId, blockId: blockAId, status: 'AVAILABLE' },
                { roomNumber: '105', floorNumber: 1, roomTypeId: stdId, blockId: blockAId, status: 'MAINTENANCE' },
                // Block A — Floor 2 (Deluxe)
                { roomNumber: '201', floorNumber: 2, roomTypeId: dlxId, blockId: blockAId, status: 'OCCUPIED' },
                { roomNumber: '202', floorNumber: 2, roomTypeId: dlxId, blockId: blockAId, status: 'AVAILABLE' },
                { roomNumber: '203', floorNumber: 2, roomTypeId: dlxId, blockId: blockAId, status: 'AVAILABLE' },
                { roomNumber: '204', floorNumber: 2, roomTypeId: dlxId, blockId: blockAId, status: 'AVAILABLE' },
                { roomNumber: '205', floorNumber: 2, roomTypeId: dlxId, blockId: blockAId, status: 'AVAILABLE' },
                // Block B — Floor 3 (Suites)
                { roomNumber: '301', floorNumber: 3, roomTypeId: suiteId, blockId: blockBId, status: 'OCCUPIED' },
                { roomNumber: '302', floorNumber: 3, roomTypeId: suiteId, blockId: blockBId, status: 'AVAILABLE' },
                { roomNumber: '303', floorNumber: 3, roomTypeId: suiteId, blockId: blockBId, status: 'AVAILABLE' },
                { roomNumber: '304', floorNumber: 3, roomTypeId: suiteId, blockId: blockBId, status: 'AVAILABLE' },
                { roomNumber: '305', floorNumber: 3, roomTypeId: suiteId, blockId: blockBId, status: 'OUT_OF_SERVICE' },
            ];
            const roomResults = await Promise.all(roomPayloads.map(r => roomsApi.create(pid, r)));
            const roomIds = roomResults.map(r => r.data?.id).filter(Boolean);

            // 5. Rate plan + rules
            setStep(4);
            const rpRes = await ratePlansApi.create(pid, {
                name: 'Standard Rack Rate',
                description: 'Default nightly rates',
                isActive: true,
            });
            const rpId = rpRes.data?.id;
            if (rpId) {
                await Promise.all([
                    rateRulesApi.create(rpId, { name: 'Standard Weekday', roomTypeId: stdId, basePrice: 2500, startDate: '2026-01-01', endDate: '2026-12-31' }),
                    rateRulesApi.create(rpId, { name: 'Deluxe Weekday', roomTypeId: dlxId, basePrice: 4500, startDate: '2026-01-01', endDate: '2026-12-31' }),
                    rateRulesApi.create(rpId, { name: 'Suite Weekday', roomTypeId: suiteId, basePrice: 8500, startDate: '2026-01-01', endDate: '2026-12-31' }),
                ].map(p => p.catch(() => null)));
            }

            // 6. Bookings + Guests
            setStep(5);
            const today = new Date();
            const fmt = (d) => d.toISOString().split('T')[0];
            const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

            // Booking 1: CHECKED_IN (currently staying) — rooms 101, 201
            const bk1Res = await bookingsApi.create(pid, {
                status: 'CHECKED_IN',
                source: 'DIRECT',
                paymentStatus: 'PARTIAL',
                currency: 'INR',
                totalAmount: 21000,
                advanceAmount: 10000,
                notes: 'Couple celebrating anniversary. Sea-view room requested.',
                items: [
                    { roomId: roomIds[0], checkinDate: fmt(addDays(today, -2)), checkoutDate: fmt(addDays(today, 3)), pricePerNight: 2500, numAdults: 2, numChildren: 0 },
                    { roomId: roomIds[5], checkinDate: fmt(addDays(today, -2)), checkoutDate: fmt(addDays(today, 3)), pricePerNight: 4500, numAdults: 2, numChildren: 0 },
                ],
                guests: [
                    { name: 'Rajesh Kumar', phone: '+919876543210', email: 'rajesh.kumar@gmail.com', nationality: 'Indian', dateOfBirth: '1985-04-12', idType: 'AADHAR', idNumber: '3456-7890-1234', address: '14, MG Road, Bangalore, Karnataka 560001', purposeOfVisit: 'Tourism', isPrimary: true },
                    { name: 'Priya Kumar', phone: '+919876543211', email: 'priya.kumar@gmail.com', nationality: 'Indian', dateOfBirth: '1988-09-25', idType: 'PASSPORT', idNumber: 'M1234567', address: '14, MG Road, Bangalore, Karnataka 560001', purposeOfVisit: 'Tourism', isPrimary: false },
                ],
            }).catch(() => null);

            // Booking 2: CONFIRMED (upcoming) — room 301 (Suite)
            const bk2Res = await bookingsApi.create(pid, {
                status: 'CONFIRMED',
                source: 'ONLINE',
                paymentStatus: 'PENDING',
                currency: 'INR',
                totalAmount: 25500,
                advanceAmount: 5000,
                notes: 'Corporate client. Needs early check-in at 10 AM.',
                items: [
                    { roomId: roomIds[10], checkinDate: fmt(addDays(today, 5)), checkoutDate: fmt(addDays(today, 8)), pricePerNight: 8500, numAdults: 1, numChildren: 0 },
                ],
                guests: [
                    { name: 'Ananya Sharma', phone: '+919988776655', email: 'ananya.sharma@techcorp.in', nationality: 'Indian', dateOfBirth: '1990-11-03', idType: 'PAN_CARD', idNumber: 'ABCPS1234D', address: '22, Bandra West, Mumbai 400050', purposeOfVisit: 'Business', isPrimary: true },
                ],
            }).catch(() => null);

            // Booking 3: CHECKED_OUT (past) — room 203
            const bk3Res = await bookingsApi.create(pid, {
                status: 'CHECKED_OUT',
                source: 'WALK_IN',
                paymentStatus: 'PAID',
                currency: 'INR',
                totalAmount: 13500,
                advanceAmount: 13500,
                notes: 'Family vacation.',
                items: [
                    { roomId: roomIds[7], checkinDate: fmt(addDays(today, -10)), checkoutDate: fmt(addDays(today, -7)), pricePerNight: 4500, numAdults: 2, numChildren: 1 },
                ],
                guests: [
                    { name: 'Amit Singh', phone: '+918765432109', email: 'amit.singh@yahoo.com', nationality: 'Indian', dateOfBirth: '1978-06-18', idType: 'DRIVING_LICENSE', idNumber: 'DL-0420110012345', address: '7, Patel Nagar, New Delhi 110008', purposeOfVisit: 'Family', isPrimary: true },
                    { name: 'Sunita Singh', phone: '+918765432108', email: 'sunita.singh@yahoo.com', nationality: 'Indian', dateOfBirth: '1982-03-22', idType: 'AADHAR', idNumber: '9876-5432-1098', address: '7, Patel Nagar, New Delhi 110008', purposeOfVisit: 'Family', isPrimary: false },
                ],
            }).catch(() => null);

            // 7. Set as active property
            setStep(6);
            store.setState({ currentProperty: prop });

            closeModal();
            showToast('Demo data loaded! Grand Horizon Hotel is ready to explore.', 'success');
            await loadProperties();
        } catch (err) {
            showToast('Error creating demo data: ' + err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="database"></i> Create Demo Data';
            initIcons();
        }
    });
}
