
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserVPNAccount, RenewAccountRequest } from '@/types/vpn';
import { RefreshCw } from 'lucide-react';

interface RenewAccountDialogProps {
  account: UserVPNAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (renewData: RenewAccountRequest) => Promise<void>;
  isLoading: boolean;
}

const RenewAccountDialog: React.FC<RenewAccountDialogProps> = ({
  account,
  isOpen,
  onClose,
  onConfirm,
  isLoading
}) => {
  const [duration, setDuration] = useState(30);

  React.useEffect(() => {
    if (account) {
      setDuration(30); // Reset to default 30 days
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    const renewData: RenewAccountRequest = {
      accountId: account.id,
      duration: duration
    };

    await onConfirm(renewData);
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Perpanjang Akun VPN
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={account.username} disabled />
          </div>

          <div className="space-y-2">
            <Label>Protokol</Label>
            <Input value={account.protocol.toUpperCase()} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Durasi Perpanjangan (Hari)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="365"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              required
            />
          </div>

          {/* Show current settings as read-only info */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Pengaturan Saat Ini (Tidak Berubah):</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Quota:</span>
                <span className="ml-2 font-medium">{account.quota} GB</span>
              </div>
              <div>
                <span className="text-muted-foreground">IP Limit:</span>
                <span className="ml-2 font-medium">{account.ip_limit} perangkat</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Perpanjang Akun'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenewAccountDialog;
