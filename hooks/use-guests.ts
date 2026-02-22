import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { guestsApi } from "@/lib/api/guests";
import type { GuestRequest, UpdateGuestRequest } from "@/types";

export function useGuests(bookingId: number) {
  return useQuery({
    queryKey: ["guests", bookingId],
    queryFn: async () => {
      const { data } = await guestsApi.getByBooking(bookingId);
      return data.data;
    },
    enabled: !!bookingId,
  });
}

export function useAddGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: GuestRequest }) =>
      guestsApi.add(bookingId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["guests", variables.bookingId] });
    },
  });
}

export function useUpdateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, guestId, data }: { bookingId: number; guestId: number; data: UpdateGuestRequest }) =>
      guestsApi.update(bookingId, guestId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["guests", variables.bookingId] });
    },
  });
}
