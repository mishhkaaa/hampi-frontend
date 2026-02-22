import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api/bookings";
import type {
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingItemRequest,
  UpdateBookingItemRequest,
} from "@/types";

export function useBooking(bookingId: number) {
  return useQuery({
    queryKey: ["bookings", bookingId],
    queryFn: async () => {
      const { data } = await bookingsApi.getById(bookingId);
      return data.data;
    },
    enabled: !!bookingId,
  });
}

export function useAvailability(propertyId: number, from: string, to: string) {
  return useQuery({
    queryKey: ["availability", propertyId, from, to],
    queryFn: async () => {
      const { data } = await bookingsApi.getAvailability(propertyId, from, to);
      return data.data;
    },
    enabled: !!propertyId && !!from && !!to,
  });
}

export function useCreateBooking(propertyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingRequest) => bookingsApi.create(propertyId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBookingRequest }) =>
      bookingsApi.update(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["bookings", variables.id] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookingsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => bookingsApi.checkIn(bookingId),
    onSuccess: (_, bookingId) => {
      qc.invalidateQueries({ queryKey: ["bookings", bookingId] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => bookingsApi.checkOut(bookingId),
    onSuccess: (_, bookingId) => {
      qc.invalidateQueries({ queryKey: ["bookings", bookingId] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useAddBookingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: BookingItemRequest }) =>
      bookingsApi.addItem(bookingId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["bookings", variables.bookingId] });
    },
  });
}

export function useUpdateBookingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, itemId, data }: { bookingId: number; itemId: number; data: UpdateBookingItemRequest }) =>
      bookingsApi.updateItem(bookingId, itemId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["bookings", variables.bookingId] });
    },
  });
}

export function useRemoveBookingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, itemId }: { bookingId: number; itemId: number }) =>
      bookingsApi.removeItem(bookingId, itemId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["bookings", variables.bookingId] });
    },
  });
}
