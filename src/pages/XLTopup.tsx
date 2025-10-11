import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { xlService, type XLPackage } from '@/services/xlService';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// QRCode library akan load dari CDN
declare const QRCode: any;

export default function XLTopup() {
  // Step states
  const [loginType, setLoginType] = useState<'otp' | 'msisdn'>('otp');
  const [phone, setPhone] = useState('');
  const [msisdn, setMsisdn] = useState('');
  const [authId, setAuthId] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'account' | 'packages' | 'payment'>('phone');
  
  // Account & Package states
  const [accessToken, setAccessToken] = useState('');
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [packages, setPackages] = useState<XLPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<XLPackage | null>(null);
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'DANA' | 'QRIS'>('DANA');
  const [paymentData, setPaymentData] = useState<any>(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Request OTP
  const handleRequestOTP = async () => {
    if (!phone || !/^628\d{8,12}$/.test(phone)) {
      setError('Nomor HP harus dimulai dengan 628 dan 8-12 digit');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await xlService.requestOTP(phone);
      if (result.success) {
        setAuthId(result.data.data?.auth_id || result.data.auth_id);
        setStep('otp');
      } else {
        setError(result.message || 'Gagal request OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat request OTP');
    } finally {
      setLoading(false);
    }
  };

  // Login with OTP
  const handleLoginOTP = async () => {
    if (!otp || otp.length < 4) {
      setError('Kode OTP tidak valid');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await xlService.loginOTP(phone, authId, otp);
      if (result.success) {
        setAccessToken(result.data.data?.access_token || result.data.access_token);
        
        // Get account info
        const quotaResult = await xlService.getQuotaDetails(result.data.data?.access_token || result.data.access_token);
        if (quotaResult.success) {
          setAccountInfo(quotaResult.data.data);
          
          // Load packages
          const packagesData = await xlService.getPackages();
          setPackages(packagesData);
          
          setStep('account');
        } else {
          setError('Gagal mendapatkan info akun');
        }
      } else {
        setError(result.message || 'Kode OTP salah atau sudah kadaluarsa');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  // Login with MSISDN
  const handleLoginMsisdn = async () => {
    const targetMsisdn = loginType === 'msisdn' ? msisdn : phone;
    if (!targetMsisdn || !/^628\d{8,12}$/.test(targetMsisdn)) {
      setError('Nomor XL harus dimulai dengan 628 dan 8-12 digit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await xlService.loginWithMsisdn(targetMsisdn);
      if (result.success && result.data.access_token) {
        setAccessToken(result.data.access_token);

        // Get account info
        const quotaResult = await xlService.getQuotaDetails(result.data.access_token);
        if (quotaResult.success) {
          setAccountInfo(quotaResult.data.data);

          // Load packages
          const packagesData = await xlService.getPackages();
          setPackages(packagesData);

          setStep('account');
        } else {
          setError('Gagal mendapatkan info akun');
        }
      } else {
        setError(result.message || 'Gagal login. Pastikan nomor sudah terdaftar di layanan XL.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  // Select Package
  const handleSelectPackage = (pkg: XLPackage) => {
    setSelectedPackage(pkg);
    setStep('packages');
  };

  // Purchase Package
  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await xlService.purchasePackage(
        selectedPackage.package_code,
        phone,
        accessToken,
        paymentMethod
      );
      
      if (result.success) {
        setPaymentData(result.data);
        setStep('payment');
        
        // Generate QR Code if QRIS
        if (paymentMethod === 'QRIS' && result.data.qris_data?.qr_code) {
          setTimeout(() => {
            const qrContainer = document.getElementById('qr-code-container');
            if (qrContainer && typeof QRCode !== 'undefined') {
              qrContainer.innerHTML = ''; // Clear previous
              new QRCode(qrContainer, {
                text: result.data.qris_data.qr_code,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
              });
            }
          }, 100);
        }
      } else {
        setError(result.message || 'Gagal membeli paket');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membeli paket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Dor-XL - Isi Paket XL</CardTitle>
              <CardDescription>Isi paket XL dengan mudah dan cepat</CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert className="mb-4 border-destructive bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Step 1: Phone Input & Login Type */}
              {step === 'phone' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Pilih Metode Login</label>
                    <RadioGroup defaultValue="otp" onValueChange={(value: 'otp' | 'msisdn') => setLoginType(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="otp" id="r1" />
                        <Label htmlFor="r1">Login dengan OTP</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="msisdn" id="r2" />
                        <Label htmlFor="r2">Login dengan Nomor Terdaftar</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {loginType === 'otp' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Nomor HP XL</label>
                      <Input
                        type="tel"
                        placeholder="628xxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={14}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Format: 628xxxxx (tanpa +)</p>
                    </div>
                  )}

                  {loginType === 'msisdn' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Nomor XL Terdaftar</label>
                      <Input
                        type="tel"
                        placeholder="628xxxxx"
                        value={msisdn}
                        onChange={(e) => setMsisdn(e.target.value)}
                        maxLength={14}
                        disabled={loading}
                      />
                       <p className="text-xs text-muted-foreground mt-1">Masukkan nomor yang sudah pernah login sebelumnya.</p>
                    </div>
                  )}

                  <Button
                    onClick={loginType === 'otp' ? handleRequestOTP : handleLoginMsisdn}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> :
                     loginType === 'otp' ? 'Request OTP' : 'Login'}
                  </Button>
                </div>
              )}
              
              {/* Step 2: OTP Input */}
              {step === 'otp' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Kode OTP</label>
                    <Input
                      type="text"
                      placeholder="Masukkan kode OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      disabled={loading}
                    />
                  </div>
                  <Button onClick={handleLoginOTP} disabled={loading} className="w-full">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifikasi...</> : 'Verifikasi OTP'}
                  </Button>
                </div>
              )}
              
              {/* Step 3: Account Info & Package List */}
              {step === 'account' && accountInfo && (
                <div className="space-y-4">
                  <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                    <p><strong>Nomor:</strong> {accountInfo.msisdn}</p>
                    <p><strong>Status:</strong> Aktif</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">Pilih Paket:</h3>
                    {packages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Belum ada paket tersedia</p>
                    ) : (
                      packages.map((pkg) => (
                        <Card 
                          key={pkg.id} 
                          className="cursor-pointer hover:border-primary transition-colors" 
                          onClick={() => handleSelectPackage(pkg)}
                        >
                          <CardContent className="p-4">
                            <p className="font-medium">{pkg.name}</p>
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                            <p className="text-sm font-semibold mt-2">
                              Harga: Rp{pkg.price.toLocaleString()} | Fee: Rp{pkg.fee.toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {/* Step 4: Payment Method Selection */}
              {step === 'packages' && selectedPackage && (
                <div className="space-y-4">
                  <div className="bg-success/10 p-4 rounded-lg">
                    <p className="font-medium">Paket Terpilih:</p>
                    <p className="text-sm">{selectedPackage.name}</p>
                    <p className="text-sm font-semibold mt-2">Fee: Rp{selectedPackage.fee.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Metode Pembayaran:</label>
                    <div className="flex gap-2">
                      <Button
                        variant={paymentMethod === 'DANA' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('DANA')}
                        className="flex-1"
                        disabled={loading}
                      >
                        DANA
                      </Button>
                      <Button
                        variant={paymentMethod === 'QRIS' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('QRIS')}
                        className="flex-1"
                        disabled={loading}
                      >
                        QRIS
                      </Button>
                    </div>
                  </div>
                  
                  <Button onClick={handlePurchase} disabled={loading} className="w-full">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : 'Beli Paket'}
                  </Button>
                </div>
              )}
              
              {/* Step 5: Payment Result */}
              {step === 'payment' && paymentData && (
                <div className="space-y-4 text-center">
                  <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                  
                  {paymentData.have_deeplink && paymentData.deeplink_data?.deeplink_url && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Saldo berhasil dipotong sebesar Rp{paymentData.fee?.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">Silakan bayar melalui DANA:</p>
                      <Button
                        onClick={() => window.open(paymentData.deeplink_data.deeplink_url, '_blank')}
                        className="w-full"
                      >
                        Bayar via DANA
                      </Button>
                    </div>
                  )}
                  
                  {paymentData.is_qris && paymentData.qris_data?.qr_code && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Saldo berhasil dipotong sebesar Rp{paymentData.fee?.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">Scan QR Code di bawah ini:</p>
                      <div id="qr-code-container" className="flex justify-center my-4"></div>
                      {paymentData.qris_data.remaining_time && (
                        <p className="text-xs text-muted-foreground">Expired dalam: {paymentData.qris_data.remaining_time}s</p>
                      )}
                    </div>
                  )}
                  
                  <Button onClick={() => window.location.reload()} variant="outline" className="w-full mt-4">
                    Selesai
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
