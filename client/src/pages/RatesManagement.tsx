import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, Plus, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function RatesManagement() {
  const utils = trpc.useUtils();
  const { data: ratesWithDetails, isLoading } = trpc.rates.listWithDetails.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  
  const isAdmin = user?.role === "admin";

  const updateMutation = trpc.rates.update.useMutation({
    onSuccess: () => {
      utils.rates.listWithDetails.invalidate();
      toast.success("Rate updated successfully");
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`Failed to update rate: ${error.message}`);
    },
  });

  const formatCurrency = (cents: number | null) => {
    if (cents === null) return "N/A";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleEdit = (id: number, currentRate: number) => {
    setEditingId(id);
    setEditValue((currentRate / 100).toFixed(2));
  };

  const handleSave = (id: number) => {
    const newRateCents = Math.round(parseFloat(editValue) * 100);
    if (isNaN(newRateCents) || newRateCents < 0) {
      toast.error("Please enter a valid rate");
      return;
    }
    updateMutation.mutate({ id, rate: newRateCents });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
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
            <h1 className="text-3xl font-bold text-foreground">Rate Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage reimbursement rates for CPT codes
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ratesWithDetails?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Verified Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {ratesWithDetails?.filter(r => r.verified).length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Assumed Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {ratesWithDetails?.filter(r => !r.verified).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reimbursement Rates</CardTitle>
            <CardDescription>
              Medicare base rates for different CPT codes and site types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">CPT Code</th>
                    <th className="text-left p-3 font-medium">Site Type</th>
                    <th className="text-left p-3 font-medium">Component</th>
                    <th className="text-right p-3 font-medium">Rate</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    {isAdmin && <th className="text-center p-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {ratesWithDetails?.map((rate) => (
                    <tr key={rate.id} className="border-b hover:bg-accent/50">
                      <td className="p-3">
                        <div className="font-medium">{rate.cptCode}</div>
                        <div className="text-sm text-muted-foreground">{rate.cptDescription}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={rate.siteType === "FPA" ? "default" : "secondary"}>
                          {rate.siteType}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{rate.component}</Badge>
                      </td>
                      <td className="p-3 text-right">
                        {editingId === rate.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24 h-8 text-right"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="font-medium">{formatCurrency(rate.rate)}</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {rate.verified ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Assumed
                          </Badge>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-center">
                          {editingId === rate.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleSave(rate.id)}
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
                              onClick={() => handleEdit(rate.id, rate.rate)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
