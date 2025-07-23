
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import About from "./pages/About";
import CreateAccount from "./pages/CreateAccount";
import AdminDashboard from "./pages/AdminDashboard";
import ServerSelection from "./pages/ServerSelection";
import ProtocolSelection from "./pages/ProtocolSelection";
import ProtocolServerSelection from "./pages/ProtocolServerSelection";
import Register from "./pages/Register";
import SetUsername from "./pages/SetUsername";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vpn-ui-theme">
      <SidebarProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<About />} />
              <Route path="/register" element={<Register />} />
              <Route path="/set-username" element={<SetUsername />} />
              <Route path="/admin" element={<AdminDashboard />} />
              
              {/* Protected Routes */}
              <Route path="/create-account" element={
                <ProtectedRoute>
                  <CreateAccount />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/servers/:protocol" element={
                <ProtectedRoute>
                  <ServerSelection />
                </ProtectedRoute>
              } />
              <Route path="/protokol" element={
                <ProtectedRoute>
                  <ProtocolSelection />
                </ProtectedRoute>
              } />
              <Route path="/protokol/:protocol" element={
                <ProtectedRoute>
                  <ProtocolServerSelection />
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
