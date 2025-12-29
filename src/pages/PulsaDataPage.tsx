import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { digiflazzService, DigiflazzBrand, DigiflazzProduct, TelcoTransaction } from '@/services/digiflazzService';
import { toast } from 'sonner';
import { formatRupiah } from '@/constants/pricing';
import { Loader2, Smartphone, Wifi, History, CheckCircle, XCircle, Clock, Search, ShoppingCart } from 'lucide-react';

const PulsaDataPage = () => {
  const [pulsaBrands, setPulsaBrands] = useState<DigiflazzBrand[]>([]);
  const [dataBrands, setDataBrands] = useState<DigiflazzBrand[]>([]);
  const [pulsaProducts, setPulsaProducts] = useState<DigiflazzProduct[]>([]);
  const [dataProducts, setDataProducts] = useState<DigiflazzProduct[]>([]);
  const [selectedPulsaBrand, setSelectedPulsaBrand] = useState<string>('all');
  const [selectedDataBrand, setSelectedDataBrand] = useState<string>('all');
  const [pulsaSearch, setPulsaSearch] = useState('');
  const [dataSearch, setDataSearch] = useState('');
  const [isLoadingPulsa, setIsLoadingPulsa] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [transactions, setTransactions] = useState<TelcoTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [refreshTrigger] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<DigiflazzProduct | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<'pulsa' | 'data' | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [customerNumber, setCustomerNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadBrands();
    loadHistory();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadPulsaProducts();
    }, 250);
    return () => clearTimeout(debounce);
  }, [selectedPulsaBrand, pulsaSearch]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadDataProducts();
    }, 250);
    return () => clearTimeout(debounce);
  }, [selectedDataBrand, dataSearch]);

  const loadBrands = async () => {
    try {
      const [pulsa, data] = await Promise.all([
        digiflazzService.getPulsaBrands(),
        digiflazzService.getDataBrands()
      ]);
      setPulsaBrands(pulsa);
      setDataBrands(data);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat daftar operator');
    }
  };

  const loadPulsaProducts = async () => {
    setIsLoadingPulsa(true);
    try {
      const brand = selectedPulsaBrand === 'all' ? undefined : selectedPulsaBrand;
      const products = await digiflazzService.getPulsaProducts(brand, pulsaSearch);
      setPulsaProducts(products);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat produk pulsa');
    } finally {
      setIsLoadingPulsa(false);
    }
  };

  const loadDataProducts = async () => {
    setIsLoadingData(true);
    try {
      const brand = selectedDataBrand === 'all' ? undefined : selectedDataBrand;
      const products = await digiflazzService.getDataProducts(brand, dataSearch);
      setDataProducts(products);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat produk paket data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await digiflazzService.getTelcoHistory(20);
      setTransactions(data);
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error(error.message || 'Gagal memuat riwayat transaksi pulsa/paket data');
    } finally {
      setIsLoadingHistory(false);
    }
  };

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

  const handleBuyClick = (product: DigiflazzProduct, type: 'pulsa' | 'data') => {
    setSelectedProduct(product);
    setSelectedProductType(type);
    setCustomerNumber('');
    setIsBuyModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isProcessing) return;
    setIsBuyModalOpen(false);
    setSelectedProduct(null);
    setSelectedProductType(null);
    setCustomerNumber('');
  };

  const handleConfirmBuy = async () => {
    if (!selectedProduct || !selectedProductType) {
      toast.error('Pilih produk terlebih dahulu');
      return;
    }
    const cleanNumber = customerNumber.trim();

    if (!cleanNumber) {
      toast.error('Masukkan nomor tujuan terlebih dahulu');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await digiflazzService.createTelcoTopup(
        selectedProduct.buyer_sku_code,
        cleanNumber,
        selectedProductType
      );

      if (result.success) {
        toast.success(result.message || 'Pembelian berhasil diproses');
        handleCloseModal();
        loadHistory();
      } else {
        toast.error(result.message || 'Pembelian gagal');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memproses pembelian');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderProductCard = (product: DigiflazzProduct, type: 'pulsa' | 'data') => (
    <Card key={product.buyer_sku_code} className="border shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{product.brand}</Badge>
            <span className="text-xs text-muted-foreground">{product.category}</span>
          </div>
          <span className="text-sm font-semibold text-primary">{formatRupiah(product.selling_price)}</span>
        </div>
        <p className="font-semibold leading-snug line-clamp-2">{product.product_name}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description || 'Masa aktif akan ditampilkan di sini.'}
        </p>
        <div className="pt-1">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleBuyClick(product, type)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <BalanceDisplay refreshTrigger={refreshTrigger} onBalanceChange={() => {}} />
          </div>

          <Tabs defaultValue="data" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Paket Data
              </TabsTrigger>
              <TabsTrigger value="pulsa" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Pulsa
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Riwayat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paket Data</CardTitle>
                  <CardDescription>Pilih operator dan paket data sesuai kebutuhan Anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="data-operator">Operator</Label>
                      <Select value={selectedDataBrand} onValueChange={setSelectedDataBrand}>
                        <SelectTrigger id="data-operator">
                          <SelectValue placeholder="Semua operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Operator</SelectItem>
                          {dataBrands.map(brand => (
                            <SelectItem key={brand.brand} value={brand.brand}>{brand.brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="data-search">Cari Paket Data</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="data-search"
                          placeholder="Cari paket..."
                          value={dataSearch}
                          onChange={(e) => setDataSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {isLoadingData ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : dataProducts.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                      Tidak ada paket data yang tersedia untuk filter ini.
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dataProducts.map(product => renderProductCard(product, 'data'))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pulsa" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pulsa</CardTitle>
                  <CardDescription>Pilih operator dan nominal pulsa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="pulsa-operator">Operator</Label>
                      <Select value={selectedPulsaBrand} onValueChange={setSelectedPulsaBrand}>
                        <SelectTrigger id="pulsa-operator">
                          <SelectValue placeholder="Semua operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Operator</SelectItem>
                          {pulsaBrands.map(brand => (
                            <SelectItem key={brand.brand} value={brand.brand}>{brand.brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="pulsa-search">Cari Pulsa</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pulsa-search"
                          placeholder="Cari pulsa..."
                          value={pulsaSearch}
                          onChange={(e) => setPulsaSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {isLoadingPulsa ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : pulsaProducts.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                      Tidak ada produk pulsa yang tersedia untuk filter ini.
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pulsaProducts.map(product => renderProductCard(product, 'pulsa'))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Transaksi</CardTitle>
                  <CardDescription>Riwayat pembelian terbaru Anda</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Belum ada riwayat transaksi</p>
                  ) : (
                    <ScrollArea className="h-[420px] pr-4">
                      <div className="space-y-3">
                        {transactions.map(tx => (
                          <div key={tx.id} className="p-4 rounded-lg border bg-card">
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
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog
        open={isBuyModalOpen}
        onOpenChange={(open) => {
          if (isProcessing) return;
          if (!open) {
            handleCloseModal();
          } else {
            setIsBuyModalOpen(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembelian</DialogTitle>
            <DialogDescription>
              Masukkan nomor tujuan untuk melanjutkan pembelian {selectedProductType === 'data' ? 'paket data' : 'pulsa'}.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produk</span>
                  <span className="font-medium text-right">{selectedProduct.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operator</span>
                  <span className="font-medium">{selectedProduct.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga</span>
                  <span className="font-semibold text-primary">{formatRupiah(selectedProduct.selling_price)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-number">Nomor Tujuan</Label>
                <Input
                  id="customer-number"
                  placeholder="Masukkan nomor handphone"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCloseModal}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleConfirmBuy}
              disabled={isProcessing || !customerNumber.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Buy'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PulsaDataPage;
