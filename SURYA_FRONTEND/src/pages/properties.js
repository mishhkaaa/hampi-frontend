// ===== PROPERTIES PAGE =====
import { renderLayout } from '../layout.js';
import { propertiesApi } from '../api.js';
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
      <button class="btn btn-primary" id="btn-add-property">
        <i data-lucide="plus"></i> Add Property
      </button>
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
        <p>Create your first property to get started.</p>
        <button class="btn btn-primary" id="btn-add-property-empty"><i data-lucide="plus"></i> Add Property</button>
      </div>
    `}
  `;

    document.getElementById('page-content').innerHTML = content;
    initIcons();

    // Event bindings
    document.getElementById('btn-add-property')?.addEventListener('click', () => showPropertyForm());
    document.getElementById('btn-add-property-empty')?.addEventListener('click', () => showPropertyForm());

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

        const btn = document.getElementById('prop-submit-btn');
        btn.innerHTML = '<span class="spinner"></span>';
        btn.disabled = true;

        try {
            if (isEdit) {
                await propertiesApi.update(existing.id, data);
                showToast('Property updated', 'success');
            } else {
                await propertiesApi.create(data);
                showToast('Property created', 'success');
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
