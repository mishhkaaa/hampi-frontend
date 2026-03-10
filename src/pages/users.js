// ===== USERS PAGE =====
import { renderLayout } from '../layout.js';
import { usersApi, rolesApi, userPermissionsApi, permissionsApi, propertiesApi, companyApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, initIcons, store } from '../utils.js';

let users = [], roles = [], permissions = [], properties = [];

export async function renderUsers() {
    renderLayout('<div class="loading-spinner"></div>', 'users');
    await loadData();
}

async function loadData() {
    try {
        const [uRes, rRes, pRes, prRes] = await Promise.all([
            usersApi.getAll(),
            rolesApi.getAll(),
            permissionsApi.getAll().catch(() => ({ data: [] })),
            propertiesApi.getAll().catch(() => ({ data: [] })),
        ]);
        users = uRes.data || [];
        roles = rRes.data || [];
        permissions = pRes.data || [];
        properties = prRes.data || [];
    } catch (e) { showToast('Error loading users: ' + e.message, 'error'); }
    renderList();
}

function renderList() {
    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Users</h1>
        <p>Manage staff accounts, roles and property access</p>
      </div>
      <button class="btn btn-primary" id="btn-add"><i data-lucide="plus"></i> Add User</button>
    </div>

    ${users.length > 0 ? `
      <div class="table-wrapper"><table class="data-table">
        <thead><tr>
          <th>Name</th><th>Email</th><th>Role</th><th>Properties</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>${users.map(u => {
            const userProps = (u.propertyIds || []).map(pid => {
                const p = properties.find(pr => pr.id === pid);
                return p ? `<span class="badge badge-info" style="margin:1px;">${p.name}</span>` : '';
            }).join('');
            return `<tr>
              <td>
                <div style="font-weight:600; color:var(--text-primary);">${u.name}</div>
                <div style="font-size:var(--font-xs); color:var(--text-muted);">ID: ${u.id}</div>
              </td>
              <td style="color:var(--text-secondary);">${u.email}</td>
              <td><span class="badge badge-purple">${u.roleName || '—'}</span></td>
              <td>${userProps || '<span style="color:var(--text-muted); font-size:var(--font-xs);">All (admin)</span>'}</td>
              <td>${u.isActive !== false
                ? '<span class="badge badge-success badge-dot">Active</span>'
                : '<span class="badge badge-danger badge-dot">Inactive</span>'}</td>
              <td><div class="table-actions">
                <button class="btn btn-ghost btn-sm btn-pw" data-id="${u.id}" title="Change Password">
                  <i data-lucide="key-round"></i>
                </button>
                <button class="btn btn-ghost btn-sm btn-perms" data-id="${u.id}" title="Permission Overrides">
                  <i data-lucide="shield"></i>
                </button>
                <button class="btn btn-ghost btn-sm btn-edit" data-id="${u.id}" title="Edit">
                  <i data-lucide="pencil"></i>
                </button>
                <button class="btn btn-ghost btn-sm btn-del" data-id="${u.id}" style="color:var(--danger);" title="Delete">
                  <i data-lucide="trash-2"></i>
                </button>
              </div></td>
            </tr>`;
        }).join('')}</tbody>
      </table></div>
    ` : `<div class="empty-state">
      <i data-lucide="users"></i>
      <h3>No users yet</h3>
      <p>Add your first staff account to get started.</p>
      <button class="btn btn-primary" id="btn-add-e"><i data-lucide="plus"></i> Add User</button>
    </div>`}
  `;
    initIcons();
    document.getElementById('btn-add')?.addEventListener('click', () => showUserForm());
    document.getElementById('btn-add-e')?.addEventListener('click', () => showUserForm());
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => showUserForm(users.find(u => u.id == b.dataset.id))));
    document.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => {
        const u = users.find(x => x.id == b.dataset.id);
        showConfirm('Delete User', `Delete "${u.name}"? This cannot be undone.`, async () => {
            try { await usersApi.delete(u.id); showToast('User deleted', 'success'); await loadData(); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
    document.querySelectorAll('.btn-perms').forEach(b => b.addEventListener('click', () => showUserPermissions(b.dataset.id)));
    document.querySelectorAll('.btn-pw').forEach(b => b.addEventListener('click', () => showChangePasswordForm(b.dataset.id)));
}

function showUserForm(existing = null) {
    const isEdit = !!existing;
    // Build property checkboxes
    const propChecks = properties.map(p => {
        const checked = (existing?.propertyIds || []).includes(p.id) ? 'checked' : '';
        return `<label class="form-checkbox" style="margin-bottom:4px;">
          <input type="checkbox" name="propertyIds" value="${p.id}" ${checked} />
          <span>${p.name}</span>
        </label>`;
    }).join('');

    showModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Edit' : 'Add'} User</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''">
        <i data-lucide="x"></i>
      </button>
    </div>
    <form id="user-form">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-input" name="name" value="${existing?.name || ''}" placeholder="John Smith" required />
        </div>
        ${!isEdit ? `
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" class="form-input" name="email" placeholder="staff@hotel.com" required />
            </div>
            <div class="form-group">
              <label class="form-label">Password *</label>
              <input type="password" class="form-input" name="password" placeholder="Minimum 8 characters" required />
            </div>
          </div>
        ` : ''}
        <div class="form-group">
          <label class="form-label">Role *</label>
          <select class="form-select" name="roleId" required>
            <option value="">— Select role —</option>
            ${roles.map(r => `<option value="${r.id}" ${existing?.roleId === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
          </select>
          <small style="color:var(--text-muted); font-size:var(--font-xs); margin-top:4px; display:block;">
            Use <strong>COMPANY_ADMIN</strong> role for client users with full property access.
          </small>
        </div>
        ${properties.length > 0 ? `
          <div class="form-group">
            <label class="form-label">Property Access</label>
            <div style="background:var(--bg-input); border-radius:var(--radius-md); padding:var(--space-3); display:flex; flex-direction:column; gap:2px; max-height:160px; overflow-y:auto;">
              ${propChecks || '<p style="color:var(--text-muted); font-size:var(--font-sm);">No properties available.</p>'}
            </div>
            <small style="color:var(--text-muted); font-size:var(--font-xs); margin-top:4px; display:block;">
              COMPANY_ADMIN users can see all properties regardless of this selection.
            </small>
          </div>
        ` : ''}
        ${isEdit ? `
          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" name="isActive" ${existing?.isActive !== false ? 'checked' : ''} />
              <span>Account Active</span>
            </label>
          </div>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
        <button type="submit" class="btn btn-primary" id="usr-submit">${isEdit ? 'Update User' : 'Create User'}</button>
      </div>
    </form>
  `);
    initIcons();
    document.getElementById('user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        // Collect checked property IDs
        const checkedProps = [...f.querySelectorAll('input[name="propertyIds"]:checked')].map(cb => parseInt(cb.value));
        let data;
        if (isEdit) {
            data = {
                name: f.name.value,
                roleId: parseInt(f.roleId.value),
                isActive: f.isActive?.checked,
                propertyIds: checkedProps.length > 0 ? checkedProps : undefined,
            };
        } else {
            data = {
                name: f.name.value,
                email: f.email.value,
                password: f.password.value,
                roleId: parseInt(f.roleId.value),
                propertyIds: checkedProps.length > 0 ? checkedProps : undefined,
            };
        }
        const btn = document.getElementById('usr-submit');
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
        try {
            if (isEdit) await usersApi.update(existing.id, data);
            else await usersApi.create(data);
            showToast(isEdit ? 'User updated' : 'User created', 'success');
            closeModal(); await loadData();
        } catch (e) {
            showToast('Error: ' + e.message, 'error');
            btn.disabled = false; btn.innerHTML = isEdit ? 'Update User' : 'Create User';
        }
    });
}

