import api from "./axios";
import type { ApiResponse, PermissionResponse } from "@/types";

export const permissionsApi = {
  getAll: () =>
    api.get<ApiResponse<PermissionResponse[]>>("/permissions"),
};
