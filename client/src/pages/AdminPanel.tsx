import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const setRoleMutation = trpc.admin.setRole.useMutation({
    onSuccess: (_, variables) => {
      const targetUser = users?.find(u => u.id === variables.userId);
      const newRole = variables.role === 'admin' ? 'an admin' : 'a user';
      toast.success(`✅ ${targetUser?.name || targetUser?.email} is now ${newRole}`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const handleSetRole = (userId: number, role: 'admin' | 'user') => {
    setRoleMutation.mutate({ userId, role });
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin Management Panel</CardTitle>
            <CardDescription>
              Manage user roles and permissions. All logged-in users can promote or demote admins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || "—"}</TableCell>
                    <TableCell>{u.email || "—"}</TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Badge variant="default" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetRole(u.id, 'user')}
                          disabled={setRoleMutation.isPending}
                        >
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Remove Admin
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSetRole(u.id, 'admin')}
                          disabled={setRoleMutation.isPending}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Make Admin
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
