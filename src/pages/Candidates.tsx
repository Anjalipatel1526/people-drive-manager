import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";
import { Download, Eye, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Candidate = Database["public"]["Tables"]["candidates"]["Row"];
type CandidateDoc = Database["public"]["Tables"]["candidate_documents"]["Row"];
type Department = Database["public"]["Enums"]["department"];

const DEPARTMENTS = Constants.public.Enums.department;

interface CandidatesPageProps {
  filterStatus?: "Pending" | "Verified";
  filterDepartment?: Department;
}

const Candidates = ({ filterStatus, filterDepartment }: CandidatesPageProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>(filterDepartment || "all");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateDocs, setCandidateDocs] = useState<CandidateDoc[]>([]);
  const { toast } = useToast();

  const fetchCandidates = async () => {
    let query = supabase.from("candidates").select("*").order("created_at", { ascending: false });
    if (filterStatus) query = query.eq("status", filterStatus);
    if (filterDepartment) query = query.eq("department", filterDepartment);
    const { data } = await query;
    setCandidates(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCandidates(); }, [filterStatus, filterDepartment]);

  const filtered = candidates.filter((c) => {
    const matchesSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || c.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const updateStatus = async (id: string, status: "Pending" | "Verified") => {
    const { error } = await supabase.from("candidates").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated" });
      fetchCandidates();
    }
  };

  const deleteCandidate = async (id: string) => {
    const { error } = await supabase.from("candidates").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Candidate deleted" });
      fetchCandidates();
    }
  };

  const viewDetails = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    const { data } = await supabase.from("candidate_documents").select("*").eq("candidate_id", candidate.id);
    setCandidateDocs(data || []);
  };

  const downloadDoc = async (doc: CandidateDoc) => {
    const { data } = await supabase.storage.from("candidate-documents").createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const exportCSV = () => {
    const headers = "Name,Email,Phone,Department,Status,Date\n";
    const rows = filtered.map((c) => `"${c.full_name}","${c.email}","${c.phone}","${c.department}","${c.status}","${new Date(c.created_at).toLocaleDateString()}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidates.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const title = filterStatus ? `${filterStatus} Candidates` : filterDepartment ? `${filterDepartment} Department` : "All Candidates";

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {!filterDepartment && (
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No candidates found</TableCell></TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{c.phone}</TableCell>
                    <TableCell><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{c.department}</span></TableCell>
                    <TableCell>
                      <button
                        onClick={() => updateStatus(c.id, c.status === "Pending" ? "Verified" : "Pending")}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${c.status === "Verified" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"}`}
                      >
                        {c.status}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => viewDetails(c)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCandidate(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Candidate detail dialog */}
      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedCandidate?.full_name}</DialogTitle></DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {selectedCandidate.email}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selectedCandidate.phone}</div>
                <div><span className="text-muted-foreground">Department:</span> {selectedCandidate.department}</div>
                <div><span className="text-muted-foreground">Status:</span> {selectedCandidate.status}</div>
                {selectedCandidate.address && <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {selectedCandidate.address}</div>}
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Documents</h4>
                {candidateDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                ) : (
                  <div className="space-y-2">
                    {candidateDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-2">
                        <div>
                          <p className="text-sm font-medium capitalize">{doc.document_type}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => downloadDoc(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Candidates;
