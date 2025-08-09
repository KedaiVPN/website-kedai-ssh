
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Wallet, Smartphone, Building2 } from 'lucide-react';
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
  { id: 'QRIS', name: 'QRIS', icon: Smartphone, description: 'Scan QR Code dengan berbagai aplikasi' },
  { id: 'BRIVA', name: 'BRI Virtual Account', icon: Building2, description: 'Transfer via Virtual Account BRI' },
  { id: 'BNIVA', name: 'BNI Virtual Account', icon: Building2, description: 'Transfer via Virtual Account BNI' },
  { id: 'MANDIRIVA', name: 'Mandiri Virtual Account', icon: Building2, description: 'Transfer via Virtual Account Mandiri' },
  { id: 'OVO', name: 'OVO', icon: Wallet, description: 'Bayar dengan OVO' },
  { id: 'DANA', name: 'DANA', icon: Wallet, description: 'Bayar dengan DANA' }
];

const Topup = () => {
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('QRIS');
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

    setIsProcessing(true);

    try {
      const result = await topupService.createPayment({
        amount: selectedAmount,
        paymentMethod: selectedPaymentMethod || 'QRIS'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-20">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Topup Saldo</h1>
            <p className="text-muted-foreground mt-2">
              Isi saldo akun Anda untuk membuat akun VPN
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Topup Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Pilih Nominal Topup</CardTitle>
                  <CardDescription>
                    Pilih nominal atau masukkan jumlah custom
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preset Amounts */}
                  <div>
                    <Label className="text-sm font-medium">Nominal Cepat</Label>
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
                    <Label htmlFor="custom-amount">Jumlah Custom (min. Rp 10.000)</Label>
                    <Input
                      id="custom-amount"
                      placeholder="Masukkan jumlah..."
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  {/* Payment Methods */}
                  <div>
                    <Label className="text-sm font-medium">Metode Pembayaran</Label>
                    <div className="grid gap-3 mt-2">
                      {PAYMENT_METHODS.map((method) => (
                        <div
                          key={method.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedPaymentMethod === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <method.icon className="h-5 w-5" />
                            <div>
                              <div className="font-medium">{method.name}</div>
                              <div className="text-sm text-muted-foreground">{method.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Summary & Action */}
                  {selectedAmount > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium">Total Topup:</span>
                        <span className="text-xl font-bold">{formatRupiah(selectedAmount)}</span>
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
