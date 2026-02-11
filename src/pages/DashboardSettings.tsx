import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DashboardSettings = () => {
  const { user, roles } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <Card className="shadow-sm max-w-md">
        <CardHeader><CardTitle>Account Info</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">Email:</span> {user?.email}</div>
          <div><span className="text-muted-foreground">Roles:</span> {roles.length > 0 ? roles.join(", ") : "No roles assigned"}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSettings;
