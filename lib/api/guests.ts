import api from "./axios";
import type {
  ApiResponse,
  GuestResponse,
  GuestRequest,
  UpdateGuestRequest,
} from "@/types";

export const guestsApi = {
  getByBooking: (bookingId: number) =>
    api.get<ApiResponse<GuestResponse[]>>(`/bookings/${bookingId}/guests`),

  add: (bookingId: number, data: GuestRequest) =>
    api.post<ApiResponse<GuestResponse>>(`/bookings/${bookingId}/guests`, data),

  update: (bookingId: number, guestId: number, data: UpdateGuestRequest) =>
    api.patch<ApiResponse<GuestResponse>>(`/bookings/${bookingId}/guests/${guestId}`, data),
};
