import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rateRulesApi } from "@/lib/api/rate-rules";
import type { CreateRateRuleRequest, UpdateRateRuleRequest } from "@/types";

export function useRateRules(ratePlanId: number) {
  return useQuery({
    queryKey: ["rateRules", ratePlanId],
    queryFn: async () => {
      const { data } = await rateRulesApi.getByPlan(ratePlanId);
      return data.data;
    },
    enabled: !!ratePlanId,
  });
}

export function useCreateRateRule(ratePlanId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRateRuleRequest) => rateRulesApi.create(ratePlanId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rateRules", ratePlanId] }),
  });
}

export function useUpdateRateRule(ratePlanId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRateRuleRequest }) =>
      rateRulesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rateRules", ratePlanId] }),
  });
}

export function useDeleteRateRule(ratePlanId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rateRulesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rateRules", ratePlanId] }),
  });
}
