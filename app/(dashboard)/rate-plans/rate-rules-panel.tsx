"use client";

import { useState } from "react";
import { useRateRules, useCreateRateRule, useUpdateRateRule, useDeleteRateRule } from "@/hooks/use-rate-rules";
import { useRoomTypes } from "@/hooks/use-room-types";
import { useProperty } from "@/lib/providers/property-provider";
import { PageHeader } from "@/components/page-header";
import { LoadingTable } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { RateRuleFormDialog } from "./rate-rule-form-dialog";
import type { RatePlanResponse, RateRuleResponse, CreateRateRuleRequest, UpdateRateRuleRequest } from "@/types";

interface Props {
  ratePlan: RatePlanResponse;
  onBack: () => void;
}

export function RateRulesPanel({ ratePlan, onBack }: Props) {
  const { selectedPropertyId } = useProperty();
  const { data: rules, isLoading } = useRateRules(ratePlan.id);
  const { data: roomTypes } = useRoomTypes(selectedPropertyId!);
  const createRule = useCreateRateRule(ratePlan.id);
  const updateRule = useUpdateRateRule(ratePlan.id);
  const deleteRule = useDeleteRateRule(ratePlan.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RateRuleResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = async (data: CreateRateRuleRequest) => {
    await createRule.mutateAsync(data);
    setFormOpen(false);
  };

  const handleUpdate = async (data: UpdateRateRuleRequest) => {
    if (!editing) return;
    await updateRule.mutateAsync({ id: editing.id, data });
    setEditing(null);
    setFormOpen(false);
  };

  const getRoomTypeName = (id: number) => roomTypes?.find((rt) => rt.id === id)?.name || "—";

  if (isLoading) return <LoadingTable />;

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Rate Plans
        </Button>
      </div>

      <PageHeader title={`Rate Rules — ${ratePlan.name}`} description={`Currency: ${ratePlan.currency}`}>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </PageHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room Type</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Weekday Price</TableHead>
            <TableHead>Weekend Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules?.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell>{getRoomTypeName(rule.roomTypeId)}</TableCell>
              <TableCell>{rule.startDate}</TableCell>
              <TableCell>{rule.endDate}</TableCell>
              <TableCell>{rule.weekdayPrice}</TableCell>
              <TableCell>{rule.weekendPrice}</TableCell>
              <TableCell>
                <Badge variant={rule.status === "ACTIVE" ? "success" : "secondary"}>
                  {rule.status}
                </Badge>
              </TableCell>
              <TableCell>{rule.priority}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => { setEditing(rule); setFormOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(rule.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {rules?.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No rate rules found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <RateRuleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        rule={editing}
        roomTypes={roomTypes || []}
        onSubmit={editing ? handleUpdate : handleCreate}
        isSubmitting={createRule.isPending || updateRule.isPending}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Rate Rule"
        description="Are you sure you want to delete this rate rule?"
        onConfirm={async () => { if (deleteId) await deleteRule.mutateAsync(deleteId); setDeleteId(null); }}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
