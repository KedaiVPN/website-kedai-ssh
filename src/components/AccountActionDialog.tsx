
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, Gift } from 'lucide-react';

interface AccountActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  onTrialAccount: () => void;
  serverName: string;
  protocol: string;
}

export const AccountActionDialog = ({
  isOpen,
  onClose,
  onCreateAccount,
  onTrialAccount,
  serverName,
  protocol
}: AccountActionDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Pilih Jenis Akun
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Server: {serverName} • Protocol: {protocol.toUpperCase()}
          </p>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Card 
            className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary"
            onClick={onCreateAccount}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Create Account</h3>
                <p className="text-sm text-muted-foreground">
                  Buat akun premium dengan durasi custom
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-green-500"
            onClick={onTrialAccount}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-700 dark:text-green-400">Trial Account</h3>
                <p className="text-sm text-muted-foreground">
                  Coba gratis tanpa memotong saldo
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
