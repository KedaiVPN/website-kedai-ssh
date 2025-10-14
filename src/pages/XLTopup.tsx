import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { xlService, type XLPackage } from '@/services/xlService';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib/utils';

export default function XLTopup() {
  // State for login and account
  const [loginType, setLoginType] = useState<'otp' | 'msisdn'>('otp');
  const [phone, setPhone] = useState('');
  const [authId, setAuthId] = useState(''); // Correctly define authId state
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
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // Derived state for the selected package
  const selectedPackage = packages.find(p => p.package_code === selectedPackageCode) || null;

  const handleLogin = async () => {
    if (!phone || !/^628\d{8,12}$/.test(phone)) {
      setError('Nomor HP harus dimulai dengan 628 dan 8-12 digit.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSelectedPackageCode('');
    setAccountInfo(null);
    setIsLoggedIn(false);

    try {
      if (loginType === 'otp') {
        const result = await xlService.requestOTP(phone);
        // Correctly extract auth_id from nested data property if it exists
        const receivedAuthId = result.data?.data?.auth_id || result.data?.auth_id;
        if (result.success && receivedAuthId) {
          setAuthId(receivedAuthId);
          setIsOtpSent(true);
          toast.success('Kode OTP telah dikirim ke nomor Anda.');
        } else {
          setError(result.message || 'Gagal mengirim OTP atau tidak menerima Auth ID.');
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
    if (!authId) {
      setError('Auth ID tidak ditemukan. Silakan minta ulang OTP.');
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

  const fetchPackages = async () => {
    try {
      const packagesData = await xlService.getPackages();
      setPackages(packagesData);
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchAccountDetails = async (token: string, msisdn: string) => {
    setError('');
    try {
      const result = await xlService.getQuotaDetails(token);
      if (result.success && result.data) {
        const accountData = typeof result.data === 'object' && result.data !== null ? result.data : {};
        setAccountInfo({ ...accountData, msisdn });
        setIsLoggedIn(true);
        setIsOtpSent(false);
        toast.success('Login berhasil! Silakan pilih paket.');
      } else {
        setError(result.message || 'Gagal mendapatkan detail akun.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail akun.');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Dor-XL - Isi Paket XL</CardTitle>
              <CardDescription>Isi paket XL dengan mudah dan cepat dalam satu halaman.</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {isLoggedIn && accountInfo && (
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-800 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      Info Akun
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p><strong>Nomor:</strong> {accountInfo.msisdn}</p>
                    <p><strong>Status:</strong> {accountInfo.subscription_status}</p>
                    <p><strong>Pulsa:</strong> {accountInfo.pulsa_real}</p>
                    <p><strong>Aktif Sampai:</strong> {accountInfo.active_until}</p>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
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
              </div>

              <div className={`space-y-4 p-4 border rounded-lg`}>
                <h3 className="font-semibold text-lg">Langkah 2: Pilih Paket</h3>
                <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isComboboxOpen}
                      className="w-full justify-between h-auto"
                    >
                      <span className="truncate whitespace-normal text-left">
                        {selectedPackageCode
                          ? packages.find((pkg) => pkg.package_code === selectedPackageCode)?.name
                          : "Pilih paket yang Anda inginkan..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cari nama paket..." />
                      <CommandList>
                        <CommandEmpty>Paket tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {packages.map((pkg, index) => (
                            <>
                              <CommandItem
                                key={pkg.package_code}
                                value={pkg.name}
                                onSelect={() => {
                                  setSelectedPackageCode(pkg.package_code);
                                  setIsComboboxOpen(false);
                                }}
                                className="h-auto"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedPackageCode === pkg.package_code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="flex-1 text-wrap">{pkg.name}</span>
                              </CommandItem>
                              {index < packages.length - 1 && <hr className="my-1" />}
                            </>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

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

              <div className={`space-y-4 p-4 border rounded-lg transition-opacity ${!selectedPackage || !isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 <h3 className="font-semibold text-lg">Langkah 3: Pembayaran</h3>
                 <div>
                    <Label>Metode Pembayaran</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value: 'DANA' | 'QRIS') => setPaymentMethod(value)}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="DANA" id="dana" disabled={!selectedPackage || !isLoggedIn} />
                        <Label htmlFor="dana">DANA</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="QRIS" id="qris" disabled={!selectedPackage || !isLoggedIn} />
                        <Label htmlFor="qris">QRIS</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button onClick={handlePurchase} disabled={!selectedPackage || !isLoggedIn || isPurchasing} className="w-full">
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