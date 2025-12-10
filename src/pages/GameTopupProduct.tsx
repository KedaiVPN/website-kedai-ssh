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
  };

  const handleConfirmTopup = () => {
    if (!selectedProduct) {
      toast.error('Pilih produk terlebih dahulu');
      return;
    }
    if (!customerId.trim()) {
      toast.error('Masukkan ID pelanggan');
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
    
    setIsProcessing(true);
    try {
      const result = await digiflazzService.createTopup(
        selectedProduct.buyer_sku_code,
        customerId.trim()
      );

      if (result.success) {
        toast.success(result.message || 'Topup berhasil diproses');
        setShowConfirmDialog(false);
        setSelectedProduct(null);
        setCustomerId('');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
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
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Pilih Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : products.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Tidak ada produk tersedia untuk game ini
                    </p>
                  ) : (
                    products.map(product => (
                      <div
                        key={product.buyer_sku_code}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedProduct?.buyer_sku_code === product.buyer_sku_code
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm'
                        }`}
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{product.product_name}</p>
                            <p className="text-xs text-muted-foreground">{product.buyer_sku_code}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{formatRupiah(product.selling_price)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

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
                      <Label htmlFor="customer-id">ID Pelanggan *</Label>
                      <Input
                        id="customer-id"
                        placeholder="Masukkan User ID / Zone ID"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Pastikan ID yang dimasukkan benar
                      </p>
                    </div>

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
                  <span className="text-muted-foreground">ID Pelanggan</span>
                  <span className="font-medium">{customerId}</span>
                </div>
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
