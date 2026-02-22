import api from "./axios";
import type {
  ApiResponse,
  RoomTypeResponse,
  CreateRoomTypeRequest,
  UpdateRoomTypeRequest,
} from "@/types";

export const roomTypesApi = {
  getByProperty: (propertyId: number) =>
    api.get<ApiResponse<RoomTypeResponse[]>>(`/properties/${propertyId}/room-types`),

  getById: (roomTypeId: number) =>
    api.get<ApiResponse<RoomTypeResponse>>(`/properties/room-types/${roomTypeId}`),

  create: (propertyId: number, data: CreateRoomTypeRequest) =>
    api.post<ApiResponse<RoomTypeResponse>>(`/properties/${propertyId}/room-types`, data),

  update: (roomTypeId: number, data: UpdateRoomTypeRequest) =>
    api.patch<ApiResponse<RoomTypeResponse>>(`/properties/room-types/${roomTypeId}`, data),

  delete: (roomTypeId: number) =>
    api.delete<ApiResponse<void>>(`/properties/room-types/${roomTypeId}`),
};
