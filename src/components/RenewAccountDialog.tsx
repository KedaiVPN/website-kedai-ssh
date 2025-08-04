
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
  const [formData, setFormData] = useState({
    duration: 30,
    quota: 50,
    ip_limit: 1
  });

  React.useEffect(() => {
    if (account) {
      setFormData({
        duration: 30,
        quota: account.quota || 50,
        ip_limit: account.ip_limit || 1
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    const renewData: RenewAccountRequest = {
      accountId: account.id,
      duration: formData.duration,
      ip_limit: formData.ip_limit,
      ...(account.protocol !== 'ssh' && { quota: formData.quota })
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
            <Label htmlFor="duration">Durasi (Hari)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="365"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              required
            />
          </div>

          {account.protocol !== 'ssh' && (
            <div className="space-y-2">
              <Label htmlFor="quota">Quota (GB)</Label>
              <Input
                id="quota"
                type="number"
                min="1"
                max="1000"
                value={formData.quota}
                onChange={(e) => setFormData(prev => ({ ...prev, quota: parseInt(e.target.value) }))}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ip_limit">Batas IP</Label>
            <Input
              id="ip_limit"
              type="number"
              min="1"
              max="10"
              value={formData.ip_limit}
              onChange={(e) => setFormData(prev => ({ ...prev, ip_limit: parseInt(e.target.value) }))}
              required
            />
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
