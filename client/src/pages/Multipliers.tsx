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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reimbursement Rate Multipliers</h1>
          <p className="text-muted-foreground mt-2">
            Multipliers applied to Medicare base rates for different insurance types
          </p>
        </div>

        {/* Global / FPA Section */}
        <Card>
          <CardHeader>
            <CardTitle>Global / FPA (Freestanding Office)</CardTitle>
            <CardDescription>
              Single multiplier applied to the global rate for each insurance type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {multipliers?.map((mult) => (
                <div key={mult.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{mult.payerType}</h3>
                      <p className="text-sm text-muted-foreground">
                        {mult.payerType === 'Medicare' && 'Federal health insurance program'}
                        {mult.payerType === 'Commercial' && 'Private insurance companies'}
                        {mult.payerType === 'Medicaid' && 'State health insurance program'}
                      </p>
                    </div>
                    {isAdmin && editingId !== mult.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(mult.id, mult.professionalMultiplier, mult.technicalMultiplier, mult.globalMultiplier)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {editingId === mult.id && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSave(mult.id)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-900">Global Multiplier:</span>
                      {editingId === mult.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editValues.global}
                          onChange={(e) => setEditValues({ ...editValues, global: e.target.value })}
                          className="w-24 text-right"
                        />
                      ) : (
                        <span className="text-lg font-bold text-blue-700">{formatMultiplier(mult.globalMultiplier)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Article 28 Section */}
        <Card>
          <CardHeader>
            <CardTitle>Article 28 (Hospital Outpatient)</CardTitle>
            <CardDescription>
              Separate multipliers for Professional (26) and Technical (TC) components for each insurance type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {multipliers?.map((mult) => (
                <div key={`a28-${mult.id}`} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{mult.payerType}</h3>
                      <p className="text-sm text-muted-foreground">
                        {mult.payerType === 'Medicare' && 'Federal health insurance program'}
                        {mult.payerType === 'Commercial' && 'Private insurance companies'}
                        {mult.payerType === 'Medicaid' && 'State health insurance program'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-purple-900">Professional (26):</span>
                        {editingId === mult.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editValues.professional}
                            onChange={(e) => setEditValues({ ...editValues, professional: e.target.value })}
                            className="w-24 text-right"
                          />
                        ) : (
                          <span className="text-lg font-bold text-purple-700">{formatMultiplier(mult.professionalMultiplier)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-purple-900">Technical (TC):</span>
                        {editingId === mult.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editValues.technical}
                            onChange={(e) => setEditValues({ ...editValues, technical: e.target.value })}
                            className="w-24 text-right"
                          />
                        ) : (
                          <span className="text-lg font-bold text-purple-700">{formatMultiplier(mult.technicalMultiplier)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {!isAdmin && (
          <p className="text-sm text-muted-foreground text-center">
            Contact an administrator to modify multiplier values
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
