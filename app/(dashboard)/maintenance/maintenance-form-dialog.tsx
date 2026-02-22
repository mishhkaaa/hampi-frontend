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
import { Textarea } from "@/components/ui/textarea";
import type { RoomMaintenanceResponse } from "@/types";

const schema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  reason: z.string().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: RoomMaintenanceResponse | null;
  onSubmitCreate: (data: FormData) => Promise<void>;
  onSubmitUpdate: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
}

export function MaintenanceFormDialog({ open, onOpenChange, maintenance, onSubmitCreate, onSubmitUpdate, isSubmitting }: Props) {
  const isEditing = !!maintenance;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
      status: "SCHEDULED",
    },
  });

  useEffect(() => {
    if (maintenance) {
      reset({
        startDate: maintenance.startDate || "",
        endDate: maintenance.endDate || "",
        reason: maintenance.reason || "",
        status: maintenance.status as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED",
      });
    } else {
      reset({
        startDate: "",
        endDate: "",
        reason: "",
        status: "SCHEDULED",
      });
    }
  }, [maintenance, reset]);

  const onSubmit = (data: FormData) => {
    if (isEditing) return onSubmitUpdate(data);
    return onSubmitCreate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Maintenance" : "Schedule Maintenance"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" {...register("startDate")} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" {...register("endDate")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea {...register("reason")} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select {...register("status")}>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
