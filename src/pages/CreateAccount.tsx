import { useState, useEffect } from 'react';
import { VPNProtocol, Server, AccountData, CreateAccountRequest } from '@/types/vpn';
import { vpnService } from '@/services/vpnService';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProgressSteps } from '@/components/ProgressSteps';
import { StepContent } from '@/components/StepContent';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSidebar } from '@/contexts/SidebarContext';

const CreateAccount = () => {
  const navigate = useNavigate();
  const { isMenuOpen } = useSidebar();
  const [currentStep, setCurrentStep] = useState<'protocol' | 'server' | 'form' | 'result'>('protocol');
  const [selectedProtocol, setSelectedProtocol] = useState<VPNProtocol>('ssh');
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountResult, setAccountResult] = useState<AccountData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Prevent any unwanted redirects on component mount
  useEffect(() => {
    // Ensure we don't interfere with browser history
    const handlePopState = (event: PopStateEvent) => {
      // Let the browser handle back/forward navigation naturally
      // Don't prevent default or redirect
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setIsLoadingServers(true);
    try {
      const serverList = await vpnService.getServers();
      setServers(serverList);
      if (serverList.length > 0) {
        setSelectedServerId(serverList.find(s => s.status === 'online')?.id || serverList[0].id);
      }
    } catch (error) {
      toast.error('Gagal memuat daftar server');
    } finally {
      setIsLoadingServers(false);
    }
  };

  const transitionToStep = (nextStep: typeof currentStep) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setIsTransitioning(false);
    }, 150);
  };

  const handleProtocolSelect = (protocol: VPNProtocol) => {
    setSelectedProtocol(protocol);
    transitionToStep('server');
  };

  const handleServerSelect = (serverId: string) => {
    setSelectedServerId(serverId);
    transitionToStep('form');
  };

  const handleAccountCreate = async (formData: {
    username: string;
    password?: string;
    duration: number;
    quota?: number;
    ipLimit: number;
  }) => {
    setIsCreatingAccount(true);
    try {
      const request: CreateAccountRequest = {
        userId: 'user-123',
        username: formData.username,
        password: formData.password,
        protocol: selectedProtocol,
        duration: formData.duration,
        quota: formData.quota,
        ipLimit: formData.ipLimit,
        serverId: selectedServerId
      };

      const result = await vpnService.createAccount(request);
      
      if (result.success && result.data) {
        setAccountResult(result.data);
        transitionToStep('result');
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat membuat akun');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleReset = () => {
    setAccountResult(null);
    setSelectedProtocol('ssh');
    setSelectedServerId('');
    transitionToStep('protocol');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'server':
        transitionToStep('protocol');
        break;
      case 'form':
        transitionToStep('server');
        break;
      case 'result':
        transitionToStep('form');
        break;
    }
  };

  const handleBackToPrevious = () => {
    // Use navigate(-1) which properly uses history.back()
    // This preserves the browser history stack
    navigate(-1);
  };

  const steps = [
    { id: 'protocol', title: 'Protocol', subtitle: 'Pilih Protocol' },
    { id: 'server', title: 'Server', subtitle: 'Pilih Server' },
    { id: 'form', title: 'Konfigurasi', subtitle: 'Atur Akun' },
    { id: 'result', title: 'Selesai', subtitle: 'Akun Dibuat' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 transition-all duration-300 ${isMenuOpen ? 'mr-64' : 'mr-0'}`}>
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

        <Hero />
        
        <ProgressSteps steps={steps} currentStepIndex={currentStepIndex} />

        <StepContent
          currentStep={currentStep}
          selectedProtocol={selectedProtocol}
          servers={servers}
          selectedServerId={selectedServerId}
          isLoadingServers={isLoadingServers}
          isCreatingAccount={isCreatingAccount}
          accountResult={accountResult}
          isTransitioning={isTransitioning}
          onProtocolSelect={handleProtocolSelect}
          onServerSelect={handleServerSelect}
          onAccountCreate={handleAccountCreate}
          onBack={handleBack}
          onReset={handleReset}
          onLoadServers={loadServers}
        />

        <LoadingOverlay 
          isCreatingAccount={isCreatingAccount} 
          selectedProtocol={selectedProtocol} 
        />

        <Footer />
      </div>
    </div>
  );
};

export default CreateAccount;
