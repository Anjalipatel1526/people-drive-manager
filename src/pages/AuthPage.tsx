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
                // Submit to Google Sheets
                await googleSheets.submitCandidate({
                    fullName,
                    email,
                    role: 'candidate'
                });

                // Auto-login after signup
                await signIn(email, "candidate", fullName);

                toast({ title: "Account created!", description: "Welcome to the portal." });
                navigate("/candidate-form");
            } else {
                // Simplified "Login" for now 
                // Since we don't have a backend to verify password against, 
                // we'll just allow entry if email is present (simulated).
                // In a real Google Sheet app, we'd need to fetch the sheet data to verify, 
                // but that requires exposing all user emails to the client or a proxy.
                // For this request, we assume "Enter Email to Resume" is sufficient for the demo.

                await signIn(email, "candidate");
                navigate("/candidate-form");
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
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <FileText className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>Manage your HR documents efficiently</CardDescription>
                </CardHeader>

                <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); resetForm(); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="candidate">Candidate</TabsTrigger>
                        <TabsTrigger value="hr">HR Admin</TabsTrigger>
                    </TabsList>

                    <TabsContent value="candidate">
                        <form onSubmit={handleCandidateAuth}>
                            <CardContent className="space-y-4">
                                {candidateMode === "signup" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="candidate@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Processing..." : (candidateMode === "signup" ? <><UserPlus className="mr-2 h-4 w-4" /> Sign Up</> : <><LogIn className="mr-2 h-4 w-4" /> Sign In</>)}
                                </Button>

                                <div className="text-sm text-center text-muted-foreground">
                                    {candidateMode === "signup" ? (
                                        <p>Already have an account? <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => setCandidateMode("login")}>Sign in</span></p>
                                    ) : (
                                        <p>Don't have an account? <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => setCandidateMode("signup")}>Sign up</span></p>
                                    )}
                                </div>
                            </CardFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="hr">
                        <form onSubmit={handleHRLogin}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hr-email">Work Email</Label>
                                    <Input id="hr-email" type="email" placeholder="hr@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hr-password">Password</Label>
                                    <Input id="hr-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Signing in..." : <><LogIn className="mr-2 h-4 w-4" /> HR Sign In</>}
                                </Button>
                            </CardFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
};

export default AuthPage;
