"use client";

import { useState } from "react";
import { useProperty } from "@/lib/providers/property-provider";
import { useRooms } from "@/hooks/use-rooms";
import { useRoomMaintenance, useCreateMaintenance, useUpdateMaintenance, useDeleteMaintenance } from "@/hooks/use-maintenance";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { MaintenanceFormDialog } from "./maintenance-form-dialog";
import type { RoomMaintenanceResponse, CreateRoomMaintenanceRequest, UpdateRoomMaintenanceRequest } from "@/types";

const statusVariant: Record<string, "warning" | "info" | "success"> = {
  SCHEDULED: "warning",
  IN_PROGRESS: "info",
  COMPLETED: "success",
};

export default function MaintenancePage() {
  const { selectedPropertyId } = useProperty();
  const { data: rooms, isLoading: roomsLoading } = useRooms(selectedPropertyId!);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const { data: maintenanceList, isLoading } = useRoomMaintenance(selectedRoomId ?? 0);
  const createMaintenance = useCreateMaintenance();
  const updateMaintenance = useUpdateMaintenance();
  const deleteMaintenance = useDeleteMaintenance();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoomMaintenanceResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = async (data: CreateRoomMaintenanceRequest) => {
    if (!selectedRoomId) return;
    await createMaintenance.mutateAsync({ roomId: selectedRoomId, data });
    setFormOpen(false);
  };

  const handleUpdate = async (data: UpdateRoomMaintenanceRequest) => {
    if (!editing) return;
    await updateMaintenance.mutateAsync({ id: editing.id, data });
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMaintenance.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (roomsLoading) return <LoadingPage />;

  return (
    <div>
      <PageHeader title="Room Maintenance" description="Schedule and track room maintenance">
        {selectedRoomId && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
        )}
      </PageHeader>

      <div className="mb-6 max-w-xs">
        <Select
          value={selectedRoomId?.toString() || ""}
          onChange={(e) => setSelectedRoomId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Select a Room</option>
          {rooms?.map((room) => (
            <option key={room.id} value={room.id}>Room {room.roomNumber}</option>
          ))}
        </Select>
      </div>

      {!selectedRoomId ? (
        <p className="text-center text-muted-foreground py-12">
          Select a room to view and manage maintenance records.
        </p>
      ) : isLoading ? (
        <LoadingPage />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceList?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.reason}</TableCell>
                  <TableCell>{m.startDate || "—"}</TableCell>
                  <TableCell>{m.endDate || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[m.status] || "secondary"}>
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!maintenanceList || maintenanceList.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No maintenance records for this room.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <MaintenanceFormDialog
        open={formOpen || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
        maintenance={editing}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
        isSubmitting={createMaintenance.isPending || updateMaintenance.isPending}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Maintenance Record"
        description="Are you sure you want to delete this maintenance record?"
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
