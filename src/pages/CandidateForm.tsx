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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

const CandidateForm = () => {
  const [phase, setPhase] = useState<"1" | "2">("1");
  const [regType, setRegType] = useState<"Individual" | "Team">("Individual");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showCodePopup, setShowCodePopup] = useState(() => !localStorage.getItem("codekar_reg_id"));
  const [regIdInput, setRegIdInput] = useState(() => localStorage.getItem("codekar_reg_id") || "");
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    collegeCompany: "",
    teamName: "",
    teamLeaderName: "",
    teamLeaderEmail: "",
    projectDescription: "",
    githubRepoLink: "",
    registrationId: "", // For Phase 2
  });

  const [teamMembers, setTeamMembers] = useState([{ name: "", email: "" }]);
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: "", email: "" }]);
  };

  const handleTeamMemberChange = (index: number, field: "name" | "email", value: string) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };

  const handleFetchData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!regIdInput.trim()) return;

    setFetchingData(true);
    try {
      const data = await candidateApi.getApplicationByRegId(regIdInput);
      if (data) {
        setFormData({
          ...formData,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || data.teamLeaderEmail || "",
          phone: data.phone || "",
          department: data.department || "",
          collegeCompany: data.collegeCompany || "",
          teamName: data.teamName || "",
          teamLeaderName: data.teamLeaderName || "",
          teamLeaderEmail: data.teamLeaderEmail || "",
          projectDescription: data.phase1?.projectDescription || "",
          githubRepoLink: data.phase2?.githubRepoLink || "",
          registrationId: data.registrationId,
        });

        if (data.registrationType) setRegType(data.registrationType);
        if (data.teamMembers) setTeamMembers(data.teamMembers);

        // Auto switch to phase 2 if phase 1 is completed
        if (data.phase1?.projectDescription) {
          setPhase("2");
        }

        setShowCodePopup(false);
        localStorage.setItem("codekar_reg_id", regIdInput);
        toast({ title: "Portal Authenticated", description: "Your project details have been loaded." });
      }
    } catch (err: any) {
      // Only show error if explicitly submitted via button or if input length is sufficient
      if (e || regIdInput.length >= 10) {
        toast({
          title: "Invalid Code",
          description: "Could not find registration with this code. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setFetchingData(false);
    }
  };

  // Automatic fetch when code is entered
  useEffect(() => {
    const checkAndFetch = async () => {
      if (regIdInput.length === 10 && regIdInput.startsWith("REG-")) {
        await handleFetchData();
      }
    };
    checkAndFetch();
  }, [regIdInput]);

  const handleClearSession = () => {
    localStorage.removeItem("codekar_reg_id");
    setRegIdInput("");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      collegeCompany: "",
      teamName: "",
      teamLeaderName: "",
      teamLeaderEmail: "",
      projectDescription: "",
      githubRepoLink: "",
      registrationId: "",
    });
    setFiles({ ppt: null, readme: null, finalZip: null });
    setPhase("1");
    setRegType("Individual");
    setTeamMembers([]);
    setShowCodePopup(true);
    toast({ title: "Session Cleared", description: "You have been signed out of this session." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registrationId) {
      toast({ title: "Authentication Required", description: "Please enter your unique code first.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("registrationId", formData.registrationId);

      // Submit what is present
      if (formData.projectDescription) data.append("projectDescription", formData.projectDescription);
      if (files.ppt) data.append("ppt", files.ppt);
      if (formData.githubRepoLink) data.append("githubRepoLink", formData.githubRepoLink);
      if (files.readme) data.append("readme", files.readme);
      if (files.finalZip) data.append("finalZip", files.finalZip);

      // We use submitPhase2 as it's an update-style endpoint on the backend
      await candidateApi.submitPhase2(data);
      toast({ title: "Upload Successful", description: "Your project files have been updated." });
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center shadow-2xl border-none bg-white/80 backdrop-blur-md">
          <CardContent className="pt-10 pb-10 space-y-4">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h2 className="text-2xl font-bold text-slate-800">Submission Successful!</h2>
            <p className="text-slate-600">
              {phase === "1"
                ? "Your project description has been received. Check your email for confirmation."
                : "Your final project has been received and is under review."}
            </p>
            <Button onClick={() => setSubmitted(false)} className="bg-indigo-600 hover:bg-indigo-700">Submit Another Response</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950/20 backdrop-blur-sm bg-gradient-to-br from-slate-50 to-indigo-50 py-12 px-4">
      {/* Unique Code Popup */}
      <Dialog open={showCodePopup} onOpenChange={setShowCodePopup}>
        <DialogContent className="sm:max-w-md border-none p-0 overflow-hidden rounded-3xl shadow-2xl">
          <div className="bg-indigo-600 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Upload className="h-24 w-24" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black italic tracking-tighter">PROJECT UPLOAD PORTAL</DialogTitle>
              <DialogDescription className="text-indigo-100 mt-2 font-medium">
                Enter your unique code to authenticate and access the submission portal.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleFetchData} className="p-8 space-y-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="regId" className="text-slate-700 font-semibold">Unique Registration Code</Label>
              <Input
                id="regId"
                placeholder="e.g. REG-123456"
                value={regIdInput}
                onChange={(e) => setRegIdInput(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-xs text-slate-500 italic">This code was provided to you during your initial signup.</p>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg"
              disabled={fetchingData}
            >
              {fetchingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching Your Data...
                </>
              ) : "Access My Registration"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl italic uppercase italic underline decoration-indigo-500 decoration-8 underline-offset-8">
            CODEKAR UPLOAD
          </h1>
          <p className="text-lg text-slate-600 font-medium">Submit your project prototypes and final solutions</p>
        </div>

        {/* Tabs removed to focus on unified submission for authenticated users */}

        <Card className="shadow-2xl border-none bg-white rounded-3xl overflow-hidden ring-1 ring-slate-200">
          <CardHeader className="bg-indigo-600 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <Upload className="h-6 w-6" /> Project Submission Portal
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Authenticated Access: Proceed with uploading your project documentation and files.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSession}
                className="bg-indigo-500/20 border-indigo-400/30 text-white hover:bg-white hover:text-indigo-600 text-[10px] font-bold h-7 rounded-lg transition-all"
              >
                SWITCH ACCOUNT
              </Button>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-8 space-y-8">
              {/* Individual vs Team Selection */}
              {/* Selection is now locked/read-only info */}
              {!showCodePopup && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Participant Type</p>
                    <div className="flex items-center gap-2">
                      {regType === 'Individual' ? <User className="h-4 w-4 text-indigo-600" /> : <Users className="h-4 w-4 text-indigo-600" />}
                      <span className="font-bold text-slate-700">{regType}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Track</p>
                    <span className="font-bold text-slate-700">{formData.department || "Not Specified"}</span>
                  </div>
                </div>
              )}

              {/* Personal Details as Read-only Info */}
              {!showCodePopup && (
                <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" /> Participant Identity
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {regType === 'Individual' ? (
                      <>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Full Name</p>
                          <p className="font-bold text-slate-800">{formData.firstName} {formData.lastName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Contact Email</p>
                          <p className="font-bold text-slate-800 italic underline">{formData.email}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Team Name / Leader</p>
                          <p className="font-bold text-slate-800">{formData.teamName} ({formData.teamLeaderName})</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Leader Email</p>
                          <p className="font-bold text-slate-800 italic underline">{formData.teamLeaderEmail}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Phase Switch Logic Hidden - only file sections show if authenticated */}

              {/* Phase 1 Fields */}
              {(phase === "1" || formData.registrationId) && (
                <div className="space-y-6 border-t pt-8 border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</div>
                    Phase 1: Project Description
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="projectDescription">Project Description *</Label>
                    <Textarea
                      id="projectDescription"
                      placeholder="Briefly describe your project goals..."
                      className="min-h-[150px] rounded-2xl"
                      value={formData.projectDescription}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-sm font-medium text-slate-700 items-center gap-2 flex">
                      <FileText className="h-4 w-4 text-indigo-500" /> Upload Project PPT (PDF/PPT) *
                    </Label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-indigo-100 border-dashed rounded-2xl hover:border-indigo-400 bg-indigo-50/30 transition-colors cursor-pointer group">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                        <div className="flex text-sm text-slate-600 justify-center">
                          <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-indigo-600 hover:text-indigo-500">
                            <span>Upload Phase 1 Files</span>
                            <input type="file" className="sr-only" onChange={(e) => handleFileChange('ppt', e.target.files?.[0] || null)} />
                          </label>
                        </div>
                        <p className="text-xs text-slate-500">PDF, PPTX up to 10MB</p>
                        {files.ppt && <p className="text-sm font-bold text-emerald-600 mt-2 flex items-center justify-center gap-1"><CheckCircle2 className="h-4 w-4" /> {files.ppt.name}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 2 Fields */}
              {(phase === "2" || formData.registrationId) && (
                <div className="space-y-6 border-t pt-8 border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">2</div>
                    Phase 2: Final Submission
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="githubRepoLink">GitHub Repository Link *</Label>
                    <div className="relative">
                      <Github className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                      <Input
                        id="githubRepoLink"
                        placeholder="https://github.com/username/project"
                        className="pl-12 rounded-xl h-12"
                        value={formData.githubRepoLink}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>README File (PDF/DOC) *</Label>
                      <div className="flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:border-indigo-400 transition-colors cursor-pointer relative">
                        <FileText className="h-8 w-8 text-indigo-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{files.readme ? files.readme.name : "Select README"}</p>
                          <p className="text-xs text-slate-500">PDF or Word</p>
                        </div>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange('readme', e.target.files?.[0] || null)} required={!formData.githubRepoLink} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Final Project Files (ZIP) - Optional</Label>
                      <div className="flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:border-indigo-400 transition-colors cursor-pointer relative">
                        <FileArchive className="h-8 w-8 text-indigo-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{files.finalZip ? files.finalZip.name : "Select ZIP archive"}</p>
                          <p className="text-xs text-slate-500">Project source code</p>
                        </div>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange('finalZip', e.target.files?.[0] || null)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95" disabled={loading}>
                {loading ? "Processing Submission..." : phase === "1" ? "Submit Project Description" : "Complete Final Submission"}
              </Button>
            </CardContent>
          </form>
        </Card>

        <p className="text-center mt-12 text-slate-500 text-sm">
          Protected by Codekar Security • © 2026 Codekar Hackathon
        </p>
      </div>
    </div>
  );
};

export default CandidateForm;
