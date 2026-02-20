import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthPage from "@/pages/AuthPage";
import CandidateForm from "@/pages/CandidateForm";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Candidates from "@/pages/Candidates";
import DashboardSettings from "@/pages/DashboardSettings";
import NotFound from "@/pages/NotFound";

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister }}
  >
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CandidateForm />} />
            <Route path="/login" element={<AuthPage />} />
            <Route
              path="/candidate-form"
              element={<CandidateForm />}
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <DashboardLayout><Dashboard /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/candidates"
              element={
                <ProtectedRoute>
                  <DashboardLayout><Candidates /></DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/pending"
              element={
                <ProtectedRoute>
                  <DashboardLayout><Candidates filterStatus="Pending" /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/approved"
              element={
                <ProtectedRoute>
                  <DashboardLayout><Candidates filterStatus="Approved" /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout><DashboardSettings /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </PersistQueryClientProvider>
);

export default App;
