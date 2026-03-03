import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileText, Upload, Users, User, Github, FileArchive } from "lucide-react";
import { candidateApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const TRACKS = [
  "Education",
  "Entertainment",
  "AI Agent and Automation",
  "Core AI/ML",
  "Big Data",
  "Mass Communication",
  "Cutting Agents"
];

const toBase64 = (file: File) =>
  new Promise<{ base64: string; name: string; type: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve({ base64: base64String, name: file.name, type: file.type });
    };
    reader.onerror = (error) => reject(error);
  });

// ─── Default blank state ─────────────────────────────────────────────────────
const blankForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  track: "",
  collegeCompany: "",
  teamName: "",
  teamLeaderEmail: "",
  projectDescription: "",
  githubRepoLink: "",
  registrationId: "",
  projectName: "",
  member1Email: "",
  member2Email: "",
  member3Email: "",
  member4Email: "",
});

const CandidateForm = () => {
  const [globalPhase, setGlobalPhase] = useState<number>(() => {
    const saved = localStorage.getItem("codekarx_global_phase");
    return saved ? parseInt(saved, 10) : 1;
  });

  const [regType, setRegType] = useState<"Individual" | "Team">("Individual");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [teamSize, setTeamSize] = useState<number>(2);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const { toast } = useToast();

  // Phase 2 lookup state
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<any>(null);

  const [formData, setFormData] = useState(blankForm());

  // ─── Fetch global phase on mount ──────────────────────────────────────────
  useEffect(() => {
    const initPhase = async () => {
      try {
        const currentGlobalPhase = await candidateApi.getPhase();
        setGlobalPhase(currentGlobalPhase);
        localStorage.setItem("codekarx_global_phase", currentGlobalPhase.toString());
      } catch {
        // use cached
      }
    };
    initPhase();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  // ─── Phase 2 email lookup ─────────────────────────────────────────────────
  const handlePhase2Lookup = async () => {
    if (!lookupEmail.trim()) {
      toast({ title: "Enter Email", description: "Please enter your registered email address.", variant: "destructive" });
      return;
    }
    setLookupLoading(true);
    try {
      const data = await candidateApi.getApplicationByEmail(lookupEmail.trim().toLowerCase());
      if (data) {
        setFetchedData(data);
        setRegType(data.registrationType || "Individual");
        let detectedTeamSize = 2;
        if (data.member4Email) detectedTeamSize = 4;
        else if (data.member3Email) detectedTeamSize = 3;
        setTeamSize(detectedTeamSize);
        toast({ title: "Registration Found", description: `Project: ${data.projectName || "Untitled"}` });
      }
    } catch {
      toast({ title: "Not Found", description: "No registration found for this email. Please check and try again.", variant: "destructive" });
    } finally {
      setLookupLoading(false);
    }
  };

  // ─── Submit Phase 1 ──────────────────────────────────────────────────────
  const handlePhase1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName) {
      toast({ title: "Validation Error", description: "Project Name is required.", variant: "destructive" });
      return;
    }
    if (regType === "Individual" && !formData.email) {
      toast({ title: "Validation Error", description: "Email is required.", variant: "destructive" });
      return;
    }
    if (regType === "Team" && !formData.teamLeaderEmail) {
      toast({ title: "Validation Error", description: "Team Leader Email is required.", variant: "destructive" });
      return;
    }
    if (!formData.track) {
      toast({ title: "Validation Error", description: "Please select a track.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const identity = regType === "Individual"
        ? `${formData.firstName}_${formData.email}`.replace(/[^a-zA-Z0-9.@_-]/g, "_")
        : `${formData.teamName}_${formData.teamLeaderEmail}`.replace(/[^a-zA-Z0-9.@_-]/g, "_");

      const payload: any = {
        data: { ...formData, registrationType: regType, candidateIdentity: identity },
        files: {}
      };

      if (files.ppt) {
        const fileData = await toBase64(files.ppt);
        fileData.name = `${identity}_${fileData.name}`;
        payload.files.ppt = fileData;
      }

      const res = await candidateApi.submitPhase1(payload);
      setFormData((prev: any) => ({ ...prev, registrationId: res.registrationId }));
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Submit Phase 2 ──────────────────────────────────────────────────────
  const handlePhase2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fetchedData?.registrationId) {
      toast({ title: "Error", description: "Please look up your registration first.", variant: "destructive" });
      return;
    }
    if (!formData.githubRepoLink) {
      toast({ title: "Validation Error", description: "GitHub Repository Link is required.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const identity = regType === "Individual"
        ? `${fetchedData.firstName}_${fetchedData.email}`.replace(/[^a-zA-Z0-9.@_-]/g, "_")
        : `${fetchedData.teamName}_${fetchedData.teamLeaderEmail}`.replace(/[^a-zA-Z0-9.@_-]/g, "_");

      const payload: any = {
        data: {
          registrationId: fetchedData.registrationId,
          githubRepoLink: formData.githubRepoLink,
          candidateIdentity: identity,
        },
        files: {}
      };

      if (files.readme) {
        const fileData = await toBase64(files.readme);
        fileData.name = `${identity}_README.${fileData.type.split("/")[1]}`;
        payload.files.readme = fileData;
      }
      if (files.finalZip) {
        const fileData = await toBase64(files.finalZip);
        fileData.name = `${identity}_SOURCE.zip`;
        payload.files.finalZip = fileData;
      }

      await candidateApi.submitPhase2(payload);
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
        <Card className="w-full max-w-lg text-center shadow-2xl border-none bg-white/95 backdrop-blur-md rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className={`p-8 ${globalPhase === 1 ? "bg-gradient-to-r from-indigo-500 to-indigo-600" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`}>
            <CheckCircle2 className="mx-auto h-20 w-20 text-white animate-bounce" />
            <h2 className="text-3xl font-black text-white mt-4 tracking-tighter uppercase">
              {globalPhase === 1 ? "Registration Successful!" : "Phase 2 Submitted!"}
            </h2>
          </div>
          <CardContent className="p-10 space-y-6">
            {globalPhase === 1 && formData.registrationId && (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center shadow-inner">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Your Unique Access Code</span>
                <span className="text-3xl font-black text-indigo-600 font-mono tracking-tighter select-all cursor-pointer hover:scale-105 transition-transform">
                  {formData.registrationId}
                </span>
                <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest leading-relaxed">
                    IMPORTANT: Save this code! <br /> A confirmation email has been sent to you.
                  </p>
                </div>
              </div>
            )}
            <p className="text-slate-600 font-bold leading-relaxed">
              {globalPhase === 1
                ? "Your Phase 1 registration has been received. Please wait for the team to review your project."
                : "Your final project submission has been received. All the best for the final round!"}
            </p>
            <div className="pt-4">
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setFormData(blankForm());
                  setFetchedData(null);
                  setLookupEmail("");
                  setFiles({});
                }}
                variant="outline"
                className="rounded-xl border-slate-200 text-slate-400 font-bold hover:text-indigo-600 transition-colors"
              >
                Exit Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main Form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 py-12 px-4 font-sans">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center space-y-3">
          <Badge className={`text-[10px] font-black px-3 py-1 mb-2 tracking-widest uppercase rounded-full shadow-lg ${globalPhase === 1 ? "bg-indigo-600 shadow-indigo-200" : "bg-emerald-600 shadow-emerald-200"}`}>
            {globalPhase === 1 ? "Registration Open" : "Phase 2 Active"}
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl italic uppercase leading-none">
            CODEKARX <br /> <span className="text-indigo-600 underline decoration-indigo-200 decoration-8 underline-offset-4">HACKATHON</span>
          </h1>
          <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">
            {globalPhase === 1 ? "Phase 1: Project Registration" : "Phase 2: Final Submission"}
          </p>
        </div>

        <Card className="shadow-[0_20px_50px_rgba(8,112,184,0.07)] border-none bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden ring-1 ring-slate-200/50">
          <CardHeader className={`${globalPhase === 1 ? "bg-indigo-600" : "bg-emerald-600"} text-white p-10`}>
            <CardTitle className="text-3xl font-black flex items-center gap-3 tracking-tighter uppercase">
              <Upload className="h-8 w-8" />
              {globalPhase === 1 ? "New Registration" : "Phase 2 Portal"}
            </CardTitle>
            <CardDescription className="text-indigo-100 font-bold mt-2 opacity-80">
              {globalPhase === 1 ? "Start your journey with Codekarx" : "Submit your final project"}
            </CardDescription>
          </CardHeader>

          {/* ════ PHASE 1 FORM ════ */}
          {globalPhase === 1 && (
            <form onSubmit={handlePhase1Submit} className="p-10 space-y-8">
              {/* Registration Type */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Registration Type</Label>
                <RadioGroup
                  value={regType}
                  onValueChange={(v: any) => setRegType(v)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-white transition-colors">
                    <RadioGroupItem value="Individual" id="p1-individual" />
                    <Label htmlFor="p1-individual" className="font-bold cursor-pointer flex items-center gap-2"><User className="h-4 w-4" />Individual</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-white transition-colors">
                    <RadioGroupItem value="Team" id="p1-team" />
                    <Label htmlFor="p1-team" className="font-bold cursor-pointer flex items-center gap-2"><Users className="h-4 w-4" />Team</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Track */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Select Track *</Label>
                <Select value={formData.track} onValueChange={(v) => setFormData({ ...formData, track: v })}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold">
                    <SelectValue placeholder="Choose your track..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                    {TRACKS.map((t) => <SelectItem key={t} value={t} className="font-medium">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Name */}
              <div className="space-y-3">
                <Label htmlFor="projectName" className="text-xs font-black uppercase tracking-widest text-slate-400">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="My Innovation"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="h-14 rounded-xl border-slate-200 font-bold bg-slate-50/50"
                  required
                />
              </div>

              {/* Individual Fields */}
              {regType === "Individual" ? (
                <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">First Name</Label>
                    <Input id="firstName" value={formData.firstName} onChange={handleInputChange} className="rounded-xl border-slate-200 bg-white font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Last Name</Label>
                    <Input id="lastName" value={formData.lastName} onChange={handleInputChange} className="rounded-xl border-slate-200 bg-white font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email Address *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="rounded-xl border-slate-200 bg-white font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone (10 digits)</Label>
                    <Input id="phone" value={formData.phone} onChange={handleInputChange} className="rounded-xl border-slate-200 bg-white font-bold" maxLength={10} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="collegeCompany" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">College / Organization</Label>
                    <Input id="collegeCompany" value={formData.collegeCompany} onChange={handleInputChange} className="rounded-xl border-slate-200 bg-white font-bold" />
                  </div>
                </div>
              ) : (
                /* Team Fields */
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="teamName" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Team Name *</Label>
                      <Input id="teamName" value={formData.teamName} onChange={handleInputChange} className="rounded-xl border-slate-200 font-bold h-12" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collegeCompany" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">College / Organization</Label>
                      <Input id="collegeCompany" value={formData.collegeCompany} onChange={handleInputChange} className="rounded-xl border-slate-200 font-bold h-12" />
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Team Members</Label>
                      <Select value={teamSize.toString()} onValueChange={(v) => setTeamSize(parseInt(v))}>
                        <SelectTrigger className="rounded-xl h-9 border-slate-200 font-bold w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="2">2 Members</SelectItem>
                          <SelectItem value="3">3 Members</SelectItem>
                          <SelectItem value="4">4 Members</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamLeaderEmail" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Team Leader Email *</Label>
                      <Input id="teamLeaderEmail" type="email" value={formData.teamLeaderEmail} onChange={handleInputChange} className="rounded-xl border-slate-200 font-bold bg-white" required />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Array.from({ length: teamSize }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Member {i + 1} Email</Label>
                          <Input
                            id={`member${i + 1}Email`}
                            type="email"
                            value={(formData as any)[`member${i + 1}Email`]}
                            onChange={handleInputChange}
                            className="rounded-xl border-slate-200 font-bold bg-white"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Project Description & PPT */}
              <div className="space-y-8 pt-8 border-t border-slate-100">
                <div className="space-y-3">
                  <Label htmlFor="projectDescription" className="text-xs font-black uppercase tracking-widest text-slate-500">Project Description *</Label>
                  <Textarea
                    id="projectDescription"
                    value={formData.projectDescription}
                    onChange={handleInputChange}
                    className="min-h-[160px] rounded-2xl border-slate-200 bg-slate-50/20 font-medium"
                    placeholder="Describe your vision and technical stack..."
                    required
                  />
                </div>
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 font-black uppercase tracking-widest text-indigo-600 text-[10px]">
                    <FileText className="h-4 w-4" /> Upload Concept PPT *
                  </Label>
                  <div className="group relative mt-1 flex justify-center px-6 py-10 border-2 border-indigo-100 border-dashed rounded-3xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer text-center">
                    <label className="cursor-pointer w-full h-full">
                      <Upload className="mx-auto h-12 w-12 text-indigo-300 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-black text-indigo-600 mt-4 block uppercase tracking-widest">Select Concept Document</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">PPTX or PDF preferred</span>
                      <input type="file" className="sr-only" onChange={(e) => handleFileChange("ppt", e.target.files?.[0] || null)} required />
                    </label>
                  </div>
                  {files.ppt && (
                    <div className="bg-emerald-50 p-4 rounded-xl flex items-center justify-center gap-3 animate-in bounce-in">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">{files.ppt.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-16 text-xl font-black rounded-3xl shadow-2xl transition-all active:scale-95 disabled:opacity-50 tracking-[0.1em] uppercase bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Submitting...</span>
                  </div>
                ) : "Complete Registration"}
              </Button>
            </form>
          )}

          {/* ════ PHASE 2 FORM ════ */}
          {globalPhase === 2 && (
            <div className="p-10 space-y-8">
              {/* Step 1: Registration Type + Email Lookup */}
              {!fetchedData && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
                    <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-1">Welcome to Phase 2</h4>
                      <p className="text-sm font-bold text-blue-700 leading-relaxed opacity-80">
                        Select your registration type and enter your registered email to load your project details.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">I registered as</Label>
                    <RadioGroup value={regType} onValueChange={(v: any) => setRegType(v)} className="flex gap-6">
                      <div className="flex-1 flex items-center space-x-2 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all">
                        <RadioGroupItem value="Individual" id="p2-individual" />
                        <Label htmlFor="p2-individual" className="font-bold cursor-pointer flex items-center gap-2 text-base"><User className="h-4 w-4 text-indigo-500" />Individual</Label>
                      </div>
                      <div className="flex-1 flex items-center space-x-2 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all">
                        <RadioGroupItem value="Team" id="p2-team" />
                        <Label htmlFor="p2-team" className="font-bold cursor-pointer flex items-center gap-2 text-base"><Users className="h-4 w-4 text-indigo-500" />Team</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                      {regType === "Individual" ? "Your Registered Email *" : "Team Leader Email *"}
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        type="email"
                        placeholder={regType === "Individual" ? "your@email.com" : "leader@email.com"}
                        value={lookupEmail}
                        onChange={(e) => setLookupEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePhase2Lookup()}
                        className="h-14 rounded-2xl border-slate-200 font-bold text-lg text-indigo-600 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handlePhase2Lookup}
                        disabled={lookupLoading || !lookupEmail.trim()}
                        className="h-14 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-white shrink-0"
                      >
                        {lookupLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Look Up"}
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">Enter the email you used during Phase 1 registration.</p>
                  </div>
                </div>
              )}

              {/* Step 2: Confirmation + Phase 2 Submission Fields */}
              {fetchedData && (
                <form onSubmit={handlePhase2Submit} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  {/* Found registration banner */}
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-emerald-800 text-sm uppercase tracking-wider">Registration Found</p>
                      <p className="text-emerald-700 font-bold text-sm mt-1">
                        Project: <span className="text-emerald-900">{fetchedData.projectName}</span>
                        <span className="mx-2 text-emerald-300">•</span>
                        Track: <span className="text-emerald-900">{fetchedData.track}</span>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setFetchedData(null); setLookupEmail(""); }}
                        className="text-emerald-600 hover:text-emerald-800 p-0 h-auto mt-1 text-xs font-bold"
                      >
                        ← Use a different email
                      </Button>
                    </div>
                  </div>

                  {/* Phase 2 submission fields */}
                  <div className="space-y-10 pt-4 border-t border-emerald-100">
                    <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100 space-y-8">
                      <div className="space-y-3">
                        <Label htmlFor="githubRepoLink" className="text-xs font-black uppercase tracking-widest text-emerald-700">GitHub Repository Link *</Label>
                        <div className="relative group">
                          <Github className="absolute left-5 top-5 h-6 w-6 text-emerald-500 group-focus-within:scale-110 transition-transform" />
                          <Input
                            id="githubRepoLink"
                            value={formData.githubRepoLink}
                            onChange={handleInputChange}
                            placeholder="https://github.com/username/project"
                            className="h-16 pl-14 rounded-2xl border-emerald-200 bg-white font-bold text-emerald-900 focus:ring-emerald-200"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Project README (PDF/DOC) *</Label>
                          <div className="relative h-14 bg-white rounded-xl border border-emerald-200 flex items-center px-4 overflow-hidden group">
                            <Upload className="h-5 w-5 text-emerald-400 mr-2" />
                            <span className="text-xs font-bold text-emerald-600 uppercase truncate">
                              {files.readme ? files.readme.name : "Select README"}
                            </span>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange("readme", e.target.files?.[0] || null)} required />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Source Code ZIP (Optional)</Label>
                          <div className="relative h-14 bg-white rounded-xl border border-emerald-200 flex items-center px-4 overflow-hidden group">
                            <FileArchive className="h-5 w-5 text-emerald-400 mr-2" />
                            <span className="text-xs font-bold text-emerald-600 uppercase truncate">
                              {files.finalZip ? files.finalZip.name : "Select ZIP"}
                            </span>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange("finalZip", e.target.files?.[0] || null)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-16 text-xl font-black rounded-3xl shadow-2xl transition-all active:scale-95 disabled:opacity-50 tracking-[0.1em] uppercase bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Submitting...</span>
                      </div>
                    ) : "Submit Final Project"}
                  </Button>
                </form>
              )}
            </div>
          )}
        </Card>

        <div className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">
          Powering the next generation of innovators • Codekarx 2026
        </div>
      </div>
    </div>
  );
};

export default CandidateForm;
