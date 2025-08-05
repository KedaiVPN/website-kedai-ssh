
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserVPNAccount } from '@/types/vpn';
import { Trash2, AlertTriangle, RefreshCw, Coins, Calculator } from 'lucide-react';
import { getDailyPrice, formatRupiah } from '@/constants/pricing';
import { balanceService } from '@/services/balanceService';
import { toast } from 'sonner';

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
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch user balance when dialog opens
  useEffect(() => {
    if (isOpen && account) {
      fetchUserBalance();
    }
  }, [isOpen, account]);

  const fetchUserBalance = async () => {
    setLoadingBalance(true);
    try {
      const response = await balanceService.getBalance();
      setUserBalance(response.balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      toast.error('Gagal memuat saldo');
    } finally {
      setLoadingBalance(false);
    }
  };

  if (!account) return null;

  // Calculate refund
  const expiredDate = new Date(account.expired_date);
  const now = new Date();
  const remainingDays = Math.max(0, Math.ceil((expiredDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const dailyPrice = getDailyPrice(account.ip_limit);
  const refundAmount = remainingDays * dailyPrice;
  const balanceAfterRefund = userBalance + refundAmount;

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

          {/* Refund Calculation */}
          {remainingDays > 0 && refundAmount > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Perhitungan Refund
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sisa masa aktif:</span>
                  <span className="font-medium">{remainingDays} hari</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga per hari:</span>
                  <span className="font-medium">{formatRupiah(dailyPrice)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t">
                  <span>Refund:</span>
                  <span className="text-green-600 dark:text-green-400">{formatRupiah(refundAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Balance Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Informasi Saldo
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo saat ini:</span>
                <span className="font-medium">
                  {loadingBalance ? 'Loading...' : formatRupiah(userBalance)}
                </span>
              </div>
              {refundAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refund:</span>
                    <span className="font-medium text-green-600">{formatRupiah(refundAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t">
                    <span>Saldo setelah refund:</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatRupiah(balanceAfterRefund)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* No Refund Info */}
          {remainingDays <= 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Akun ini sudah kedaluwarsa, tidak ada refund yang akan diberikan.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="destructive" 
              onClick={onConfirm} 
              disabled={isLoading || loadingBalance}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Ya, Hapus Akun{refundAmount > 0 ? ' & Refund' : ''}
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
