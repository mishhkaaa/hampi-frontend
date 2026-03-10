// ===== WEB CHECK-IN PAGE (Public — no auth required) =====
// Accessible via #/checkin — guests scan QR or use shared link
// Supports two modes:
//   ?token=JWT   → submits to POST /public/self-checkin/submit (proper token flow)
//   ?bookingId=N → adds guest directly via POST /bookings/{id}/guests (fallback until backend adds token generation)
import { selfCheckinApi } from '../api.js';
import { showToast, initIcons } from '../utils.js';

const BASE_URL = 'https://sohraa-hms-production-803b.up.railway.app';

export function renderWebCheckin() {
    const app = document.getElementById('app');

    // Read params from hash: #/checkin?token=xxx or #/checkin?bookingId=xxx
    const rawHash = window.location.hash || '';
    const queryStr = rawHash.includes('?') ? rawHash.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    const token = params.get('token');
    const bookingId = params.get('bookingId');
    const propertyName = params.get('property') || 'Sohraa HMS';

    const mode = token ? 'token' : (bookingId ? 'booking' : 'standalone');

    app.innerHTML = `
    <div class="checkin-page">
      <div class="checkin-header">
        <div class="checkin-logo">
          <i data-lucide="hotel" style="width:32px; height:32px; color:#0ea5e9;"></i>
          <span>${propertyName}</span>
        </div>
        <h1 class="checkin-title">Self Check-in</h1>
        <p class="checkin-subtitle">Fill in your details to complete check-in. This only takes a minute.</p>
        ${bookingId ? `<div style="background:rgba(14,165,233,0.1); border:1px solid #0ea5e9; border-radius:10px; padding:10px 16px; margin-top:12px; font-size:13px; color:#0284c7;">
          Booking reference: <strong>#${bookingId}</strong>
        </div>` : ''}
      </div>

      <div class="checkin-steps">
        <div class="checkin-step active" id="step-indicator-1">
          <div class="step-num">1</div><div class="step-label">Verify</div>
        </div>
        <div class="checkin-step-line"></div>
        <div class="checkin-step" id="step-indicator-2">
          <div class="step-num">2</div><div class="step-label">Details</div>
        </div>
        <div class="checkin-step-line"></div>
        <div class="checkin-step" id="step-indicator-3">
          <div class="step-num">3</div><div class="step-label">Done</div>
        </div>
      </div>

      <div class="checkin-card">
        <!-- Step 1: Phone lookup -->
        <div id="checkin-step-1">
          <h2 class="checkin-step-title">Enter your phone number</h2>
          <p class="checkin-step-desc">We'll pre-fill your details if you've stayed with us before.</p>
          <div class="checkin-field">
            <label class="checkin-label">Phone Number *</label>
            <input type="tel" id="ci-phone" class="checkin-input" placeholder="+91 98765 43210" autocomplete="tel" />
          </div>
          <button class="checkin-btn" id="btn-ci-lookup">
            <i data-lucide="search"></i> Continue
          </button>
          <div id="ci-lookup-status" style="margin-top:16px; display:none;"></div>
        </div>

        <!-- Step 2: Guest details form -->
        <div id="checkin-step-2" style="display:none;">
          <h2 class="checkin-step-title">Your Details</h2>
          <p class="checkin-step-desc">Please verify or complete the form below. All guests must fill their ID details.</p>

          <div id="ci-found-banner" style="display:none; background:rgba(14,165,233,0.08); border:1px solid #0ea5e9; border-radius:12px; padding:12px 16px; margin-bottom:16px; font-size:14px; color:#0284c7;">
            <strong>Welcome back!</strong> We found your previous details — please review and confirm.
          </div>

          <form id="ci-details-form">
            <input type="hidden" id="ci-existing-guest-id" value="" />

            <!-- Photo upload -->
            <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:24px;">
              <div style="position:relative; margin-bottom:8px;">
                <div id="ci-photo-circle" style="width:90px; height:90px; border-radius:50%; background:#e0f2fe; border:2px dashed #7dd3fc; display:flex; align-items:center; justify-content:center; overflow:hidden; cursor:pointer;">
                  <i data-lucide="user" style="width:40px; height:40px; color:#7dd3fc;" id="ci-photo-icon"></i>
                  <img id="ci-photo-img" style="width:100%; height:100%; object-fit:cover; display:none;" alt="Your photo" />
                </div>
                <div id="ci-photo-cam" style="position:absolute; bottom:2px; right:2px; width:28px; height:28px; border-radius:50%; background:#0ea5e9; display:flex; align-items:center; justify-content:center; cursor:pointer; border:2px solid white;">
                  <i data-lucide="camera" style="width:14px; height:14px; color:white;"></i>
                </div>
                <input type="file" id="ci-photo-input" accept="image/*" style="display:none;" />
              </div>
              <span style="font-size:12px; color:#64748b;">Tap to upload photo (optional)</span>
            </div>

            <div class="checkin-field-row">
              <div class="checkin-field">
                <label class="checkin-label">Full Name *</label>
                <input type="text" class="checkin-input" name="name" id="ci-name" required placeholder="Full name as on ID" />
              </div>
              <div class="checkin-field">
                <label class="checkin-label">Phone *</label>
                <input type="tel" class="checkin-input" name="phone" id="ci-phone-detail" required placeholder="+91 98765 43210" />
              </div>
            </div>

            <div class="checkin-field-row">
              <div class="checkin-field">
                <label class="checkin-label">Email</label>
                <input type="email" class="checkin-input" name="email" id="ci-email" placeholder="your@email.com" />
              </div>
              <div class="checkin-field">
                <label class="checkin-label">Nationality</label>
                <input type="text" class="checkin-input" name="nationality" id="ci-nationality" placeholder="Indian" />
              </div>
            </div>

            <div class="checkin-field-row">
              <div class="checkin-field">
                <label class="checkin-label">Date of Birth</label>
                <input type="date" class="checkin-input" name="dateOfBirth" id="ci-dob" />
              </div>
              <div class="checkin-field">
                <label class="checkin-label">Purpose of Visit</label>
                <select class="checkin-input" name="purposeOfVisit" id="ci-purpose">
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

            <!-- ID section — required for token/booking mode -->
            <div style="background:rgba(14,165,233,0.05); border:1px solid rgba(14,165,233,0.2); border-radius:10px; padding:16px; margin-bottom:16px;">
              <div style="font-size:13px; font-weight:600; color:#0284c7; margin-bottom:12px;">
                <i data-lucide="shield-check" style="width:14px; height:14px; display:inline; margin-right:4px;"></i>
                Government ID (Required)
              </div>
              <div class="checkin-field-row">
                <div class="checkin-field">
                  <label class="checkin-label">ID Type *</label>
                  <select class="checkin-input" name="idType" id="ci-id-type" required>
                    <option value="">— Select —</option>
                    <option value="AADHAR">Aadhar Card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="PAN_CARD">PAN Card</option>
                    <option value="VOTER_ID">Voter ID</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div class="checkin-field">
                  <label class="checkin-label">ID / Document Number *</label>
                  <input type="text" class="checkin-input" name="idNumber" id="ci-id-number" required placeholder="Aadhar / Passport number" />
                </div>
              </div>
            </div>

            <div class="checkin-field">
              <label class="checkin-label">Residential Address</label>
              <textarea class="checkin-input" name="address" id="ci-address" rows="3" placeholder="Your home address"></textarea>
            </div>

            <button type="submit" class="checkin-btn" id="ci-submit-btn">
              <i data-lucide="check-circle"></i> Submit Check-in Details
            </button>
          </form>
        </div>

        <!-- Step 3: Success -->
        <div id="checkin-step-3" style="display:none; text-align:center; padding:32px 0;">
          <div style="width:72px; height:72px; border-radius:50%; background:rgba(16,185,129,0.12); display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
            <i data-lucide="check-circle" style="width:40px; height:40px; color:#10b981;"></i>
          </div>
          <h2 style="color:#0f172a; margin-bottom:8px;">You're all set!</h2>
          <p style="color:#64748b; margin-bottom:24px; line-height:1.6;">
            Your details have been saved and sent to reception. Just show this screen when you arrive — no waiting needed.
          </p>
          <div id="ci-confirmation-name" style="font-size:22px; font-weight:700; color:#0ea5e9; margin-bottom:4px;"></div>
          <div id="ci-confirmation-phone" style="font-size:15px; color:#64748b; margin-bottom:4px;"></div>
          <div id="ci-confirmation-id" style="font-size:13px; color:#94a3b8; margin-bottom:16px;"></div>
          <div style="margin-top:24px; padding:16px; background:rgba(14,165,233,0.06); border-radius:12px;">
            <p style="color:#475569; font-size:14px; margin:0;">
              <i data-lucide="info" style="width:14px; height:14px; display:inline; margin-right:4px;"></i>
              No further action needed. See you soon!
            </p>
          </div>
        </div>
      </div>

      <div class="checkin-footer">
        Powered by <strong>Sohraa HMS</strong>
      </div>
    </div>
  `;

    initIcons();
    bindCheckinEvents(mode, token, bookingId);
}

