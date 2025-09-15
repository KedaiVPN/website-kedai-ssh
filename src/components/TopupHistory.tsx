import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { topupService, TopupTransaction } from '@/services/topupService';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

const TopupHistory = () => {
  const [transactions, setTransactions] = useState<TopupTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const result = await topupService.getTopupHistory(10);
      if (result.success && result.data) {
        setTransactions(result.data);
      }
    } catch (error: any) {
      console.error('Failed to load topup history:', error);
      toast.error('Error', {
        description: 'Failed to load topup history',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Berhasil
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Gagal
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Topup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Topup</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Belum ada riwayat topup</div>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {formatRupiah(transaction.amount)}
                        </span>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.payment_method || 'Tripay'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {dayjs(transaction.created_at).format('DD MMM YYYY, HH:mm')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ref: {transaction.duitku_reference}
                      </div>
                    </div>
                  </div>
                  {index < transactions.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TopupHistory;
