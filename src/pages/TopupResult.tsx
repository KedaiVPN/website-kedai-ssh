import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Crown, AlertTriangle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { topupService } from '@/services/topupService';

// Define a type for the transaction details we expect from the navigation state
interface TransactionDetails {
  reference: string;
  amountNet: number;
  amountGross: number;
  paymentMethod: string;
  newToken?: string | null;
  status: 'success' | 'expired' | 'failed' | 'refunded' | 'pending';
}

// Configuration for each status
const statusConfig = {
  success: {
    Icon: CheckCircle,
    iconClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    title: 'Topup Berhasil!',
    description: 'Pembayaran Anda telah berhasil diproses. Saldo Anda telah diperbarui.',
    buttonText: 'Lanjut ke Dashboard',
    buttonAction: (navigate: Function) => navigate('/dashboard'),
  },
  failed: {
    Icon: XCircle,
    iconClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    title: 'Topup Gagal',
    description: 'Pembayaran Anda tidak berhasil diproses. Silakan coba lagi.',
    buttonText: 'Coba Lagi',
    buttonAction: (navigate: Function) => navigate('/topup'),
  },
  expired: {
    Icon: AlertTriangle,
    iconClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    title: 'Waktu Habis',
    description: 'Waktu untuk pembayaran telah habis. Silakan buat transaksi baru.',
    buttonText: 'Coba Lagi',
    buttonAction: (navigate: Function) => navigate('/topup'),
  },
  refunded: {
    Icon: RefreshCw,
    iconClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    title: 'Dana Dikembalikan',
    description: 'Transaksi ini telah dikembalikan. Saldo Anda telah disesuaikan.',
    buttonText: 'Lihat Riwayat',
    buttonAction: (navigate: Function) => navigate('/profile'), // Or wherever history is
  },
  pending: { // Fallback for unexpected cases
    Icon: AlertTriangle,
    iconClass: 'text-gray-600 dark:text-gray-400',
    bgClass: 'bg-gray-100 dark:bg-gray-900/30',
    title: 'Status Belum Dikonfirmasi',
    description: 'Status transaksi Anda sedang diperiksa. Mohon tunggu sebentar.',
    buttonText: 'Kembali',
    buttonAction: (navigate: Function) => navigate('/topup'),
  }
};

const TopupResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [transaction, setTransaction] = React.useState<TransactionDetails | undefined>(
    (location.state as { transaction?: TransactionDetails })?.transaction
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const hasFetched = React.useRef(false);

  React.useEffect(() => {
    const checkStatus = async () => {
        // If we already have transaction data, don't fetch.
        if (transaction) return;

        // If we already tried fetching, don't try again (unless we want to poll, but for now just one-off check on mount)
        if (hasFetched.current) return;

        const searchParams = new URLSearchParams(location.search);
        // Tripay might return 'reference' or 'merchant_ref'. Midtrans uses 'order_id'.
        // We prioritize 'reference', then 'merchant_ref', then 'order_id'.
        const reference = searchParams.get('reference');
        const merchantRef = searchParams.get('merchant_ref');
        const orderIdParam = searchParams.get('order_id');

        const transactionRef = reference || merchantRef || orderIdParam;

        if (transactionRef) {
            hasFetched.current = true;
            setIsLoading(true);
            try {
                const response = await topupService.getTransactionStatus(transactionRef);
                if (response.success && response.data) {
                    const data = response.data;
                    const statusStr = data.status.toLowerCase();
                    let status: TransactionDetails['status'] = 'pending';

                    if (statusStr === 'success' || statusStr === 'paid') status = 'success';
                    else if (statusStr === 'failed') status = 'failed';
                    else if (statusStr === 'expired') status = 'expired';
                    else if (statusStr === 'refunded') status = 'refunded';

                    const details: TransactionDetails = {
                        reference: data.reference,
                        amountNet: data.amountNet || 0,
                        amountGross: data.amountGross || 0,
                        paymentMethod: data.paymentMethod || 'Unknown',
                        newToken: data.newToken,
                        status: status
                    };
                    setTransaction(details);
                } else {
                    toast.error("Gagal memuat status transaksi.");
                    navigate('/topup');
                }
            } catch (error) {
                console.error("Error checking status:", error);
                toast.error("Terjadi kesalahan saat memuat status.");
                navigate('/topup');
            } finally {
                setIsLoading(false);
            }
        } else {
            // No transaction state and no reference param
            toast.error("Detail transaksi tidak ditemukan.");
            navigate('/topup');
        }
    };

    checkStatus();
  }, [location.search, navigate, transaction]);

  const formatRupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Memeriksa status pembayaran...</p>
            </Card>
        </div>
      );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="ml-4 text-muted-foreground">Mengarahkan kembali...</p>
      </div>
    );
  }

  const config = statusConfig[transaction.status] || statusConfig.pending;
  const hasRoleUpgraded = transaction.status === 'success' && !!transaction.newToken;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${config.bgClass}`}>
            <config.Icon className={`w-8 h-8 ${config.iconClass}`} />
          </div>
          <CardTitle className={`text-2xl font-bold ${config.iconClass}`}>{config.title}</CardTitle>
          <CardDescription className="text-base text-muted-foreground">{config.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg border text-sm space-y-2 bg-muted/50 dark:bg-muted/20">
            <h4 className="font-medium mb-2 border-b pb-2">Detail Transaksi</h4>
            <div className="flex justify-between"><span className="text-muted-foreground">Referensi:</span> <span className="font-mono">{transaction.reference}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Bayar:</span> <span className="font-semibold">{formatRupiah(transaction.amountGross)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Jumlah Topup:</span> <span className="font-semibold">{formatRupiah(transaction.amountNet)}</span></div>
            {hasRoleUpgraded && (
              <div className="flex justify-between"><span className="text-muted-foreground">Role Baru:</span> <span className="font-bold text-primary">Reseller</span></div>
            )}
          </div>

          {hasRoleUpgraded && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h4 className="font-bold text-yellow-800 dark:text-yellow-200">UPGRADE ROLE BERHASIL!</h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Anda mendapatkan diskon produk KEDAI SSH hingga 50%.</p>
            </div>
          )}

          <Button onClick={() => config.buttonAction(navigate)} className="w-full h-12 text-base">
            {config.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopupResult;
