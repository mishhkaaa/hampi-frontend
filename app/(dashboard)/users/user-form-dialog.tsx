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
import { useRoles } from "@/hooks/use-roles";
import type { UserResponse } from "@/types";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.coerce.number().min(1, "Role is required"),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  roleId: z.coerce.number().min(1, "Role is required"),
  isActive: z.boolean().optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserResponse | null;
  onSubmitCreate: (data: z.infer<typeof createSchema>) => Promise<void>;
  onSubmitUpdate: (data: z.infer<typeof updateSchema>) => Promise<void>;
  isSubmitting: boolean;
}

export function UserFormDialog({ open, onOpenChange, user, onSubmitCreate, onSubmitUpdate, isSubmitting }: Props) {
  const { data: roles } = useRoles();
  const isEditing = !!user;
  const schema = isEditing ? updateSchema : createSchema;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: "",
        roleId: user.roleId || 0,
        isActive: user.isActive ?? true,
      });
    } else {
      reset({ name: "", email: "", password: "", roleId: 0, isActive: true });
    }
  }, [user, reset]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: Record<string, any>) => {
    if (isEditing) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, email, ...updateData } = data;
      return onSubmitUpdate(updateData as z.infer<typeof updateSchema>);
    }
    return onSubmitCreate(data as z.infer<typeof createSchema>);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{String(errors.name.message)}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register("email")} disabled={isEditing} />
            {errors.email && <p className="text-sm text-destructive">{String(errors.email.message)}</p>}
          </div>
          {!isEditing && (
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{String(errors.password.message)}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select {...register("roleId")}>
              <option value="">Select Role</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </Select>
            {errors.roleId && <p className="text-sm text-destructive">{String(errors.roleId.message)}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register("isActive")} />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
