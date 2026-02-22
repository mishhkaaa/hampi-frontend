import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments";
import type { CreatePaymentRequest } from "@/types";

export function usePayments(bookingId: number) {
  return useQuery({
    queryKey: ["payments", bookingId],
    queryFn: async () => {
      const { data } = await paymentsApi.getByBooking(bookingId);
      return data.data;
    },
    enabled: !!bookingId,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: CreatePaymentRequest }) =>
      paymentsApi.record(bookingId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["payments", variables.bookingId] });
      qc.invalidateQueries({ queryKey: ["bookings", variables.bookingId] });
    },
  });
}
