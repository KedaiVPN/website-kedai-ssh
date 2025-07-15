import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VPNProtocol, Server, AccountData, CreateAccountRequest } from '@/types/vpn';
import { vpnService } from '@/services/vpnService';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Users, Wifi, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { AccountForm } from '@/components/AccountForm';
import { AccountResult } from '@/components/AccountResult';
import { useSidebar } from '@/contexts/SidebarContext';

// Protocol configurations
const PROTOCOL_CONFIGS = {
  ssh: { 
    title: 'SSH Servers', 
    description: 'Secure Shell tunneling dengan enkripsi tinggi',
    color: 'bg-blue-500'
  },
  vmess: { 
    title: 'VMess Servers', 
    description: 'V2Ray protocol dengan performa optimal',
    color: 'bg-green-500'
  },
  vless: { 
    title: 'VLESS Servers', 
    description: 'V2Ray protocol ringan dan cepat',
    color: 'bg-purple-500'
  },
  trojan: { 
    title: 'Trojan Servers', 
    description: 'Protocol dengan kamuflase HTTPS',
    color: 'bg-red-500'
  }
};

const ProtocolServerSelection = () => {
  const { protocol } = useParams<{ protocol: string }>();
  const navigate = useNavigate();
  const { isMenuOpen } = useSidebar();
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [currentStep, setCurrentStep] = useState<'server' | 'form' | 'result'>('server');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountResult, setAccountResult] = useState<AccountData | null>(null);

  // Extract protocol from URL parameter (remove 'server-' prefix)
  const currentProtocol = protocol?.replace('server-', '') as VPNProtocol;
  
  // Get protocol config
  const protocolConfig = PROTOCOL_CONFIGS[currentProtocol];

  useEffect(() => {
    // Redirect if invalid protocol
    if (!protocolConfig) {
      navigate('/protokol');
      return;
    }
    loadServers();
  }, [currentProtocol, protocolConfig, navigate]);

  const loadServers = async () => {
    setIsLoadingServers(true);
    try {
      const serverList = await vpnService.getServers();
      // Filter servers for the specific protocol
      const protocolServers = serverList.filter(server => 
        server.protocols.includes(currentProtocol)
      );
      setServers(protocolServers);
      
      if (protocolServers.length > 0) {
        setSelectedServerId(protocolServers.find(s => s.status === 'online')?.id || protocolServers[0].id);
      }
    } catch (error) {
      toast.error('Gagal memuat daftar server');
    } finally {
      setIsLoadingServers(false);
    }
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
        protocol: currentProtocol,
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

  const handleBack = () => {
    switch (currentStep) {
      case 'form':
        setCurrentStep('server');
        break;
      case 'result':
        setCurrentStep('form');
        break;
      default:
        navigate('/protokol');
    }
  };

  const handleReset = () => {
    setAccountResult(null);
    setSelectedServerId('');
    setCurrentStep('server');
  };

  if (!protocolConfig) {
    return null; // Will redirect in useEffect
  }

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
        {/* Back Button */}
        <div className="mb-4 pt-20">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 'server' ? 'Kembali ke Pilih Protocol' : 'Kembali'}
          </Button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`w-3 h-3 ${protocolConfig.color} rounded-full`}></div>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
              {protocolConfig.title}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {protocolConfig.description}
          </p>
        </div>

        {/* Content based on current step */}
        {currentStep === 'server' && (
          <div className="space-y-6">
            {isLoadingServers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Memuat server...</p>
              </div>
            ) : servers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Tidak ada server tersedia untuk protocol {currentProtocol.toUpperCase()}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {servers.map((server) => (
                  <Card 
                    key={server.id}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                      selectedServerId === server.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleServerSelect(server.id)}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">{server.name}</h3>
                          <Badge 
                            variant={server.status === 'online' ? 'default' : 'destructive'}
                            className="ml-auto sm:ml-0"
                          >
                            {server.status === 'online' ? 'Online' : 'Maintenance'}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{server.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wifi className="w-4 h-4" />
                            <span>{server.ping}ms</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{server.users} users</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Protocol: {currentProtocol.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full sm:w-auto"
                        disabled={server.status !== 'online'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServerSelect(server.id);
                        }}
                      >
                        {server.status === 'online' ? 'Pilih Server' : 'Maintenance'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 'form' && (
          <AccountForm
            protocol={currentProtocol}
            onSubmit={handleAccountCreate}
            isLoading={isCreatingAccount}
          />
        )}

        {currentStep === 'result' && accountResult && (
          <AccountResult
            accountData={accountResult}
            protocol={currentProtocol}
          />
        )}
      </div>
    </div>
  );
};

export default ProtocolServerSelection;