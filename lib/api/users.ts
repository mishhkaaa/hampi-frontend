import api from "./axios";
import type {
  ApiResponse,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/types";

export const usersApi = {
  getAll: () =>
    api.get<ApiResponse<UserResponse[]>>("/users"),

  getById: (userId: number) =>
    api.get<ApiResponse<UserResponse>>(`/users/${userId}`),

  create: (data: CreateUserRequest) =>
    api.post<ApiResponse<UserResponse>>("/users", data),

  update: (userId: number, data: UpdateUserRequest) =>
    api.patch<ApiResponse<UserResponse>>(`/users/${userId}`, data),

  delete: (userId: number) =>
    api.delete<ApiResponse<void>>(`/users/${userId}`),
};
