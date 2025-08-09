
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { topupService } from '@/services/topupService';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import dayjs from 'dayjs';

const TopupSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const merchantRef = searchParams.get('merchant_ref');

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!merchantRef) {
        toast({
          title: 'Error',
          description: 'Transaction reference not found',
          variant: 'destructive'
        });
        navigate('/topup');
        return;
      }

      try {
        // Get transaction history and find the matching transaction
        const result = await topupService.getTopupHistory(50);
        if (result.success && result.data) {
          const foundTransaction = result.data.find(
            (tx: any) => tx.duitku_merchant_order_id === merchantRef
          );
          
          if (foundTransaction) {
            setTransaction(foundTransaction);
          } else {
            throw new Error('Transaction not found');
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch transaction details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load transaction details',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [merchantRef, navigate, toast]);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Berhasil
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-muted-foreground">Memuat detail transaksi...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Topup Berhasil!
            </h1>
            <p className="text-gray-600">
              Saldo Anda telah berhasil ditambahkan
            </p>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Detail Transaksi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {transaction ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Jumlah Topup:</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatRupiah(transaction.amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    {getStatusBadge(transaction.status)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Metode Pembayaran:</span>
                    <span className="font-medium">{transaction.payment_method}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Referensi:</span>
                    <span className="font-mono text-sm">{transaction.duitku_reference}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tanggal:</span>
                    <span>{dayjs(transaction.created_at).format('DD MMM YYYY, HH:mm')}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Detail transaksi tidak ditemukan</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              onClick={() => navigate('/dashboard')}
              className="flex-1"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Button>
            <Button
              onClick={() => navigate('/topup')}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Topup Lagi
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TopupSuccess;
