// ===== WEB CHECK-IN PAGE (Public) =====
// Accessible via #/checkin — no auth required
// Guests scan QR → enter phone → system looks up data → pre-fill form → submit pre-registration
import { guestsApi } from '../api.js';
import { showToast, initIcons } from '../utils.js';

export function renderWebCheckin() {
    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="checkin-page">
      <!-- Header -->
      <div class="checkin-header">
        <div class="checkin-logo">
          <i data-lucide="hotel" style="width:32px; height:32px; color:#0ea5e9;"></i>
          <span>Sohraa HMS</span>
        </div>
        <h1 class="checkin-title">Online Check-in</h1>
        <p class="checkin-subtitle">Complete your check-in details in advance to save time at reception.</p>
      </div>

      <!-- Steps indicator -->
      <div class="checkin-steps">
        <div class="checkin-step active" id="step-indicator-1">
          <div class="step-num">1</div>
          <div class="step-label">Verify</div>
        </div>
        <div class="checkin-step-line"></div>
        <div class="checkin-step" id="step-indicator-2">
          <div class="step-num">2</div>
          <div class="step-label">Details</div>
        </div>
        <div class="checkin-step-line"></div>
        <div class="checkin-step" id="step-indicator-3">
          <div class="step-num">3</div>
          <div class="step-label">Done</div>
        </div>
      </div>

      <div class="checkin-card">

        <!-- Step 1: Phone lookup -->
        <div id="checkin-step-1">
          <h2 class="checkin-step-title">Enter your phone number</h2>
          <p class="checkin-step-desc">We'll look up your previous stay details or create a new profile for you.</p>
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
          <p class="checkin-step-desc">Please verify or fill in the details below.</p>

          <div id="ci-found-banner" style="display:none; background:rgba(14,165,233,0.08); border:1px solid #0ea5e9; border-radius:12px; padding:12px 16px; margin-bottom:16px; font-size:14px; color:#0284c7;">
            <i data-lucide="user-check" style="width:16px; height:16px; display:inline;"></i>
            <strong>Welcome back!</strong> We found your previous details. Please review and confirm below.
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
              <span style="font-size:12px; color:#64748b;">Tap to upload your photo (optional)</span>
            </div>

            <div class="checkin-field-row">
              <div class="checkin-field">
                <label class="checkin-label">Full Name *</label>
                <input type="text" class="checkin-input" name="name" id="ci-name" required placeholder="Your full name" autocomplete="name" />
              </div>
              <div class="checkin-field">
                <label class="checkin-label">Phone *</label>
                <input type="tel" class="checkin-input" name="phone" id="ci-phone-detail" required placeholder="+91 98765 43210" autocomplete="tel" />
              </div>
            </div>

            <div class="checkin-field-row">
              <div class="checkin-field">
                <label class="checkin-label">Email</label>
                <input type="email" class="checkin-input" name="email" id="ci-email" placeholder="your@email.com" autocomplete="email" />
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

            <div class="checkin-field-row">
              <div class="checkin-field">
                <label class="checkin-label">ID Type</label>
                <select class="checkin-input" name="idType" id="ci-id-type">
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
                <label class="checkin-label">ID / Document Number</label>
                <input type="text" class="checkin-input" name="idNumber" id="ci-id-number" placeholder="Aadhar / Passport number" />
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
          <div id="ci-confirmation-photo" style="margin:0 auto 16px; width:72px; height:72px; border-radius:50%; overflow:hidden; display:none;">
            <img id="ci-conf-photo-img" style="width:100%; height:100%; object-fit:cover;" alt="" />
          </div>
          <h2 style="color:#0f172a; margin-bottom:8px;">You're all set!</h2>
          <p style="color:#64748b; margin-bottom:24px; line-height:1.6;">
            Your details have been saved. Just show this confirmation at the reception when you arrive.
          </p>
          <div id="ci-confirmation-name" style="font-size:22px; font-weight:700; color:#0ea5e9; margin-bottom:4px;"></div>
          <div id="ci-confirmation-phone" style="font-size:15px; color:#64748b; margin-bottom:4px;"></div>
          <div id="ci-confirmation-purpose" style="font-size:13px; color:#94a3b8;"></div>
          <div style="margin-top:32px; padding:16px; background:rgba(14,165,233,0.06); border-radius:12px;">
            <p style="color:#475569; font-size:14px; margin:0;">
              <i data-lucide="info" style="width:14px; height:14px; display:inline; margin-right:4px;"></i>
              No further action needed. See you soon!
            </p>
          </div>
        </div>

      </div>

      <div class="checkin-footer">
        Powered by <strong>Sohraa HMS</strong> &nbsp;&bull;&nbsp;
        <a href="#/" style="color:#0ea5e9;">Back to app</a>
      </div>
    </div>
  `;

    initIcons();
    bindCheckinEvents();
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

function bindCheckinEvents() {
    // Photo upload
    const photoCircle = document.getElementById('ci-photo-circle');
    const photoCam = document.getElementById('ci-photo-cam');
    const photoInput = document.getElementById('ci-photo-input');
    const triggerPhoto = () => photoInput.click();
    photoCircle.addEventListener('click', triggerPhoto);
    photoCam.addEventListener('click', triggerPhoto);
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

    // Step 1: phone lookup
    document.getElementById('btn-ci-lookup').addEventListener('click', async () => {
        const phone = document.getElementById('ci-phone').value.trim();
        if (!phone) { showToast('Please enter your phone number', 'error'); return; }

        const btn = document.getElementById('btn-ci-lookup');
        btn.disabled = true;
        btn.innerHTML = '<span class="ci-spinner"></span> Looking up…';

        try {
            const res = await guestsApi.getByPhone(phone);
            const guests = res.data || [];

            document.getElementById('ci-phone-detail').value = phone;

            if (guests.length > 0) {
                const g = guests[0];
                document.getElementById('ci-existing-guest-id').value = g.id || '';
                document.getElementById('ci-name').value = g.name || '';
                document.getElementById('ci-email').value = g.email || '';
                document.getElementById('ci-nationality').value = g.nationality || '';
                document.getElementById('ci-dob').value = g.dateOfBirth ? g.dateOfBirth.split('T')[0] : '';
                document.getElementById('ci-purpose').value = g.purposeOfVisit || '';
                document.getElementById('ci-id-type').value = g.idType || '';
                document.getElementById('ci-id-number').value = g.idNumber || '';
                document.getElementById('ci-address').value = g.address || '';
                if (g.photoUrl) {
                    document.getElementById('ci-photo-img').src = g.photoUrl;
                    document.getElementById('ci-photo-img').style.display = 'block';
                    document.getElementById('ci-photo-icon').style.display = 'none';
                }

                const banner = document.getElementById('ci-found-banner');
                banner.style.display = 'block';
                initIcons();
            }

            setStep(2);
        } catch {
            document.getElementById('ci-phone-detail').value = phone;
            setStep(2);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="search"></i> Continue';
            initIcons();
        }
    });

    // Allow Enter key in phone field
    document.getElementById('ci-phone').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btn-ci-lookup').click(); }
    });

    // Step 2: form submit
    document.getElementById('ci-details-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const submitBtn = document.getElementById('ci-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="ci-spinner"></span> Saving…';

        const photoImg = document.getElementById('ci-photo-img');
        const photoUrl = (photoImg.style.display !== 'none' && photoImg.src) ? photoImg.src : undefined;

        const data = {
            name: f.name.value.trim(),
            phone: f.phone.value.trim() || undefined,
            email: f.email.value.trim() || undefined,
            nationality: f.nationality.value.trim() || undefined,
            dateOfBirth: f.dateOfBirth.value || undefined,
            purposeOfVisit: f.purposeOfVisit.value || undefined,
            idType: f.idType.value || undefined,
            idNumber: f.idNumber.value.trim() || undefined,
            address: f.address.value.trim() || undefined,
            isPrimary: true,
            photoUrl,
        };

        try {
            sessionStorage.setItem('webCheckinData', JSON.stringify({
                ...data,
                submittedAt: new Date().toISOString(),
                existingGuestId: document.getElementById('ci-existing-guest-id').value || null,
            }));

            // Populate success screen
            document.getElementById('ci-confirmation-name').textContent = data.name;
            document.getElementById('ci-confirmation-phone').textContent = data.phone || '';
            if (data.purposeOfVisit) {
                document.getElementById('ci-confirmation-purpose').textContent = '✈ ' + data.purposeOfVisit;
            }
            if (photoUrl) {
                document.getElementById('ci-conf-photo-img').src = photoUrl;
                document.getElementById('ci-confirmation-photo').style.display = 'block';
            }
            setStep(3);
        } catch {
            showToast('Something went wrong. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check-circle"></i> Submit Check-in Details';
            initIcons();
        }
    });
}
