import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import CandidateForm from "./pages/CandidateForm";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import Departments from "./pages/Departments";
import DashboardSettings from "./pages/DashboardSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout><Dashboard /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/candidates"
              element={
                <ProtectedRoute>
                  <DashboardLayout><Candidates /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/departments"
              element={
                <ProtectedRoute>
                  <DashboardLayout><Departments /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/pending"
              element={
                <ProtectedRoute>
                  <DashboardLayout><Candidates filterStatus="Pending" /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/verified"
              element={
                <ProtectedRoute>
                  <DashboardLayout><Candidates filterStatus="Verified" /></DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
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
  </QueryClientProvider>
);

export default App;
