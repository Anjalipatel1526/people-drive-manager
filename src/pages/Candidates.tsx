import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Eye, Search, Trash2, CheckCircle, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
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
import { googleSheets } from "@/lib/googleSheets";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const DEPARTMENTS = ["HR", "Tech", "Finance", "Marketing", "Operations"];

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  status: string;
  address: string;
  photo?: string;
  resume?: string;
  aadhaar?: string;
  pan?: string;
  passbook?: string;
}

interface CandidatesPageProps {
  filterStatus?: "Pending" | "Verified";
  filterDepartment?: string;
}


const Candidates = ({ filterStatus, filterDepartment }: CandidatesPageProps) => {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>(filterDepartment || "all");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: candidates = [], isLoading, refetch } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const response = await googleSheets.getApplications();
      if (response.result === "success") {
        return (response.data || []).map((app: any) => ({
          id: app.timestamp || Math.random().toString(),
          full_name: app.fullname || "Unknown",
          email: app.email || "",
          phone: app.phone || "",
          department: app.department || "Unassigned",
          status: app.status || "Pending",
          address: app.address || "",
          photo: app.photo || "",
          resume: app.resume || "",
          aadhaar: app.aadhaar || "",
          pan: app.pan || "",
          passbook: app.passbook || "",
        }));
      }
      throw new Error(response.error || "Failed to fetch data");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const verifyMutation = useMutation({
    mutationFn: (email: string) => googleSheets.verifyCandidate(email),
    onMutate: async (email) => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });
      const previousCandidates = queryClient.getQueryData<Candidate[]>(["applications"]);
      queryClient.setQueryData<Candidate[]>(["applications"], (old) =>
        old?.map((c) => (c.email === email ? { ...c, status: "Verified" } : c))
      );
      return { previousCandidates };
    },
    onError: (err, email, context) => {
      queryClient.setQueryData(["applications"], context?.previousCandidates);
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Candidate status updated to Verified." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (email: string) => googleSheets.deleteCandidate(email),
    onMutate: async (email) => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });
      const previousCandidates = queryClient.getQueryData<Candidate[]>(["applications"]);
      queryClient.setQueryData<Candidate[]>(["applications"], (old) =>
        old?.filter((c) => c.email !== email)
      );
      return { previousCandidates };
    },
    onError: (err, email, context) => {
      queryClient.setQueryData(["applications"], context?.previousCandidates);
      toast({ title: "Deletion failed", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Candidate application removed." });
    },
  });

  const filtered = candidates.filter((c) => {
    const matchesSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || c.department === deptFilter;
    const matchesStatus = !filterStatus || c.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleVerify = (email: string) => verifyMutation.mutate(email);
  const handleDelete = (email: string) => deleteMutation.mutate(email);

  const exportCSV = () => {
    toast({ title: "Not Available", description: "Export from Google Sheets directly.", variant: "default" });
  };

  const title = filterStatus ? `${filterStatus} Candidates` : filterDepartment ? `${filterDepartment} Department` : "All Candidates";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <Search className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
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
              {isLoading && candidates.length === 0 ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {isLoading ? "Loading data from Google Sheets..." : "No candidates found. If you just submitted, try refreshing in a moment."}
                </TableCell></TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{c.phone}</TableCell>
                    <TableCell><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{c.department}</span></TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "Verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedCandidate(c)} title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {c.status !== "Verified" && (
                          <Button variant="ghost" size="icon" onClick={() => handleVerify(c.email)} className="text-green-600 hover:text-green-700 hover:bg-green-50" title="Verify Document">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmEmail(c.email)} className="text-destructive hover:text-destructive/80" title="Delete Application">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                  <p className="text-sm font-medium">{selectedCandidate.full_name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Department</label>
                  <p className="text-sm font-medium">{selectedCandidate.department}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                <p className="text-sm font-medium">{selectedCandidate.email}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone</label>
                <p className="text-sm font-medium">{selectedCandidate.phone || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Address</label>
                <p className="text-sm font-medium">{selectedCandidate.address || "N/A"}</p>
              </div>

              <div className="pt-4 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase">Uploaded Documents</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: "Photo", url: selectedCandidate.photo, icon: ImageIcon },
                    { label: "Resume", url: selectedCandidate.resume, icon: FileText },
                    { label: "Aadhaar Card", url: selectedCandidate.aadhaar, icon: FileText },
                    { label: "PAN Card", url: selectedCandidate.pan, icon: FileText },
                    { label: "Bank Passbook", url: selectedCandidate.passbook, icon: FileText },
                  ].map((doc) => (
                    doc.url ? (
                      <a
                        key={doc.label}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-md border border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <doc.icon className="h-4 w-4 text-green-600" />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-green-800">{doc.label} - Uploaded</span>
                            <span className="text-[10px] text-green-600 font-medium">Click to open Drive Link</span>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-green-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    ) : (
                      <div key={doc.label} className="flex items-center gap-3 p-3 rounded-md border border-dashed border-border opacity-70">
                        <doc.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground font-medium">{doc.label} - Not Uploaded</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedCandidate(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmEmail} onOpenChange={(open) => !open && setDeleteConfirmEmail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the application for <strong>{deleteConfirmEmail}</strong> from Google Sheets. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmEmail && handleDelete(deleteConfirmEmail)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Candidates;
