import api from "./axios";
import type {
  ApiResponse,
  PaymentResponse,
  CreatePaymentRequest,
} from "@/types";

export const paymentsApi = {
  getByBooking: (bookingId: number) =>
    api.get<ApiResponse<PaymentResponse[]>>(`/bookings/${bookingId}/payments`),

  record: (bookingId: number, data: CreatePaymentRequest) =>
    api.post<ApiResponse<PaymentResponse>>(`/bookings/${bookingId}/payments`, data),
};
