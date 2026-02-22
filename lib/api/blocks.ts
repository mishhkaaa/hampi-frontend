import api from "./axios";
import type {
  ApiResponse,
  PropertyBlockResponse,
  CreatePropertyBlockRequest,
  UpdatePropertyBlockRequest,
} from "@/types";

export const blocksApi = {
  getByProperty: (propertyId: number) =>
    api.get<ApiResponse<PropertyBlockResponse[]>>(`/properties/${propertyId}/blocks`),

  getById: (blockId: number) =>
    api.get<ApiResponse<PropertyBlockResponse>>(`/properties/blocks/${blockId}`),

  create: (propertyId: number, data: CreatePropertyBlockRequest) =>
    api.post<ApiResponse<PropertyBlockResponse>>(`/properties/${propertyId}/blocks`, data),

  update: (blockId: number, data: UpdatePropertyBlockRequest) =>
    api.patch<ApiResponse<PropertyBlockResponse>>(`/properties/blocks/${blockId}`, data),

  delete: (blockId: number) =>
    api.delete<ApiResponse<void>>(`/properties/blocks/${blockId}`),
};
