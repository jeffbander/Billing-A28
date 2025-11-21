import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Beaker, TrendingUp, Users, FileText, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ScenarioType = "type1_fpa" | "type1_article28" | "type2_visiting" | "type3_ordering" | "imaging_heavy" | "visit_heavy";

interface GeneratedScenario {
  id: number;
  name: string;
  scenarioType: ScenarioType;
  providerId: number;
  institutionId: number;
  siteId: number;
}

export default function TestScenarios() {
  const [, setLocation] = useLocation();
  const [selectedProvider, setSelectedProvider] = useState<number | undefined>();
  const [selectedInstitution, setSelectedInstitution] = useState<number | undefined>();
  const [selectedSite, setSelectedSite] = useState<number | undefined>();
  const [generatedScenarios, setGeneratedScenarios] = useState<GeneratedScenario[]>([]);

  const { data: providers } = trpc.admin.listActiveProviders.useQuery();
  const { data: institutions } = trpc.admin.listActiveInstitutions.useQuery();
  const { data: sites } = trpc.admin.listActiveSites.useQuery();

  const generateMutation = trpc.admin.generateTestScenario.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated: ${data.valuation.name}`);
      setGeneratedScenarios(prev => [...prev, {
        id: data.valuation.id,
        name: data.valuation.name,
        scenarioType: data.scenarioType,
        providerId: data.valuation.providerId,
        institutionId: data.valuation.institutionId!,
        siteId: data.valuation.siteId!,
      }]);
    },
    onError: (error) => {
      toast.error(`Failed to generate scenario: ${error.message}`);
    },
  });

  const deleteMutation = trpc.valuations.delete.useMutation({
    onSuccess: () => {
      toast.success("Test scenario deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleGenerate = (scenarioType: ScenarioType) => {
    generateMutation.mutate({
      scenarioType,
      providerId: selectedProvider,
      institutionId: selectedInstitution,
      siteId: selectedSite,
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
    setGeneratedScenarios(prev => prev.filter(s => s.id !== id));
  };

  const handleClearAll = () => {
    generatedScenarios.forEach(scenario => {
      deleteMutation.mutate({ id: scenario.id });
    });
    setGeneratedScenarios([]);
    toast.success("All test scenarios cleared");
  };

  const handleViewResults = (id: number) => {
    setLocation(`/valuations/${id}`);
  };

  const scenarioDescriptions: Record<ScenarioType, { title: string; description: string; icon: typeof Users }> = {
    type1_fpa: {
      title: "Type 1 - FPA Site",
      description: "Provider at own institution, FPA site. Earns all professional + technical revenue.",
      icon: Users,
    },
    type1_article28: {
      title: "Type 1 - Article 28",
      description: "Provider at own institution, Article 28 site. Professional + technical split.",
      icon: Users,
    },
    type2_visiting: {
      title: "Type 2 - Visiting Provider",
      description: "Provider visiting from different institution. More reads than orders.",
      icon: TrendingUp,
    },
    type3_ordering: {
      title: "Type 3 - Ordering Only",
      description: "Orders only, no reads. All revenue attributed, none earned by this provider.",
      icon: FileText,
    },
    imaging_heavy: {
      title: "Imaging Heavy Practice",
      description: "High imaging volume (echo, nuclear, stress). Mixed orders and reads.",
      icon: Beaker,
    },
    visit_heavy: {
      title: "Visit Heavy Practice",
      description: "High office visit volume, minimal imaging. Visit codes only.",
      icon: Users,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Test Scenarios</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Generate realistic test data to validate earned vs attributed revenue calculations
            </p>
          </div>
          {generatedScenarios.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All ({generatedScenarios.length})
            </Button>
          )}
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Select provider, institution, and site for test scenarios (optional - will use first available if not selected)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select
                value={selectedProvider?.toString()}
                onValueChange={(value) => setSelectedProvider(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto-select first provider" />
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Institution</label>
              <Select
                value={selectedInstitution?.toString()}
                onValueChange={(value) => setSelectedInstitution(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto-select first institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions?.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id.toString()}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Site</label>
              <Select
                value={selectedSite?.toString()}
                onValueChange={(value) => setSelectedSite(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto-select first site" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name} ({site.siteType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Scenario Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.entries(scenarioDescriptions) as [ScenarioType, typeof scenarioDescriptions[ScenarioType]][]).map(([type, info]) => {
            const Icon = info.icon;
            return (
              <Card key={type} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{info.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-sm">{info.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleGenerate(type)}
                    disabled={generateMutation.isPending}
                    className="w-full"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Beaker className="w-4 h-4 mr-2" />
                        Generate Test
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Generated Scenarios */}
        {generatedScenarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Test Scenarios</CardTitle>
              <CardDescription>
                Click "View Results" to see earned vs attributed revenue calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{scenario.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        <Badge variant="secondary" className="mr-2">
                          {scenarioDescriptions[scenario.scenarioType].title}
                        </Badge>
                        ID: {scenario.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewResults(scenario.id)}
                      >
                        View Results
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(scenario.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
