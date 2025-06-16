
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
import { Loader2, RefreshCw, Shield, Sparkles } from 'lucide-react';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'protocol' | 'server' | 'form' | 'result'>('protocol');
  const [selectedProtocol, setSelectedProtocol] = useState<VPNProtocol>('ssh');
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountResult, setAccountResult] = useState<AccountData | null>(null);

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

  const handleProtocolSelect = (protocol: VPNProtocol) => {
    setSelectedProtocol(protocol);
    setCurrentStep('server');
  };

  const handleServerSelect = (serverId: string) => {
    setSelectedServerId(serverId);
    setCurrentStep('form');
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
        setCurrentStep('result');
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
    setCurrentStep('protocol');
    setAccountResult(null);
    setSelectedProtocol('ssh');
    setSelectedServerId('');
  };

  const steps = [
    { id: 'protocol', title: 'Pilih Protocol' },
    { id: 'server', title: 'Pilih Server' },
    { id: 'form', title: 'Konfigurasi' },
    { id: 'result', title: 'Hasil' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 transition-all duration-300">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-start mb-12">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Shield className="h-12 w-12 text-primary animate-pulse" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-3">
              VPN Creator Pro
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Platform premium untuk membuat akun VPN dengan protokol SSH, VMess, VLESS, dan Trojan
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Progress Steps */}
        <Card className="p-6 mb-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      index <= currentStepIndex
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium transition-colors ${
                      index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </span>
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

        {/* Content */}
        <div className="space-y-8">
          {currentStep === 'protocol' && (
            <Card className="p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
              <ProtocolSelector
                selectedProtocol={selectedProtocol}
                onProtocolChange={handleProtocolSelect}
              />
            </Card>
          )}

          {currentStep === 'server' && (
            <Card className="p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
              <div className="space-y-6">
                <ServerSelector
                  servers={servers}
                  selectedServerId={selectedServerId}
                  onServerChange={handleServerSelect}
                  isLoading={isLoadingServers}
                />
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setCurrentStep('protocol')} className="hover:scale-105 transition-transform">
                    Kembali
                  </Button>
                  <Button onClick={loadServers} variant="outline" size="default" className="hover:scale-105 transition-transform">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Server
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {currentStep === 'form' && (
            <Card className="p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
              <div className="space-y-6">
                <AccountForm
                  protocol={selectedProtocol}
                  onSubmit={handleAccountCreate}
                  isLoading={isCreatingAccount}
                />
                <Button variant="outline" onClick={() => setCurrentStep('server')} className="hover:scale-105 transition-transform">
                  Kembali
                </Button>
              </div>
            </Card>
          )}

          {currentStep === 'result' && accountResult && (
            <Card className="p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
              <div className="space-y-6">
                <AccountResult
                  accountData={accountResult}
                  protocol={selectedProtocol}
                />
                <div className="flex space-x-3">
                  <Button onClick={handleReset} className="flex-1 hover:scale-105 transition-transform bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    Buat Akun Baru
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep('form')} className="hover:scale-105 transition-transform">
                    Kembali
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Loading Overlay */}
        {isCreatingAccount && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="p-8 text-center max-w-md mx-4 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-0 shadow-2xl">
              <div className="relative mb-6">
                <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Membuat Akun...
              </h3>
              <p className="text-muted-foreground">
                Mohon tunggu, sedang memproses pembuatan akun {selectedProtocol.toUpperCase()}
              </p>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
            <Shield className="h-4 w-4" />
            <span>© 2024 VPN Creator Pro. Semua hak dilindungi.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
