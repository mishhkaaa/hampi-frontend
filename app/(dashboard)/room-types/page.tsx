"use client";

import { useState } from "react";
import { useProperty } from "@/lib/providers/property-provider";
import { useRoomTypes, useCreateRoomType, useUpdateRoomType, useDeleteRoomType } from "@/hooks/use-room-types";
import { PageHeader } from "@/components/page-header";
import { LoadingTable } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { RoomTypeFormDialog } from "./room-type-form-dialog";
import type { RoomTypeResponse, CreateRoomTypeRequest, UpdateRoomTypeRequest } from "@/types";

export default function RoomTypesPage() {
  const { selectedPropertyId } = useProperty();
  const { data: roomTypes, isLoading } = useRoomTypes(selectedPropertyId!);
  const createRoomType = useCreateRoomType(selectedPropertyId!);
  const updateRoomType = useUpdateRoomType(selectedPropertyId!);
  const deleteRoomType = useDeleteRoomType(selectedPropertyId!);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoomTypeResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = async (data: CreateRoomTypeRequest) => {
    await createRoomType.mutateAsync(data);
    setFormOpen(false);
  };

  const handleUpdate = async (data: UpdateRoomTypeRequest) => {
    if (!editing) return;
    await updateRoomType.mutateAsync({ id: editing.id, data });
    setEditing(null);
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) await deleteRoomType.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (isLoading) return <LoadingTable />;

  return (
    <div>
      <PageHeader title="Room Types" description="Manage room type categories">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Room Type
        </Button>
      </PageHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Base Occupancy</TableHead>
            <TableHead>Max Occupancy</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roomTypes?.map((rt) => (
            <TableRow key={rt.id}>
              <TableCell className="font-medium">{rt.name}</TableCell>
              <TableCell>{rt.description || "—"}</TableCell>
              <TableCell>{rt.baseOccupancy ?? "—"}</TableCell>
              <TableCell>{rt.maxOccupancy ?? "—"}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => { setEditing(rt); setFormOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(rt.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {roomTypes?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No room types found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <RoomTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        roomType={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        isSubmitting={createRoomType.isPending || updateRoomType.isPending}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Room Type"
        description="Are you sure? This will affect all rooms using this type."
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
