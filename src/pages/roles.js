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
    } catch (e) { showToast('Error loading data: ' + e.message, 'error'); }
    renderList();
}

function renderList() {
    document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Roles &amp; Permissions</h1>
        <p>Manage access control roles and system permissions</p>
      </div>
      <button class="btn btn-primary" id="btn-add">
        <i data-lucide="plus"></i> Add Role
      </button>
    </div>

    <div class="roles-layout">
      <!-- Roles Panel -->
      <div class="card" style="margin-bottom:0;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-3);">
          <h3 class="card-title">Roles <span class="badge badge-info" style="margin-left:6px;">${roles.length}</span></h3>
          <button class="btn btn-primary btn-sm" id="btn-add-2">
            <i data-lucide="plus"></i> Add Role
          </button>
        </div>
        ${roles.length > 0 ? `
          <div class="table-wrapper" style="border:none; margin:0; padding:0;">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Description</th><th style="width:100px;">Actions</th></tr></thead>
              <tbody>${roles.map(r => `
                <tr>
                  <td>
                    <div style="font-weight:600; color:var(--text-primary);">${r.name}</div>
                    <div style="font-size:var(--font-xs); color:var(--text-muted);">ID: ${r.id}</div>
                  </td>
                  <td style="color:var(--text-secondary);">${r.description || '—'}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-ghost btn-sm btn-role-perms" data-id="${r.id}" title="View Permissions">
                        <i data-lucide="shield"></i>
                      </button>
                      <button class="btn btn-ghost btn-sm btn-edit" data-id="${r.id}" title="Edit">
                        <i data-lucide="pencil"></i>
                      </button>
                      <button class="btn btn-ghost btn-sm btn-del" data-id="${r.id}" style="color:var(--danger);" title="Delete">
                        <i data-lucide="trash-2"></i>
                      </button>
                    </div>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        ` : `<div class="empty-state"><i data-lucide="shield"></i><h3>No roles yet</h3><p>Create your first role to get started.</p></div>`}
      </div>

      <!-- Permissions Panel -->
      <div class="card" style="margin-bottom:0;">
        <div class="card-header">
          <h3 class="card-title">System Permissions <span class="badge badge-neutral" style="margin-left:6px;">${permissions.length}</span></h3>
        </div>
        ${permissions.length > 0 ? `
          <div class="table-wrapper" style="border:none; margin:0; padding:0;">
            <table class="data-table">
              <thead><tr><th>Code</th><th>Description</th></tr></thead>
              <tbody>${permissions.map(p => `
                <tr>
                  <td><code style="font-size:var(--font-xs); background:var(--bg-input); padding:2px 6px; border-radius:4px; color:var(--accent-primary-hover);">${p.code}</code></td>
                  <td style="color:var(--text-secondary);">${p.description || '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        ` : `<div class="empty-state"><p>No permissions in system.</p></div>`}
      </div>
    </div>
  `;
    initIcons();

    document.getElementById('btn-add')?.addEventListener('click', () => showRoleForm());
    document.getElementById('btn-add-2')?.addEventListener('click', () => showRoleForm());
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => showRoleForm(roles.find(r => r.id == b.dataset.id))));
    document.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => {
        const role = roles.find(r => r.id == b.dataset.id);
        showConfirm('Delete Role', `Delete role "${role.name}"? This cannot be undone.`, async () => {
            try { await rolesApi.delete(role.id); showToast('Role deleted', 'success'); await loadData(); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
    document.querySelectorAll('.btn-role-perms').forEach(b => b.addEventListener('click', () => showRolePermissions(b.dataset.id)));
}

function showRoleForm(existing = null) {
    const isEdit = !!existing;
    showModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Edit' : 'Create'} Role</h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''">
        <i data-lucide="x"></i>
      </button>
    </div>
    <form id="role-form">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Role Name *</label>
          <input class="form-input" name="name" value="${existing?.name || ''}" placeholder="e.g. Front Desk Staff" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" name="description" placeholder="Describe what this role can do…">${existing?.description || ''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
        <button type="submit" class="btn btn-primary" id="rl-submit">${isEdit ? 'Update Role' : 'Create Role'}</button>
      </div>
    </form>
  `);
    initIcons();
    document.getElementById('role-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const data = { name: f.name.value, description: f.description.value || undefined };
        const btn = document.getElementById('rl-submit');
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
        try {
            if (isEdit) await rolesApi.update(existing.id, data);
            else await rolesApi.create(data);
            showToast(isEdit ? 'Role updated' : 'Role created', 'success');
            closeModal(); await loadData();
        } catch (e) {
            showToast('Error: ' + e.message, 'error');
            btn.disabled = false; btn.innerHTML = isEdit ? 'Update Role' : 'Create Role';
        }
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
    <div class="modal-header">
      <h2>Permissions — <span style="color:var(--accent-primary);">${role?.name}</span></h2>
      <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="modal-body">
      <button class="btn btn-primary btn-sm" id="btn-add-rp" style="margin-bottom:var(--space-4);">
        <i data-lucide="plus"></i> Add Permission
      </button>
      ${rolePerms.length > 0 ? `
        <div class="table-wrapper" style="border:none; padding:0;">
          <table class="data-table">
            <thead><tr><th>Permission</th><th>Access Level</th><th style="width:60px;"></th></tr></thead>
            <tbody>${rolePerms.map(rp => `
              <tr>
                <td style="font-weight:500; color:var(--text-primary);">${rp.permissionCode || rp.permissionId}</td>
                <td>${statusBadge(rp.accessLevel)}</td>
                <td>
                  <button class="btn btn-ghost btn-sm btn-rm-rp" data-id="${rp.id}" style="color:var(--danger);">
                    <i data-lucide="trash-2"></i>
                  </button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p style="color:var(--text-muted);">No permissions assigned to this role yet.</p>'}
    </div>
  `, { size: 'lg' });
    initIcons();

    document.getElementById('btn-add-rp')?.addEventListener('click', () => {
        showModal(`
      <div class="modal-header">
        <h2>Add Permission to Role</h2>
        <button class="btn btn-ghost" onclick="document.getElementById('modal-container').innerHTML=''">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="add-rp-form">
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
              <option value="WRITE" selected>WRITE</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancel</button>
          <button type="submit" class="btn btn-primary" id="arp-submit">Add Permission</button>
        </div>
      </form>
    `);
        initIcons();
        document.getElementById('add-rp-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = e.target;
            const data = { permissionId: parseInt(f.permissionId.value), accessLevel: f.accessLevel.value };
            const btn = document.getElementById('arp-submit');
            btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
            try {
                await rolesApi.addPermission(roleId, data);
                showToast('Permission added', 'success');
                closeModal(); showRolePermissions(roleId);
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
                btn.disabled = false; btn.innerHTML = 'Add Permission';
            }
        });
    });

    document.querySelectorAll('.btn-rm-rp').forEach(b => b.addEventListener('click', () => {
        showConfirm('Remove Permission', 'Remove this permission from the role?', async () => {
            try {
                await rolesApi.removePermission(roleId, b.dataset.id);
                showToast('Removed', 'success'); showRolePermissions(roleId);
            } catch (e) { showToast('Error: ' + e.message, 'error'); }
        });
    }));
}
