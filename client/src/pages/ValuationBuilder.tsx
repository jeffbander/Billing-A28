import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calculator, Plus, Trash2, User, Activity } from "lucide-react";

export default function ValuationBuilder() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [providerId, setProviderId] = useState<number | null>(null);
  const [monthlyPatients, setMonthlyPatients] = useState(0);
  const [activities, setActivities] = useState<Array<{
    cptCodeId: number;
    monthlyOrders: number;
    monthlyReads: number;
    monthlyPerforms: number;
  }>>([]);

  const { data: providers } = trpc.admin.listProviders.useQuery();
  const { data: cptCodes } = trpc.cptCodes.list.useQuery();
  const createValuation = trpc.valuations.create.useMutation();

  const selectedProvider = providers?.find(p => p.id === providerId);

  const handleAddActivity = () => {
    setActivities([...activities, {
      cptCodeId: 0,
      monthlyOrders: 0,
      monthlyReads: 0,
      monthlyPerforms: 0,
    }]);
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityChange = (index: number, field: string, value: number) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setActivities(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a valuation name");
      return;
    }

    if (!providerId) {
      toast.error("Please select a provider");
      return;
    }

    if (activities.length === 0) {
      toast.error("Please add at least one CPT code activity");
      return;
    }

    // Validate all activities have a CPT code selected
    const invalidActivities = activities.filter(a => a.cptCodeId === 0);
    if (invalidActivities.length > 0) {
      toast.error("Please select a CPT code for all activities");
      return;
    }

    try {
      const result = await createValuation.mutateAsync({
        name,
        description,
        providerId,
        monthlyPatients,
        activities,
      });

      toast.success("Valuation created successfully!");
      setLocation(`/valuations/${result.id}`);
    } catch (error) {
      toast.error("Failed to create valuation");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Provider Valuation</h1>
          <p className="text-muted-foreground mt-2">
            Analyze a provider's RVU productivity and revenue attribution
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Valuation Details
            </CardTitle>
            <CardDescription>
              Name this valuation scenario and provide a description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Valuation Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Dr. Bander Monthly Analysis"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any notes about this valuation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Provider Selection
            </CardTitle>
            <CardDescription>
              Select the provider to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Select
                value={providerId?.toString() || ""}
                onValueChange={(value) => setProviderId(Number(value))}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers?.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name} ({provider.providerType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProvider && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Provider Type:</span>
                  <span className="text-sm">{selectedProvider.providerType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Home Institution:</span>
                  <span className="text-sm">{selectedProvider.homeInstitutionId || "N/A"}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="monthlyPatients">Monthly Patient Visits</Label>
              <Input
                id="monthlyPatients"
                type="number"
                min="0"
                placeholder="e.g., 200"
                value={monthlyPatients}
                onChange={(e) => setMonthlyPatients(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Number of patient visits per month (for context)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CPT Code Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              CPT Code Activities
            </CardTitle>
            <CardDescription>
              Specify monthly volumes for each CPT code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No activities added yet.</p>
                <p className="text-sm">Click "Add CPT Code" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const selectedCpt = cptCodes?.find(c => c.id === activity.cptCodeId);
                  const isImaging = selectedCpt?.procedureType === "imaging";

                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>CPT Code #{index + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveActivity(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Select
                          value={activity.cptCodeId.toString()}
                          onValueChange={(value) =>
                            handleActivityChange(index, "cptCodeId", Number(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CPT code" />
                          </SelectTrigger>
                          <SelectContent>
                            {cptCodes?.map((code) => (
                              <SelectItem key={code.id} value={code.id.toString()}>
                                {code.code} - {code.description}
                                {code.procedureType === "imaging" && " (Imaging)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {isImaging ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Orders/Month</Label>
                            <Input
                              type="number"
                              min="0"
                              value={activity.monthlyOrders}
                              onChange={(e) =>
                                handleActivityChange(index, "monthlyOrders", Number(e.target.value))
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              How many ordered
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Reads/Month</Label>
                            <Input
                              type="number"
                              min="0"
                              value={activity.monthlyReads}
                              onChange={(e) =>
                                handleActivityChange(index, "monthlyReads", Number(e.target.value))
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              How many read
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Performs/Month</Label>
                          <Input
                            type="number"
                            min="0"
                            value={activity.monthlyPerforms}
                            onChange={(e) =>
                              handleActivityChange(index, "monthlyPerforms", Number(e.target.value))
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            How many performed
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleAddActivity}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add CPT Code
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createValuation.isPending}
            className="flex-1"
          >
            {createValuation.isPending ? "Creating..." : "Create Valuation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
