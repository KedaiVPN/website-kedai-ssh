import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, ChevronRight, Loader2, Gamepad2 } from 'lucide-react';
import { digiflazzService, DigiflazzProduct, DigiflazzBrand } from '@/services/digiflazzService';
import { balanceService } from '@/services/balanceService';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { formatRupiah } from '@/constants/pricing';

const GameTopupProduct = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [products, setProducts] = useState<DigiflazzProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DigiflazzProduct | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [requiresZoneId, setRequiresZoneId] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [balance, setBalance] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [brandName, setBrandName] = useState<string>('');

  useEffect(() => {
    // Get brand name from state or try to get from brands list
    const stateBrand = location.state?.brand as string;
    if (stateBrand) {
      setBrandName(stateBrand);
      loadProducts(stateBrand);
    } else {
      // Try to find brand from slug
      loadBrandFromSlug();
    }
    loadBalance();
  }, [slug, location.state]);

  const loadBrandFromSlug = async () => {
    try {
      const brands = await digiflazzService.getBrands();
      const matchingBrand = brands.find(b => {
        const brandSlug = b.brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return brandSlug === slug;
      });
      
      if (matchingBrand) {
        setBrandName(matchingBrand.brand);
        loadProducts(matchingBrand.brand);
      } else {
        toast.error('Game tidak ditemukan');
        navigate('/topupgame');
      }
    } catch (error) {
      console.error('Error loading brand:', error);
      navigate('/topupgame');
    }
  };

  const loadBalance = async () => {
    try {
      const data = await balanceService.getBalance();
      setBalance(data.balance);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadProducts = async (brand: string) => {
    setIsLoading(true);
    try {
      const data = await digiflazzService.getProducts(undefined, brand);
      setProducts(data);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat produk');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = (product: DigiflazzProduct) => {
    setSelectedProduct(product);

    // Reset fields
    setCustomerId('');
    setZoneId('');

    // Check if product description or brand requires zone id
    const description = product.description?.toLowerCase() || '';
    const brand = product.brand?.toLowerCase() || '';
    if (brand.includes('mobile legends') || description.includes('(zone') || description.includes('(server') || description.includes('zone id')) {
      setRequiresZoneId(true);
    } else {
      setRequiresZoneId(false);
    }
  };

  const handleConfirmTopup = () => {
    if (!selectedProduct) {
      toast.error('Pilih produk terlebih dahulu');
      return;
    }
    if (!customerId.trim()) {
      toast.error(requiresZoneId ? 'Masukkan User ID' : 'Masukkan ID Pelanggan');
      return;
    }
    if (requiresZoneId && !zoneId.trim()) {
      toast.error('Masukkan Zone ID / Server');
      return;
    }
    if (balance < selectedProduct.selling_price) {
      toast.error('Saldo tidak mencukupi');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleProcessTopup = async () => {
    if (!selectedProduct) return;

    // Clean and combine IDs
    const cleanCustomerId = customerId.replace(/\D/g, '');
    const cleanZoneId = zoneId.replace(/\D/g, '');

    const finalCustomerId = requiresZoneId
      ? `${cleanCustomerId}${cleanZoneId}`
      : cleanCustomerId;
    
    setIsProcessing(true);
    try {
      const result = await digiflazzService.createTopup(
        selectedProduct.buyer_sku_code,
        finalCustomerId
      );

      if (result.success) {
        toast.success(result.message || 'Topup berhasil diproses');
        setShowConfirmDialog(false);
        setSelectedProduct(null);
        setCustomerId('');
        setZoneId('');
        setRefreshTrigger(prev => prev + 1);
        loadBalance();
      } else {
        toast.error(result.message || 'Topup gagal');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memproses topup');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button & Title */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/topupgame')}
              className="mb-4 text-primary hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke daftar game
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{brandName || 'Loading...'}</h1>
                <p className="text-muted-foreground">Pilih produk yang ingin dibeli</p>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="mb-6">
            <BalanceDisplay refreshTrigger={refreshTrigger} onBalanceChange={setBalance} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product List */}
            <div className="lg:col-span-2 space-y-4">
               <h2 className="text-xl font-semibold">Pilih Nominal Top Up</h2>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Tidak ada produk tersedia untuk game ini
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products.map(product => {
                      const imageUrl = product.product_image_url || product.brand_image_url;
                      return (
                        <div
                          key={product.buyer_sku_code}
                          className={`group cursor-pointer rounded-xl border bg-card transition-all duration-300 relative aspect-[4/3] overflow-hidden ${
                            selectedProduct?.buyer_sku_code === product.buyer_sku_code
                            ? 'border-primary ring-2 ring-primary/50'
                            : 'hover:border-primary/50'
                          }`}
                          onClick={() => handleSelectProduct(product)}
                        >
                          {/* Background Image or Fallback */}
                          {imageUrl ? (
                            <img src={imageUrl} alt={product.product_name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center transition-all duration-300">
                              <Gamepad2 className="h-10 w-10 text-primary/50" />
                            </div>
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                          {/* Text Content */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                            <p className="text-sm font-semibold [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)] line-clamp-2">
                              {product.product_name}
                            </p>
                            <p className="text-xs font-bold text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">
                              {formatRupiah(product.selling_price)}
                            </p>
                          </div>

                           {/* Checkmark overlay */}
                          {selectedProduct?.buyer_sku_code === product.buyer_sku_code && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Detail Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProduct ? (
                  <>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Produk</p>
                      <p className="font-semibold">{selectedProduct.product_name}</p>
                      <p className="text-xs text-muted-foreground">{brandName}</p>
                    </div>

                    <div>
                      <Label htmlFor="customer-id">
                        {requiresZoneId ? 'User ID *' : 'ID Pelanggan *'}
                      </Label>
                      <Input
                        id="customer-id"
                        placeholder={requiresZoneId ? 'Masukkan User ID' : 'Masukkan Player ID'}
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {requiresZoneId && (
                      <div>
                        <Label htmlFor="zone-id">Zone ID / Server *</Label>
                        <Input
                          id="zone-id"
                          placeholder="Masukkan Zone ID / Server"
                          value={zoneId}
                          onChange={(e) => setZoneId(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground -mt-2">
                      Pastikan ID yang dimasukkan benar
                    </p>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harga</span>
                        <span className="font-semibold">{formatRupiah(selectedProduct.selling_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Saldo Anda</span>
                        <span className={balance >= selectedProduct.selling_price ? 'text-green-600' : 'text-red-600'}>
                          {formatRupiah(balance)}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleConfirmTopup}
                      disabled={!customerId.trim() || balance < selectedProduct.selling_price}
                    >
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Proses Topup
                    </Button>

                    {balance < selectedProduct.selling_price && (
                      <p className="text-xs text-red-500 text-center">
                        Saldo tidak mencukupi. Silakan topup saldo terlebih dahulu.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Pilih produk untuk melihat detail pesanan
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Topup</DialogTitle>
            <DialogDescription>
              Pastikan data berikut sudah benar sebelum melanjutkan
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Game</span>
                  <span className="font-medium">{brandName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produk</span>
                  <span className="font-medium">{selectedProduct.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{requiresZoneId ? 'User ID' : 'ID Pelanggan'}</span>
                  <span className="font-medium">{customerId.replace(/\D/g, '')}</span>
                </div>
                {requiresZoneId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zone ID</span>
                    <span className="font-medium">{zoneId.replace(/\D/g, '')}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">{formatRupiah(selectedProduct.selling_price)}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Saldo akan dipotong sebesar {formatRupiah(selectedProduct.selling_price)}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isProcessing}>
              Batal
            </Button>
            <Button onClick={handleProcessTopup} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konfirmasi & Bayar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default GameTopupProduct;
