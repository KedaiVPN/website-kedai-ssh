
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserVPNAccount } from '@/types/vpn';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteAccountDialogProps {
  account: UserVPNAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  account,
  isOpen,
  onClose,
  onConfirm,
  isLoading
}) => {
  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Hapus Akun VPN
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tindakan ini tidak dapat dibatalkan. Akun VPN akan dihapus secara permanen dari server.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h4 className="font-medium">Detail Akun yang akan dihapus:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-medium">{account.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protokol:</span>
                <span className="font-medium">{account.protocol.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Server:</span>
                <span className="font-medium">{account.server_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kedaluwarsa:</span>
                <span className="font-medium">{account.expired_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium ${account.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {account.status === 'active' ? 'Aktif' : 'Kedaluwarsa'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="destructive" 
              onClick={onConfirm} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Trash2 className="w-4 h-4 mr-2 animate-pulse" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Ya, Hapus Akun
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;
