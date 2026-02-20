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
    const { signIn } = useAuth();

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();

    const resetForm = () => {
        setEmail("");
        setPassword("");
    };

    const handleHRLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const normalizedEmail = email.toLowerCase();

        // Hardcoded HR Check
        const isKomall = normalizedEmail === "komallarna06@gmail.com" && password === "anju@1526";
        const isAdmin = normalizedEmail === "admin@gmail.com" && password === "admin123";

        if (isKomall || isAdmin) {
            await signIn(normalizedEmail, "hr", isKomall ? "HR Admin" : "System Admin");
            navigate("/admin");
        } else {
            toast({ title: "Login failed", description: "Invalid Codekar credentials", variant: "destructive" });
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-lg border-primary/20">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center">
                        <img
                            src="/un-logo.png"
                            alt="Logo"
                            className="h-full w-full object-cover rounded-xl shadow-md"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold">Codekar Admin Login</CardTitle>
                    <CardDescription>Secure Access for Hackathon Management</CardDescription>
                </CardHeader>

                <form onSubmit={handleHRLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hr-email">Work Email</Label>
                            <Input
                                id="hr-email"
                                type="email"
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button type="submit" className="w-full" disabled={loading} size="lg">
                            {loading ? "Signing in..." : "Codekar Sign In"}
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
