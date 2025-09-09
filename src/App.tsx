import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "./components/Sidebar"; // Import new Sidebar
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
import BugInjectorPage from "./pages/BugInjectorPage";
import AboutUs from "./pages/AboutUs";

const queryClient = new QueryClient();

// A new layout component to wrap routes that should have the sidebar
const MainLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Don't show sidebar on admin page or auth pages
  const noSidebarRoutes = ['/admin', '/login', '/register', '/forgot-password', '/reset-password', '/set-username', '/check-email', '/verify-email'];
  const showSidebar = isAuthenticated && !noSidebarRoutes.includes(location.pathname);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<About />} />
    <Route path="/register" element={<Register />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/set-username" element={<SetUsername />} />
    <Route path="/check-email" element={<CheckEmail />} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/terms-of-service" element={<TermsOfService />} />
    <Route path="/about-us" element={<AboutUs />} />

    {/* Protected Routes */}
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/protokol" element={<ProtectedRoute><ProtocolSelection /></ProtectedRoute>} />
    <Route path="/protokol/:protocol" element={<ProtectedRoute><ProtocolServerSelection /></ProtectedRoute>} />
    <Route path="/topup" element={<ProtectedRoute><Topup /></ProtectedRoute>} />
    <Route path="/topup/result" element={<ProtectedRoute><TopupResult /></ProtectedRoute>} />
    <Route path="/bug-injector" element={<ProtectedRoute><BugInjectorPage /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vpn-ui-theme">
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Sonner position="top-center" richColors duration={6000} toastOptions={{ classNames: { error: 'bg-red-500 text-white', success: 'bg-green-500 text-white' } }} />
            <MainLayout>
              <AppRoutes />
            </MainLayout>
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
