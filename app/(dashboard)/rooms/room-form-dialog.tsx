"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { RoomResponse, RoomTypeResponse } from "@/types";

const roomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  roomTypeId: z.coerce.number().min(1, "Room type is required"),
  floorNumber: z.coerce.number().optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "OUT_OF_SERVICE"]).optional(),
  blockId: z.coerce.number().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: RoomResponse | null;
  roomTypes: RoomTypeResponse[];
  onSubmit: (data: RoomFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function RoomFormDialog({ open, onOpenChange, room, roomTypes, onSubmit, isSubmitting }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoomFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(roomSchema) as any,
  });

  useEffect(() => {
    if (room) {
      reset({
        roomNumber: room.roomNumber,
        roomTypeId: room.roomTypeId,
        floorNumber: room.floorNumber,
        status: room.status,
        blockId: room.blockId,
      });
    } else {
      reset({ roomNumber: "", roomTypeId: 0, floorNumber: undefined, status: "AVAILABLE" });
    }
  }, [room, reset, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{room ? "Edit Room" : "Add Room"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Room Number</Label>
            <Input {...register("roomNumber")} />
            {errors.roomNumber && <p className="text-sm text-destructive">{errors.roomNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Room Type</Label>
            <Select {...register("roomTypeId")}>
              <option value="">Select room type</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </Select>
            {errors.roomTypeId && <p className="text-sm text-destructive">{errors.roomTypeId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Floor Number</Label>
            <Input type="number" {...register("floorNumber")} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select {...register("status")}>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : room ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
