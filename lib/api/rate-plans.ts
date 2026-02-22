import api from "./axios";
import type {
  ApiResponse,
  RatePlanResponse,
  CreateRatePlanRequest,
  UpdateRatePlanRequest,
} from "@/types";

export const ratePlansApi = {
  getByProperty: (propertyId: number) =>
    api.get<ApiResponse<RatePlanResponse[]>>(`/properties/${propertyId}/rate-plans`),

  getById: (ratePlanId: number) =>
    api.get<ApiResponse<RatePlanResponse>>(`/properties/rate-plans/${ratePlanId}`),

  create: (propertyId: number, data: CreateRatePlanRequest) =>
    api.post<ApiResponse<RatePlanResponse>>(`/properties/${propertyId}/rate-plans`, data),

  update: (ratePlanId: number, data: UpdateRatePlanRequest) =>
    api.patch<ApiResponse<RatePlanResponse>>(`/properties/rate-plans/${ratePlanId}`, data),

  delete: (ratePlanId: number) =>
    api.delete<ApiResponse<void>>(`/properties/rate-plans/${ratePlanId}`),
};
