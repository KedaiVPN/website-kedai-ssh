import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Turnstile } from '@marsidev/react-turnstile';
import { CreditCard, Gift } from 'lucide-react';
import { toast } from 'sonner';

const TURNSTILE_SITE_KEY = '0x4AAAAAAB66StA9s_iEIAj1';

interface AccountActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  onTrialAccount: (turnstileToken: string) => void;
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
  const [showTrialCaptcha, setShowTrialCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const handleTrialClick = () => {
    setShowTrialCaptcha(true);
  };

  const handleTrialConfirm = () => {
    if (!turnstileToken) {
      toast.error('Harap selesaikan verifikasi captcha');
      return;
    }
    onTrialAccount(turnstileToken);
    setShowTrialCaptcha(false);
    setTurnstileToken('');
  };

  const handleClose = () => {
    setShowTrialCaptcha(false);
    setTurnstileToken('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {showTrialCaptcha ? 'Verifikasi Captcha' : 'Pilih Jenis Akun'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Server: {serverName} • Protocol: {protocol.toUpperCase()}
          </p>
        </DialogHeader>
        
        {showTrialCaptcha ? (
          <div className="py-4 space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Selesaikan verifikasi captcha untuk membuat akun trial
            </p>
            <div className="flex justify-center">
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setTurnstileToken}
                onError={() => setTurnstileToken('')}
                onExpire={() => setTurnstileToken('')}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowTrialCaptcha(false);
                  setTurnstileToken('');
                }}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button 
                onClick={handleTrialConfirm}
                disabled={!turnstileToken}
                className="flex-1"
              >
                Lanjutkan
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <Card 
                className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary"
                onClick={onCreateAccount}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-700 dark:text-purple-400">Create Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Buat akun premium dengan durasi custom
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-green-500"
                onClick={handleTrialClick}
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
              <Button variant="outline" onClick={handleClose}>
                Batal
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
