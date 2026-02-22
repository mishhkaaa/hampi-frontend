"use client";

import { useState, useMemo } from "react";
import { useProperty } from "@/lib/providers/property-provider";
import { useAvailability, useCreateBooking } from "@/hooks/use-bookings";
import { useRooms } from "@/hooks/use-rooms";
import { useRoomTypes } from "@/hooks/use-room-types";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight } from "lucide-react";
import { BookingCreateDialog } from "./booking-create-dialog";
import { BookingDetail } from "./booking-detail";
import { format } from "date-fns";
import type { CreateBookingRequest, BookingStatus } from "@/types";

interface BookingSummary {
  bookingId: number;
  status: BookingStatus;
  earliestDate: string;
  latestDate: string;
  roomCount: number;
}

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary" | "info" | "default"> = {
  DRAFT: "secondary",
  CONFIRMED: "info",
  CHECKED_IN: "success",
  CHECKED_OUT: "default",
  CANCELLED: "destructive",
  NO_SHOW: "warning",
};

export default function BookingsPage() {
  const { selectedPropertyId } = useProperty();
  const today = format(new Date(), "yyyy-MM-dd");
  const endDate = format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd");
  const { data: availability, isLoading: availLoading } = useAvailability(selectedPropertyId!, today, endDate);
  const { data: rooms, isLoading: roomsLoading } = useRooms(selectedPropertyId!);
  const { data: roomTypes } = useRoomTypes(selectedPropertyId!);
  const createBooking = useCreateBooking(selectedPropertyId!);

  const [createOpen, setCreateOpen] = useState(false);
  const [viewBookingId, setViewBookingId] = useState<number | null>(null);

  // Collect booking summaries from availability data
  const bookings = useMemo(() => {
    if (!availability) return [];

    const map = new Map<number, BookingSummary>();

    availability.roomTypes?.forEach((rt) => {
      rt.rooms?.forEach((room) => {
        room.occupiedDates?.forEach((od) => {
          if (!od.bookingId) return;

          const existing = map.get(od.bookingId);
          if (existing) {
            if (od.date < existing.earliestDate) existing.earliestDate = od.date;
            if (od.date > existing.latestDate) existing.latestDate = od.date;
            // Count unique rooms per booking via a set stored temporarily
            existing.roomCount = existing.roomCount; // updated below
          } else {
            map.set(od.bookingId, {
              bookingId: od.bookingId,
              status: od.bookingStatus,
              earliestDate: od.date,
              latestDate: od.date,
              roomCount: 0,
            });
          }
        });
      });
    });

    // Second pass: count unique rooms per booking
    const roomSets = new Map<number, Set<number>>();
    availability.roomTypes?.forEach((rt) => {
      rt.rooms?.forEach((room) => {
        room.occupiedDates?.forEach((od) => {
          if (!od.bookingId) return;
          if (!roomSets.has(od.bookingId)) roomSets.set(od.bookingId, new Set());
          roomSets.get(od.bookingId)!.add(room.roomId);
        });
      });
    });
    roomSets.forEach((rooms, bookingId) => {
      const entry = map.get(bookingId);
      if (entry) entry.roomCount = rooms.size;
    });

    // Sort by earliest date descending (most recent first)
    return Array.from(map.values()).sort((a, b) => b.earliestDate.localeCompare(a.earliestDate));
  }, [availability]);

  const handleCreate = async (data: CreateBookingRequest) => {
    const res = await createBooking.mutateAsync(data);
    setCreateOpen(false);
    setViewBookingId(res.data.data.id);
  };

  if (viewBookingId) {
    return <BookingDetail bookingId={viewBookingId} onBack={() => setViewBookingId(null)} />;
  }

  const isLoading = availLoading || roomsLoading;

  return (
    <div>
      <PageHeader title="Bookings" description="Create and manage bookings">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="grid gap-3">
          {bookings.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No bookings found for the next 30 days. Create a new booking to get started.
            </p>
          )}
          {bookings.map((b) => (
            <div
              key={b.bookingId}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setViewBookingId(b.bookingId)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-medium">Booking #{b.bookingId}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {b.earliestDate} → {b.latestDate} &middot; {b.roomCount} {b.roomCount === 1 ? "room" : "rooms"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant[b.status] || "secondary"}>{b.status}</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      <BookingCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        rooms={rooms || []}
        roomTypes={roomTypes || []}
        onSubmit={handleCreate}
        isSubmitting={createBooking.isPending}
      />
    </div>
  );
}
