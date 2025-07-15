
/**
 * Komponen utama aplikasi yang mengatur routing dan provider
 * File ini merupakan entry point utama untuk aplikasi React
 */

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

// Membuat instance QueryClient untuk manajemen state global dan caching data
const queryClient = new QueryClient();

/**
 * Komponen App utama yang membungkus seluruh aplikasi
 * Mengatur provider untuk theme, query client, sidebar, dan routing
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Provider untuk tema aplikasi (light/dark mode) */}
    <ThemeProvider defaultTheme="light" storageKey="vpn-ui-theme">
      {/* Provider untuk state sidebar (buka/tutup) */}
      <SidebarProvider>
        {/* Provider untuk tooltip komponen UI */}
        <TooltipProvider>
          {/* Komponen untuk menampilkan notifikasi toast */}
          <Toaster />
          <Sonner />
          
          {/* Router utama aplikasi */}
          <BrowserRouter>
            <Routes>
              {/* Halaman utama - tentang aplikasi */}
              <Route path="/" element={<About />} />
              
              {/* Halaman untuk membuat akun VPN */}
              <Route path="/create-account" element={<CreateAccount />} />
              
              {/* Halaman dashboard admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              
              {/* Halaman pemilihan server berdasarkan protokol */}
              <Route path="/servers/:protocol" element={<ServerSelection />} />
              
              {/* Halaman pemilihan protokol VPN */}
              <Route path="/protokol" element={<ProtocolSelection />} />
              
              {/* Halaman pemilihan server untuk protokol tertentu */}
              <Route path="/protokol/:protocol" element={<ProtocolServerSelection />} />
              
              {/* Route catch-all untuk halaman tidak ditemukan - HARUS DI PALING BAWAH */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
