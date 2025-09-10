import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Wallet, Smartphone, Building2, Check } from 'lucide-react';
import { topupService, CreatePaymentResponse } from '@/services/topupService';
import { toast } from 'sonner';
import TopupHistory from '@/components/TopupHistory';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuPush } from '@/hooks/useMenuPush';
import QrCodeModal from '../components/QrCodeModal';
import VirtualAccountModal from '../components/VirtualAccountModal';

const PRESET_AMOUNTS = [
  { value: 10000, label: 'Rp 10.000' },
  { value: 25000, label: 'Rp 25.000' },
  { value: 50000, label: 'Rp 50.000' },
  { value: 100000, label: 'Rp 100.000' },
  { value: 250000, label: 'Rp 250.000' },
  { value: 500000, label: 'Rp 500.000' }
];

const PAYMENT_METHODS = [
  { id: 'QRIS', name: 'QRIS', icon: Smartphone, description: 'Scan QR Code (Recommended)', requiresPhone: false, direct: true },
  { id: 'BRIVA', name: 'BRI Virtual Account', icon: Building2, description: 'Transfer via Virtual Account BRI', requiresPhone: false, direct: true },
  { id: 'BNIVA', name: 'BNI Virtual Account', icon: Building2, description: 'Transfer via Virtual Account BNI', requiresPhone: false, direct: true },
  { id: 'MANDIRIVA', name: 'Mandiri Virtual Account', icon: Building2, description: 'Transfer via Virtual Account Mandiri', requiresPhone: false, direct: true },
  { id: 'OVO', name: 'OVO', icon: Wallet, description: 'Bayar dengan OVO (Redirect)', requiresPhone: true, direct: false },
  { id: 'DANA', name: 'DANA', icon: Wallet, description: 'Bayar dengan DANA (Redirect)', requiresPhone: true, direct: false }
];

