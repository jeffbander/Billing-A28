import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Download, Loader2, Upload, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function RatesManagement() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const { data: rates, isLoading } = trpc.rates.listWithDetails.useQuery();
  const updateMutation = trpc.rates.update.useMutation({
    onSuccess: () => {
      toast.success("Rate updated successfully");
      setEditingId(null);
      utils.rates.listWithDetails.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update rate: ${error.message}`);
    },
  });
  const bulkImportMutation = trpc.rates.bulkImport.useMutation({
    onSuccess: (result) => {
      toast.success(`Imported ${result.success} rates successfully. ${result.errors} errors.`);
      utils.rates.listWithDetails.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to import: ${error.message}`);
    },
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newCptCode, setNewCptCode] = useState("");
  const [newCptDescription, setNewCptDescription] = useState("");
  const [newWorkRvu, setNewWorkRvu] = useState("");
  const [newProcedureType, setNewProcedureType] = useState<"imaging" | "procedure" | "visit">("procedure");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const createCptMutation = trpc.cptCodes.create.useMutation({
    onSuccess: () => {
      toast.success("CPT code added successfully");
      setNewCptCode("");
      setNewCptDescription("");
      setNewWorkRvu("");
      setNewProcedureType("procedure");
      setIsAddDialogOpen(false);
      utils.rates.listWithDetails.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to add CPT code: ${error.message}`);
    },
  });

  const deleteCptMutation = trpc.cptCodes.delete.useMutation({
    onSuccess: () => {
      toast.success("CPT code deleted successfully");
      utils.rates.listWithDetails.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete CPT code: ${error.message}`);
    },
  });

  const handleEdit = (id: number, currentRate: number) => {
    setEditingId(id);
    setEditValue((currentRate / 100).toFixed(2));
  };

  const handleSave = async (id: number) => {
    const rateInCents = Math.round(parseFloat(editValue) * 100);
    await updateMutation.mutateAsync({ id, rate: rateInCents });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleAddCptCode = async () => {
    if (!newCptCode.trim() || !newCptDescription.trim()) {
      toast.error("Please enter both CPT code and description");
      return;
    }
    const workRvu = newWorkRvu.trim() ? parseFloat(newWorkRvu) : undefined;
    if (newWorkRvu.trim() && (isNaN(workRvu!) || workRvu! < 0)) {
      toast.error("Work RVU must be a positive number");
      return;
    }
    await createCptMutation.mutateAsync({
      code: newCptCode.trim(),
      description: newCptDescription.trim(),
      workRvu,
      procedureType: newProcedureType,
    });
  };

  const handleDeleteCptCode = async (cptCodeId: number) => {
    await deleteCptMutation.mutateAsync({ id: cptCodeId });
  };

  const downloadTemplate = () => {
    const template = `cptCode,payerType,siteType,component,rate,verified,notes
99213,Medicare,FPA,Global,80.00,true,Medicare 2025 rate
99213,Commercial,FPA,Global,134.00,true,Commercial rate
99213,Medicaid,FPA,Global,98.00,true,Medicaid rate
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
        cptCodeId: rate.cptCodeId,
        cptCode: rate.cptCode || '',
        cptDescription: rate.cptDescription || '',
        rates: [],
      };
    }
    acc[key].rates.push(rate);
    return acc;
  }, {} as Record<string, { cptCodeId: number; cptCode: string; cptDescription: string; rates: typeof rates }>);

  const renderRateCell = (rate: any) => {
    if (!rate) {
      // Show $0.00 for missing rates
      return <span className="text-lg font-semibold text-muted-foreground">$0.00</span>;
    }

    if (editingId === rate.id) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 w-24"
            autoFocus
          />
          <Button size="sm" onClick={() => handleSave(rate.id)} className="h-8 w-8 p-0">
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
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
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reimbursement Rates</h1>
            <p className="text-muted-foreground mt-1">
              View and edit reimbursement rates for each CPT code and payer type
            </p>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Plus className="w-4 h-4 mr-2" />
                    Add CPT Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New CPT Code</DialogTitle>
                    <DialogDescription>
                      Enter the CPT code and description. Placeholder rates will be created automatically.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpt-code">CPT Code</Label>
                      <Input
                        id="cpt-code"
                        placeholder="e.g., 99214"
                        value={newCptCode}
                        onChange={(e) => setNewCptCode(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="e.g., Office visit, established patient"
                        value={newCptDescription}
                        onChange={(e) => setNewCptDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work-rvu">Work RVU (Optional)</Label>
                      <Input
                        id="work-rvu"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 1.40"
                        value={newWorkRvu}
                        onChange={(e) => setNewWorkRvu(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">CMS work RVU value for this procedure</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="procedure-type">Procedure Type</Label>
                      <select
                        id="procedure-type"
                        value={newProcedureType}
                        onChange={(e) => setNewProcedureType(e.target.value as "imaging" | "procedure" | "visit")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="procedure">Procedure</option>
                        <option value="imaging">Imaging</option>
                        <option value="visit">Visit</option>
                      </select>
                      <p className="text-xs text-muted-foreground">Imaging codes track orders/reads separately</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCptCode} disabled={createCptMutation.isPending}>
                      {createCptMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add CPT Code
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
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

        {groupedRates && Object.values(groupedRates).map((group) => {
          // Organize rates by payer type and component
          const getRateFor = (siteType: string, component: string, payerType: string) => {
            return group.rates.find(
              r => r.siteType === siteType && r.component === component && r.payerType === payerType
            );
          };

          return (
            <Card key={group.cptCode}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{group.cptCode}</CardTitle>
                    <CardDescription>{group.cptDescription}</CardDescription>
                  </div>
                  {user?.role === 'admin' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete CPT Code</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete CPT code {group.cptCode}? This will also delete all associated rates. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCptCode(group.cptCodeId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteCptMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Site Type / Component</th>
                        <th className="text-center p-3 font-semibold">Medicare</th>
                        <th className="text-center p-3 font-semibold bg-blue-50">Commercial</th>
                        <th className="text-center p-3 font-semibold bg-green-50">Medicaid</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-blue-600">FPA - Global</td>
                        <td className="p-3 text-center">{renderRateCell(getRateFor('FPA', 'Global', 'Medicare'))}</td>
                        <td className="p-3 text-center bg-blue-50">{renderRateCell(getRateFor('FPA', 'Global', 'Commercial'))}</td>
                        <td className="p-3 text-center bg-green-50">{renderRateCell(getRateFor('FPA', 'Global', 'Medicaid'))}</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-purple-600">Article 28 - Professional (26)</td>
                        <td className="p-3 text-center">{renderRateCell(getRateFor('Article28', 'Professional', 'Medicare'))}</td>
                        <td className="p-3 text-center bg-blue-50">{renderRateCell(getRateFor('Article28', 'Professional', 'Commercial'))}</td>
                        <td className="p-3 text-center bg-green-50">{renderRateCell(getRateFor('Article28', 'Professional', 'Medicaid'))}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-purple-600">Article 28 - Technical (TC)</td>
                        <td className="p-3 text-center">{renderRateCell(getRateFor('Article28', 'Technical', 'Medicare'))}</td>
                        <td className="p-3 text-center bg-blue-50">{renderRateCell(getRateFor('Article28', 'Technical', 'Commercial'))}</td>
                        <td className="p-3 text-center bg-green-50">{renderRateCell(getRateFor('Article28', 'Technical', 'Medicaid'))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
