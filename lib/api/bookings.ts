import api from "./axios";
import type {
  ApiResponse,
  BookingResponse,
  CreateBookingRequest,
  UpdateBookingRequest,
  AvailabilityResponse,
  BookingItemRequest,
  UpdateBookingItemRequest,
  RoomAvailabilityCheckResponse,
} from "@/types";

export const bookingsApi = {
  create: (propertyId: number, data: CreateBookingRequest) =>
    api.post<ApiResponse<BookingResponse>>(`/properties/${propertyId}/bookings`, data),

  getById: (bookingId: number) =>
    api.get<ApiResponse<BookingResponse>>(`/properties/bookings/${bookingId}`),

  update: (bookingId: number, data: UpdateBookingRequest) =>
    api.patch<ApiResponse<BookingResponse>>(`/properties/bookings/${bookingId}`, data),

  delete: (bookingId: number) =>
    api.delete<ApiResponse<void>>(`/properties/bookings/${bookingId}`),

  checkIn: (bookingId: number) =>
    api.post<ApiResponse<BookingResponse>>(`/properties/bookings/${bookingId}/checkin`),

  checkOut: (bookingId: number) =>
    api.post<ApiResponse<BookingResponse>>(`/properties/bookings/${bookingId}/checkout`),

  getAvailability: (propertyId: number, from: string, to: string) =>
    api.get<ApiResponse<AvailabilityResponse>>(
      `/properties/${propertyId}/availability?from=${from}&to=${to}`
    ),

  addItem: (bookingId: number, data: BookingItemRequest) =>
    api.post<ApiResponse<BookingResponse>>(`/bookings/${bookingId}/items`, data),

  updateItem: (bookingId: number, itemId: number, data: UpdateBookingItemRequest) =>
    api.patch<ApiResponse<BookingResponse>>(`/bookings/${bookingId}/items/${itemId}`, data),

  removeItem: (bookingId: number, itemId: number) =>
    api.delete<ApiResponse<BookingResponse>>(`/bookings/${bookingId}/items/${itemId}`),

  checkRoomAvailability: (roomId: number, from: string, to: string) =>
    api.get<ApiResponse<RoomAvailabilityCheckResponse>>(
      `/bookings/rooms/${roomId}/availability?from=${from}&to=${to}`
    ),
};
