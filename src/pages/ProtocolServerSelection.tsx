
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VPNProtocol, Server, AccountData } from '@/types/vpn';
import { vpnService } from '@/services/vpnService';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Globe, Shield, Users, Wifi, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { AccountFormModal } from '@/components/AccountFormModal';
import { AccountActionDialog } from '@/components/AccountActionDialog';
import { TrialResultModal } from '@/components/TrialResultModal';
import { PROTOCOL_CONFIGS } from '@/constants/protocols';
import { getPingColor, getStatusBadge } from '@/lib/utils';

const ProtocolServerSelection = () => {
  const { protocol } = useParams<{ protocol: string }>();
  const navigate = useNavigate();
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  
  // New states for trial feature
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isTrialLoading, setIsTrialLoading] = useState(false);
  const [trialResult, setTrialResult] = useState<AccountData | null>(null);
  const [showTrialResult, setShowTrialResult] = useState(false);

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
      
      // Sort servers by name alphabetically
      protocolServers.sort((a, b) => a.name.localeCompare(b.name));

      setServers(protocolServers);
    } catch (error) {
      toast.error('Gagal memuat daftar server');
    } finally {
      setIsLoadingServers(false);
    }
  };

  const handleServerSelect = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    // Only allow selection if server is online
    if (server && server.status === 'online') {
      setSelectedServerId(serverId);
      setIsActionDialogOpen(true);
    }
  };

  const handleCreateAccount = () => {
    setIsActionDialogOpen(false);
    setIsModalOpen(true);
  };

  const handleTrialAccount = async (turnstileToken: string) => {
    setIsActionDialogOpen(false);
    setIsTrialLoading(true);
    
    try {
      console.log('Creating trial account for protocol:', currentProtocol, 'server:', selectedServerId);
      const response = await vpnService.createTrialAccount(currentProtocol, parseInt(selectedServerId), turnstileToken);
      
      if (response.success) {
        setTrialResult(response.data);
        setShowTrialResult(true);
        toast.success(response.message);
      } else {
        toast.error(response.message || 'Gagal membuat akun trial');
      }
    } catch (error: any) {
      console.error('Error creating trial account:', error);
      toast.error(error.response?.data?.message || 'Gagal membuat akun trial');
    } finally {
      setIsTrialLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/protokol');
  };

  const handleAccountCreated = () => {
    // Refresh server data to update the counter
    loadServers();
  };

  const getSelectedServerName = () => {
    const server = servers.find(s => s.id === selectedServerId);
    return server ? server.name : '';
  };

  if (!protocolConfig) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative z-10 transition-transform duration-300 overflow-x-hidden">
      <Header />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      <div className={`relative z-10 max-w-4xl mx-auto p-4 sm:p-6 transition-all duration-300 ${isModalOpen || isActionDialogOpen || showTrialResult ? 'blur-sm' : ''}`}>
        {/* Back Button */}
        <div className="mb-4 pt-20">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Pilih Protocol
          </Button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`w-3 h-3 ${protocolConfig.statusColor} rounded-full`}></div>
            <h1 className="text-2xl lg:text-4xl font-bold text-foreground">
              {protocolConfig.title}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {protocolConfig.description}
          </p>
        </div>

        {/* Trial Loading Overlay */}
        {isTrialLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-background p-6 rounded-lg shadow-xl text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">Membuat akun trial...</p>
              <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
            </div>
          </div>
        )}

        {/* Server List */}
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
              {servers.map((server) => {
                const statusBadge = getStatusBadge(server.status);
                const isServerAvailable = server.status === 'online';
                
                return (
                  <Card 
                    key={server.id}
                    className={`p-4 transition-all duration-200 ${
                      isServerAvailable 
                        ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' 
                        : 'opacity-60 cursor-not-allowed'
                    } ${
                      isServerAvailable 
                        ? 'hover:bg-accent/50'
                        : ''
                    }`}
                    onClick={() => isServerAvailable && handleServerSelect(server.id)}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">{server.name}</h3>
                          <Badge 
                            variant={statusBadge.variant}
                            className={`ml-auto lg:ml-0 ${statusBadge.className}`}
                          >
                            {statusBadge.text}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{server.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wifi className="w-4 h-4" />
                            <span className={getPingColor(server.ping)}>{server.ping}ms</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{server.users}/{server.batas_create_akun}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            <span>Protocol: {currentProtocol.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full lg:w-auto"
                        disabled={!isServerAvailable}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isServerAvailable) {
                            handleServerSelect(server.id);
                          }
                        }}
                      >
                        {isServerAvailable ? 'Pilih Server' : statusBadge.text}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Account Action Dialog */}
      <AccountActionDialog
        isOpen={isActionDialogOpen}
        onClose={() => setIsActionDialogOpen(false)}
        onCreateAccount={handleCreateAccount}
        onTrialAccount={handleTrialAccount}
        serverName={getSelectedServerName()}
        protocol={currentProtocol}
      />

      {/* Account Form Modal */}
      <AccountFormModal
        protocol={currentProtocol}
        serverId={selectedServerId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccountCreated={handleAccountCreated}
      />

      {/* Trial Result Modal */}
      <TrialResultModal
        isOpen={showTrialResult}
        onClose={() => {
          setShowTrialResult(false);
          setTrialResult(null);
        }}
        accountData={trialResult}
        protocol={currentProtocol}
      />
    </div>
  );
};

export default ProtocolServerSelection;
