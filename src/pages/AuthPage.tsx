import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { googleSheets } from "@/lib/googleSheets";

const AuthPage = () => {
    const [activeTab, setActiveTab] = useState("candidate");
    const [candidateMode, setCandidateMode] = useState<"login" | "signup">("signup");
    const { signIn } = useAuth();

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();

    const resetForm = () => {
        setEmail("");
        setPassword("");
        setFullName("");
    };

    const handleCandidateAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (candidateMode === "signup") {
                // Register in 'Users' sheet
                await googleSheets.registerUser(email, password, fullName);

                // Auto-login (store in local storage)
                await signIn(email, "candidate", fullName);

                toast({ title: "Account created!", description: "Welcome to the portal." });
                navigate("/candidate-form");
            } else {
                // Verify credentials against 'Users' sheet
                const response = await googleSheets.login(email, password);

                if (response.result === "success") {
                    await signIn(email, "candidate", response.user.fullName);
                    navigate("/candidate-form");
                } else {
                    throw new Error(response.error || "Login failed");
                }
            }
        } catch (error: any) {
            toast({ title: "Authentication failed", description: error.message || "Failed to connect", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleHRLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const normalizedEmail = email.toLowerCase();

        // Hardcoded HR Check
        if (normalizedEmail === "komallarna06@gmail.com" && password === "anju@1526") {
            await signIn(normalizedEmail, "hr", "HR Admin");
            navigate("/dashboard");
        } else {
            toast({ title: "Login failed", description: "Invalid HR credentials", variant: "destructive" });
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-lg border-primary/20">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <LogIn className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">HR Portal</CardTitle>
                    <CardDescription>Sign in with your admin credentials</CardDescription>
                </CardHeader>

                <form onSubmit={handleHRLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hr-email">Work Email</Label>
                            <Input
                                id="hr-email"
                                type="email"
                                placeholder="hr@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hr-password">Password</Label>
                            <Input
                                id="hr-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button type="submit" className="w-full" disabled={loading} size="lg">
                            {loading ? "Signing in..." : "HR Sign In"}
                        </Button>
                        <Button variant="ghost" onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:bg-transparent hover:text-primary transition-colors">
                            Back to Application Form
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default AuthPage;
