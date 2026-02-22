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
import type { RateRuleResponse, RoomTypeResponse } from "@/types";

const schema = z.object({
  roomTypeId: z.coerce.number().min(1, "Room type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  weekdayPrice: z.coerce.number().min(0, "Must be >= 0"),
  weekendPrice: z.coerce.number().min(0, "Must be >= 0"),
  extraAdultPrice: z.coerce.number().min(0).optional(),
  extraChildPrice: z.coerce.number().min(0).optional(),
  minNights: z.coerce.number().min(1).optional(),
  priority: z.coerce.number().min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: RateRuleResponse | null;
  roomTypes: RoomTypeResponse[];
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
}

export function RateRuleFormDialog({ open, onOpenChange, rule, roomTypes, onSubmit, isSubmitting }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  useEffect(() => {
    if (rule) {
      reset({
        roomTypeId: rule.roomTypeId,
        startDate: rule.startDate,
        endDate: rule.endDate,
        weekdayPrice: rule.weekdayPrice,
        weekendPrice: rule.weekendPrice,
        extraAdultPrice: rule.extraAdultPrice,
        extraChildPrice: rule.extraChildPrice,
        minNights: rule.minNights,
        priority: rule.priority,
        status: rule.status,
        notes: rule.notes || "",
      });
    } else {
      reset({
        roomTypeId: 0,
        startDate: "",
        endDate: "",
        weekdayPrice: 0,
        weekendPrice: 0,
        extraAdultPrice: 0,
        extraChildPrice: 0,
        minNights: 1,
        priority: 1,
        status: "ACTIVE",
        notes: "",
      });
    }
  }, [rule, reset, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Rate Rule" : "Add Rate Rule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" {...register("startDate")} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" {...register("endDate")} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Weekday Price</Label>
              <Input type="number" step="0.01" {...register("weekdayPrice")} />
              {errors.weekdayPrice && <p className="text-sm text-destructive">{errors.weekdayPrice.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Weekend Price</Label>
              <Input type="number" step="0.01" {...register("weekendPrice")} />
              {errors.weekendPrice && <p className="text-sm text-destructive">{errors.weekendPrice.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Extra Adult Price</Label>
              <Input type="number" step="0.01" {...register("extraAdultPrice")} />
            </div>
            <div className="space-y-2">
              <Label>Extra Child Price</Label>
              <Input type="number" step="0.01" {...register("extraChildPrice")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Min Nights</Label>
              <Input type="number" {...register("minNights")} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Input type="number" {...register("priority")} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select {...register("status")}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : rule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
