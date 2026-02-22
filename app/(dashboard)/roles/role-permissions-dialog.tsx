"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useRolePermissions, useAddRolePermission, useRemoveRolePermission } from "@/hooks/use-roles";
import type { PermissionResponse, AccessLevel } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: number;
  allPermissions: PermissionResponse[];
}

export function RolePermissionsDialog({ open, onOpenChange, roleId, allPermissions }: Props) {
  const { data: rolePermissions, isLoading } = useRolePermissions(roleId);
  const assignPermission = useAddRolePermission();
  const removePermission = useRemoveRolePermission();

  const assignedMap = new Map(
    rolePermissions?.map((rp) => [rp.permissionId, rp]) || []
  );

  const handleToggle = async (permissionId: number, checked: boolean) => {
    if (checked) {
      await assignPermission.mutateAsync({ roleId, data: { permissionId, accessLevel: "WRITE" as AccessLevel } });
    } else {
      const rp = assignedMap.get(permissionId);
      if (rp) {
        await removePermission.mutateAsync({ roleId, rolePermissionId: rp.id });
      }
    }
  };

  const handleAccessLevelChange = async (permissionId: number, accessLevel: AccessLevel) => {
    const rp = assignedMap.get(permissionId);
    if (rp) {
      const previousAccessLevel = rp.accessLevel;
      try {
        // Remove and re-add with new access level
        await removePermission.mutateAsync({ roleId, rolePermissionId: rp.id });
        await assignPermission.mutateAsync({ roleId, data: { permissionId, accessLevel } });
      } catch {
        // If add failed after successful remove, try to restore previous permission
        try {
          await assignPermission.mutateAsync({ roleId, data: { permissionId, accessLevel: previousAccessLevel } });
        } catch {
          // Rollback also failed — permission was lost; user should reassign manually
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-center py-4 text-muted-foreground">Loading permissions...</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {allPermissions.map((perm) => {
              const assigned = assignedMap.get(perm.id);
              return (
                <div key={perm.id} className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50">
                  <input
                    type="checkbox"
                    id={`perm-${perm.id}`}
                    checked={!!assigned}
                    onChange={(e) => handleToggle(perm.id, e.target.checked)}
                    disabled={assignPermission.isPending || removePermission.isPending}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`perm-${perm.id}`} className="font-medium cursor-pointer">{perm.code}</Label>
                    {perm.description && <p className="text-xs text-muted-foreground">{perm.description}</p>}
                  </div>
                  {assigned && (
                    <Select
                      value={assigned.accessLevel}
                      onChange={(e) => handleAccessLevelChange(perm.id, e.target.value as AccessLevel)}
                      className="w-28 text-xs"
                    >
                      <option value="READ">Read</option>
                      <option value="WRITE">Write</option>
                      <option value="DISABLED">Disabled</option>
                    </Select>
                  )}
                </div>
              );
            })}
            {allPermissions.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">No permissions defined.</p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
