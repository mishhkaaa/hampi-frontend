import api from "./axios";
import type {
  ApiResponse,
  UserPermissionOverrideResponse,
  UserPermissionOverrideRequest,
} from "@/types";

export const userPermissionsApi = {
  getByUser: (userId: number) =>
    api.get<ApiResponse<UserPermissionOverrideResponse[]>>(`/users/${userId}/permission-overrides`),

  add: (userId: number, data: UserPermissionOverrideRequest) =>
    api.post<ApiResponse<UserPermissionOverrideResponse>>(`/users/${userId}/permission-overrides`, data),

  remove: (userId: number, overrideId: number) =>
    api.delete<ApiResponse<void>>(`/users/${userId}/permission-overrides/${overrideId}`),
};
