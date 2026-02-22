import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceApi } from "@/lib/api/maintenance";
import type { CreateRoomMaintenanceRequest, UpdateRoomMaintenanceRequest } from "@/types";

export function useRoomMaintenance(roomId: number) {
  return useQuery({
    queryKey: ["maintenance", roomId],
    queryFn: async () => {
      const { data } = await maintenanceApi.getByRoom(roomId);
      return data.data;
    },
    enabled: !!roomId,
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: number; data: CreateRoomMaintenanceRequest }) =>
      maintenanceApi.create(roomId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["maintenance", variables.roomId] });
    },
  });
}

export function useUpdateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoomMaintenanceRequest }) =>
      maintenanceApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}

export function useDeleteMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => maintenanceApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}
