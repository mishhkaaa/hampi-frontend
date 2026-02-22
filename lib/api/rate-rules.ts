import api from "./axios";
import type {
  ApiResponse,
  RateRuleResponse,
  CreateRateRuleRequest,
  UpdateRateRuleRequest,
} from "@/types";

export const rateRulesApi = {
  getByPlan: (ratePlanId: number) =>
    api.get<ApiResponse<RateRuleResponse[]>>(`/rate-plans/${ratePlanId}/rules`),

  getById: (rateRuleId: number) =>
    api.get<ApiResponse<RateRuleResponse>>(`/rate-plans/rules/${rateRuleId}`),

  create: (ratePlanId: number, data: CreateRateRuleRequest) =>
    api.post<ApiResponse<RateRuleResponse>>(`/rate-plans/${ratePlanId}/rules`, data),

  update: (rateRuleId: number, data: UpdateRateRuleRequest) =>
    api.patch<ApiResponse<RateRuleResponse>>(`/rate-plans/rules/${rateRuleId}`, data),

  delete: (rateRuleId: number) =>
    api.delete<ApiResponse<void>>(`/rate-plans/rules/${rateRuleId}`),
};
