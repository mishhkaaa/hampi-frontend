"use client";

import { useMemo } from "react";
import { useProperty } from "@/lib/providers/property-provider";
import { useRooms } from "@/hooks/use-rooms";
import { useAvailability } from "@/hooks/use-bookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading";
import { BedDouble, UserCheck, UserX, CalendarCheck, CalendarX, DoorOpen } from "lucide-react";
import { format, addDays } from "date-fns";

const statusColorMap: Record<string, string> = {
  AVAILABLE: "bg-green-100 border-green-300 text-green-800",
  OCCUPIED: "bg-red-100 border-red-300 text-red-800",
  MAINTENANCE: "bg-yellow-100 border-yellow-300 text-yellow-800",
  OUT_OF_SERVICE: "bg-gray-200 border-gray-400 text-gray-700",
};

export default function DashboardPage() {
  const { selectedPropertyId } = useProperty();
  const { data: rooms, isLoading: roomsLoading } = useRooms(selectedPropertyId!);
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const { data: availability, isLoading: availLoading } = useAvailability(
    selectedPropertyId!,
    today,
    tomorrow
  );

  const stats = useMemo(() => {
    if (!rooms || !availability) return null;

    const totalRooms = rooms.length;
    const occupied = rooms.filter((r) => r.status === "OCCUPIED").length;
    const available = rooms.filter((r) => r.status === "AVAILABLE").length;
    const maintenance = rooms.filter(
      (r) => r.status === "MAINTENANCE" || r.status === "OUT_OF_SERVICE"
    ).length;

    let checkedIn = 0;
    let checkedOut = 0;
    let expectedArrival = 0;
    let expectedDeparture = 0;

    availability.roomTypes?.forEach((rt) => {
      rt.rooms?.forEach((room) => {
        const todayEntry = room.occupiedDates?.find((od) => od.date === today);
        const tomorrowEntry = room.occupiedDates?.find((od) => od.date === tomorrow);

        if (todayEntry) {
          if (todayEntry.bookingStatus === "CHECKED_IN") checkedIn++;
          if (todayEntry.bookingStatus === "CHECKED_OUT") checkedOut++;
          if (todayEntry.bookingStatus === "CONFIRMED") expectedArrival++;

          // Expected departure: checked-in today but no booking tomorrow
          // (their stay ends today)
          if (todayEntry.bookingStatus === "CHECKED_IN" && !tomorrowEntry) {
            expectedDeparture++;
          }
        }
      });
    });

    return { totalRooms, occupied, available, maintenance, checkedIn, checkedOut, expectedArrival, expectedDeparture };
  }, [rooms, availability, today, tomorrow]);

  if (roomsLoading || availLoading) return <LoadingPage />;

  const statCards = [
    { label: "Occupied Rooms", value: stats?.occupied ?? 0, icon: BedDouble, color: "text-red-600" },
    { label: "Vacant Rooms", value: stats?.available ?? 0, icon: DoorOpen, color: "text-green-600" },
    { label: "Checked In", value: stats?.checkedIn ?? 0, icon: UserCheck, color: "text-blue-600" },
    { label: "Checked Out", value: stats?.checkedOut ?? 0, icon: UserX, color: "text-orange-600" },
    { label: "Expected Arrival", value: stats?.expectedArrival ?? 0, icon: CalendarCheck, color: "text-purple-600" },
    { label: "Expected Departure", value: stats?.expectedDeparture ?? 0, icon: CalendarX, color: "text-pink-600" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Property overview at a glance" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room Status Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {rooms?.map((room) => (
              <div
                key={room.id}
                className={`p-2 rounded-md border text-center text-xs font-medium ${statusColorMap[room.status] || "bg-gray-100"}`}
              >
                <div className="font-bold">{room.roomNumber}</div>
                <div className="text-[10px] mt-0.5 opacity-75">{room.status}</div>
              </div>
            ))}
          </div>
          {rooms?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No rooms configured yet.</p>
          )}
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
              Available
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
              Occupied
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
              Maintenance
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-200 border border-gray-400" />
              Out of Service
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
