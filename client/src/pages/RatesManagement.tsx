import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, Plus, Pencil, Check, X, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function RatesManagement() {
  const utils = trpc.useUtils();
  const { data: ratesWithDetails, isLoading } = trpc.rates.listWithDetails.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  
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

  const bulkImportMutation = trpc.rates.bulkImport.useMutation({
    onSuccess: (data) => {
      utils.rates.listWithDetails.invalidate();
      if (data.success) {
        toast.success(`Successfully imported ${data.successCount} rates`);
      } else {
        toast.warning(`Imported ${data.successCount} rates with ${data.errorCount} errors`);
        if (data.errors.length > 0) {
          console.error("Import errors:", data.errors);
        }
      }
      setShowImportDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to import rates: ${error.message}`);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file must have a header row and at least one data row");
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const rates = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rate: any = {};

        headers.forEach((header, index) => {
          const value = values[index];
          if (header === 'cptCode') rate.cptCode = value;
          else if (header === 'siteType') rate.siteType = value;
          else if (header === 'component') rate.component = value;
          else if (header === 'rate') rate.rate = Math.round(parseFloat(value) * 100);
          else if (header === 'verified') rate.verified = value.toLowerCase() === 'true';
          else if (header === 'notes') rate.notes = value;
        });

        if (rate.cptCode && rate.siteType && rate.component && !isNaN(rate.rate)) {
          rates.push(rate);
        }
      }

      if (rates.length === 0) {
        toast.error("No valid rates found in CSV");
        return;
      }

      bulkImportMutation.mutate({ rates });
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const downloadTemplate = () => {
    const template = `cptCode,siteType,component,rate,verified,notes\n99213,FPA,Global,93.00,true,Medicare 2025 rate\n99213,Article28,Professional,54.00,true,Medicare 2025 rate\n99213,Article28,Technical,39.00,true,Medicare 2025 rate`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rates_template.csv';
    a.click();
    URL.revokeObjectURL(url);
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
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button onClick={() => document.getElementById('csv-upload')?.click()} disabled={bulkImportMutation.isPending}>
                <Upload className="h-4 w-4 mr-2" />
                {bulkImportMutation.isPending ? "Importing..." : "Import CSV"}
              </Button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
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
