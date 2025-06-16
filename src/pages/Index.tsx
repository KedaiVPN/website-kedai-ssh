
import { useState, useEffect } from 'react';
import { VPNProtocol, Server, AccountData, CreateAccountRequest } from '@/types/vpn';
import { vpnService } from '@/services/vpnService';
import { ProtocolSelector } from '@/components/ProtocolSelector';
import { ServerSelector } from '@/components/ServerSelector';
import { AccountForm } from '@/components/AccountForm';
import { AccountResult } from '@/components/AccountResult';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';

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
        userId: 'user-123', // In real app, this would come from authentication
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌟 VPN Account Creator Pro
          </h1>
          <p className="text-gray-600">
            Buat akun VPN premium dengan protokol SSH, VMess, VLESS, dan Trojan
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Content */}
        <div className="space-y-6">
          {currentStep === 'protocol' && (
            <ProtocolSelector
              selectedProtocol={selectedProtocol}
              onProtocolChange={handleProtocolSelect}
            />
          )}

          {currentStep === 'server' && (
            <div className="space-y-4">
              <ServerSelector
                servers={servers}
                selectedServerId={selectedServerId}
                onServerChange={handleServerSelect}
                isLoading={isLoadingServers}
              />
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setCurrentStep('protocol')}>
                  Kembali
                </Button>
                <Button onClick={loadServers} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Server
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'form' && (
            <div className="space-y-4">
              <AccountForm
                protocol={selectedProtocol}
                onSubmit={handleAccountCreate}
                isLoading={isCreatingAccount}
              />
              <Button variant="outline" onClick={() => setCurrentStep('server')}>
                Kembali
              </Button>
            </div>
          )}

          {currentStep === 'result' && accountResult && (
            <div className="space-y-4">
              <AccountResult
                accountData={accountResult}
                protocol={selectedProtocol}
              />
              <div className="flex space-x-2">
                <Button onClick={handleReset} className="flex-1">
                  Buat Akun Baru
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep('form')}>
                  Kembali
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isCreatingAccount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Membuat Akun...</h3>
              <p className="text-muted-foreground">
                Mohon tunggu, sedang memproses pembuatan akun {selectedProtocol.toUpperCase()}
              </p>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© 2024 VPN Account Creator Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
