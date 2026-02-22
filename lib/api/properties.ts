import api from "./axios";
import type {
  ApiResponse,
  PropertyResponse,
  CreatePropertyRequest,
  UpdatePropertyRequest,
} from "@/types";

export const propertiesApi = {
  getAll: () =>
    api.get<ApiResponse<PropertyResponse[]>>("/properties"),

  getById: (propertyId: number) =>
    api.get<ApiResponse<PropertyResponse>>(`/properties/${propertyId}`),

  create: (data: CreatePropertyRequest) =>
    api.post<ApiResponse<PropertyResponse>>("/properties", data),

  update: (propertyId: number, data: UpdatePropertyRequest) =>
    api.patch<ApiResponse<PropertyResponse>>(`/properties/${propertyId}`, data),

  delete: (propertyId: number) =>
    api.delete<ApiResponse<void>>(`/properties/${propertyId}`),
};
