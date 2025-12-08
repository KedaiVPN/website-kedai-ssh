import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Gamepad2, Search, Wallet, History, ChevronRight, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { digiflazzService, DigiflazzProduct, DigiflazzBrand, GameTopupTransaction } from '@/services/digiflazzService';
import { balanceService } from '@/services/balanceService';
import { formatRupiah } from '@/constants/pricing';
import { BalanceDisplay } from '@/components/BalanceDisplay';

const GameTopup = () => {
  const [brands, setBrands] = useState<DigiflazzBrand[]>([]);
  const [products, setProducts] = useState<DigiflazzProduct[]>([]);
  const [transactions, setTransactions] = useState<GameTopupTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Selection state
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DigiflazzProduct | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [balance, setBalance] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadBrands();
    loadTransactions();
    loadBalance();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadProducts(selectedBrand);
    } else {
      setProducts([]);
    }
    setSelectedProduct(null);
  }, [selectedBrand]);

  const loadBalance = async () => {
    try {
      const data = await balanceService.getBalance();
      setBalance(data.balance);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const data = await digiflazzService.getBrands();
      setBrands(data);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat daftar game');
    } finally {
      setIsLoading(false);
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

  const loadTransactions = async () => {
    try {
      const data = await digiflazzService.getHistory(20);
      setTransactions(data);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
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
        setSelectedBrand(null);
        setRefreshTrigger(prev => prev + 1);
        loadTransactions();
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

  const filteredBrands = brands.filter(brand =>
    brand.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sukses':
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" /> Sukses</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-500 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'Gagal':
        return <Badge className="bg-red-500 gap-1"><XCircle className="h-3 w-3" /> Gagal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 dark:from-slate-950 dark:via-purple-950 dark:to-pink-950">
      <Header />

      <div className="pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Gamepad2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                Game Topup
              </h1>
            </div>
            <p className="text-muted-foreground">
              Top up game favorit kamu dengan harga terbaik menggunakan saldo website
            </p>
          </div>

          {/* Balance Card */}
          <div className="mb-6">
            <BalanceDisplay refreshTrigger={refreshTrigger} onBalanceChange={setBalance} />
          </div>

          <Tabs defaultValue="topup">
            <TabsList className="mb-6">
              <TabsTrigger value="topup" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Topup
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Riwayat
              </TabsTrigger>
            </TabsList>

            {/* Topup Tab */}
            <TabsContent value="topup" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Game Selection */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Pilih Game</CardTitle>
                    <CardDescription>Pilih game yang ingin di-topup</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari game..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Brand Grid */}
                    {!selectedBrand ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {isLoading ? (
                          <div className="col-span-full flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : filteredBrands.length === 0 ? (
                          <p className="col-span-full text-center py-8 text-muted-foreground">
                            {brands.length === 0 ? 'Belum ada game tersedia' : 'Tidak ada game yang cocok'}
                          </p>
                        ) : (
                          filteredBrands.map(brand => (
                            <Button
                              key={brand.brand}
                              variant="outline"
                              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
                              onClick={() => setSelectedBrand(brand.brand)}
                            >
                              <Gamepad2 className="h-8 w-8 text-primary" />
                              <span className="text-sm font-medium text-center line-clamp-2">
                                {brand.brand}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {brand.product_count} produk
                              </span>
                            </Button>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Back button */}
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedBrand(null)}
                          className="text-primary"
                        >
                          ← Kembali ke daftar game
                        </Button>

                        <h3 className="font-semibold text-lg">{selectedBrand}</h3>

                        {/* Product List */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                  selectedProduct?.buyer_sku_code === product.buyer_sku_code
                                    ? 'border-primary bg-primary/5'
                                    : 'hover:border-primary/50'
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
                      </div>
                    )}
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
                          <p className="text-xs text-muted-foreground">{selectedBrand}</p>
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
                        Pilih game dan produk untuk melihat detail pesanan
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Transaksi</CardTitle>
                  <CardDescription>Riwayat topup game Anda</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Belum ada riwayat transaksi
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map(tx => (
                        <div key={tx.id} className="p-4 rounded-lg border">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{tx.product_name}</p>
                              <p className="text-sm text-muted-foreground">ID: {tx.customer_no}</p>
                            </div>
                            {getStatusBadge(tx.digiflazz_status)}
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              {new Date(tx.created_at).toLocaleString('id-ID')}
                            </span>
                            <span className="font-semibold">{formatRupiah(tx.selling_price)}</span>
                          </div>
                          {tx.sn && (
                            <p className="text-xs text-muted-foreground mt-2">
                              SN: {tx.sn}
                            </p>
                          )}
                          {tx.message && tx.digiflazz_status === 'Gagal' && (
                            <p className="text-xs text-red-500 mt-2">
                              {tx.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

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
                  <span className="font-medium">{selectedBrand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produk</span>
                  <span className="font-medium">{selectedProduct.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Pelanggan</span>
                  <span className="font-medium">{customerId}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-primary">{formatRupiah(selectedProduct.selling_price)}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Saldo akan dipotong sebesar {formatRupiah(selectedProduct.selling_price)}. 
                Jika transaksi gagal, saldo akan dikembalikan secara otomatis.
              </p>
            </div>
          )}

          <DialogFooter>
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
    </div>
  );
};

export default GameTopup;
