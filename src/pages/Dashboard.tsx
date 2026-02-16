import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Clock, CheckCircle, Building2, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { googleSheets } from "@/lib/googleSheets";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
} from "recharts";

const DEPARTMENTS = ["HR", "Tech", "Finance", "Marketing", "Operations"];
const COLORS = ["#4954FA", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const Dashboard = () => {
    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ["applications"],
        queryFn: async () => {
            const response = await googleSheets.getApplications();
            if (response.result === "success") {
                return (response.data || []).map((app: any) => ({
                    id: app.timestamp || Math.random().toString(),
                    full_name: app.fullname || "Unknown",
                    email: app.email || "",
                    department: app.department || "Unassigned",
                    status: app.status || "Pending",
                }));
            }
            throw new Error(response.error || "Failed to fetch data");
        },
        staleTime: 5 * 60 * 1000,
    });

    const total = candidates.length;
    const pending = candidates.filter((c) => c.status === "Pending").length;
    const verified = candidates.filter((c) => c.status === "Verified").length;

    const statCards = [
        { label: "Total Talent", value: total, icon: Users, color: "from-blue-500/10 to-blue-500/5", iconColor: "text-blue-600" },
        { label: "Pending Review", value: pending, icon: Clock, color: "from-amber-500/10 to-amber-500/5", iconColor: "text-amber-600" },
        { label: "Verified Assets", value: verified, icon: CheckCircle, color: "from-emerald-500/10 to-emerald-500/5", iconColor: "text-emerald-600" },
        { label: "Active Sectors", value: DEPARTMENTS.length, icon: Building2, color: "from-indigo-500/10 to-indigo-500/5", iconColor: "text-indigo-600" },
    ];

    const deptData = DEPARTMENTS.map((dept) => ({
        name: dept,
        count: candidates.filter((c: any) => c.department === dept).length,
    }));

    const statusData = [
        { name: "Verified", value: verified, color: "#10B981" },
        { name: "Pending", value: pending, color: "#F59E0B" },
    ].filter(d => d.value > 0);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
                <p className="text-muted-foreground italic flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> Real-time workforce analytics and onboarding overview.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((s) => (
                    <Card key={s.label} className="border-none shadow-sm hover:shadow-md transition-all duration-300">
                        <CardContent className={`flex items-center gap-4 p-6 ${s.color} rounded-xl border border-white/10`}>
                            <div className={`rounded-xl bg-white p-3 shadow-sm ${s.iconColor}`}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                                <p className="text-3xl font-black text-foreground">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Department Distribution */}
                <Card className="lg:col-span-4 border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Department Saturation</CardTitle>
                            <CardDescription>Visual breakdown of candidates across key sectors.</CardDescription>
                        </div>
                        <BarChart3 className="h-5 w-5 text-muted-foreground opacity-50" />
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontSize: '14px'
                                    }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                    {deptData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Ratio */}
                <Card className="lg:col-span-3 border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Verification Status</CardTitle>
                            <CardDescription>Ratio of pending vs verified candidates.</CardDescription>
                        </div>
                        <PieChartIcon className="h-5 w-5 text-muted-foreground opacity-50" />
                    </CardHeader>
                    <CardContent className="h-[350px] flex flex-col items-center justify-center pt-4">
                        {statusData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex gap-6 mt-2">
                                    {statusData.map((d) => (
                                        <div key={d.name} className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                                            <span className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{d.name}: {d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground font-medium">No data available for distribution.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Activity Summary */}
            <Card className="border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-xl font-bold">Operational Context</CardTitle>
                    <CardDescription>A concise overview of the current talent landscape across all sectors.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 divide-x divide-border/50">
                        <div className="p-6 space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">High-Volume Sectors</h4>
                            <div className="space-y-4">
                                {[...deptData].sort((a, b) => b.count - a.count).slice(0, 3).map((dept) => (
                                    <div key={dept.name} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm font-semibold">
                                            <span>{dept.name}</span>
                                            <span>{dept.count} units</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000"
                                                style={{ width: `${(dept.count / (total || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 flex flex-col justify-center items-center text-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <TrendingUp className="h-8 w-8" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold">Onboarding Efficiency</h4>
                                <p className="text-sm text-muted-foreground max-w-[250px]">
                                    Currently, <span className="text-emerald-600 font-bold">{Math.round((verified / (total || 1)) * 100)}%</span> of total talent has been successfully verified across the network.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
