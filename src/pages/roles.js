// ===== ROLES & PERMISSIONS PAGE =====
import { renderLayout } from '../layout.js';
import { rolesApi, permissionsApi } from '../api.js';
import { showToast, showModal, closeModal, showConfirm, statusBadge, initIcons } from '../utils.js';

let roles = [], permissions = [];

export async function renderRoles() {
    renderLayout('<div class="loading-spinner"></div>', 'roles');
    await loadData();
}

async function loadData() {
    try {
        const [rRes, pRes] = await Promise.all([rolesApi.getAll(), permissionsApi.getAll()]);
        roles = rRes.data || [];
        permissions = pRes.data || [];
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    renderList();
}

function renderList() {
    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Roles & Permissions</h1><p>Manage access control</p></div>
      <button class="btn btn-primary" id="btn-add"><i data-lucide="plus"></i> Add Role</button>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-6);">
      <div>
        <h3 style="font-weight:600; margin-bottom:var(--space-4); color:var(--text-primary);">Roles</h3>
        ${roles.length > 0 ? `
          <div class="table-wrapper"><table class="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
            <tbody>${roles.map(r => `
              <tr>
                <td>${r.id}</td>
                <td style="color:var(--text-primary);font-weight:600;">${r.name}</td>
                <td>${r.description || '—'}</td>
                <td><div class="table-actions">
                  <button class="btn btn-ghost btn-sm btn-role-perms" data-id="${r.id}" title="Permissions"><i data-lucide="shield"></i></button>
                  <button class="btn btn-ghost btn-sm btn-edit" data-id="${r.id}"><i data-lucide="pencil"></i></button>
                  <button class="btn btn-ghost btn-sm btn-del" data-id="${r.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button>
                </div></td>
              </tr>`).join('')}</tbody>
          </table></div>
        ` : '<div class="empty-state"><p>No roles.</p></div>'}
      </div>

      <div>
        <h3 style="font-weight:600; margin-bottom:var(--space-4); color:var(--text-primary);">System Permissions</h3>
        ${permissions.length > 0 ? `
          <div class="table-wrapper"><table class="data-table">
            <thead><tr><th>ID</th><th>Code</th><th>Description</th></tr></thead>
            <tbody>${permissions.map(p => `
              <tr>
                <td>${p.id}</td>
                <td style="font-weight:600; color:var(--accent-primary-hover);"><code>${p.code}</code></td>
                <td>${p.description || '—'}</td>
              </tr>`).join('')}</tbody>
          </table></div>
        ` : '<div class="empty-state"><p>No permissions in system.</p></div>'}
      </div>
    </div>
  `;
    initIcons();

    document.getElementById('btn-add')?.addEventListener('click', () => showRoleForm());
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => showRoleForm(roles.find(r => r.id == b.dataset.id))));
    document.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => {
        const role = roles.find(r => r.id == b.dataset.id);
        showConfirm('Delete Role', `Delete "${role.name}"?`, async () => {
            try { await rolesApi.delete(role.id); showToast('Deleted', 'success'); await loadData(); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
    document.querySelectorAll('.btn-role-perms').forEach(b => b.addEventListener('click', () => showRolePermissions(b.dataset.id)));
}

function showRoleForm(existing = null) {
    const isEdit = !!existing;
    showModal(`
    <div class="modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Role</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <form id="role-form"><div class="modal-body">
      <div class="form-group"><label class="form-label">Name *</label>
        <input class="form-input" name="name" value="${existing?.name || ''}" required /></div>
      <div class="form-group"><label class="form-label">Description</label>
        <textarea class="form-textarea" name="description">${existing?.description || ''}</textarea></div>
    </div><div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
      <button type="submit" class="btn btn-primary" id="rl-submit">${isEdit ? 'Update' : 'Create'}</button>
    </div></form>
  `);
    initIcons();
    document.getElementById('role-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = { name: f.name.value, description: f.description.value || undefined };
        const btn = document.getElementById('rl-submit'); btn.disabled = true;
        try {
            if (isEdit) await rolesApi.update(existing.id, data); else await rolesApi.create(data);
            showToast(isEdit ? 'Updated' : 'Created', 'success'); closeModal(); await loadData();
        } catch (e) { showToast('Error: ' + e.message, 'error'); btn.disabled = false; }
    });
}

async function showRolePermissions(roleId) {
    const role = roles.find(r => r.id == roleId);
    let rolePerms = [];
    try {
        const res = await rolesApi.getPermissions(roleId);
        rolePerms = res.data || [];
    } catch (e) { /* ignore */ }

    showModal(`
    <div class="modal-header"><h2>Permissions — ${role?.name}</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
    <div class="modal-body">
      <button class="btn btn-primary btn-sm" id="btn-add-rp" style="margin-bottom:var(--space-4);"><i data-lucide="plus"></i> Add Permission</button>
      ${rolePerms.length > 0 ? `
        <div class="table-wrapper" style="border:none;"><table class="data-table">
          <thead><tr><th>Permission</th><th>Access Level</th><th>Actions</th></tr></thead>
          <tbody>${rolePerms.map(rp => `
            <tr>
              <td style="font-weight:500; color:var(--text-primary);">${rp.permissionCode || rp.permissionId}</td>
              <td>${statusBadge(rp.accessLevel)}</td>
              <td><button class="btn btn-ghost btn-sm btn-rm-rp" data-id="${rp.id}" style="color:var(--danger);"><i data-lucide="trash-2"></i></button></td>
            </tr>`).join('')}</tbody>
        </table></div>
      ` : '<p style="color:var(--text-muted);">No permissions assigned.</p>'}
    </div>
  `, { size: 'lg' });
    initIcons();

    document.getElementById('btn-add-rp')?.addEventListener('click', () => {
        showModal(`
      <div class="modal-header"><h2>Add Permission to Role</h2>
        <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''"><i data-lucide="x"></i></button></div>
      <form id="add-rp-form"><div class="modal-body">
        <div class="form-group"><label class="form-label">Permission *</label>
          <select class="form-select" name="permissionId" required>
            <option value="">Select</option>
            ${permissions.map(p => `<option value="${p.id}">${p.code} — ${p.description || ''}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Access Level *</label>
          <select class="form-select" name="accessLevel" required>
            <option value="DISABLED">DISABLED</option><option value="READ">READ</option><option value="WRITE" selected>WRITE</option>
          </select></div>
      </div><div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
        <button type="submit" class="btn btn-primary" id="arp-submit">Add</button>
      </div></form>
    `);
        initIcons();
        document.getElementById('add-rp-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = e.target;
            const data = { permissionId: parseInt(f.permissionId.value), accessLevel: f.accessLevel.value };
            try { await rolesApi.addPermission(roleId, data); showToast('Permission added', 'success'); closeModal(); showRolePermissions(roleId); }
            catch (err) { showToast('Error: ' + err.message, 'error'); }
        });
    });

    document.querySelectorAll('.btn-rm-rp').forEach(b => b.addEventListener('click', () => {
        showConfirm('Remove', 'Remove this permission?', async () => {
            try { await rolesApi.removePermission(roleId, b.dataset.id); showToast('Removed', 'success'); showRolePermissions(roleId); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
}
