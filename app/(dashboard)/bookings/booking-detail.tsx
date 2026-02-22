"use client";

import { useState } from "react";
import { useBooking, useCheckIn, useCheckOut, useDeleteBooking } from "@/hooks/use-bookings";
import { useGuests, useAddGuest } from "@/hooks/use-guests";
import { usePayments, useRecordPayment } from "@/hooks/use-payments";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ArrowLeft, LogIn, LogOut, Plus } from "lucide-react";
import { PaymentFormDialog } from "./payment-form-dialog";
import { GuestFormDialog } from "./guest-form-dialog";
import type { GuestRequest, CreatePaymentRequest } from "@/types";

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary" | "info" | "default"> = {
  DRAFT: "secondary",
  CONFIRMED: "info",
  CHECKED_IN: "success",
  CHECKED_OUT: "default",
  CANCELLED: "destructive",
  NO_SHOW: "warning",
};

interface Props {
  bookingId: number;
  onBack: () => void;
}

export function BookingDetail({ bookingId, onBack }: Props) {
  const { data: booking, isLoading, isError } = useBooking(bookingId);
  const { data: guests } = useGuests(bookingId);
  const { data: payments } = usePayments(bookingId);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const deleteBooking = useDeleteBooking();
  const addGuest = useAddGuest();
  const recordPayment = useRecordPayment();

  const [tab, setTab] = useState("info");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  if (isLoading) return <LoadingPage />;

  if (isError || !booking) {
    return (
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load booking details. The booking may have been deleted.</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Return to Bookings
          </Button>
        </div>
      </div>
    );
  }

  const handleCheckIn = async () => {
    await checkIn.mutateAsync(bookingId);
  };

  const handleCheckOut = async () => {
    await checkOut.mutateAsync(bookingId);
  };

  const handleDelete = async () => {
    await deleteBooking.mutateAsync(bookingId);
    onBack();
  };

  const handleAddGuest = async (data: GuestRequest) => {
    await addGuest.mutateAsync({ bookingId, data });
    setGuestOpen(false);
  };

  const handleAddPayment = async (data: CreatePaymentRequest) => {
    await recordPayment.mutateAsync({ bookingId, data });
    setPaymentOpen(false);
  };

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Bookings
      </Button>

      <PageHeader title={`Booking #${booking.id}`}>
        <Badge variant={statusVariant[booking.status] || "secondary"} className="text-sm">
          {booking.status}
        </Badge>
        {booking.status === "CONFIRMED" && (
          <Button onClick={handleCheckIn} disabled={checkIn.isPending} className="gap-2">
            <LogIn className="h-4 w-4" />
            Check In
          </Button>
        )}
        {booking.status === "CHECKED_IN" && (
          <Button onClick={handleCheckOut} disabled={checkOut.isPending} variant="secondary" className="gap-2">
            <LogOut className="h-4 w-4" />
            Check Out
          </Button>
        )}
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="rooms">Rooms ({booking.items?.length || 0})</TabsTrigger>
          <TabsTrigger value="guests">Guests ({guests?.length || 0})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium">{booking.source}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant={booking.paymentStatus === "PAID" ? "success" : "warning"}>
                    {booking.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">{booking.currency} {booking.totalAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Advance Amount</p>
                  <p className="font-medium">{booking.currency} {booking.advanceAmount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-in Time</p>
                  <p className="font-medium">{booking.checkinTime || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out Time</p>
                  <p className="font-medium">{booking.checkoutTime || "—"}</p>
                </div>
              </div>
              {booking.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room ID</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Price/Night</TableHead>
                    <TableHead>Adults</TableHead>
                    <TableHead>Children</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.roomId}</TableCell>
                      <TableCell>{item.checkinDate}</TableCell>
                      <TableCell>{item.checkoutDate}</TableCell>
                      <TableCell>{item.pricePerNight}</TableCell>
                      <TableCell>{item.numAdults ?? "—"}</TableCell>
                      <TableCell>{item.numChildren ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Guests</CardTitle>
              <Button size="sm" onClick={() => setGuestOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Guest
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Primary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests?.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>{g.phone || "—"}</TableCell>
                      <TableCell>{g.email || "—"}</TableCell>
                      <TableCell>{g.isPrimary ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Payments</CardTitle>
              <Button size="sm" onClick={() => setPaymentOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Payment
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.currency} {p.amount}</TableCell>
                      <TableCell>{p.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "SUCCESS" ? "success" : p.status === "FAILED" ? "destructive" : "warning"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.transactionId || "—"}</TableCell>
                      <TableCell>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Booking"
        description="Are you sure you want to delete this booking? This action cannot be undone."
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />

      <PaymentFormDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onSubmit={handleAddPayment}
        isSubmitting={recordPayment.isPending}
      />

      <GuestFormDialog
        open={guestOpen}
        onOpenChange={setGuestOpen}
        onSubmit={handleAddGuest}
        isSubmitting={addGuest.isPending}
      />
    </div>
  );
}
