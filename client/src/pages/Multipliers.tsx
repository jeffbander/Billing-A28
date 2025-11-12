import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Multipliers() {
  const utils = trpc.useUtils();
  const { data: multipliers, isLoading } = trpc.multipliers.list.useQuery();
  const { data: payers } = trpc.payers.list.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    professional: string;
    technical: string;
    global: string;
  }>({ professional: "", technical: "", global: "" });
  
  const isAdmin = user?.role === "admin";

  const updateMutation = trpc.multipliers.update.useMutation({
    onSuccess: () => {
      utils.multipliers.list.invalidate();
      toast.success("Multiplier updated successfully");
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`Failed to update multiplier: ${error.message}`);
    },
  });

  const formatMultiplier = (value: number) => {
    return `${(value / 100).toFixed(2)}x`;
  };

  const handleEdit = (id: number, prof: number, tech: number, global: number) => {
    setEditingId(id);
    setEditValues({
      professional: (prof / 100).toFixed(2),
      technical: (tech / 100).toFixed(2),
      global: (global / 100).toFixed(2),
    });
  };

  const handleSave = (id: number) => {
    const profCents = Math.round(parseFloat(editValues.professional) * 100);
    const techCents = Math.round(parseFloat(editValues.technical) * 100);
    const globalCents = Math.round(parseFloat(editValues.global) * 100);
    
    if (isNaN(profCents) || isNaN(techCents) || isNaN(globalCents)) {
      toast.error("Please enter valid multiplier values");
      return;
    }
    
    updateMutation.mutate({
      id,
      professionalMultiplier: profCents,
      technicalMultiplier: techCents,
      globalMultiplier: globalCents,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ professional: "", technical: "", global: "" });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payer Multipliers</h1>
            <p className="text-muted-foreground mt-2">
              Default multipliers for calculating reimbursement rates
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>How multipliers work:</strong> These values are applied to Medicare base rates 
              to estimate commercial and Medicaid reimbursement when specific payer rates are not available. 
              For example, a 1.40x professional multiplier means the commercial rate is 140% of the Medicare rate.
            </p>
          </CardContent>
        </Card>

        {/* Multipliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Multipliers</CardTitle>
            <CardDescription>
              Multipliers by payer type and specific payers - Click edit to update values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Payer / Type</th>
                    <th className="text-right p-3 font-medium">Professional (26)</th>
                    <th className="text-right p-3 font-medium">Technical (TC)</th>
                    <th className="text-right p-3 font-medium">Global</th>
                    <th className="text-left p-3 font-medium">Notes</th>
                    {isAdmin && <th className="text-center p-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {multipliers?.map((mult) => {
                    const payer = mult.payerId ? payers?.find(p => p.id === mult.payerId) : null;
                    const label = payer ? payer.payerName : mult.payerType || "Default";
                    const isEditing = editingId === mult.id;
                    
                    return (
                      <tr key={mult.id} className="border-b hover:bg-accent/50">
                        <td className="p-3 font-medium">{label}</td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={editValues.professional}
                                onChange={(e) => setEditValues({...editValues, professional: e.target.value})}
                                className="w-20 h-8 text-right font-mono"
                              />
                              <span className="text-sm">x</span>
                            </div>
                          ) : (
                            <span className="font-mono">{formatMultiplier(mult.professionalMultiplier)}</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={editValues.technical}
                                onChange={(e) => setEditValues({...editValues, technical: e.target.value})}
                                className="w-20 h-8 text-right font-mono"
                              />
                              <span className="text-sm">x</span>
                            </div>
                          ) : (
                            <span className="font-mono">{formatMultiplier(mult.technicalMultiplier)}</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={editValues.global}
                                onChange={(e) => setEditValues({...editValues, global: e.target.value})}
                                className="w-20 h-8 text-right font-mono"
                              />
                              <span className="text-sm">x</span>
                            </div>
                          ) : (
                            <span className="font-mono">{formatMultiplier(mult.globalMultiplier)}</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {mult.notes || "—"}
                        </td>
                        {isAdmin && (
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleSave(mult.id)}
                                  disabled={updateMutation.isPending}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={handleCancel}
                                  disabled={updateMutation.isPending}
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEdit(mult.id, mult.professionalMultiplier, mult.technicalMultiplier, mult.globalMultiplier)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Reference Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reference: Default Multipliers from PRD</CardTitle>
            <CardDescription>
              Standard multipliers based on Milliman/KFF 2025 data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Payer Type</th>
                    <th className="text-right p-2 font-medium">Prof (26)</th>
                    <th className="text-right p-2 font-medium">Tech (TC)</th>
                    <th className="text-right p-2 font-medium">Global</th>
                    <th className="text-left p-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="p-2">Medicare</td>
                    <td className="p-2 text-right">1.00x</td>
                    <td className="p-2 text-right">1.00x</td>
                    <td className="p-2 text-right">1.00x</td>
                    <td className="p-2">Baseline reference</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Commercial</td>
                    <td className="p-2 text-right">1.40x</td>
                    <td className="p-2 text-right">2.20x</td>
                    <td className="p-2 text-right">1.65x</td>
                    <td className="p-2">Milliman/KFF 2025 averages</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Medicaid</td>
                    <td className="p-2 text-right">0.80x</td>
                    <td className="p-2 text-right">0.80x</td>
                    <td className="p-2 text-right">0.80x</td>
                    <td className="p-2">Conservative baseline</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">BCBS</td>
                    <td className="p-2 text-right">1.45x</td>
                    <td className="p-2 text-right">2.00x</td>
                    <td className="p-2 text-right">1.65x</td>
                    <td className="p-2">Typical NY rates</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Aetna</td>
                    <td className="p-2 text-right">1.40x</td>
                    <td className="p-2 text-right">2.10x</td>
                    <td className="p-2 text-right">1.65x</td>
                    <td className="p-2">Market estimate</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">UHC</td>
                    <td className="p-2 text-right">1.50x</td>
                    <td className="p-2 text-right">2.20x</td>
                    <td className="p-2 text-right">1.70x</td>
                    <td className="p-2">NYC range</td>
                  </tr>
                  <tr>
                    <td className="p-2">Cigna</td>
                    <td className="p-2 text-right">1.55x</td>
                    <td className="p-2 text-right">2.15x</td>
                    <td className="p-2 text-right">1.70x</td>
                    <td className="p-2">Common PPO assumption</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