function showChangePasswordForm(userId) {
    const user = users.find(u => u.id == userId);
    showModal(`
    <div class="modal-header">
      <h2>Change Password — ${user?.name}</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''">
        <i data-lucide="x"></i>
      </button>
    </div>
    <form id="pw-form">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">New Password *</label>
          <input type="password" class="form-input" name="newPassword" placeholder="Enter new password" required />
        </div>
        <div class="form-group">
          <label class="form-label">Confirm New Password *</label>
          <input type="password" class="form-input" name="confirmPassword" placeholder="Re-enter new password" required />
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
        <button type="submit" class="btn btn-primary" id="pw-submit">Change Password</button>
      </div>
    </form>
  `);
    initIcons();
    document.getElementById('pw-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        if (f.newPassword.value !== f.confirmPassword.value) {
            showToast('Passwords do not match', 'error'); return;
        }
        const btn = document.getElementById('pw-submit');
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
        try {
            await usersApi.changePassword(userId, { newPassword: f.newPassword.value });
            showToast('Password changed successfully', 'success'); closeModal();
        } catch (e) {
            showToast('Error: ' + e.message, 'error');
            btn.disabled = false; btn.innerHTML = 'Change Password';
        }
    });
}

async function showUserPermissions(userId) {
    const user = users.find(u => u.id == userId);
    let overrides = [];
    try {
        const res = await userPermissionsApi.get(userId);
        overrides = res.data || [];
    } catch (_e) { /* no overrides */ }

    showModal(`
    <div class="modal-header">
      <h2>Permission Overrides — ${user?.name}</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-muted); font-size:var(--font-sm); margin-bottom:var(--space-4);">
        Overrides take precedence over role permissions for this specific user.
      </p>
      <button class="btn btn-primary btn-sm" id="btn-add-override" style="margin-bottom:var(--space-4);">
        <i data-lucide="plus"></i> Add Override
      </button>
      ${overrides.length > 0 ? `
        <div class="table-wrapper" style="border:none; padding:0;">
          <table class="data-table">
            <thead><tr><th>Permission</th><th>Access Level</th><th style="width:60px;"></th></tr></thead>
            <tbody>${overrides.map(o => `
              <tr>
                <td style="font-weight:500; color:var(--text-primary);">${o.permissionCode || o.permissionId}</td>
                <td>${statusBadge(o.accessLevel)}</td>
                <td>
                  <button class="btn btn-ghost btn-sm btn-rm-override" data-id="${o.id}" style="color:var(--danger);">
                    <i data-lucide="trash-2"></i>
                  </button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p style="color:var(--text-muted);">No permission overrides for this user.</p>'}
    </div>
  `, { size: 'lg' });
    initIcons();

    document.getElementById('btn-add-override')?.addEventListener('click', () => {
        showModal(`
      <div class="modal-header">
        <h2>Add Permission Override</h2>
        <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="override-form">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Permission *</label>
            <select class="form-select" name="permissionId" required>
              <option value="">— Select permission —</option>
              ${permissions.map(p => `<option value="${p.id}">${p.code}${p.description ? ' — ' + p.description : ''}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Access Level *</label>
            <select class="form-select" name="accessLevel" required>
              <option value="DISABLED">DISABLED</option>
              <option value="READ">READ</option>
              <option value="WRITE">WRITE</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
          <button type="submit" class="btn btn-primary" id="ov-submit">Add Override</button>
        </div>
      </form>
    `);
        initIcons();
        document.getElementById('override-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = e.target;
            const data = { permissionId: parseInt(f.permissionId.value), accessLevel: f.accessLevel.value };
            const btn = document.getElementById('ov-submit');
            btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
            try {
                await userPermissionsApi.add(userId, data);
                showToast('Override added', 'success');
                closeModal(); showUserPermissions(userId);
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
                btn.disabled = false; btn.innerHTML = 'Add Override';
            }
        });
    });

    document.querySelectorAll('.btn-rm-override').forEach(b => b.addEventListener('click', () => {
        showConfirm('Remove Override', 'Remove this permission override?', async () => {
            try {
                await userPermissionsApi.remove(userId, b.dataset.id);
                showToast('Removed', 'success'); showUserPermissions(userId);
            } catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
}
