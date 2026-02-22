import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomTypesApi } from "@/lib/api/room-types";
import type { CreateRoomTypeRequest, UpdateRoomTypeRequest } from "@/types";

export function useRoomTypes(propertyId: number) {
  return useQuery({
    queryKey: ["roomTypes", propertyId],
    queryFn: async () => {
      const { data } = await roomTypesApi.getByProperty(propertyId);
      return data.data;
    },
    enabled: !!propertyId,
  });
}

export function useCreateRoomType(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoomTypeRequest) => roomTypesApi.create(propertyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roomTypes", propertyId] }),
  });
}

export function useUpdateRoomType(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoomTypeRequest }) =>
      roomTypesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roomTypes", propertyId] }),
  });
}

export function useDeleteRoomType(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roomTypesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roomTypes", propertyId] }),
  });
}
