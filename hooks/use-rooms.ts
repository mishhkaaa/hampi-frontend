import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomsApi } from "@/lib/api/rooms";
import type { CreateRoomRequest, UpdateRoomRequest } from "@/types";

export function useRooms(propertyId: number) {
  return useQuery({
    queryKey: ["rooms", propertyId],
    queryFn: async () => {
      const { data } = await roomsApi.getByProperty(propertyId);
      return data.data;
    },
    enabled: !!propertyId,
  });
}

export function useCreateRoom(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoomRequest) => roomsApi.create(propertyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms", propertyId] }),
  });
}

export function useUpdateRoom(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoomRequest }) =>
      roomsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms", propertyId] }),
  });
}

export function useDeleteRoom(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roomsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms", propertyId] }),
  });
}