const Topup = () => {
  const { mainContentStyle } = useMenuPush();
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('QRIS');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [modalFlow, setModalFlow] = useState<'QRIS' | 'VA' | null>(null);
  const [modalData, setModalData] = useState<any>({});
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const { updateToken, refreshUser } = useAuth();

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseInt(value.replace(/[^0-9]/g, ''));
    if (!isNaN(numValue)) setSelectedAmount(numValue);
    else setSelectedAmount(0);
  };

  const formatRupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const startPolling = (ref: string) => {
    stopPolling();
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await topupService.getTransactionStatus(ref);
        const status = response.data?.status;
        if (response.success && status && status !== 'pending') {
          stopPolling();
          setModalFlow(null);

          // Handle token update for success cases
          if (status === 'success') {
            toast.success('Pembayaran berhasil dikonfirmasi!');
            if (response.data.newToken) {
              updateToken(response.data.newToken);
            } else {
              refreshUser();
            }
          }

          // Navigate to a generic result page for all terminal states
          navigate('/topup/result', {
            state: {
              transaction: response.data
            }
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Optional: stop polling on certain types of errors
      }
    }, 5000);
  };

  const handleTopup = async () => {
    if (!selectedAmount || selectedAmount < 10000) {
      toast.error('Minimal topup Rp 10.000');
      return;
    }

    const selectedMethod = PAYMENT_METHODS.find(method => method.id === selectedPaymentMethod);
    if (!selectedMethod) return;

    if (selectedMethod.requiresPhone && (!phoneNumber.trim() || phoneNumber.trim().length < 10)) {
      toast.error('Nomor telepon valid diperlukan untuk metode ini.');
      return;
    }

    setIsProcessing(true);
    try {
      const result: CreatePaymentResponse = await topupService.createPayment({
        amount: selectedAmount,
        paymentMethod: selectedPaymentMethod,
        phoneNumber: selectedMethod.requiresPhone ? phoneNumber.replace(/\D/g, '') : undefined,
      });

      if (result.success) {
        if (result.flow === 'DIRECT_QRIS' && result.qrCodeUrl) {
          setModalData(result);
          setModalFlow('QRIS');
          startPolling(result.reference!);
        } else if (result.flow === 'DIRECT_VA' && result.payCode) {
          setModalData(result);
          setModalFlow('VA');
          startPolling(result.reference!);
        } else if (result.flow === 'REDIRECT' && result.paymentUrl) {
          toast.info('Anda akan dialihkan ke halaman pembayaran...');
          window.open(result.paymentUrl, '_blank');
        } else {
          throw new Error('Respons tidak valid dari server.');
        }
      } else {
        throw new Error(result.message || 'Gagal membuat pembayaran.');
      }
    } catch (error: any) {
      console.error('Topup error:', error);
      toast.error(error.message || 'Gagal membuat pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <QrCodeModal
        isOpen={modalFlow === 'QRIS'}
        onClose={() => { setModalFlow(null); stopPolling(); }}
        qrCodeUrl={modalData.qrCodeUrl || ''}
        reference={modalData.reference || ''}
        amountGross={modalData.amountGross || 0}
        amountNet={modalData.amountNet || 0}
      />
      <VirtualAccountModal
        isOpen={modalFlow === 'VA'}
        onClose={() => { setModalFlow(null); stopPolling(); }}
        paymentName={modalData.paymentName || ''}
        payCode={modalData.payCode || ''}
        amountGross={modalData.amountGross || 0}
        amountNet={modalData.amountNet || 0}
        reference={modalData.reference || ''}
        instructions={modalData.instructions || []}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="container mx-auto px-4" style={mainContentStyle}>
          <div className="space-y-6 pt-8 pb-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Topup Saldo</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Isi saldo akun Anda untuk membuat akun VPN</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Pilih Nominal Topup</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">Pilih nominal atau masukkan jumlah custom</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-900 dark:text-white">Nominal Cepat</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {PRESET_AMOUNTS.map((preset) => (
                          <Button key={preset.value} variant={selectedAmount === preset.value && !customAmount ? 'default' : 'outline'} onClick={() => handleAmountSelect(preset.value)} className="h-12">{preset.label}</Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="custom-amount" className="text-gray-900 dark:text-white">Jumlah Custom (min. Rp 10.000)</Label>
                      <Input id="custom-amount" placeholder="Masukkan jumlah..." value={customAmount} onChange={(e) => handleCustomAmountChange(e.target.value)} className="mt-2 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white" />
                    </div>
                    <Separator className="bg-gray-200 dark:bg-gray-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-900 dark:text-white">Metode Pembayaran</Label>
                      <div className="grid gap-3 mt-2">
                        {PAYMENT_METHODS.map((method) => (
                          <div key={method.id} className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-300 ${selectedPaymentMethod === method.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 ring-2 ring-blue-500/20 shadow-md' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 hover:bg-blue-25 dark:hover:bg-gray-600 hover:shadow-sm'}`} onClick={() => setSelectedPaymentMethod(method.id)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <method.icon className={`h-6 w-6 ${selectedPaymentMethod === method.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                                <div>
                                  <div className={`font-medium ${selectedPaymentMethod === method.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>{method.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{method.description}</div>
                                </div>
                              </div>
                              {selectedPaymentMethod === method.id && <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full"><Check className="h-4 w-4 text-white" /></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.requiresPhone && (
                      <div>
                        <Label htmlFor="phone-number" className="text-gray-900 dark:text-white">Nomor Telepon <span className="text-red-500">*</span></Label>
                        <Input id="phone-number" placeholder="08xxxxxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-2 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: 08xxxxxxxxxx atau 62xxxxxxxxxx</p>
                      </div>
                    )}
                    <Separator className="bg-gray-200 dark:bg-gray-600" />
                    {selectedAmount > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-medium text-gray-900 dark:text-white">Total Topup:</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">{formatRupiah(selectedAmount)}</span>
                        </div>
                        <Button onClick={handleTopup} disabled={isProcessing} className="w-full" size="lg">{isProcessing ? 'Memproses...' : 'Lanjut Pembayaran'}</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div><TopupHistory /></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Topup;
