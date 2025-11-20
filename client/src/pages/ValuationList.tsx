import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreVertical, Trash2, GitCompare, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function ValuationList() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "provider" | "rvus">("date");
  const [selectedValuations, setSelectedValuations] = useState<number[]>([]);

  const { data: valuations, isLoading, refetch } = trpc.valuations.list.useQuery();
  const deleteValuation = trpc.valuations.delete.useMutation({
    onSuccess: () => {
      toast.success("Valuation deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete valuation: ${error.message}`);
    },
  });

  // Filter and sort valuations
  const filteredValuations = valuations
    ?.filter((v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.providerName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "provider") {
        return (a.providerName || "").localeCompare(b.providerName || "");
      } else if (sortBy === "rvus") {
        return (b.totalRvus || 0) - (a.totalRvus || 0);
      }
      return 0;
    });

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this valuation?")) {
      await deleteValuation.mutateAsync({ id });
    }
  };

  const handleCompare = () => {
    if (selectedValuations.length < 2) {
      toast.error("Please select at least 2 valuations to compare");
      return;
    }
    if (selectedValuations.length > 4) {
      toast.error("You can compare up to 4 valuations at once");
      return;
    }
    navigate(`/valuations/compare?ids=${selectedValuations.join(",")}`);
  };

  const toggleSelection = (id: number) => {
    setSelectedValuations((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading valuations...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Provider Valuations</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all provider valuation scenarios
            </p>
          </div>
          <Button onClick={() => navigate("/valuations/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Valuation
          </Button>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="provider">Sort by Provider</SelectItem>
                  <SelectItem value="rvus">Sort by RVUs</SelectItem>
                </SelectContent>
              </Select>

              {/* Compare Button */}
              {selectedValuations.length > 0 && (
                <Button onClick={handleCompare} variant="outline">
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare ({selectedValuations.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Valuations Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredValuations?.length || 0} Valuation{filteredValuations?.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!filteredValuations || filteredValuations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "No valuations match your search"
                    : "No valuations created yet"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate("/valuations/new")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Valuation
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedValuations.length === filteredValuations.length &&
                          filteredValuations.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedValuations(filteredValuations.map((v) => v.id));
                          } else {
                            setSelectedValuations([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Valuation Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Provider Type</TableHead>
                    <TableHead className="text-right">Total RVUs</TableHead>
                    <TableHead className="text-right">Prof. Revenue</TableHead>
                    <TableHead className="text-right">Tech. Revenue</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredValuations.map((valuation) => (
                    <TableRow
                      key={valuation.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => {
                        // Don't navigate if clicking checkbox or actions
                        if (
                          (e.target as HTMLElement).closest('input[type="checkbox"]') ||
                          (e.target as HTMLElement).closest('button')
                        ) {
                          return;
                        }
                        navigate(`/valuations/${valuation.id}`);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedValuations.includes(valuation.id)}
                          onChange={() => toggleSelection(valuation.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{valuation.name}</TableCell>
                      <TableCell>{valuation.providerName || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{valuation.providerType || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {valuation.totalRvus?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        ${(valuation.professionalRevenue || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-600">
                        ${(valuation.technicalRevenue || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(valuation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/valuations/${valuation.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedValuations([valuation.id]);
                                // Find another valuation to compare with
                                const others = filteredValuations.filter(
                                  (v) => v.id !== valuation.id
                                );
                                if (others.length > 0) {
                                  navigate(
                                    `/valuations/compare?ids=${valuation.id},${others[0].id}`
                                  );
                                } else {
                                  toast.error("Need at least 2 valuations to compare");
                                }
                              }}
                            >
                              <GitCompare className="w-4 h-4 mr-2" />
                              Compare
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(valuation.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
