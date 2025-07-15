
// Halaman untuk membuat akun VPN baru
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VPNProtocol } from '@/types/vpn';
import { Header } from '@/components/Header';
import { ProgressSteps } from '@/components/ProgressSteps';
import { AccountForm } from '@/components/AccountForm';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AccountSuccess } from '@/components/AccountSuccess';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createVPNAccount } from '@/services/vpnService';
import { toast } from 'sonner';
import { useSidebar } from '@/contexts/SidebarContext';

const CreateAccount = () => {
  // Mengambil parameter protocol dari URL
  const { protocol } = useParams<{ protocol: VPNProtocol }>();
  // Hook untuk navigasi
  const navigate = useNavigate();
  // State sidebar
  const { isMenuOpen } = useSidebar();
  
  // State untuk mengontrol tampilan dan proses
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountData, setAccountData] = useState<any>(null);

  // Konfigurasi langkah-langkah pembuatan akun
  const steps = [
    {
      id: 'form',
      title: 'Konfigurasi Akun',
      subtitle: 'Setup'
    },
    {
      id: 'success',
      title: 'Akun Berhasil Dibuat',
      subtitle: 'Selesai'
    }
  ];

  // Validasi protocol dari URL
  if (!protocol || !['ssh', 'vmess', 'vless', 'trojan'].includes(protocol)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Protocol Tidak Valid</h1>
          <Button onClick={() => navigate('/')}>Kembali ke Beranda</Button>
        </div>
      </div>
    );
  }

  // Fungsi untuk menangani submit form pembuatan akun
  const handleFormSubmit = async (formData: any) => {
    setIsCreatingAccount(true);
    
    try {
      // Memanggil service untuk membuat akun VPN
      const result = await createVPNAccount(protocol, formData);
      
      if (result.success) {
        // Menyimpan data akun yang berhasil dibuat
        setAccountData(result.data);
        // Pindah ke step sukses
        setCurrentStep(1);
        toast.success('Akun VPN berhasil dibuat!');
      } else {
        // Menampilkan pesan error jika gagal
        toast.error(result.message || 'Gagal membuat akun VPN');
      }
    } catch (error) {
      // Menangani error yang tidak terduga
      console.error('Error creating VPN account:', error);
      toast.error('Terjadi kesalahan saat membuat akun');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Fungsi untuk kembali ke halaman sebelumnya
  const handleBackToPrevious = () => {
    navigate(-1);
  };

  // Fungsi untuk membuat akun baru lagi
  const handleCreateAnother = () => {
    setCurrentStep(0);
    setAccountData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 relative z-10 transition-transform duration-300 overflow-x-hidden">
      <Header />
      
      {/* Elemen latar belakang animasi */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6">
        {/* Tombol kembali */}
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

        {/* Header halaman */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Buat Akun {protocol?.toUpperCase()}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ikuti langkah-langkah berikut untuk membuat akun VPN Anda
          </p>
        </div>

        {/* Indikator progress langkah */}
        <ProgressSteps steps={steps} currentStepIndex={currentStep} />

        {/* Konten berdasarkan langkah saat ini */}
        <div className="max-w-2xl mx-auto">
          {currentStep === 0 && (
            <AccountForm 
              protocol={protocol}
              onSubmit={handleFormSubmit}
              isLoading={isCreatingAccount}
            />
          )}
          
          {currentStep === 1 && accountData && (
            <AccountSuccess 
              accountData={accountData}
              protocol={protocol}
              onCreateAnother={handleCreateAnother}
            />
          )}
        </div>
        
        <Footer />
      </div>

      {/* Overlay loading saat membuat akun */}
      <LoadingOverlay 
        isCreatingAccount={isCreatingAccount}
        selectedProtocol={protocol}
      />
    </div>
  );
};

export default CreateAccount;
