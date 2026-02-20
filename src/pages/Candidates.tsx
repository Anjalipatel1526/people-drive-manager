import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  User,
  Github,
  FileText,
  FileArchive,
  MoreVertical,
  Trash2,
  CheckCircle,
  ShieldCheck,
  Building2,
  Download,
  Eye,
  FolderOpen
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { candidateApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

const TRACKS = [
  "Education",
  "Entertainment",
  "AI Agent and Automation",
  "Core AI/ML",
  "Big Data",
  "Mass Communication",
  "Cutting Agents"
];

interface TeamMember {
  name: string;
  email: string;
}

interface Candidate {
  _id: string;
  registrationId: string;
  registrationType: 'Individual' | 'Team';
  track: string;
  status: 'Pending' | 'Approved' | 'Rejected';

  // Individual
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  collegeCompany?: string;

  // Team
  teamName?: string;
  teamLeaderName?: string;
  teamLeaderEmail?: string;
  teamMembers?: TeamMember[];

  phase1?: {
    projectDescription: string;
    pptUrl?: string;
    submittedAt: string;
  };

  phase2?: {
    githubRepoLink: string;
    readmeUrl?: string;
    finalProjectZipUrl?: string;
    submittedAt: string;
    isCompleted: boolean;
  };
}

interface CandidatesPageProps {
  filterStatus?: "Pending" | "Approved" | "Rejected";
  filterTrack?: string;
}

const Candidates = ({ filterStatus, filterTrack }: CandidatesPageProps) => {
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<string>(filterTrack || "All");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [cachedCandidates, setCachedCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem("codekar_candidates_cache");
    return saved ? JSON.parse(saved) : [];
  });

  const { data: candidates = cachedCandidates, isPending, isFetching, refetch } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const data = await candidateApi.getAllApplications();
      localStorage.setItem("codekar_candidates_cache", JSON.stringify(data));
      setCachedCandidates(data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    initialData: cachedCandidates.length > 0 ? cachedCandidates : undefined,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => candidateApi.updateStatus(id, status),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      // Update local cache immediately too
      const updatedCandidates = candidates.map(c => c._id === data._id ? { ...c, status: data.status } : c);
      localStorage.setItem("codekar_candidates_cache", JSON.stringify(updatedCandidates));
      setCachedCandidates(updatedCandidates);
      toast({ title: "Success", description: "Status updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  });

  const filtered = useMemo(() => candidates.filter((c: Candidate) => {
    const name = c.registrationType === 'Individual' ? `${c.firstName} ${c.lastName}` : c.teamName || '';
    const email = (c.registrationType === 'Individual' ? c.email : c.teamLeaderEmail) || '';

    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase()) || c.registrationId.toLowerCase().includes(search.toLowerCase());
    const matchesTrack = trackFilter === "All" || c.track === trackFilter;
    const matchesStatus = !filterStatus || c.status === filterStatus;
    return matchesSearch && matchesTrack && matchesStatus;
  }), [candidates, search, trackFilter, filterStatus]);

  const TableSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {filterStatus ? `${filterStatus} Submissions` : "All Applications"}
          </h1>
          <p className="text-slate-500">Manage candidate registrations and project submissions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="bg-white">
            <Search className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="bg-white">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-lg border-slate-200"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">Filter by Track</Label>
          <Select value={trackFilter} onValueChange={setTrackFilter}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white/50">
              <SelectValue placeholder="All Tracks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Tracks</SelectItem>
              {TRACKS.map((track) => (
                <SelectItem key={track} value={track}>{track}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">ID & Name</TableHead>
                <TableHead className="font-semibold text-slate-700">Type</TableHead>
                <TableHead className="font-semibold text-slate-700">Track</TableHead>
                <TableHead className="font-semibold text-slate-700">Phase Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isPending && candidates.length === 0) ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-12">No applications found.</TableCell></TableRow>
              ) : (
                filtered.map((c: Candidate) => (
                  <TableRow key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-indigo-600 font-bold">{c.registrationId}</span>
                        <span className="font-semibold text-slate-900">
                          {c.registrationType === 'Individual' ? `${c.firstName} ${c.lastName}` : c.teamName}
                        </span>
                        <span className="text-xs text-slate-500">{c.registrationType === 'Individual' ? c.email : c.teamLeaderEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.registrationType === 'Team' ? "bg-indigo-50 border-indigo-100 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-700"}>
                        {c.registrationType === 'Team' ? <Users className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                        {c.registrationType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-slate-600 truncate max-w-[150px] inline-block">{c.track}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">P1 ✓</Badge>
                        {c.phase2?.isCompleted ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">P2 ✓</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-400 border-slate-200 text-[10px]">P2 -</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={c.status}
                        onValueChange={(v) => statusMutation.mutate({ id: c._id, status: v })}
                      >
                        <SelectTrigger className={`h-8 w-28 text-xs font-bold rounded-full border-none px-3 ${c.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          c.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedCandidate(c)} className="hover:bg-indigo-50 text-indigo-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none rounded-3xl">
          {selectedCandidate && (
            <>
              <DialogHeader className="p-8 bg-indigo-600 text-white rounded-t-3xl">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="mb-2 bg-indigo-500 text-white border-indigo-400">{selectedCandidate.registrationId}</Badge>
                    <DialogTitle className="text-2xl font-bold">
                      {selectedCandidate.registrationType === 'Individual' ? `${selectedCandidate.firstName} ${selectedCandidate.lastName}` : selectedCandidate.teamName}
                    </DialogTitle>
                    <p className="text-indigo-100 text-sm">{selectedCandidate.track}</p>
                  </div>
                  <Badge className={selectedCandidate.status === 'Approved' ? 'bg-emerald-500' : selectedCandidate.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'}>
                    {selectedCandidate.status}
                  </Badge>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 p-8 bg-slate-50">
                <div className="space-y-8 pb-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                      <p className="font-semibold text-slate-700 flex items-center gap-2">
                        {selectedCandidate.registrationType === 'Team' ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        {selectedCandidate.registrationType}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</label>
                      <p className="font-semibold text-slate-700 truncate">
                        {selectedCandidate.registrationType === 'Individual' ? selectedCandidate.email : selectedCandidate.teamLeaderEmail}
                      </p>
                    </div>
                  </div>

                  {selectedCandidate.registrationType === 'Team' && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Team Members</label>
                      <div className="space-y-2">
                        {selectedCandidate.teamMembers?.map((m, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{m.name}</span>
                            <span className="text-slate-500">{m.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-500 pl-3">Phase 1: Project Idea</h3>
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">{selectedCandidate.phase1?.projectDescription}</p>
                      {selectedCandidate.phase1?.pptUrl && (
                        <a
                          href={selectedCandidate.phase1.pptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <FileText className="h-5 w-5" />
                          <span className="text-sm font-bold">Open Project PPT (Drive)</span>
                          <ExternalLink className="h-4 w-4 ml-auto" />
                        </a>
                      )}
                    </div>
                  </div>

                  {selectedCandidate.phase2?.isCompleted ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-500 pl-3">Phase 2: Final Submission</h3>
                      <div className="space-y-3">
                        <a
                          href={selectedCandidate.phase2.githubRepoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors"
                        >
                          <Github className="h-6 w-6" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-400">GitHub Repository</p>
                            <p className="text-sm font-semibold truncate">{selectedCandidate.phase2.githubRepoLink}</p>
                          </div>
                          <ExternalLink className="h-4 w-4" />
                        </a>

                        <div className="grid grid-cols-2 gap-3">
                          {selectedCandidate.phase2.readmeUrl && (
                            <a
                              href={selectedCandidate.phase2.readmeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors"
                            >
                              <FileText className="h-4 w-4 text-indigo-600" />
                              <span className="text-xs font-semibold">README</span>
                              <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
                            </a>
                          )}
                          {selectedCandidate.phase2.finalProjectZipUrl && (
                            <a
                              href={selectedCandidate.phase2.finalProjectZipUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors"
                            >
                              <FolderOpen className="h-4 w-4 text-indigo-600" />
                              <span className="text-xs font-semibold">Final Source</span>
                              <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 text-sm font-medium">Phase 2 submission pending...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
                <Button variant="outline" onClick={() => setSelectedCandidate(null)} className="rounded-xl">Close View</Button>
                <Button className="bg-indigo-600 rounded-xl">Generate Report</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Candidates;
