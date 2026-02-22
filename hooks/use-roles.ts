import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "@/lib/api/roles";
import type { CreateRoleRequest, UpdateRoleRequest, RolePermissionRequest } from "@/types";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await rolesApi.getAll();
      return data.data;
    },
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleRequest }) =>
      rolesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useRolePermissions(roleId: number) {
  return useQuery({
    queryKey: ["rolePermissions", roleId],
    queryFn: async () => {
      const { data } = await rolesApi.getPermissions(roleId);
      return data.data;
    },
    enabled: !!roleId,
  });
}

export function useAddRolePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: number; data: RolePermissionRequest }) =>
      rolesApi.addPermission(roleId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["rolePermissions", variables.roleId] });
    },
  });
}

export function useRemoveRolePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, rolePermissionId }: { roleId: number; rolePermissionId: number }) =>
      rolesApi.removePermission(roleId, rolePermissionId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["rolePermissions", variables.roleId] });
    },
  });
}
