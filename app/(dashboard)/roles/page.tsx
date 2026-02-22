"use client";

import { useState } from "react";
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "@/hooks/use-roles";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { RoleFormDialog } from "./role-form-dialog";
import { RolePermissionsDialog } from "./role-permissions-dialog";
import type { RoleResponse, CreateRoleRequest, UpdateRoleRequest } from "@/types";

export default function RolesPage() {
  const { data: roles, isLoading } = useRoles();
  const { data: permissions } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [permissionsRoleId, setPermissionsRoleId] = useState<number | null>(null);

  const handleCreate = async (data: CreateRoleRequest) => {
    await createRole.mutateAsync(data);
    setFormOpen(false);
  };

  const handleUpdate = async (data: UpdateRoleRequest) => {
    if (!editingRole) return;
    await updateRole.mutateAsync({ id: editingRole.id, data });
    setEditingRole(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRole.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div>
      <PageHeader title="Roles & Permissions" description="Manage roles and their permissions">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </PageHeader>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>{role.description || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setPermissionsRoleId(role.id)} title="Manage Permissions">
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingRole(role)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(role.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!roles || roles.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No roles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <RoleFormDialog
        open={formOpen || !!editingRole}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingRole(null);
          }
        }}
        role={editingRole}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
        isSubmitting={createRole.isPending || updateRole.isPending}
      />

      {permissionsRoleId && (
        <RolePermissionsDialog
          open={!!permissionsRoleId}
          onOpenChange={(open) => !open && setPermissionsRoleId(null)}
          roleId={permissionsRoleId}
          allPermissions={permissions || []}
        />
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Role"
        description="Are you sure you want to delete this role?"
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
