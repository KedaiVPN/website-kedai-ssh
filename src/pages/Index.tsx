import { useState, useEffect } from 'react';
import { VPNProtocol, Server, AccountData, CreateAccountRequest } from '@/types/vpn';
import { vpnService } from '@/services/vpnService';
import { ProtocolSelector } from '@/components/ProtocolSelector';
import { ServerSelector } from '@/components/ServerSelector';
import { AccountForm } from '@/components/AccountForm';
import { AccountResult } from '@/components/AccountResult';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Shield, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'protocol' | 'server' | 'form' | 'result'>('protocol');
  const [selectedProtocol, setSelectedProtocol] = useState<VPNProtocol>('ssh');
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountResult, setAccountResult] = useState<AccountData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const steps = [
    { id: 'protocol', title: 'Protocol', subtitle: 'Pilih Protocol' },
    { id: 'server', title: 'Server', subtitle: 'Pilih Server' },
    { id: 'form', title: 'Konfigurasi', subtitle: 'Atur Akun' },
    { id: 'result', title: 'Selesai', subtitle: 'Akun Dibuat' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 transition-all duration-500">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-start mb-8 sm:mb-12">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/lovable-uploads/aa532f4b-2138-497d-aa0f-ed3294e0c935.png" 
                alt="Kedai SSH Logo" 
                className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse"
              />
            </div>
            <div className="relative inline-block">
              <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-3">
                Kedai SS<span className="relative">H<Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2 animate-bounce" /></span>
              </h1>
            </div>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Platform premium untuk membuat akun VPN dengan protokol SSH, VMess, VLESS, dan Trojan
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Mobile-optimized Progress Steps */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
          {/* Mobile: Compact progress indicator */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Langkah {currentStepIndex + 1} dari {steps.length}
              </span>
              <span className="text-sm font-semibold text-primary">
                {steps[currentStepIndex].title}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Desktop: Full progress steps */}
          <div className="hidden sm:flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      index <= currentStepIndex
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="mt-2 text-center">
                    <span
                      className={`text-sm font-medium transition-colors ${
                        index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {step.subtitle}
                    </span>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-20 h-1 mx-4 rounded-full transition-all duration-500 ${
                      index < currentStepIndex 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                        : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Content with smooth transitions */}
        <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {currentStep === 'protocol' && (
            <Card className="p-4 sm:p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
              <ProtocolSelector
                selectedProtocol={selectedProtocol}
                onProtocolChange={handleProtocolSelect}
              />
            </Card>
          )}

          {currentStep === 'server' && (
            <Card className="p-4 sm:p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
              <div className="space-y-6">
                <ServerSelector
                  servers={servers}
                  selectedServerId={selectedServerId}
                  onServerChange={handleServerSelect}
                  isLoading={isLoadingServers}
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    className="flex items-center justify-center hover:scale-105 transition-transform order-2 sm:order-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                  <Button 
                    onClick={loadServers} 
                    variant="outline" 
                    className="flex items-center justify-center hover:scale-105 transition-transform order-1 sm:order-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Server
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {currentStep === 'form' && (
            <Card className="p-4 sm:p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
              <div className="space-y-6">
                <AccountForm
                  protocol={selectedProtocol}
                  onSubmit={handleAccountCreate}
                  isLoading={isCreatingAccount}
                />
                <Button 
                  variant="outline" 
                  onClick={handleBack} 
                  className="w-full sm:w-auto flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </div>
            </Card>
          )}

          {currentStep === 'result' && accountResult && (
            <Card className="p-4 sm:p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
              <div className="space-y-6">
                <AccountResult
                  accountData={accountResult}
                  protocol={selectedProtocol}
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleReset} 
                    className="flex-1 hover:scale-105 transition-transform bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center"
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Buat Akun Baru
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    className="hover:scale-105 transition-transform flex items-center justify-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Loading Overlay */}
        {isCreatingAccount && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="p-6 sm:p-8 text-center max-w-md mx-4 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-0 shadow-2xl animate-scale-in">
              <div className="relative mb-6">
                <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin mx-auto text-primary" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Membuat Akun...
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Mohon tunggu, sedang memproses pembuatan akun {selectedProtocol.toUpperCase()}
              </p>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="inline-flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/20">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>© 2024 Kedai SSH. Semua hak dilindungi.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
