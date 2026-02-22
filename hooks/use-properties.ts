import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { propertiesApi } from "@/lib/api/properties";
import type { CreatePropertyRequest, UpdatePropertyRequest } from "@/types";

export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data } = await propertiesApi.getAll();
      return data.data;
    },
  });
}

export function useProperty(propertyId: number) {
  return useQuery({
    queryKey: ["properties", propertyId],
    queryFn: async () => {
      const { data } = await propertiesApi.getById(propertyId);
      return data.data;
    },
    enabled: !!propertyId,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePropertyRequest) => propertiesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePropertyRequest }) =>
      propertiesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => propertiesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}
