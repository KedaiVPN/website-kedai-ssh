
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserVPNAccount, RenewAccountRequest } from '@/types/vpn';
import { RefreshCw, Wallet, Calculator, AlertTriangle, Crown } from 'lucide-react';
import { calculateTotalCost, formatRupiah, getDailyPrice } from '@/constants/pricing';
import { balanceService } from '@/services/balanceService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const userRole = user?.role || 'member';
  const [duration, setDuration] = useState(30);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch user balance when dialog opens
  useEffect(() => {
    if (isOpen && account) {
      fetchUserBalance();
      setDuration(30); // Reset to default 30 days
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

  // Calculate costs with user role
  const dailyPrice = getDailyPrice(account.ip_limit, userRole);
  const totalCost = calculateTotalCost(account.ip_limit, duration, userRole);
  const remainingBalance = userBalance - totalCost;
  const isBalanceSufficient = userBalance >= totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !isBalanceSufficient) return;

    const renewData: RenewAccountRequest = {
      accountId: account.id,
      duration: duration
    };

    await onConfirm(renewData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Perpanjang Akun VPN
            {userRole === 'reseller' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full border border-yellow-300 dark:border-yellow-700">
                <Crown className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">RESELLER</span>
              </div>
            )}
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
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          {/* Cost Calculation */}
          <div className={`bg-gradient-to-r ${
            userRole === 'reseller' 
              ? 'from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800' 
              : 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800'
          } p-4 rounded-lg border`}>
            <h4 className={`text-sm font-medium ${
              userRole === 'reseller' 
                ? 'text-yellow-700 dark:text-yellow-300' 
                : 'text-blue-700 dark:text-blue-300'
            } mb-3 flex items-center gap-2`}>
              {userRole === 'reseller' ? <Crown className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
              {userRole === 'reseller' ? 'Perhitungan Biaya Reseller' : 'Perhitungan Biaya'}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harga per hari:</span>
                <span className="font-medium">{formatRupiah(dailyPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durasi:</span>
                <span className="font-medium">{duration} hari</span>
              </div>
              {userRole === 'reseller' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diskon Reseller:</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">50%</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-2 border-t">
                <span>Total Biaya:</span>
                <span className={`${
                  userRole === 'reseller' 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {formatRupiah(totalCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Informasi Saldo
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo saat ini:</span>
                <span className="font-medium">
                  {loadingBalance ? 'Loading...' : formatRupiah(userBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total biaya:</span>
                <span className="font-medium">{formatRupiah(totalCost)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t">
                <span>Sisa saldo:</span>
                <span className={`${isBalanceSufficient ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatRupiah(remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {!isBalanceSufficient && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Saldo tidak mencukupi untuk perpanjangan ini. Anda membutuhkan tambahan {formatRupiah(totalCost - userBalance)}.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Account Settings */}
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
            <Button 
              type="submit" 
              disabled={isLoading || !isBalanceSufficient || loadingBalance} 
              className={`flex-1 ${
                userRole === 'reseller' 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700' 
                  : ''
              }`}
            >
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
