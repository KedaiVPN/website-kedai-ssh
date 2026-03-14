import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { xlService, type XLTransaction } from '@/services/xlService';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function XLHistory() {
  const [transactions, setTransactions] = useState<XLTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await xlService.getTransactions();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat riwayat pembelian');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    let interval: any;
    // Set up polling for pending transactions
    if (transactions.some(t => t.status === 'pending')) {
      interval = setInterval(() => {
        fetchHistory();
      }, 5000); // 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [transactions]); // Depend on transactions to start/stop polling

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Sukses</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-100 dark:bg-yellow-900/20">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Gagal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Riwayat Pembelian</CardTitle>
          <CardDescription>Daftar pembelian paket langsung maupun terjadwal</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchHistory} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && transactions.length === 0 ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">Belum ada riwayat pembelian</div>
        ) : (
          <div className="space-y-4">
            {transactions.map((trx) => (
              <div key={trx.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg gap-2">
                <div>
                  <div className="font-medium">{trx.package_name}</div>
                  <div className="text-sm text-muted-foreground">Nomor: {trx.phone}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(trx.created_at).toLocaleString('id-ID')}
                  </div>
                  {trx.trx_id && (
                    <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded mt-1 inline-block">
                      TrxID: {trx.trx_id}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="font-semibold text-lg">Rp{trx.fee.toLocaleString()}</div>
                  {getStatusBadge(trx.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
