import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileText, Upload, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { googleSheets } from "@/lib/googleSheets";

// Hardcode departments since we removed Supabase
const DEPARTMENTS = ["HR", "Tech", "Finance", "Marketing", "Operations"];

const DOCUMENT_TYPES = [
  { key: "photo", label: "Photo", accept: "image/jpeg,image/png" },
  { key: "resume", label: "Resume", accept: ".pdf,image/jpeg,image/png" },
  { key: "aadhaar", label: "Aadhaar Card", accept: ".pdf,image/jpeg,image/png" },
  { key: "pan", label: "PAN Card", accept: ".pdf,image/jpeg,image/png" },
  { key: "passbook", label: "Bank Passbook", accept: ".pdf,image/jpeg,image/png" },
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CandidateForm = () => {
  const { user } = useAuth();
  // Pre-fill from user context if available
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [address, setAddress] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (key: string, file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // remove data:image/png;base64, prefix
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Please sign in", description: "You must be signed in to submit.", variant: "destructive" });
      return;
    }

    if (!department) {
      toast({ title: "Department required", description: "Please select a department", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Prepare Data
      const candidateData = {
        fullName,
        email,
        phone,
        department,
        address
      };

      // 2. Prepare Files
      const fileData: Record<string, any> = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const base64 = await convertFileToBase64(file);
          fileData[key] = {
            name: file.name,
            type: file.type,
            base64: base64
          };
        }
      }

      // 3. Submit to Google Sheets
      await googleSheets.submitCandidateDocuments(candidateData, fileData);

      setSubmitted(true);
      toast({ title: "Success", description: "Information submitted successfully." });
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardContent className="pt-10 pb-10 space-y-4">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold text-foreground">Submission Successful!</h2>
            <p className="text-muted-foreground">Your documents have been submitted to Google Sheets.</p>
            <Button onClick={() => setSubmitted(false)} variant="outline">Submit Another Response</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Document Submission</h1>
          <p className="mt-2 text-muted-foreground">Submit your documents via Google Sheets</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Fill in your details and upload required documents</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Personal fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" placeholder="Rahul Kumar" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="rahul@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select value={department} onValueChange={(v) => setDepartment(v)}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" placeholder="Your address..." value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} />
              </div>

              {/* File uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Documents</h3>
                {DOCUMENT_TYPES.map((doc) => (
                  <div key={doc.key} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {doc.label} {doc.key !== "photo" && <span className="text-destructive">*</span>}
                      </p>
                      {files[doc.key] ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground truncate">{files[doc.key]!.name}</span>
                          <button type="button" onClick={() => handleFileChange(doc.key, null)} className="text-destructive hover:text-destructive/80">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG — Max 5MB</p>
                      )}
                    </div>
                    <label className="cursor-pointer rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors">
                      Browse
                      <input
                        type="file"
                        className="hidden"
                        accept={doc.accept}
                        onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> Submitting...</>
                ) : (
                  "Submit Documents"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CandidateForm;
