
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import About from "./pages/About";
import AdminDashboard from "./pages/AdminDashboard";
import ProtocolSelection from "./pages/ProtocolSelection";
import ProtocolServerSelection from "./pages/ProtocolServerSelection";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SetUsername from "./pages/SetUsername";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CheckEmail from "./pages/CheckEmail";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Topup from "./pages/Topup";
import TopupResult from "./pages/TopupResult";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AboutUs from "./pages/AboutUs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vpn-ui-theme">
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Sonner position="top-center" richColors duration={6000} toastOptions={{
              classNames: {
                error: 'bg-red-500 text-white',
                success: 'bg-green-500 text-white',
              },
            }}/>
            <Routes>
              <Route path="/" element={<About />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/set-username" element={<SetUsername />} />
              <Route path="/check-email" element={<CheckEmail />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/admin" element={<AdminDashboard />} />
              
              {/* Legal Pages */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/about-us" element={<AboutUs />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
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
              <Route path="/topup" element={
                  <ProtectedRoute>
                    <Topup />
                  </ProtectedRoute>
                } />
              <Route path="/topup/result" element={
                <ProtectedRoute>
                  <TopupResult />
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingWhatsAppButton />
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
