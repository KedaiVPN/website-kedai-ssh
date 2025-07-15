
// Halaman utama/beranda aplikasi VPN
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProtocolSelector } from '@/components/ProtocolSelector';
import { Footer } from '@/components/Footer';
import { VPNProtocol } from '@/types/vpn';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';

const Home = () => {
  // Hook untuk navigasi antar halaman
  const navigate = useNavigate();
  // Hook untuk mengakses state sidebar
  const { isMenuOpen } = useSidebar();

  // Fungsi untuk menangani pemilihan protocol VPN
  const handleProtocolSelect = (protocol: VPNProtocol) => {
    // Navigasi ke halaman pembuatan akun dengan protocol yang dipilih
    navigate(`/buat-akun/${protocol}`);
  };

  return (
    // Container utama dengan gradient background dan responsive design
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 relative z-10 transition-transform duration-300 overflow-x-hidden">
      {/* Header navigasi */}
      <Header />
      
      {/* Elemen latar belakang animasi untuk visual menarik */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Lingkaran gradient animasi */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Konten utama */}
      <div className="relative z-10">
        {/* Bagian hero/pembuka */}
        <Hero />
        
        {/* Container untuk selector protocol dengan padding responsive */}
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Komponen untuk memilih protocol VPN */}
          <ProtocolSelector 
            selectedProtocol="ssh" 
            onProtocolChange={handleProtocolSelect}
          />
        </div>
        
        {/* Footer aplikasi */}
        <Footer />
      </div>
    </div>
  );
};

export default Home;
