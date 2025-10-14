import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { xlService, type XLPackage } from '@/services/xlService';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QRCodeCanvas } from 'qrcode.react';

export default function XLTopup() {
  // State for login and account
  const [loginType, setLoginType] = useState<'otp' | 'msisdn'>('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [accountInfo, setAccountInfo] = useState<any>(null);

  // State for packages
  const [packages, setPackages] = useState<XLPackage[]>([]);
  const [selectedPackageCode, setSelectedPackageCode] = useState<string>('');
  
  // State for payment
  const [paymentMethod, setPaymentMethod] = useState<'DANA' | 'QRIS'>('DANA');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // General UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Derived state for the selected package
  const selectedPackage = packages.find(p => p.package_code === selectedPackageCode) || null;

  // Handlers for API calls (logic remains the same, but UI flow changes)
  const handleLogin = async () => {
    if (!phone || !/^628\d{8,12}$/.test(phone)) {
      setError('Nomor HP harus dimulai dengan 628 dan 8-12 digit.');
      return;
    }
    
    setLoading(true);
    setError('');
    setIsLoggedIn(false);
    setPackages([]);
    setSelectedPackageCode('');
    setAccountInfo(null);

    try {
      if (loginType === 'otp') {
        const result = await xlService.requestOTP(phone);
        if (result.success) {
          setIsOtpSent(true);
          toast.success('Kode OTP telah dikirim ke nomor Anda.');
        } else {
          setError(result.message || 'Gagal mengirim OTP.');
        }
      } else { // msisdn login
        const result = await xlService.loginWithMsisdn(phone);
        if (result.success && result.data.access_token) {
          setAccessToken(result.data.access_token);
          await fetchAccountDetails(result.data.access_token, phone);
        } else {
          setError(result.message || 'Gagal login dengan nomor terdaftar.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      setError('Kode OTP tidak valid.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await xlService.loginOTP(phone, authId, otp);
      if (result.success && result.data.access_token) {
        setAccessToken(result.data.access_token);
        await fetchAccountDetails(result.data.access_token, phone);
      } else {
        setError(result.message || 'Kode OTP salah atau sudah kadaluarsa.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat verifikasi OTP.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountDetails = async (token: string, msisdn: string) => {
    try {
      const quotaResult = await xlService.getQuotaDetails(token);
      if (quotaResult.success) {
        const accountData = typeof quotaResult.data.data === 'object' && quotaResult.data.data !== null ? quotaResult.data.data : {};
        setAccountInfo({ ...accountData, msisdn });
        setIsLoggedIn(true);
        setIsOtpSent(false); // Reset OTP state

        const packagesData = await xlService.getPackages();
        setPackages(packagesData);
        toast.success('Login berhasil! Silakan pilih paket.');
      } else {
        setError('Gagal mendapatkan detail akun.');
      }
    } catch (err: any) {
      setError('Gagal memuat detail akun.');
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !accountInfo?.msisdn || !accessToken) {
      setError('Silakan login dan pilih paket terlebih dahulu.');
      return;
    }
    
    setIsPurchasing(true);
    setError('');
    
    try {
      const result = await xlService.purchasePackage(
        selectedPackage.package_code,
        accountInfo.msisdn,
        accessToken,
        paymentMethod,
        selectedPackage.price
      );
      
      if (result.success) {
        setPaymentData(result.data);
        toast.success('Pembelian berhasil! Silakan selesaikan pembayaran.');
      } else {
        setError(result.message || 'Gagal membeli paket.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membeli paket.');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <CardTitle>Pembayaran</CardTitle>
                <CardDescription>Selesaikan pembayaran Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                {paymentData.is_qris && paymentData.qris_data?.qr_code && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">Scan QR Code di bawah ini:</p>
                    <div className="flex justify-center my-4 p-4 bg-white rounded-lg">
                      <QRCodeCanvas value={paymentData.qris_data.qr_code} size={256} level="H" />
                    </div>
                    {paymentData.qris_data.remaining_time && (
                      <p className="text-xs text-muted-foreground">Kedaluwarsa dalam: {paymentData.qris_data.remaining_time} detik</p>
                    )}
                  </div>
                )}
                {paymentData.have_deeplink && paymentData.deeplink_data?.deeplink_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">Klik tombol di bawah untuk membayar dengan DANA:</p>
                    <Button onClick={() => window.open(paymentData.deeplink_data.deeplink_url, '_blank')} className="w-full">
                      Bayar via DANA
                    </Button>
                  </div>
                )}
                 <p className="text-sm text-muted-foreground mt-4">
                    Total biaya admin yang dipotong dari saldo: Rp{selectedPackage?.fee.toLocaleString()}
                </p>
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full mt-4">
                  Selesai
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <Header />
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Dor-XL - Isi Paket XL</CardTitle>
              <CardDescription>Isi paket XL dengan mudah dan cepat dalam satu halaman.</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Login Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Langkah 1: Login Akun XL</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone-number">Nomor HP XL</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="628xxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={14}
                      disabled={loading || isLoggedIn}
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-method">Metode Login</Label>
                    <Select
                      value={loginType}
                      onValueChange={(value: 'otp' | 'msisdn') => {
                        setLoginType(value);
                        setIsOtpSent(false);
                      }}
                      disabled={loading || isLoggedIn}
                    >
                      <SelectTrigger id="login-method">
                        <SelectValue placeholder="Pilih metode login" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="otp">Gunakan OTP</SelectItem>
                        <SelectItem value="msisdn">Gunakan Nomor Terdaftar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {loginType === 'otp' && (
                  <div className="flex items-end gap-4">
                    <div className="flex-grow">
                      <Label htmlFor="otp-input">Kode OTP</Label>
                      <Input
                        id="otp-input"
                        type="text"
                        placeholder="Masukkan OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        disabled={!isOtpSent || loading || isLoggedIn}
                      />
                    </div>
                    <Button onClick={handleVerifyOTP} disabled={!otp || loading || isLoggedIn}>
                      {loading && loginType === 'otp' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Verifikasi
                    </Button>
                  </div>
                )}

                {!isLoggedIn && (
                  <Button onClick={handleLogin} disabled={loading || !phone} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {loginType === 'otp' ? 'Kirim OTP' : 'Login'}
                  </Button>
                )}

                {isLoggedIn && accountInfo && (
                  <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Login berhasil untuk nomor <strong>{accountInfo.msisdn}</strong>. Silakan pilih paket.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Package Selection Section */}
              <div className={`space-y-4 p-4 border rounded-lg transition-opacity ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <h3 className="font-semibold text-lg">Langkah 2: Pilih Paket</h3>
                <div className="space-y-2">
                  <Label htmlFor="package-select">Paket Tersedia</Label>
                  <Select
                    value={selectedPackageCode}
                    onValueChange={setSelectedPackageCode}
                    disabled={!isLoggedIn}
                  >
                    <SelectTrigger id="package-select">
                      <SelectValue placeholder="Pilih paket yang Anda inginkan" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map(pkg => (
                        <SelectItem key={pkg.package_code} value={pkg.package_code}>
                          {pkg.name} (Rp{(pkg.price || 0).toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPackage && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                    <h4 className="font-semibold">Deskripsi Paket:</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedPackage.description}</p>
                    <p className="text-sm pt-2">
                      <strong>Harga:</strong> Rp{(selectedPackage.price || 0).toLocaleString()} |
                      <strong> Biaya Layanan:</strong> Rp{(selectedPackage.fee || 0).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className={`space-y-4 p-4 border rounded-lg transition-opacity ${!selectedPackage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 <h3 className="font-semibold text-lg">Langkah 3: Pembayaran</h3>
                 <div>
                    <Label>Metode Pembayaran</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value: 'DANA' | 'QRIS') => setPaymentMethod(value)}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="DANA" id="dana" disabled={!selectedPackage} />
                        <Label htmlFor="dana">DANA</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="QRIS" id="qris" disabled={!selectedPackage} />
                        <Label htmlFor="qris">QRIS</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button onClick={handlePurchase} disabled={!selectedPackage || isPurchasing} className="w-full">
                    {isPurchasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Beli & Bayar
                  </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}