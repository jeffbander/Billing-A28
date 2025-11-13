import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Check, Download, Loader2, Pencil, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function RatesManagement() {
  const { user, loading: authLoading } = useAuth();
  const { data: rates, isLoading, refetch } = trpc.rates.listWithDetails.useQuery();
  const updateRate = trpc.rates.update.useMutation({
    onSuccess: () => {
      toast.success("Rate updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update rate: ${error.message}`);
    },
  });

  const bulkImportMutation = trpc.rates.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(`Import complete: ${data.successCount} succeeded, ${data.errorCount} failed`);
      if (data.errors.length > 0) {
        console.error("Import errors:", data.errors);
      }
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleEdit = (id: number, currentRate: number) => {
    setEditingId(id);
    setEditValue((currentRate / 100).toFixed(2));
  };

  const handleSave = async (id: number) => {
    const rateInCents = Math.round(parseFloat(editValue) * 100);
    await updateRate.mutateAsync({ id, rate: rateInCents });
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const downloadTemplate = () => {
    const template = `cptCode,payerType,siteType,component,rate,verified,notes
99213,Medicare,FPA,Global,93.00,true,Medicare 2025 rate
99213,Commercial,FPA,Global,134.00,true,Commercial rate
99213,Medicaid,FPA,Global,80.00,true,Medicaid rate
99213,Medicare,Article28,Professional,71.00,true,Medicare 2025 rate
99213,Commercial,Article28,Professional,93.00,true,Commercial rate
99213,Medicaid,Article28,Professional,57.00,true,Medicaid rate
99213,Medicare,Article28,Technical,152.00,true,Medicare 2025 rate
99213,Commercial,Article28,Technical,312.00,true,Commercial rate
99213,Medicaid,Article28,Technical,166.00,true,Medicaid rate`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rates_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').slice(1); // Skip header
    const ratesData = lines
      .filter(line => line.trim())
      .map(line => {
        const [cptCode, payerType, siteType, component, rate, verified, notes] = line.split(',');
        return {
          cptCode: cptCode.trim(),
          payerType: payerType.trim() as "Medicare" | "Commercial" | "Medicaid",
          siteType: siteType.trim() as "FPA" | "Article28",
          component: component.trim() as "Professional" | "Technical" | "Global",
          rate: Math.round(parseFloat(rate) * 100),
          verified: verified?.trim().toLowerCase() === 'true',
          notes: notes?.trim(),
        };
      });

    await bulkImportMutation.mutateAsync({ rates: ratesData });
    event.target.value = '';
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Group rates by CPT code
  const groupedRates = rates?.reduce((acc, rate) => {
    const key = `${rate.cptCode}`;
    if (!acc[key]) {
      acc[key] = {
        cptCode: rate.cptCode || '',
        cptDescription: rate.cptDescription || '',
        rates: [],
      };
    }
    acc[key].rates.push(rate);
    return acc;
  }, {} as Record<string, { cptCode: string; cptDescription: string; rates: typeof rates }>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reimbursement Rates</h1>
            <p className="text-muted-foreground mt-1">
              Manage rates for each CPT code, payer type, and component
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button onClick={() => document.getElementById('csv-upload')?.click()} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>

        {groupedRates && Object.values(groupedRates).map((group) => (
          <Card key={group.cptCode}>
            <CardHeader>
              <CardTitle>{group.cptCode}</CardTitle>
              <CardDescription>{group.cptDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* FPA Global Rates */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-blue-600">FPA - Global</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['Medicare', 'Commercial', 'Medicaid'].map(payerType => {
                      const rate = group.rates.find(
                        r => r.siteType === 'FPA' && r.component === 'Global' && r.payerType === payerType
                      );
                      return (
                        <div key={payerType} className="border rounded-lg p-4">
                          <div className="text-sm font-medium text-muted-foreground mb-2">{payerType}</div>
                          {rate ? (
                            <div className="flex items-center gap-2">
                              {editingId === rate.id ? (
                                <>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="h-8"
                                  />
                                  <Button size="sm" onClick={() => handleSave(rate.id)} className="h-8 w-8 p-0">
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span className="text-lg font-semibold">${(rate.rate / 100).toFixed(2)}</span>
                                  {user?.role === 'admin' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEdit(rate.id, rate.rate)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not set</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Article 28 Professional Rates */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-purple-600">Article 28 - Professional (26)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['Medicare', 'Commercial', 'Medicaid'].map(payerType => {
                      const rate = group.rates.find(
                        r => r.siteType === 'Article28' && r.component === 'Professional' && r.payerType === payerType
                      );
                      return (
                        <div key={payerType} className="border rounded-lg p-4">
                          <div className="text-sm font-medium text-muted-foreground mb-2">{payerType}</div>
                          {rate ? (
                            <div className="flex items-center gap-2">
                              {editingId === rate.id ? (
                                <>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="h-8"
                                  />
                                  <Button size="sm" onClick={() => handleSave(rate.id)} className="h-8 w-8 p-0">
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span className="text-lg font-semibold">${(rate.rate / 100).toFixed(2)}</span>
                                  {user?.role === 'admin' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEdit(rate.id, rate.rate)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not set</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Article 28 Technical Rates */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-purple-600">Article 28 - Technical (TC)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['Medicare', 'Commercial', 'Medicaid'].map(payerType => {
                      const rate = group.rates.find(
                        r => r.siteType === 'Article28' && r.component === 'Technical' && r.payerType === payerType
                      );
                      return (
                        <div key={payerType} className="border rounded-lg p-4">
                          <div className="text-sm font-medium text-muted-foreground mb-2">{payerType}</div>
                          {rate ? (
                            <div className="flex items-center gap-2">
                              {editingId === rate.id ? (
                                <>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="h-8"
                                  />
                                  <Button size="sm" onClick={() => handleSave(rate.id)} className="h-8 w-8 p-0">
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span className="text-lg font-semibold">${(rate.rate / 100).toFixed(2)}</span>
                                  {user?.role === 'admin' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEdit(rate.id, rate.rate)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not set</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
