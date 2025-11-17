import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Plus, Trash2, Calculator } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ScenarioBuilder() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const { data: rates } = trpc.rates.listWithDetails.useQuery();
  
  // Extract unique CPT codes from rates
  const cptCodes = useMemo(() => {
    if (!rates) return [];
    const uniqueCodes = new Map<number, { id: number; code: string; description: string }>();
    rates.forEach(rate => {
      if (!uniqueCodes.has(rate.cptCodeId) && rate.cptCode && rate.cptDescription) {
        uniqueCodes.set(rate.cptCodeId, {
          id: rate.cptCodeId,
          code: rate.cptCode,
          description: rate.cptDescription
        });
      }
    });
    return Array.from(uniqueCodes.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [rates]);
  
  const [scenarioName, setScenarioName] = useState("");
  const [medicarePercent, setMedicarePercent] = useState("40");
  const [commercialPercent, setCommercialPercent] = useState("40");
  const [medicaidPercent, setMedicaidPercent] = useState("20");
  const [rateMode, setRateMode] = useState<"manual" | "calculated">("manual");
  const [procedures, setProcedures] = useState<Array<{ cptCodeId: number; quantity: number }>>([]);

  const createScenario = trpc.scenarios.create.useMutation({
    onSuccess: (data) => {
      toast.success("Scenario created successfully!");
      utils.scenarios.list.invalidate();
      setLocation(`/scenarios/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create scenario: ${error.message}`);
    },
  });

  const addProcedure = () => {
    if (cptCodes && cptCodes.length > 0) {
      setProcedures([...procedures, { cptCodeId: cptCodes[0].id, quantity: 1 }]);
    }
  };

  const removeProcedure = (index: number) => {
    setProcedures(procedures.filter((_, i) => i !== index));
  };

  const updateProcedure = (index: number, field: "cptCodeId" | "quantity", value: number) => {
    const updated = [...procedures];
    updated[index][field] = value;
    setProcedures(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const medicare = parseInt(medicarePercent);
    const commercial = parseInt(commercialPercent);
    const medicaid = parseInt(medicaidPercent);
    
    if (medicare + commercial + medicaid !== 100) {
      toast.error("Payer mix percentages must add up to 100%");
      return;
    }

    if (procedures.length === 0) {
      toast.error("Please add at least one procedure");
      return;
    }

    createScenario.mutate({
      providerName: scenarioName,
      totalPatients: 100, // Default value
      medicarePercent: medicare,
      commercialPercent: commercial,
      medicaidPercent: medicaid,
      siteType: "FPA", // Default value
      rateMode,
      procedures,
    });
  };

  const payerMixTotal = useMemo(() => {
    return parseInt(medicarePercent || "0") + parseInt(commercialPercent || "0") + parseInt(medicaidPercent || "0");
  }, [medicarePercent, commercialPercent, medicaidPercent]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Scenario</h1>
          <p className="text-muted-foreground mt-2">
            Build a reimbursement scenario to compare FPA and Article 28 outcomes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Name</CardTitle>
              <CardDescription>
                Give your scenario a descriptive name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="scenarioName">Scenario Name</Label>
                <Input
                  id="scenarioName"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g., High Commercial Mix Analysis"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Payer Mix */}
          <Card>
            <CardHeader>
              <CardTitle>Payer Mix</CardTitle>
              <CardDescription>
                Distribution of patients by insurance type (must total 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medicare">Medicare (%)</Label>
                  <Input
                    id="medicare"
                    type="number"
                    value={medicarePercent}
                    onChange={(e) => setMedicarePercent(e.target.value)}
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commercial">Commercial (%)</Label>
                  <Input
                    id="commercial"
                    type="number"
                    value={commercialPercent}
                    onChange={(e) => setCommercialPercent(e.target.value)}
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicaid">Medicaid (%)</Label>
                  <Input
                    id="medicaid"
                    type="number"
                    value={medicaidPercent}
                    onChange={(e) => setMedicaidPercent(e.target.value)}
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className={`text-sm ${payerMixTotal === 100 ? "text-green-600" : "text-red-600"}`}>
                Total: {payerMixTotal}% {payerMixTotal !== 100 && "(must equal 100%)"}
              </div>
            </CardContent>
          </Card>

          {/* Rate Mode */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                <CardTitle>Rate Calculation Mode</CardTitle>
              </div>
              <CardDescription>
                Choose how reimbursement rates are determined for this scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">
                    {rateMode === "manual" ? "Use Entered Rates" : "Use Calculated Rates"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {rateMode === "manual" 
                      ? "Use manually entered rates from the rates table"
                      : "Calculate Commercial/Medicaid Technical rates from Medicare using multipliers"}
                  </div>
                </div>
                <Switch
                  checked={rateMode === "calculated"}
                  onCheckedChange={(checked) => setRateMode(checked ? "calculated" : "manual")}
                />
              </div>
              
              {rateMode === "calculated" && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Calculated Rate Formula:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>Professional & Global:</strong> Use entered rates (all payers)</li>
                    <li>• <strong>Medicare Technical:</strong> Use entered rate (source of truth)</li>
                    <li>• <strong>Commercial Technical:</strong> Medicare Technical × Commercial Multiplier</li>
                    <li>• <strong>Medicaid Technical:</strong> Medicare Technical × Medicaid Multiplier</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Multipliers are configured in the Admin Panel
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Procedure Mix */}
          <Card>
            <CardHeader>
              <CardTitle>Procedure Mix</CardTitle>
              <CardDescription>
                Select CPT codes and quantities for this scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {procedures.map((proc, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>CPT Code</Label>
                    <Select
                      value={proc.cptCodeId.toString()}
                      onValueChange={(value) => updateProcedure(index, "cptCodeId", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cptCodes?.map((cpt) => (
                          <SelectItem key={cpt.id} value={cpt.id.toString()}>
                            {cpt.code} - {cpt.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-32 space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={proc.quantity}
                      onChange={(e) => updateProcedure(index, "quantity", parseInt(e.target.value))}
                      min="1"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeProcedure(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addProcedure} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Procedure
              </Button>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" disabled={createScenario.isPending} className="flex-1">
              {createScenario.isPending ? "Creating..." : "Create Scenario"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/dashboard")}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
