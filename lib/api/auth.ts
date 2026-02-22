import api from "./axios";
import type { ApiResponse, LoginRequest } from "@/types";

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<unknown>>("/auth/login", data),

  logout: () =>
    api.post<ApiResponse<unknown>>("/auth/logout"),

  refresh: () =>
    api.post<ApiResponse<unknown>>("/auth/refresh"),
};
