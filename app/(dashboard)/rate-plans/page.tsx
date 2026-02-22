"use client";

import { useState } from "react";
import { useProperty } from "@/lib/providers/property-provider";
import { useRatePlans, useCreateRatePlan, useUpdateRatePlan, useDeleteRatePlan } from "@/hooks/use-rate-plans";
import { PageHeader } from "@/components/page-header";
import { LoadingTable } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, List } from "lucide-react";
import { RatePlanFormDialog } from "./rate-plan-form-dialog";
import { RateRulesPanel } from "./rate-rules-panel";
import type { RatePlanResponse, CreateRatePlanRequest, UpdateRatePlanRequest } from "@/types";

export default function RatePlansPage() {
  const { selectedPropertyId } = useProperty();
  const { data: plans, isLoading } = useRatePlans(selectedPropertyId!);
  const createPlan = useCreateRatePlan(selectedPropertyId!);
  const updatePlan = useUpdateRatePlan(selectedPropertyId!);
  const deletePlan = useDeleteRatePlan(selectedPropertyId!);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RatePlanResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [rulesForPlan, setRulesForPlan] = useState<RatePlanResponse | null>(null);

  const handleCreate = async (data: CreateRatePlanRequest) => {
    await createPlan.mutateAsync(data);
    setFormOpen(false);
  };

  const handleUpdate = async (data: UpdateRatePlanRequest) => {
    if (!editing) return;
    await updatePlan.mutateAsync({ id: editing.id, data });
    setEditing(null);
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) await deletePlan.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (isLoading) return <LoadingTable />;

  if (rulesForPlan) {
    return (
      <RateRulesPanel
        ratePlan={rulesForPlan}
        onBack={() => setRulesForPlan(null)}
      />
    );
  }

  return (
    <div>
      <PageHeader title="Rate Plans" description="Manage pricing plans">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rate Plan
        </Button>
      </PageHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans?.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell>{plan.currency}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => setRulesForPlan(plan)} title="View Rules">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setEditing(plan); setFormOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(plan.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {plans?.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                No rate plans found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <RatePlanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        ratePlan={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        isSubmitting={createPlan.isPending || updatePlan.isPending}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Rate Plan"
        description="This will also delete all associated rate rules."
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
