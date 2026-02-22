import api from "./axios";
import type {
  ApiResponse,
  RoomResponse,
  CreateRoomRequest,
  UpdateRoomRequest,
} from "@/types";

export const roomsApi = {
  getByProperty: (propertyId: number) =>
    api.get<ApiResponse<RoomResponse[]>>(`/properties/${propertyId}/rooms`),

  getById: (roomId: number) =>
    api.get<ApiResponse<RoomResponse>>(`/properties/rooms/${roomId}`),

  create: (propertyId: number, data: CreateRoomRequest) =>
    api.post<ApiResponse<RoomResponse>>(`/properties/${propertyId}/rooms`, data),

  update: (roomId: number, data: UpdateRoomRequest) =>
    api.patch<ApiResponse<RoomResponse>>(`/properties/rooms/${roomId}`, data),

  delete: (roomId: number) =>
    api.delete<ApiResponse<void>>(`/properties/rooms/${roomId}`),
};
