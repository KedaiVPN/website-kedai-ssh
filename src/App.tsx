
// File utama aplikasi React yang mengatur routing dan provider-provider global
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import About from "./pages/About";
import CreateAccount from "./pages/CreateAccount";
import AdminDashboard from "./pages/AdminDashboard";
import ServerSelection from "./pages/ServerSelection";
import ProtocolSelection from "./pages/ProtocolSelection";
import ProtocolServerSelection from "./pages/ProtocolServerSelection";
import NotFound from "./pages/NotFound";

// Membuat instance QueryClient untuk mengelola state server dan caching
const queryClient = new QueryClient();

// Komponen utama aplikasi yang membungkus seluruh aplikasi dengan provider-provider yang diperlukan
const App = () => (
  // Provider untuk React Query - mengelola data fetching dan caching
  <QueryClientProvider client={queryClient}>
    {/* Provider untuk tema (light/dark mode) */}
    <ThemeProvider defaultTheme="light" storageKey="vpn-ui-theme">
      {/* Provider untuk mengelola state sidebar */}
      <SidebarProvider>
        {/* Provider untuk tooltip components */}
        <TooltipProvider>
          {/* Komponen notifikasi toast */}
          <Toaster />
          <Sonner />
          {/* Router untuk navigasi antar halaman */}
          <BrowserRouter>
            <Routes>
              {/* Route halaman utama (About) */}
              <Route path="/" element={<About />} />
              {/* Route untuk membuat akun VPN */}
              <Route path="/create-account" element={<CreateAccount />} />
              {/* Route untuk dashboard admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              {/* Route untuk pemilihan server berdasarkan protocol */}
              <Route path="/servers/:protocol" element={<ServerSelection />} />
              {/* Route untuk pemilihan protocol */}
              <Route path="/protokol" element={<ProtocolSelection />} />
              {/* Route untuk pemilihan server dalam halaman protocol */}
              <Route path="/protokol/:protocol" element={<ProtocolServerSelection />} />
              {/* Route catch-all untuk halaman tidak ditemukan - HARUS SELALU DI BAWAH */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