function setStep(n) {
    [1, 2, 3].forEach(i => {
        const step = document.getElementById(`checkin-step-${i}`);
        const indicator = document.getElementById(`step-indicator-${i}`);
        if (step) step.style.display = i === n ? '' : 'none';
        if (indicator) {
            indicator.classList.toggle('active', i <= n);
            indicator.classList.toggle('done', i < n);
        }
    });
}

function bindCheckinEvents(mode, token, bookingId) {
    // Photo upload
    const photoCircle = document.getElementById('ci-photo-circle');
    const photoCam = document.getElementById('ci-photo-cam');
    const photoInput = document.getElementById('ci-photo-input');
    [photoCircle, photoCam].forEach(el => el.addEventListener('click', () => photoInput.click()));
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('ci-photo-img').src = ev.target.result;
            document.getElementById('ci-photo-img').style.display = 'block';
            document.getElementById('ci-photo-icon').style.display = 'none';
        };
        reader.readAsDataURL(file);
    });

    // Step 1: phone lookup — try to pre-fill from existing guest record
    const lookupBtn = document.getElementById('btn-ci-lookup');
    lookupBtn.addEventListener('click', async () => {
        const phone = document.getElementById('ci-phone').value.trim();
        if (!phone) { showToast('Please enter your phone number', 'error'); return; }

        lookupBtn.disabled = true;
        lookupBtn.innerHTML = '<span class="ci-spinner"></span> Looking up…';

        try {
            const res = await fetch(`${BASE_URL}/guests?phone=${encodeURIComponent(phone)}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                const guests = data.data || [];
                if (guests.length > 0) {
                    const g = guests[0];
                    document.getElementById('ci-name').value = g.name || '';
                    document.getElementById('ci-email').value = g.email || '';
                    document.getElementById('ci-nationality').value = g.nationality || '';
                    document.getElementById('ci-dob').value = g.dateOfBirth ? g.dateOfBirth.split('T')[0] : '';
                    document.getElementById('ci-purpose').value = g.purposeOfVisit || '';
                    document.getElementById('ci-id-type').value = g.idType || '';
                    document.getElementById('ci-id-number').value = g.idNumber || '';
                    document.getElementById('ci-address').value = g.address || '';
                    document.getElementById('ci-found-banner').style.display = 'block';
                }
            }
        } catch (_) { /* silently ignore — just show the empty form */ }

        document.getElementById('ci-phone-detail').value = phone;
        setStep(2);
        initIcons();
        lookupBtn.disabled = false;
        lookupBtn.innerHTML = '<i data-lucide="search"></i> Continue';
        initIcons();
    });

    document.getElementById('ci-phone').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); lookupBtn.click(); }
    });

    // Step 2: form submit
    document.getElementById('ci-details-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const submitBtn = document.getElementById('ci-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="ci-spinner"></span> Saving…';

        const name = f.name.value.trim();
        const phone = f.phone.value.trim();
        const idType = f.idType.value;
        const idNumber = f.idNumber.value.trim();

        if (!idType || !idNumber) {
            showToast('Government ID type and number are required', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check-circle"></i> Submit Check-in Details';
            initIcons();
            return;
        }

        try {
            if (mode === 'token' && token) {
                // Official token-based self-checkin — submits to backend
                await selfCheckinApi.submit(token, [{
                    name,
                    govIdType: idType,
                    govIdNumber: idNumber,
                    govDocumentUrl: null,
                    isPrimary: true,
                }]);
            } else if (mode === 'booking' && bookingId) {
                // Fallback: add guest directly to booking
                await fetch(`${BASE_URL}/bookings/${bookingId}/guests`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        phone: phone || undefined,
                        email: f.email.value.trim() || undefined,
                        nationality: f.nationality.value.trim() || undefined,
                        dateOfBirth: f.dateOfBirth.value || undefined,
                        idType,
                        idNumber,
                        address: f.address.value.trim() || undefined,
                        isPrimary: true,
                    }),
                });
            }
            // standalone mode: just save locally
            sessionStorage.setItem('webCheckinData', JSON.stringify({ name, phone, idType, idNumber, submittedAt: new Date().toISOString() }));

            // Show success
            document.getElementById('ci-confirmation-name').textContent = name;
            document.getElementById('ci-confirmation-phone').textContent = phone || '';
            document.getElementById('ci-confirmation-id').textContent = idType ? `${idType.replace(/_/g, ' ')}: ${idNumber}` : '';
            setStep(3);
        } catch (err) {
            showToast('Submission failed: ' + err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check-circle"></i> Submit Check-in Details';
            initIcons();
        }
    });
}
