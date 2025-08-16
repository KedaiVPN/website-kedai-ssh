import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Wallet, Smartphone, Building2, Check } from 'lucide-react';
import { topupService } from '@/services/topupService';
import { useToast } from '@/hooks/use-toast';
import TopupHistory from '@/components/TopupHistory';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const PRESET_AMOUNTS = [
  { value: 10000, label: 'Rp 10.000' },
  { value: 25000, label: 'Rp 25.000' },
  { value: 50000, label: 'Rp 50.000' },
  { value: 100000, label: 'Rp 100.000' },
  { value: 250000, label: 'Rp 250.000' },
  { value: 500000, label: 'Rp 500.000' }
];

const PAYMENT_METHODS = [
  { id: 'QRIS', name: 'QRIS', icon: Smartphone, description: 'Scan QR Code dengan berbagai aplikasi', requiresPhone: false },
  { id: 'BRIVA', name: 'BRI Virtual Account', icon: Building2, description: 'Transfer via Virtual Account BRI', requiresPhone: false },
  { id: 'BNIVA', name: 'BNI Virtual Account', icon: Building2, description: 'Transfer via Virtual Account BNI', requiresPhone: false },
  { id: 'MANDIRIVA', name: 'Mandiri Virtual Account', icon: Building2, description: 'Transfer via Virtual Account Mandiri', requiresPhone: false },
  { id: 'OVO', name: 'OVO', icon: Wallet, description: 'Bayar dengan OVO', requiresPhone: true },
  { id: 'DANA', name: 'DANA', icon: Wallet, description: 'Bayar dengan DANA', requiresPhone: true }
];

const Topup = () => {
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('QRIS');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseInt(value.replace(/[^0-9]/g, ''));
    if (!isNaN(numValue)) {
      setSelectedAmount(numValue);
    } else {
      setSelectedAmount(0);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Convert 08xxx to 628xxx format
    if (digits.startsWith('08')) {
      return '62' + digits.substring(1);
    }
    
    // If already starts with 62, keep it
    if (digits.startsWith('62')) {
      return digits;
    }
    
    // If starts with 8, add 62
    if (digits.startsWith('8')) {
      return '62' + digits;
    }
    
    return digits;
  };

  const selectedMethod = PAYMENT_METHODS.find(method => method.id === selectedPaymentMethod);
  const requiresPhone = selectedMethod?.requiresPhone || false;

  const handleTopup = async () => {
    if (!selectedAmount || selectedAmount < 10000) {
      toast({
        title: 'Error',
        description: 'Minimal topup Rp 10.000',
        variant: 'destructive'
      });
      return;
    }

    if (selectedAmount > 10000000) {
      toast({
        title: 'Error', 
        description: 'Maksimal topup Rp 10.000.000',
        variant: 'destructive'
      });
      return;
    }

    // Validate phone number for DANA and OVO
    if (requiresPhone && !phoneNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Nomor telepon diperlukan untuk metode pembayaran ini',
        variant: 'destructive'
      });
      return;
    }

    if (requiresPhone && phoneNumber.trim().length < 10) {
      toast({
        title: 'Error',
        description: 'Nomor telepon harus minimal 10 digit',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await topupService.createPayment({
        amount: selectedAmount,
        paymentMethod: selectedPaymentMethod || 'QRIS',
        phoneNumber: requiresPhone ? formatPhoneNumber(phoneNumber) : undefined
      });

      if (result.success && result.data) {
        toast({
          title: 'Success',
          description: 'Redirecting to Tripay payment page...'
        });

        // Redirect to Tripay payment page
        window.open(result.data.paymentUrl, '_blank');

        // Reset form
        setSelectedAmount(0);
        setCustomAmount('');
        setSelectedPaymentMethod('QRIS');
        setPhoneNumber('');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Topup error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-20">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Topup Saldo</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Isi saldo akun Anda untuk membuat akun VPN
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Topup Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Pilih Nominal Topup</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Pilih nominal atau masukkan jumlah custom
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preset Amounts */}
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-white">Nominal Cepat</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {PRESET_AMOUNTS.map((preset) => (
                        <Button
                          key={preset.value}
                          variant={selectedAmount === preset.value && !customAmount ? 'default' : 'outline'}
                          onClick={() => handleAmountSelect(preset.value)}
                          className="h-12"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <Label htmlFor="custom-amount" className="text-gray-900 dark:text-white">Jumlah Custom (min. Rp 10.000)</Label>
                    <Input
                      id="custom-amount"
                      placeholder="Masukkan jumlah..."
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="mt-2 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>

                  <Separator className="bg-gray-200 dark:bg-gray-600" />

                  {/* Payment Methods */}
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-white">Metode Pembayaran</Label>
                    <div className="grid gap-3 mt-2">
                      {PAYMENT_METHODS.map((method) => (
                        <div
                          key={method.id}
                          className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                            selectedPaymentMethod === method.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 ring-2 ring-blue-500/20 shadow-md'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 hover:bg-blue-25 dark:hover:bg-gray-600 hover:shadow-sm'
                          }`}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <method.icon className={`h-6 w-6 ${
                                selectedPaymentMethod === method.id 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} />
                              <div>
                                <div className={`font-medium ${
                                  selectedPaymentMethod === method.id 
                                    ? 'text-blue-900 dark:text-blue-100' 
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {method.name}
                                  
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{method.description}</div>
                              </div>
                            </div>
                            {selectedPaymentMethod === method.id && (
                              <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phone Number Field (conditional) */}
                  {requiresPhone && (
                    <div>
                      <Label htmlFor="phone-number" className="text-gray-900 dark:text-white">
                        Nomor Telepon <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone-number"
                        placeholder="08xxxxxxxxxx"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mt-2 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Format: 08xxxxxxxxxx atau 62xxxxxxxxxx
                      </p>
                    </div>
                  )}

                  <Separator className="bg-gray-200 dark:bg-gray-600" />

                  {/* Summary & Action */}
                  {selectedAmount > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium text-gray-900 dark:text-white">Total Topup:</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{formatRupiah(selectedAmount)}</span>
                      </div>
                      <Button
                        onClick={handleTopup}
                        disabled={isProcessing}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessing ? 'Memproses...' : 'Lanjut Pembayaran'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Topup History */}
            <div>
              <TopupHistory />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Topup;
