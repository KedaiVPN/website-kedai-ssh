import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { xlService, type XLPackage, type XLActivePackage } from '@/services/xlService';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Loader2, ChevronsUpDown, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import XLScheduledPurchase from '@/components/XLScheduledPurchase';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib/utils';

// Reusable Package Selector Component with Grouping
const PackageSelector = ({ officialPackages, unofficialPackages, selectedCode, onSelect, disabled = false, placeholder = "Pilih paket..." }: {
  officialPackages: XLPackage[];
  unofficialPackages: XLPackage[];
  selectedCode: string;
  onSelect: (code: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const allPackages = [...officialPackages, ...unofficialPackages];
  const selectedPackage = allPackages.find((pkg) => pkg.package_code === selectedCode);

  const renderCommandItem = (pkg: XLPackage) => (
    <CommandItem
      key={pkg.package_code}
      value={pkg.name}
      onSelect={() => {
        onSelect(pkg.package_code);
        setIsOpen(false);
      }}
      className="h-auto"
    >
      <Check
        className={cn("mr-2 h-4 w-4", selectedCode === pkg.package_code ? "opacity-100" : "opacity-0")}
      />
      <span className="flex-1 text-wrap">{pkg.name}</span>
    </CommandItem>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between h-auto"
          disabled={disabled}
        >
          <span className="truncate whitespace-normal text-left">
            {selectedPackage ? selectedPackage.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Cari nama paket..." />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>Paket tidak ditemukan.</CommandEmpty>
            {officialPackages.length > 0 && (
              <CommandGroup heading="No Login">
                {officialPackages.map(renderCommandItem)}
              </CommandGroup>
            )}
            {unofficialPackages.length > 0 && (
              <CommandGroup heading="Login">
                {unofficialPackages.map(renderCommandItem)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


export default function XLTopup() {
  const normalizePhoneNumber = (value: string): string => {
    // Remove all non-digit characters first.
    let cleaned = value.replace(/\D/g, '');

    // If the number starts with '08', replace '0' with '62'.
    if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    } else if (cleaned.startsWith('08')) {
        cleaned = '62' + cleaned.substring(1);
    }

    return cleaned;
  };

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
  const [officialPackages, setOfficialPackages] = useState<XLPackage[]>([]);
  const [unofficialPackages, setUnofficialPackages] = useState<XLPackage[]>([]);
  const [allPackages, setAllPackages] = useState<XLPackage[]>([]);
  const [selectedPackageCode, setSelectedPackageCode] = useState<string>('');
  
  // State for payment
  const [paymentMethod, setPaymentMethod] = useState<'DANA' | 'QRIS'>('DANA');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // General UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State for official packages flow
  const [officialPhone, setOfficialPhone] = useState('');

  // State for active packages modal
  const [activePackages, setActivePackages] = useState<XLActivePackage[]>([]);
  const [isCheckingPackages, setIsCheckingPackages] = useState(false);

  // Derived state for the selected package
  const selectedPackage = allPackages.find(p => p.package_code === selectedPackageCode) || null;

  const handleLogin = async () => {
    if (!phone || !/^628\d{8,12}$/.test(phone)) {
      setError('Nomor HP harus dimulai dengan 628 dan 8-12 digit.');
      return;
    }
    
    setLoading(true);
    setError('');
    setAccountInfo(null);
    setIsLoggedIn(false);

    try {
      if (loginType === 'otp') {
        console.log('[Frontend] OTP Request attempt:', { 
          phonePrefix: phone.substring(0, 6) + '...' 
        });
        
        const result = await xlService.requestOTP(phone);
        const receivedAuthId = result?.data?.auth_id;
        
        console.log('[Frontend] OTP Request result:', { 
          success: result.success, 
          hasAuthId: !!receivedAuthId,
          authIdPrefix: receivedAuthId?.substring(0, 8) + '...'
        });
        
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
          await fetchSubscriberInfo(result.data.access_token, phone);
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
    const cleanOtp = otp.replace(/\D+/g, '').trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Kode OTP tidak valid.');
      return;
    }
    if (!authId) {
      setError('Auth ID tidak ditemukan. Silakan minta ulang OTP.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    console.log('[Frontend] OTP Verify attempt:', { 
      phonePrefix: phone.substring(0, 6) + '...', 
      authIdPrefix: authId.substring(0, 8) + '...', 
      otpLength: cleanOtp.length 
    });
    
    try {
      const result = await xlService.loginOTP(phone.trim(), authId.trim(), cleanOtp);
      
      console.log('[Frontend] OTP Verify result:', {
        success: result.success,
        hasAccessToken: !!result.data?.access_token,
        message: result.message
      });
      
      if (result.success && result.data?.access_token) {
        setAccessToken(result.data.access_token);
        await fetchSubscriberInfo(result.data.access_token, phone);
      } else {
        setError(result.message || 'Kode OTP salah atau sudah kadaluarsa.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat verifikasi OTP.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAndCategorizePackages = async () => {
      try {
        const packagesData = await xlService.getPackages();
        setAllPackages(packagesData);
        setOfficialPackages(packagesData.filter(p => p.kategori === 'resmi'));
        setUnofficialPackages(packagesData.filter(p => p.kategori === 'tidak resmi'));
      } catch (err) {
        console.error("Failed to fetch packages:", err);
        setError("Gagal memuat daftar paket. Coba muat ulang halaman.");
      }
    };
    fetchAndCategorizePackages();
  }, []);

  const fetchSubscriberInfo = async (token: string, msisdn: string) => {
    setError('');
    try {
      const result = await xlService.getSubscriberInfo(token);
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

  const handleCheckActivePackages = async () => {
    if (!accessToken) {
      toast.error('Silakan login terlebih dahulu untuk mengecek paket.');
      return;
    }
    setIsCheckingPackages(true);
    setActivePackages([]); // Clear previous results
    try {
      const result = await xlService.getActivePackages(accessToken);
      if (result.success && result.data?.quotas) {
        setActivePackages(result.data.quotas);
      } else {
        toast.error(result.message || 'Gagal mengambil data paket aktif.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsCheckingPackages(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      setError('Silakan pilih paket terlebih dahulu.');
      return;
    }

    const isOfficial = selectedPackage.kategori === 'resmi';
    let purchasePhone = isOfficial ? officialPhone : accountInfo?.msisdn;

    if (!purchasePhone || !/^628\d{8,12}$/.test(purchasePhone)) {
      setError('Nomor HP tujuan tidak valid (format: 628xxxx).');
      return;
    }

    if (!isOfficial && !accessToken) {
      setError('Silakan login untuk membeli paket tidak resmi.');
      return;
    }
    
    setIsPurchasing(true);
    setError('');
    
    try {
      // paymentMethod for XL API: 'BALANCE' for pulsa/saldo, 'DANA'/'QRIS' for e-wallet.
      const paymentMethodForXL = selectedPackage.payment_method === 'pulsa' || isOfficial ? 'BALANCE' : paymentMethod;

      const result = await xlService.purchasePackage(
        selectedPackage.package_code,
        purchasePhone,
        isOfficial ? '' : accessToken, // No access token needed for official packages
        paymentMethodForXL
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
    const isPulsaPayment = selectedPackage?.payment_method === 'pulsa';
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle>{isPulsaPayment ? 'Pembelian Berhasil' : 'Selesaikan Pembayaran'}</CardTitle>
                <CardDescription>
                  {isPulsaPayment
                    ? 'Paket Anda telah berhasil diaktifkan menggunakan pulsa.'
                    : 'Pindai kode QR atau gunakan tautan di bawah ini.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                {isPulsaPayment ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="font-semibold">{paymentData.package_name}</p>
                    <p className="text-sm text-muted-foreground">untuk nomor {paymentData.msisdn}</p>
                  </div>
                ) : (
                  <>
                    {paymentData.is_qris && paymentData.qris_data?.qr_code && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">Pindai Kode QR di bawah ini:</p>
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
                  </>
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
          <Tabs defaultValue="direct">
            <div className="flex justify-center mb-4">
              <TabsList>
                <TabsTrigger value="direct">Pembelian Langsung</TabsTrigger>
                <TabsTrigger value="scheduled">Pembelian Terjadwal</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="direct">
              <Card>
                <CardHeader>
                  <CardTitle>Pembelian Paket</CardTitle>
                  <CardDescription>Pilih paket, masukkan nomor, dan selesaikan pembayaran.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1: Select Package */}
                  <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Langkah 1: Pilih Paket</h3>
                <PackageSelector
                  officialPackages={officialPackages}
                  unofficialPackages={unofficialPackages}
                  selectedCode={selectedPackageCode}
                  onSelect={(code) => {
                    setSelectedPackageCode(code);
                    setError(''); // Clear error on new selection
                  }}
                />
                {selectedPackage && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                    <h4 className="font-semibold">Deskripsi Paket:</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedPackage.description}</p>
                    <p className="text-sm pt-2">
                      <strong>Biaya Layanan:</strong> Rp{(selectedPackage.fee || 0).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Dynamic Steps based on selected package */}
              {selectedPackage && (
                <>
                  {/* --- UNOFFICIAL FLOW --- */}
                  {selectedPackage.kategori === 'tidak resmi' && (
                    <>
                      {isLoggedIn && accountInfo && (
                        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg flex items-center gap-2 text-green-800 dark:text-green-300">
                                <CheckCircle className="h-5 w-5" /> Info Akun
                              </CardTitle>
                              <Button variant="outline" size="sm" onClick={handleCheckActivePackages} disabled={isCheckingPackages}>
                                {isCheckingPackages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Cek Paket Anda
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-1 text-sm">
                            <p><strong>Nomor:</strong> {accountInfo.msisdn}</p>
                            <p><strong>Pulsa:</strong> {accountInfo.pulsa_real}</p>
                            <p><strong>Aktif Sampai:</strong> {accountInfo.active_until}</p>

                            {isCheckingPackages && (
                              <div className="flex justify-center items-center pt-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            )}
                            {activePackages.length > 0 && (
                              <div className="pt-4 mt-2 border-t">
                                <h4 className="font-semibold mb-2 text-base">Paket Aktif:</h4>
                                <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                                  {activePackages.map((pkg, index) => (
                                    <div key={index} className="text-xs p-2 bg-muted/50 rounded-md">
                                      <p className="font-bold">{pkg.name}</p>
                                      <p>Expired: {pkg.expired_at}</p>
                                      <div className="pl-2 mt-1 border-l-2">
                                        {pkg.benefits.map((benefit, bIndex) => (
                                          <p key={bIndex}>- {benefit.name}: {benefit.remaining_quota}</p>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">Langkah 2: Login Akun XL</h3>
                        {isOtpSent && !isLoggedIn && (
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                            <p className="text-sm text-muted-foreground">OTP dikirim ke <span className="font-medium">{phone}</span></p>
                            <Button variant="ghost" size="sm" onClick={() => { setIsOtpSent(false); setAuthId(''); setOtp(''); setError(''); setPhone(''); }} disabled={loading}>
                              <X className="h-4 w-4 mr-1" /> Ganti Nomor
                            </Button>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone-number">Nomor HP XL</Label>
                            <Input id="phone-number" type="tel" placeholder="628xxxxx" value={phone} onChange={(e) => setPhone(normalizePhoneNumber(e.target.value))} disabled={loading || isLoggedIn || (isOtpSent && !isLoggedIn)} className={isOtpSent && !isLoggedIn ? 'bg-muted cursor-not-allowed' : ''} />
                          </div>
                          <div>
                            <Label htmlFor="login-method">Metode Login</Label>
                            <Select value={loginType} onValueChange={(value: 'otp' | 'msisdn') => { setLoginType(value); setIsOtpSent(false); }} disabled={loading || isLoggedIn || (isOtpSent && !isLoggedIn)}>
                              <SelectTrigger id="login-method" className={isOtpSent && !isLoggedIn ? 'opacity-50' : ''}><SelectValue placeholder="Pilih metode login" /></SelectTrigger>
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
                              <Input id="otp-input" type="text" placeholder="Masukkan OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} disabled={!isOtpSent || loading || isLoggedIn} />
                            </div>
                            <Button onClick={handleVerifyOTP} disabled={!otp || loading || isLoggedIn}>{loading && loginType === 'otp' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Verifikasi</Button>
                          </div>
                        )}
                        {!isLoggedIn && <Button onClick={handleLogin} disabled={loading || !phone} className="w-full">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {loginType === 'otp' ? 'Kirim OTP' : 'Login'}</Button>}
                      </div>

                      <div className={`space-y-4 p-4 border rounded-lg transition-opacity ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <h3 className="font-semibold text-lg">Langkah 3: Pembayaran</h3>
                        {selectedPackage?.payment_method === 'pulsa' ? (
                          <div><p className="text-sm text-muted-foreground">Paket ini akan dibayar menggunakan pulsa Anda.</p></div>
                        ) : (
                          <div>
                            <Label>Metode Pembayaran</Label>
                            <RadioGroup value={paymentMethod} onValueChange={(value: 'DANA' | 'QRIS') => setPaymentMethod(value)} className="flex gap-4 mt-2">
                              <div className="flex items-center space-x-2"><RadioGroupItem value="DANA" id="dana" disabled={!selectedPackage || !isLoggedIn} /><Label htmlFor="dana">DANA</Label></div>
                              <div className="flex items-center space-x-2"><RadioGroupItem value="QRIS" id="qris" disabled={!selectedPackage || !isLoggedIn} /><Label htmlFor="qris">QRIS</Label></div>
                            </RadioGroup>
                          </div>
                        )}
                        <Button onClick={handlePurchase} disabled={!isLoggedIn || isPurchasing} className="w-full">
                          {isPurchasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Beli & Bayar
                        </Button>
                      </div>
                    </>
                  )}

                  {/* --- OFFICIAL FLOW --- */}
                  {selectedPackage.kategori === 'resmi' && (
                    <>
                       <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">Langkah 2: Isi Data & Konfirmasi</h3>
                        <div>
                          <Label htmlFor="official-phone-number">Nomor HP XL Tujuan</Label>
                          <Input id="official-phone-number" type="tel" placeholder="628xxxxx" value={officialPhone} onChange={e => setOfficialPhone(normalizePhoneNumber(e.target.value))} disabled={isPurchasing} />
                        </div>
                        <p className="text-sm text-muted-foreground pt-2">Pembelian paket ini akan langsung memotong saldo Anda di website.</p>
                        <Button onClick={handlePurchase} disabled={!officialPhone || isPurchasing} className="w-full">
                          {isPurchasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Beli dengan Saldo
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled">
               <Card>
                <CardHeader>
                  <CardTitle>Jadwalkan Pembelian Paket</CardTitle>
                  <CardDescription>Atur jadwal pembelian paket untuk masa mendatang. Saldo akan dipotong dan paket akan masuk secara otomatis pada pukul 00:10 di tanggal yang ditentukan.</CardDescription>
                </CardHeader>
                <CardContent>
                  <XLScheduledPurchase />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
