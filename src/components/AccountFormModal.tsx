
import { useState } from 'react';
import { VPNProtocol, AccountData, CreateAccountRequest } from '@/types/vpn';
import { vpnService } from '@/services/vpnService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AccountForm } from '@/components/AccountForm';
import { AccountResult } from '@/components/AccountResult';
import { toast } from 'sonner';

interface AccountFormModalProps {
  protocol: VPNProtocol;
  serverId: string;
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated?: () => void;
}

export const AccountFormModal = ({ protocol, serverId, isOpen, onClose, onAccountCreated }: AccountFormModalProps) => {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountResult, setAccountResult] = useState<AccountData | null>(null);
  const [showResult, setShowResult] = useState(false);

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
        protocol: protocol,
        duration: formData.duration,
        quota: formData.quota,
        ipLimit: formData.ipLimit,
        serverId: serverId
      };

      const result = await vpnService.createAccount(request);
      
      if (result.success && result.data) {
        setAccountResult(result.data);
        setShowResult(true);
        toast.success(result.message);
        
        // Trigger callback to refresh server data after successful account creation
        if (onAccountCreated) {
          onAccountCreated();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat membuat akun');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleClose = () => {
    setAccountResult(null);
    setShowResult(false);
    onClose();
  };

  const handleCreateNew = () => {
    setAccountResult(null);
    setShowResult(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            {showResult ? (
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                🌟 Akun {protocol.toUpperCase()} Premium
              </span>
            ) : (
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Konfigurasi Akun {protocol.toUpperCase()}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showResult ? (
            <AccountForm
              protocol={protocol}
              onSubmit={handleAccountCreate}
              isLoading={isCreatingAccount}
            />
          ) : accountResult ? (
            <div className="space-y-4">
              <AccountResult
                accountData={accountResult}
                protocol={protocol}
              />
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreateNew}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Buat Akun Baru
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
