import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Crown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionDetails {
  reference: string;
  amountNet: number;
  amountGross: number;
  paymentMethod: string;
  newRole?: string; // This might not be directly in the transaction object but inferred from newToken
  newToken?: string | null;
  status: string;
}

const TopupSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transaction } = (location.state || {}) as { transaction?: TransactionDetails };

  React.useEffect(() => {
    if (!transaction) {
      toast.error("Detail transaksi tidak ditemukan.");
      navigate('/topup');
    }
  }, [transaction, navigate]);

  const formatRupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (!transaction) {
    // This is a fallback while the redirect is happening.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="ml-4 text-muted-foreground">Mengarahkan kembali...</p>
      </div>
    );
  }

  const hasRoleUpgraded = !!transaction.newToken;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
            Topup Berhasil!
          </CardTitle>
          <CardDescription className="text-base">
            Pembayaran Anda telah berhasil diproses. Saldo Anda telah diperbarui.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg border text-sm space-y-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h4 className="font-medium mb-2 border-b pb-2">Detail Transaksi</h4>
            <div className="flex justify-between"><span className="text-muted-foreground">Referensi:</span> <span className="font-mono">{transaction.reference}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Dibayar:</span> <span className="font-semibold">{formatRupiah(transaction.amountGross)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Saldo Masuk:</span> <span className="font-semibold">{formatRupiah(transaction.amountNet)}</span></div>
            {hasRoleUpgraded && (
              <div className="flex justify-between"><span className="text-muted-foreground">Role Baru:</span> <span className="font-bold text-primary">Reseller</span></div>
            )}
          </div>

          {hasRoleUpgraded ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h4 className="font-bold text-yellow-800 dark:text-yellow-200">UPGRADE ROLE BERHASIL!</h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Anda mendapatkan diskon produk KEDAI SSH hingga 50%.</p>
            </div>
          ) : (
            <p className="text-sm text-center text-muted-foreground">Saldo anda sudah bertambah.</p>
          )}

          <Button onClick={() => navigate('/dashboard')} className="w-full h-12 text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300">
            Lanjut ke Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopupSuccess;
