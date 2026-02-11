import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, UserPlus, LogIn, User } from "lucide-react";

const AuthPage = () => {
    const [activeTab, setActiveTab] = useState("candidate");
    const [candidateMode, setCandidateMode] = useState<"login" | "signup">("signup");

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
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                        data: { full_name: fullName, role: 'candidate' },
                    },
                });
                if (error) throw error;
                toast({ title: "Account created!", description: "Please check your email to verify your account." });
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate("/candidate-form");
            }
        } catch (error: any) {
            toast({ title: "Authentication failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };



    const handleHRLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const normalizedEmail = email.toLowerCase();

        if (normalizedEmail === "komallarna06@gmail.com" && password === "anju@1526") {
            localStorage.setItem("hr_auth", "true");
            // Force a reload to ensure AuthContext picks up the change if we rely on initial mount check, 
            // but better to explicitly reload or have AuthContext listen to storage. 
            // For now, let's just navigate and let AuthContext handle it if we modify it to check on mount.
            // Actually, since we are SPA, simply setting localStorage won't trigger React state updates in AuthContext 
            // unless we expose a login method or force a reload. 
            // A simple window.location.href = "/dashboard" might be easiest to ensure state reset.
            window.location.href = "/dashboard";
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            navigate("/dashboard");
        } catch (error: any) {
            toast({ title: "Login failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
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
