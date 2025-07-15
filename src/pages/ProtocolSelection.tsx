import { useNavigate } from 'react-router-dom';
import { VPNProtocol } from '@/types/vpn';
import { Header } from '@/components/Header';
import { ProtocolSelector } from '@/components/ProtocolSelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

const ProtocolSelection = () => {
  const navigate = useNavigate();
  const { isMenuOpen } = useSidebar();

  const handleProtocolSelect = (protocol: VPNProtocol) => {
    navigate(`/protokol/server-${protocol}`);
  };

  const handleBackToPrevious = () => {
    navigate(-1);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 transition-all duration-300 ${isMenuOpen ? '-ml-64' : 'ml-0'}`}>
      <Header />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6">
        {/* Back to Previous Page Button */}
        <div className="mb-4 pt-20">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleBackToPrevious}
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Halaman Sebelumnya
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Pilih Protocol VPN
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pilih protocol yang sesuai dengan kebutuhan Anda untuk membuat akun VPN
          </p>
        </div>

        {/* Protocol Selection */}
        <div className="max-w-2xl mx-auto">
          <ProtocolSelector 
            selectedProtocol="ssh" 
            onProtocolChange={handleProtocolSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default ProtocolSelection;