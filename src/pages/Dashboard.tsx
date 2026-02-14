import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, Building2 } from "lucide-react";

// Hardcoded since Supabase is removed
const DEPARTMENTS = ["HR", "Tech", "Finance", "Marketing", "Operations"];

const Dashboard = () => {
  const [candidates, setCandidates] = useState<any[]>([]); // Mock data type
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data fetching since we moved to Google Sheets and don't have read API setup yet
    // In a real scenario, we might fetch from the Sheet CSV publish link
    setCandidates([]);
    setLoading(false);
  }, []);

  const total = candidates.length;
  const pending = candidates.filter((c) => c.status === "Pending").length;
  const verified = candidates.filter((c) => c.status === "Verified").length;
  const recent = candidates.slice(0, 5);

  const statCards = [
    { label: "Total Candidates", value: total, icon: Users, color: "text-primary" },
    { label: "Pending", value: pending, icon: Clock, color: "text-yellow-500" },
    { label: "Verified", value: verified, icon: CheckCircle, color: "text-green-500" },
    { label: "Departments", value: DEPARTMENTS.length, icon: Building2, color: "text-primary" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg bg-muted p-3 ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department breakdown */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle>Department Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {DEPARTMENTS.map((dept) => {
              const count = candidates.filter((c) => c.department === dept).length;
              return (
                <div key={dept} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium text-foreground">{dept}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent submissions */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle>Recent Submissions</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Data viewing is currently disabled.</p>
              <p className="text-xs text-muted-foreground mt-1">Check Google Sheets for submissions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{c.full_name}</p>
                    <p className="text-xs text-muted-foreground">{c.email} · {c.department}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.status === "Verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
