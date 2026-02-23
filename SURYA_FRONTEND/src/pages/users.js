// ===== USERS PAGE =====
import { renderLayout } from '../layout.js';
import { usersApi, rolesApi, userPermissionsApi, permissionsApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, initIcons, store } from '../utils.js';

let users = [], roles = [], permissions = [];

export async function renderUsers() {
    renderLayout('<div class="loading-spinner"></div>', 'users');
    await loadData();
}

async function loadData() {
    try {
        const [uRes, rRes, pRes] = await Promise.all([
            usersApi.getAll(),
            rolesApi.getAll(),
            permissionsApi.getAll().catch(() => ({ data: [] })),
        ]);
        users = uRes.data || [];
        roles = rRes.data || [];
        permissions = pRes.data || [];
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    renderList();
}

function renderList() {
    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Users</h1><p>Manage staff accounts and permissions</p></div>
      <button class="btn btn-primary" id="btn-add"><i data-lucide="plus"></i> Add User</button>
    </div>
    ${users.length > 0 ? `
      <div class="table-wrapper"><table class="data-table">
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>${users.map(u => `
          <tr>
            <td>${u.id}</td>
            <td style="color:var(--text-primary);font-weight:600;">${u.name}</td>
            <td>${u.email}</td>
            <td><span class="badge badge-purple">${u.roleName || '—'}</span></td>
            <td>${u.isActive !== false ? '<span class="badge badge-success badge-dot">Active</span>' : '<span class="badge badge-danger badge-dot">Inactive</span>'}</td>
            <td><div class="table-actions">
              <button class="btn btn-ghost btn-sm btn-perms" data-id="${u.id}" title="Permission Overrides"><i data-lucide="shield"></i></button>
              <button class="btn btn-ghost btn-sm btn-edit" data-id="${u.id}"><i data-lucide="pencil"></i></button>
              <button class="btn btn-ghost btn-sm btn-del" data-id="${u.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button>
            </div></td>
          </tr>`).join('')}</tbody>
      </table></div>
    ` : `<div class="empty-state"><i data-lucide="users"></i><h3>No users</h3>
      <button class="btn btn-primary" id="btn-add-e"><i data-lucide="plus"></i> Add User</button></div>`}
  `;
    initIcons();
    document.getElementById('btn-add')?.addEventListener('click', () => showUserForm());
    document.getElementById('btn-add-e')?.addEventListener('click', () => showUserForm());
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => showUserForm(users.find(u => u.id == b.dataset.id))));
    document.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => {
        const u = users.find(x => x.id == b.dataset.id);
        showConfirm('Delete User', `Delete "${u.name}"?`, async () => {
            try { await usersApi.delete(u.id); showToast('Deleted', 'success'); await loadData(); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
    document.querySelectorAll('.btn-perms').forEach(b => b.addEventListener('click', () => showUserPermissions(b.dataset.id)));
}

function showUserForm(existing = null) {
    const isEdit = !!existing;
    showModal(`
    <div class="modal-header"><h2>${isEdit ? 'Edit' : 'Add'} User</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="user-form"><div class="modal-body">
      <div class="form-group"><label class="form-label">Name *</label>
        <input class="form-input" name="name" value="${existing?.name || ''}" required /></div>
      ${!isEdit ? `
        <div class="form-group"><label class="form-label">Email *</label>
          <input type="email" class="form-input" name="email" required /></div>
        <div class="form-group"><label class="form-label">Password *</label>
          <input type="password" class="form-input" name="password" required /></div>
      ` : ''}
      <div class="form-group"><label class="form-label">Role *</label>
        <select class="form-select" name="roleId" required>
          <option value="">Select role</option>
          ${roles.map(r => `<option value="${r.id}" ${existing?.roleId === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
        </select></div>
      ${isEdit ? `
        <div class="form-group">
          <label class="form-checkbox">
            <input type="checkbox" name="isActive" ${existing?.isActive !== false ? 'checked' : ''} />
            <span>Active</span>
          </label>
        </div>
      ` : ''}
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="usr-submit">${isEdit ? 'Update' : 'Create'}</button>
    </div></form>
  `);
    initIcons();
    document.getElementById('user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        let data;
        if (isEdit) {
            data = { name: f.name.value, roleId: parseInt(f.roleId.value), isActive: f.isActive?.checked };
        } else {
            data = { name: f.name.value, email: f.email.value, password: f.password.value, roleId: parseInt(f.roleId.value) };
        }
        const btn = document.getElementById('usr-submit'); btn.disabled = true;
        try {
            if (isEdit) await usersApi.update(existing.id, data); else await usersApi.create(data);
            showToast(isEdit ? 'Updated' : 'Created', 'success'); closeModal(); await loadData();
        } catch (e) { showToast('Error: ' + e.message, 'error'); btn.disabled = false; }
    });
}

async function showUserPermissions(userId) {
    const user = users.find(u => u.id == userId);
    let overrides = [];
    try {
        const res = await userPermissionsApi.get(userId);
        overrides = res.data || [];
    } catch (e) { /* no overrides */ }

    showModal(`
    <div class="modal-header"><h2>Permission Overrides — ${user?.name}</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <div class="modal-body">
      <button class="btn btn-primary btn-sm" id="btn-add-override" style="margin-bottom:var(--space-4);"><i data-lucide="plus"></i> Add Override</button>
      ${overrides.length > 0 ? `
        <div class="table-wrapper" style="border:none;"><table class="data-table">
          <thead><tr><th>Permission</th><th>Access Level</th><th>Actions</th></tr></thead>
          <tbody>${overrides.map(o => `
            <tr>
              <td style="font-weight:500; color:var(--text-primary);">${o.permissionCode || o.permissionId}</td>
              <td>${statusBadge(o.accessLevel)}</td>
              <td><button class="btn btn-ghost btn-sm btn-rm-override" data-id="${o.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button></td>
            </tr>`).join('')}</tbody>
        </table></div>
      ` : '<p style="color:var(--text-muted);">No permission overrides.</p>'}
    </div>
  `, { size: 'lg' });
    initIcons();

    document.getElementById('btn-add-override')?.addEventListener('click', () => {
        showModal(`
      <div class="modal-header"><h2>Add Permission Override</h2>
        <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
      <form id="override-form"><div class="modal-body">
        <div class="form-group"><label class="form-label">Permission *</label>
          <select class="form-select" name="permissionId" required>
            <option value="">Select</option>
            ${permissions.map(p => `<option value="${p.id}">${p.code} — ${p.description || ''}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Access Level *</label>
          <select class="form-select" name="accessLevel" required>
            <option value="DISABLED">DISABLED</option><option value="READ">READ</option><option value="WRITE">WRITE</option>
          </select></div>
      </div><div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
        <button type="submit" class="btn btn-primary" id="ov-submit">Add</button>
      </div></form>
    `);
        initIcons();
        document.getElementById('override-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = e.target;
            const data = { permissionId: parseInt(f.permissionId.value), accessLevel: f.accessLevel.value };
            try { await userPermissionsApi.add(userId, data); showToast('Override added', 'success'); closeModal(); showUserPermissions(userId); }
            catch (err) { showToast('Error: ' + err.message, 'error'); }
        });
    });

    document.querySelectorAll('.btn-rm-override').forEach(b => b.addEventListener('click', () => {
        showConfirm('Remove Override', 'Remove this permission override?', async () => {
            try { await userPermissionsApi.remove(userId, b.dataset.id); showToast('Removed', 'success'); showUserPermissions(userId); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
}
