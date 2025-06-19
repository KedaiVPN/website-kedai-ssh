
import { VPNProtocol, Server, AccountData } from '@/types/vpn';
import { ProtocolSelector } from '@/components/ProtocolSelector';
import { ServerSelector } from '@/components/ServerSelector';
import { AccountForm } from '@/components/AccountForm';
import { AccountResult } from '@/components/AccountResult';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface StepContentProps {
  currentStep: 'protocol' | 'server' | 'form' | 'result';
  selectedProtocol: VPNProtocol;
  servers: Server[];
  selectedServerId: string;
  isLoadingServers: boolean;
  isCreatingAccount: boolean;
  accountResult: AccountData | null;
  isTransitioning: boolean;
  onProtocolSelect: (protocol: VPNProtocol) => void;
  onServerSelect: (serverId: string) => void;
  onAccountCreate: (formData: {
    username: string;
    password?: string;
    duration: number;
    quota?: number;
    ipLimit: number;
  }) => void;
  onBack: () => void;
  onReset: () => void;
  onLoadServers: () => void;
}

export const StepContent = ({
  currentStep,
  selectedProtocol,
  servers,
  selectedServerId,
  isLoadingServers,
  isCreatingAccount,
  accountResult,
  isTransitioning,
  onProtocolSelect,
  onServerSelect,
  onAccountCreate,
  onBack,
  onReset,
  onLoadServers
}: StepContentProps) => {
  return (
    <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      {currentStep === 'protocol' && (
        <Card className="p-4 sm:p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
          <ProtocolSelector
            selectedProtocol={selectedProtocol}
            onProtocolChange={onProtocolSelect}
          />
        </Card>
      )}

      {currentStep === 'server' && (
        <Card className="p-4 sm:p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
          <div className="space-y-6">
            <ServerSelector
              servers={servers}
              selectedServerId={selectedServerId}
              onServerChange={onServerSelect}
              isLoading={isLoadingServers}
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={onBack} 
                className="flex items-center justify-center hover:scale-105 transition-transform order-2 sm:order-1"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <Button 
                onClick={onLoadServers} 
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
              onSubmit={onAccountCreate}
              isLoading={isCreatingAccount}
            />
            <Button 
              variant="outline" 
              onClick={onBack} 
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
                onClick={onReset} 
                className="flex-1 hover:scale-105 transition-transform bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4 mr-2" />
                Buat Akun Baru
              </Button>
              <Button 
                variant="outline" 
                onClick={onBack} 
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
  );
};
