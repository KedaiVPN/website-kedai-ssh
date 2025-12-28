import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
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
import TopupResult from "./pages/TopupResult"; // Corrected import
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import BugInjectorPage from "./pages/BugInjectorPage";
import AboutUs from "./pages/AboutUs";
import XLTopup from "./pages/XLTopup";
import BannerDisplay from "./components/BannerDisplay";
import TutorialsPage from "./pages/TutorialsPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import GameTopupList from "./pages/GameTopupList";
import GameTopupProduct from "./pages/GameTopupProduct";
import OtherProductsPage from "./pages/OtherProductsPage";
import OtherProductDetailPage from "./pages/OtherProductDetailPage";
import BlockedUser from "./pages/BlockedUser";
import PulsaDataPage from "./pages/PulsaDataPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vpn-ui-theme">
      <AuthProvider>
          <BannerDisplay />
          <TooltipProvider>
            <Sonner position="top-center" richColors duration={2000} toastOptions={{
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
              <Route path="/blocked" element={<BlockedUser />} />

              {/* Tutorial/Blog Pages */}
              <Route path="/tutorials" element={<TutorialsPage />} />
              <Route path="/tutorials/:slug" element={<ArticleDetailPage />} />

              {/* Legal Pages */}
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
              <Route path="/tembakPaket" element={<ProtectedRoute><XLTopup /></ProtectedRoute>} />
              <Route path="/topupgame" element={<ProtectedRoute><GameTopupList /></ProtectedRoute>} />
              <Route path="/topupgame/:slug" element={<ProtectedRoute><GameTopupProduct /></ProtectedRoute>} />
              <Route path="/pulsa-dan-paket-data" element={<ProtectedRoute><PulsaDataPage /></ProtectedRoute>} />
              <Route path="/produk-lainnya" element={<ProtectedRoute><OtherProductsPage /></ProtectedRoute>} />
              <Route path="/produk-lainnya/:slug" element={<ProtectedRoute><OtherProductDetailPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingWhatsAppButton />
          </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
