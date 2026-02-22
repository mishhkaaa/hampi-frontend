"use client";

import { useState, useMemo } from "react";
import { useProperty } from "@/lib/providers/property-provider";
import { useAvailability } from "@/hooks/use-bookings";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfDay, eachDayOfInterval } from "date-fns";

const bookingStatusColors: Record<string, string> = {
  CONFIRMED: "bg-blue-200 hover:bg-blue-300",
  CHECKED_IN: "bg-green-200 hover:bg-green-300",
  CHECKED_OUT: "bg-gray-200 hover:bg-gray-300",
  DRAFT: "bg-yellow-200 hover:bg-yellow-300",
  CANCELLED: "bg-red-100 hover:bg-red-200",
  NO_SHOW: "bg-orange-200 hover:bg-orange-300",
  MAINTENANCE: "bg-purple-200 hover:bg-purple-300",
};

export default function AvailabilityPage() {
  const { selectedPropertyId } = useProperty();
  const [startDate, setStartDate] = useState(() => format(startOfDay(new Date()), "yyyy-MM-dd"));
  const days = 14;
  const endDate = useMemo(() => format(addDays(new Date(startDate), days - 1), "yyyy-MM-dd"), [startDate]);

  const { data: availability, isLoading } = useAvailability(selectedPropertyId!, startDate, endDate);

  const dateRange = useMemo(() => {
    return eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
  }, [startDate, endDate]);

  const shiftDays = (offset: number) => {
    setStartDate(format(addDays(new Date(startDate), offset), "yyyy-MM-dd"));
  };

  return (
    <div>
      <PageHeader title="Availability" description="Room availability calendar view" />

      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => shiftDays(-7)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-44"
        />
        <span className="text-sm text-muted-foreground">to {endDate}</span>
        <Button variant="outline" size="icon" onClick={() => shiftDays(7)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <LoadingPage />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Room Availability Grid</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-background z-10 px-3 py-2 text-left font-medium border-b min-w-[140px]">
                    Room
                  </th>
                  {dateRange.map((date) => (
                    <th key={date.toISOString()} className="px-1 py-2 text-center font-medium border-b min-w-[60px]">
                      <div>{format(date, "dd")}</div>
                      <div className="text-[10px] text-muted-foreground">{format(date, "EEE")}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {availability?.roomTypes?.map((rt) => (
                  <>
                    <tr key={`type-${rt.roomTypeId}`}>
                      <td colSpan={dateRange.length + 1} className="bg-muted/50 px-3 py-1 font-semibold text-sm border-b">
                        {rt.roomTypeName}
                      </td>
                    </tr>
                    {rt.rooms?.map((room) => {
                      const occupiedMap = new Map(
                        room.occupiedDates?.map((od) => [od.date, od]) || []
                      );
                      return (
                        <tr key={room.roomId}>
                          <td className="sticky left-0 bg-background z-10 px-3 py-1.5 border-b font-medium">
                            {room.roomNumber}
                          </td>
                          {dateRange.map((date) => {
                            const dateStr = format(date, "yyyy-MM-dd");
                            const occupied = occupiedMap.get(dateStr);
                            const cellClass = occupied
                              ? bookingStatusColors[occupied.bookingStatus] || bookingStatusColors[occupied.status] || "bg-gray-100"
                              : "bg-green-50";
                            return (
                              <td key={dateStr} className="px-0.5 py-0.5 border-b">
                                <Tooltip
                                  content={
                                    occupied
                                      ? `${occupied.bookingStatus || occupied.status}${occupied.reason ? ` - ${occupied.reason}` : ""}${occupied.bookingId ? ` (#${occupied.bookingId})` : ""}`
                                      : "Available"
                                  }
                                >
                                  <div className={`h-6 rounded-sm ${cellClass} transition-colors cursor-default`} />
                                </Tooltip>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>

            {(!availability?.roomTypes || availability.roomTypes.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No room data available.</p>
            )}

            <div className="flex flex-wrap gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-50 border" />Available</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-200" />Confirmed</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-200" />Checked In</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-200" />Checked Out</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-200" />Draft</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-200" />No Show</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-purple-200" />Maintenance</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
