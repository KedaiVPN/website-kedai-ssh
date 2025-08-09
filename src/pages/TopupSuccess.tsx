
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ArrowLeft, CreditCard, Clock, AlertCircle } from 'lucide-react';
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
  const [statusMessage, setStatusMessage] = useState('');
  const [pollingAttempts, setPollingAttempts] = useState(0);

  const reference = searchParams.get('reference');
  const merchantRef = searchParams.get('merchant_ref');

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      // If no parameters provided, show friendly message
      if (!reference && !merchantRef) {
        setStatusMessage('Detail transaksi tidak tersedia');
        setIsLoading(false);
        return;
      }

      try {
        let foundTransaction = null;

        // Priority 1: Try to get status using reference (from Tripay)
        if (reference) {
          console.log('Fetching transaction status using reference:', reference);
          const statusResult = await topupService.getTransactionStatus(reference);
          
          if (statusResult.success && statusResult.data) {
            // If we got the status, try to find the transaction in history
            const historyResult = await topupService.getTopupHistory(50);
            if (historyResult.success && historyResult.data) {
              foundTransaction = historyResult.data.find(
                (tx: any) => tx.duitku_reference === reference
              );
              
              // Update transaction status if found
              if (foundTransaction) {
                foundTransaction.status = statusResult.data.status;
                foundTransaction.payment_method = statusResult.data.paymentMethod || foundTransaction.payment_method;
              }
            }
          }
        }

        // Priority 2: Fallback to merchant_ref search
        if (!foundTransaction && merchantRef) {
          console.log('Fetching transaction using merchant_ref:', merchantRef);
          const historyResult = await topupService.getTopupHistory(50);
          if (historyResult.success && historyResult.data) {
            foundTransaction = historyResult.data.find(
              (tx: any) => tx.duitku_merchant_order_id === merchantRef
            );
          }
        }

        if (foundTransaction) {
          setTransaction(foundTransaction);
          setStatusMessage('');
        } else if (pollingAttempts < 5) {
          // Implement polling mechanism - retry up to 5 times
          setTimeout(() => {
            setPollingAttempts(prev => prev + 1);
          }, 2000); // Wait 2 seconds before retry
          return; // Don't set loading to false yet
        } else {
          // After 5 attempts, show friendly message
          setStatusMessage('Terima kasih, transaksi Anda sedang diproses. Detail akan tersedia dalam beberapa saat.');
        }
      } catch (error: any) {
        console.error('Failed to fetch transaction details:', error);
        if (pollingAttempts < 5) {
          // Retry on error
          setTimeout(() => {
            setPollingAttempts(prev => prev + 1);
          }, 2000);
          return;
        } else {
          setStatusMessage('Detail transaksi belum tersedia. Silakan cek kembali dalam beberapa saat.');
        }
      } finally {
        if (pollingAttempts >= 5 || transaction) {
          setIsLoading(false);
        }
      }
    };

    fetchTransactionDetails();
  }, [reference, merchantRef, pollingAttempts, toast]);

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
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Gagal
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const LoadingSkeleton = () => (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Memuat Detail Transaksi...</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Memproses Transaksi...
              </h1>
              <p className="text-gray-600">
                Mohon tunggu, kami sedang memverifikasi pembayaran Anda
              </p>
            </div>
            <LoadingSkeleton />
          </div>
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
          {transaction ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {transaction.status === 'success' ? 'Topup Berhasil!' : 'Transaksi Diterima'}
                </h1>
                <p className="text-gray-600">
                  {transaction.status === 'success' 
                    ? 'Saldo Anda telah berhasil ditambahkan'
                    : 'Transaksi Anda sedang diproses'
                  }
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
                      <span className="font-mono text-sm">
                        {transaction.duitku_reference || reference || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono text-sm">
                        {transaction.duitku_merchant_order_id || merchantRef || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tanggal:</span>
                      <span>{dayjs(transaction.created_at).format('DD MMM YYYY, HH:mm')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <AlertCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Transaksi Sedang Diproses
                </h1>
                <p className="text-gray-600">
                  {statusMessage}
                </p>
              </div>

              <Card className="shadow-lg border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600 mb-4">
                    Jika Anda telah menyelesaikan pembayaran, detail transaksi akan muncul dalam beberapa saat.
                  </p>
                  <p className="text-sm text-gray-500">
                    Silakan refresh halaman ini atau kembali ke dashboard untuk melihat status terbaru.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

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
