
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AccountData, VPNProtocol } from '@/types/vpn';
import { AccountResult } from '@/components/AccountResult';
import { Gift } from 'lucide-react';

interface TrialResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountData: AccountData | null;
  protocol: VPNProtocol;
}

export const TrialResultModal = ({
  isOpen,
  onClose,
  accountData,
  protocol
}: TrialResultModalProps) => {
  if (!accountData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
            Trial Account {protocol.toUpperCase()}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Akun trial ini gratis dan tidak memotong saldo Anda
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-400">Trial Account</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Ini adalah akun trial gratis. Akun ini tidak disimpan di dashboard dan tidak mempengaruhi statistik akun Anda.
            </p>
          </div>

          <AccountResult accountData={accountData} protocol={protocol} />
        </div>

        <div className="flex justify-center pt-4">
          <Button onClick={onClose} className="min-w-[120px]">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
