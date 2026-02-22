import api from "./axios";
import type {
  ApiResponse,
  RoleResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  RolePermissionResponse,
  RolePermissionRequest,
} from "@/types";

export const rolesApi = {
  getAll: () =>
    api.get<ApiResponse<RoleResponse[]>>("/roles"),

  getById: (roleId: number) =>
    api.get<ApiResponse<RoleResponse>>(`/roles/${roleId}`),

  create: (data: CreateRoleRequest) =>
    api.post<ApiResponse<RoleResponse>>("/roles", data),

  update: (roleId: number, data: UpdateRoleRequest) =>
    api.patch<ApiResponse<RoleResponse>>(`/roles/${roleId}`, data),

  delete: (roleId: number) =>
    api.delete<ApiResponse<void>>(`/roles/${roleId}`),

  getPermissions: (roleId: number) =>
    api.get<ApiResponse<RolePermissionResponse[]>>(`/roles/${roleId}/permissions`),

  addPermission: (roleId: number, data: RolePermissionRequest) =>
    api.post<ApiResponse<RolePermissionResponse>>(`/roles/${roleId}/permissions`, data),

  removePermission: (roleId: number, rolePermissionId: number) =>
    api.delete<ApiResponse<void>>(`/roles/${roleId}/permissions/${rolePermissionId}`),
};
