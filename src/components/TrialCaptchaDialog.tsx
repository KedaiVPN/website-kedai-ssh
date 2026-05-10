import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Turnstile } from '@marsidev/react-turnstile';
import { toast } from 'sonner';

const TURNSTILE_SITE_KEY = '0x4AAAAAAB66StA9s_iEIAj1';

interface TrialCaptchaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (turnstileToken: string) => void;
  serverName: string;
  protocol: string;
}

export const TrialCaptchaDialog = ({
  isOpen,
  onClose,
  onConfirm,
  serverName,
  protocol
}: TrialCaptchaDialogProps) => {
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const handleConfirm = () => {
    if (!turnstileToken) {
      toast.error('Harap selesaikan verifikasi captcha');
      return;
    }
    onConfirm(turnstileToken);
    setTurnstileToken('');
  };

  const handleClose = () => {
    setTurnstileToken('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Verifikasi Captcha</DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Server: {serverName} • Protocol: {protocol.toUpperCase()}
          </p>
        </DialogHeader>

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
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleConfirm} disabled={!turnstileToken} className="flex-1">
              Lanjutkan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
