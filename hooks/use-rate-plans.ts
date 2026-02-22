import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ratePlansApi } from "@/lib/api/rate-plans";
import type { CreateRatePlanRequest, UpdateRatePlanRequest } from "@/types";

export function useRatePlans(propertyId: number) {
  return useQuery({
    queryKey: ["ratePlans", propertyId],
    queryFn: async () => {
      const { data } = await ratePlansApi.getByProperty(propertyId);
      return data.data;
    },
    enabled: !!propertyId,
  });
}

export function useCreateRatePlan(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRatePlanRequest) => ratePlansApi.create(propertyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ratePlans", propertyId] }),
  });
}

export function useUpdateRatePlan(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRatePlanRequest }) =>
      ratePlansApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ratePlans", propertyId] }),
  });
}

export function useDeleteRatePlan(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ratePlansApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ratePlans", propertyId] }),
  });
}
