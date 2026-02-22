import api from "./axios";
import type {
  ApiResponse,
  RoomMaintenanceResponse,
  CreateRoomMaintenanceRequest,
  UpdateRoomMaintenanceRequest,
} from "@/types";

export const maintenanceApi = {
  getByRoom: (roomId: number) =>
    api.get<ApiResponse<RoomMaintenanceResponse[]>>(`/rooms/${roomId}/maintenance`),

  getById: (maintenanceId: number) =>
    api.get<ApiResponse<RoomMaintenanceResponse>>(`/rooms/maintenance/${maintenanceId}`),

  create: (roomId: number, data: CreateRoomMaintenanceRequest) =>
    api.post<ApiResponse<RoomMaintenanceResponse>>(`/rooms/${roomId}/maintenance`, data),

  update: (maintenanceId: number, data: UpdateRoomMaintenanceRequest) =>
    api.patch<ApiResponse<RoomMaintenanceResponse>>(`/rooms/maintenance/${maintenanceId}`, data),

  delete: (maintenanceId: number) =>
    api.delete<ApiResponse<void>>(`/rooms/maintenance/${maintenanceId}`),
};
