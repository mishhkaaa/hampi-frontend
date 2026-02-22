"use client";

import { useState } from "react";
import { useProperty } from "@/lib/providers/property-provider";
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from "@/hooks/use-rooms";
import { useRoomTypes } from "@/hooks/use-room-types";
import { PageHeader } from "@/components/page-header";
import { LoadingTable } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { RoomFormDialog } from "./room-form-dialog";
import type { RoomResponse, CreateRoomRequest, UpdateRoomRequest } from "@/types";

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  AVAILABLE: "success",
  OCCUPIED: "destructive",
  MAINTENANCE: "warning",
  OUT_OF_SERVICE: "secondary",
};

export default function RoomsPage() {
  const { selectedPropertyId } = useProperty();
  const { data: rooms, isLoading } = useRooms(selectedPropertyId!);
  const { data: roomTypes } = useRoomTypes(selectedPropertyId!);
  const createRoom = useCreateRoom(selectedPropertyId!);
  const updateRoom = useUpdateRoom(selectedPropertyId!);
  const deleteRoom = useDeleteRoom(selectedPropertyId!);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoomResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = async (data: CreateRoomRequest) => {
    await createRoom.mutateAsync(data);
    setFormOpen(false);
  };

  const handleUpdate = async (data: UpdateRoomRequest) => {
    if (!editing) return;
    await updateRoom.mutateAsync({ id: editing.id, data });
    setEditing(null);
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) await deleteRoom.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const getRoomTypeName = (id: number) =>
    roomTypes?.find((rt) => rt.id === id)?.name || "—";

  if (isLoading) return <LoadingTable />;

  return (
    <div>
      <PageHeader title="Rooms" description="Manage property rooms">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </PageHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room Number</TableHead>
            <TableHead>Room Type</TableHead>
            <TableHead>Floor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms?.map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium">{room.roomNumber}</TableCell>
              <TableCell>{getRoomTypeName(room.roomTypeId)}</TableCell>
              <TableCell>{room.floorNumber ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[room.status] || "secondary"}>
                  {room.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(room);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(room.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {rooms?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No rooms found. Add your first room.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <RoomFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        room={editing}
        roomTypes={roomTypes || []}
        onSubmit={editing ? handleUpdate : handleCreate}
        isSubmitting={createRoom.isPending || updateRoom.isPending}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Room"
        description="Are you sure you want to delete this room? This action cannot be undone."
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
