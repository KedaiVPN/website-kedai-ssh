import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RefreshCw, Search, Package, History, Edit2, Check, X, Loader2 } from 'lucide-react';
import { digiflazzService, DigiflazzProduct, GameTopupTransaction } from '@/services/digiflazzService';
import { formatRupiah } from '@/constants/pricing';

const DigiflazzManager = () => {
  const [products, setProducts] = useState<DigiflazzProduct[]>([]);
  const [pulsaProducts, setPulsaProducts] = useState<DigiflazzProduct[]>([]);
  const [dataProducts, setDataProducts] = useState<DigiflazzProduct[]>([]);
  const [transactions, setTransactions] = useState<GameTopupTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPulsa, setIsLoadingPulsa] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingTelco, setIsSyncingTelco] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pulsaSearchTerm, setPulsaSearchTerm] = useState('');
  const [dataSearchTerm, setDataSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [pulsaFilterBrand, setPulsaFilterBrand] = useState<string>('all');
  const [dataFilterBrand, setDataFilterBrand] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingPulsaProduct, setEditingPulsaProduct] = useState<string | null>(null);
  const [editingDataProduct, setEditingDataProduct] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editPulsaPrice, setEditPulsaPrice] = useState<number>(0);
  const [editDataPrice, setEditDataPrice] = useState<number>(0);
  const [brands, setBrands] = useState<string[]>([]);
  const [pulsaBrands, setPulsaBrands] = useState<string[]>([]);
  const [dataBrands, setDataBrands] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
    loadPulsaProducts();
    loadDataProducts();
    loadTransactions();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await digiflazzService.getAdminProducts();
      setProducts(data);
      const uniqueBrands = [...new Set(data.map(p => p.brand))].sort();
      setBrands(uniqueBrands);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat produk');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPulsaProducts = async () => {
    setIsLoadingPulsa(true);
    try {
      const data = await digiflazzService.getAdminPulsaProducts();
      setPulsaProducts(data);
      const uniqueBrands = [...new Set(data.map(p => p.brand))].sort();
      setPulsaBrands(uniqueBrands);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat produk pulsa');
    } finally {
      setIsLoadingPulsa(false);
    }
  };

  const loadDataProducts = async () => {
    setIsLoadingData(true);
    try {
      const data = await digiflazzService.getAdminDataProducts();
      setDataProducts(data);
      const uniqueBrands = [...new Set(data.map(p => p.brand))].sort();
      setDataBrands(uniqueBrands);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat produk paket data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await digiflazzService.getAdminTransactions(100);
      setTransactions(data);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await digiflazzService.syncProducts();
      toast.success(result.message);
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Gagal sync produk');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncPulsa = async () => {
    setIsSyncingTelco(true);
    try {
      const pulsaResult = await digiflazzService.syncPulsaProducts();
      toast.success(`Pulsa: ${pulsaResult.new ?? 0} produk baru, ${pulsaResult.updated ?? 0} diperbarui`);
      loadPulsaProducts();
    } catch (error: any) {
      toast.error(error.message || 'Gagal sync pulsa');
    } finally {
      setIsSyncingTelco(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncingTelco(true);
    try {
      const dataResult = await digiflazzService.syncDataProducts();
      toast.success(`Paket Data: ${dataResult.new ?? 0} produk baru, ${dataResult.updated ?? 0} diperbarui`);
      loadDataProducts();
    } catch (error: any) {
      toast.error(error.message || 'Gagal sync paket data');
    } finally {
      setIsSyncingTelco(false);
    }
  };

  const handleToggleActive = async (product: DigiflazzProduct) => {
    try {
      await digiflazzService.updateProduct(product.buyer_sku_code, {
        is_active: !product.is_active
      });
      setProducts(products.map(p =>
        p.buyer_sku_code === product.buyer_sku_code
          ? { ...p, is_active: !p.is_active }
          : p
      ));
      toast.success(`Produk ${!product.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupdate produk');
    }
  };

  const handleEditPrice = (product: DigiflazzProduct) => {
    setEditingProduct(product.buyer_sku_code);
    setEditPrice(product.selling_price);
  };

  const handleSavePrice = async (sku: string) => {
    try {
      await digiflazzService.updateProduct(sku, { selling_price: editPrice });
      setProducts(products.map(p =>
        p.buyer_sku_code === sku
          ? { ...p, selling_price: editPrice }
          : p
      ));
      setEditingProduct(null);
      toast.success('Harga jual berhasil diupdate');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupdate harga');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditPrice(0);
  };

  const handleTogglePulsaActive = async (product: DigiflazzProduct) => {
    try {
      await digiflazzService.updatePulsaProduct(product.buyer_sku_code, {
        is_active: !product.is_active
      });
      setPulsaProducts(pulsaProducts.map(p =>
        p.buyer_sku_code === product.buyer_sku_code
          ? { ...p, is_active: !p.is_active }
          : p
      ));
      toast.success(`Produk pulsa ${!product.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupdate produk pulsa');
    }
  };

  const handleToggleDataActive = async (product: DigiflazzProduct) => {
    try {
      await digiflazzService.updateDataProduct(product.buyer_sku_code, {
        is_active: !product.is_active
      });
      setDataProducts(dataProducts.map(p =>
        p.buyer_sku_code === product.buyer_sku_code
          ? { ...p, is_active: !p.is_active }
          : p
      ));
      toast.success(`Produk paket data ${!product.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupdate produk paket data');
    }
  };

  const handleEditPulsaPrice = (product: DigiflazzProduct) => {
    setEditingPulsaProduct(product.buyer_sku_code);
    setEditPulsaPrice(product.selling_price);
  };

  const handleEditDataPrice = (product: DigiflazzProduct) => {
    setEditingDataProduct(product.buyer_sku_code);
    setEditDataPrice(product.selling_price);
  };

  const handleSavePulsaPrice = async (sku: string) => {
    try {
      await digiflazzService.updatePulsaProduct(sku, { selling_price: editPulsaPrice });
      setPulsaProducts(pulsaProducts.map(p =>
        p.buyer_sku_code === sku
          ? { ...p, selling_price: editPulsaPrice }
          : p
      ));
      setEditingPulsaProduct(null);
      toast.success('Harga jual pulsa berhasil diupdate');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupdate harga pulsa');
    }
  };

  const handleSaveDataPrice = async (sku: string) => {
    try {
      await digiflazzService.updateDataProduct(sku, { selling_price: editDataPrice });
      setDataProducts(dataProducts.map(p =>
        p.buyer_sku_code === sku
          ? { ...p, selling_price: editDataPrice }
          : p
      ));
      setEditingDataProduct(null);
      toast.success('Harga jual paket data berhasil diupdate');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupdate harga paket data');
    }
  };

  const handleCancelPulsaEdit = () => {
    setEditingPulsaProduct(null);
    setEditPulsaPrice(0);
  };

  const handleCancelDataEdit = () => {
    setEditingDataProduct(null);
    setEditDataPrice(0);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.buyer_sku_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'all' || product.brand === filterBrand;
    return matchesSearch && matchesBrand;
  });

  const filteredPulsaProducts = pulsaProducts.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(pulsaSearchTerm.toLowerCase()) ||
                         product.buyer_sku_code.toLowerCase().includes(pulsaSearchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(pulsaSearchTerm.toLowerCase());
    const matchesBrand = pulsaFilterBrand === 'all' || product.brand === pulsaFilterBrand;
    return matchesSearch && matchesBrand;
  });

  const filteredDataProducts = dataProducts.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(dataSearchTerm.toLowerCase()) ||
                         product.buyer_sku_code.toLowerCase().includes(dataSearchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(dataSearchTerm.toLowerCase());
    const matchesBrand = dataFilterBrand === 'all' || product.brand === dataFilterBrand;
    return matchesSearch && matchesBrand;
  });

  const filteredTransactions = transactions.filter(tx => {
    return filterStatus === 'all' || tx.digiflazz_status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sukses':
        return <Badge className="bg-green-500">Sukses</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'Gagal':
        return <Badge className="bg-red-500">Gagal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produk
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transaksi
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manajemen Produk Digiflazz</CardTitle>
                  <CardDescription>
                    Kelola produk game topup, pulsa, dan paket data dari Digiflazz
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleSync} disabled={isSyncing}>
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync Game
                  </Button>
                  <Button onClick={handleSyncPulsa} disabled={isSyncingTelco} variant="outline">
                    {isSyncingTelco ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync Pulsa
                  </Button>
                  <Button onClick={handleSyncData} disabled={isSyncingTelco} variant="outline">
                    {isSyncingTelco ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync Paket Data
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Cari Produk</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Cari nama produk, SKU, atau brand..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="brand-filter">Filter Brand</Label>
                  <Select value={filterBrand} onValueChange={setFilterBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Brand</SelectItem>
                      {brands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Table */}
              <ScrollArea className="h-[600px] rounded-md border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Harga Beli</TableHead>
                        <TableHead className="text-right">Harga Jual</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-center">Aktif</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {products.length === 0
                              ? 'Belum ada produk. Klik "Sync Produk" untuk mengambil data dari Digiflazz.'
                              : 'Tidak ada produk yang cocok dengan filter.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map(product => (
                          <TableRow key={product.buyer_sku_code}>
                            <TableCell className="font-mono text-xs">{product.buyer_sku_code}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={product.product_name}>
                              {product.product_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{product.brand}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatRupiah(product.price)}</TableCell>
                            <TableCell className="text-right">
                              {editingProduct === product.buyer_sku_code ? (
                                <Input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(Number(e.target.value))}
                                  className="w-28 text-right"
                                />
                              ) : (
                                formatRupiah(product.selling_price)
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={product.selling_price > product.price ? 'text-green-600' : 'text-red-600'}>
                                {formatRupiah(product.selling_price - product.price)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={product.is_active}
                                onCheckedChange={() => handleToggleActive(product)}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {editingProduct === product.buyer_sku_code ? (
                                <div className="flex justify-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleSavePrice(product.buyer_sku_code)}
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditPrice(product)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>

              <p className="text-sm text-muted-foreground">
                Total: {filteredProducts.length} produk | Aktif: {filteredProducts.filter(p => p.is_active).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produk Pulsa</CardTitle>
              <CardDescription>Kelola produk pulsa Digiflazz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="pulsa-search">Cari Produk</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pulsa-search"
                      placeholder="Cari nama produk, SKU, atau brand..."
                      value={pulsaSearchTerm}
                      onChange={(e) => setPulsaSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="pulsa-brand-filter">Filter Brand</Label>
                  <Select value={pulsaFilterBrand} onValueChange={setPulsaFilterBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Brand</SelectItem>
                      {pulsaBrands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ScrollArea className="h-[500px] rounded-md border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Harga Beli</TableHead>
                        <TableHead className="text-right">Harga Jual</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-center">Aktif</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingPulsa ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredPulsaProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {pulsaProducts.length === 0
                              ? 'Belum ada produk pulsa. Klik "Sync Pulsa" untuk mengambil data dari Digiflazz.'
                              : 'Tidak ada produk pulsa yang cocok dengan filter.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPulsaProducts.map(product => (
                          <TableRow key={product.buyer_sku_code}>
                            <TableCell className="font-mono text-xs">{product.buyer_sku_code}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={product.product_name}>
                              {product.product_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{product.brand}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatRupiah(product.price)}</TableCell>
                            <TableCell className="text-right">
                              {editingPulsaProduct === product.buyer_sku_code ? (
                                <Input
                                  type="number"
                                  value={editPulsaPrice}
                                  onChange={(e) => setEditPulsaPrice(Number(e.target.value))}
                                  className="w-28 text-right"
                                />
                              ) : (
                                formatRupiah(product.selling_price)
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={product.selling_price > product.price ? 'text-green-600' : 'text-red-600'}>
                                {formatRupiah(product.selling_price - product.price)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={product.is_active}
                                onCheckedChange={() => handleTogglePulsaActive(product)}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {editingPulsaProduct === product.buyer_sku_code ? (
                                <div className="flex justify-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleSavePulsaPrice(product.buyer_sku_code)}
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleCancelPulsaEdit}
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditPulsaPrice(product)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>

              <p className="text-sm text-muted-foreground">
                Total: {filteredPulsaProducts.length} produk | Aktif: {filteredPulsaProducts.filter(p => p.is_active).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produk Paket Data</CardTitle>
              <CardDescription>Kelola produk paket data Digiflazz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="data-search">Cari Produk</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="data-search"
                      placeholder="Cari nama produk, SKU, atau brand..."
                      value={dataSearchTerm}
                      onChange={(e) => setDataSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="data-brand-filter">Filter Brand</Label>
                  <Select value={dataFilterBrand} onValueChange={setDataFilterBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Brand</SelectItem>
                      {dataBrands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ScrollArea className="h-[500px] rounded-md border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Harga Beli</TableHead>
                        <TableHead className="text-right">Harga Jual</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-center">Aktif</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingData ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredDataProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {dataProducts.length === 0
                              ? 'Belum ada produk paket data. Klik "Sync Paket Data" untuk mengambil data dari Digiflazz.'
                              : 'Tidak ada produk paket data yang cocok dengan filter.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDataProducts.map(product => (
                          <TableRow key={product.buyer_sku_code}>
                            <TableCell className="font-mono text-xs">{product.buyer_sku_code}</TableCell>
                            <TableCell className="max-w/[200px] truncate" title={product.product_name}>
                              {product.product_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{product.brand}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatRupiah(product.price)}</TableCell>
                            <TableCell className="text-right">
                              {editingDataProduct === product.buyer_sku_code ? (
                                <Input
                                  type="number"
                                  value={editDataPrice}
                                  onChange={(e) => setEditDataPrice(Number(e.target.value))}
                                  className="w-28 text-right"
                                />
                              ) : (
                                formatRupiah(product.selling_price)
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={product.selling_price > product.price ? 'text-green-600' : 'text-red-600'}>
                                {formatRupiah(product.selling_price - product.price)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={product.is_active}
                                onCheckedChange={() => handleToggleDataActive(product)}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {editingDataProduct === product.buyer_sku_code ? (
                                <div className="flex justify-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleSaveDataPrice(product.buyer_sku_code)}
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleCancelDataEdit}
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditDataPrice(product)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>

              <p className="text-sm text-muted-foreground">
                Total: {filteredDataProducts.length} produk | Aktif: {filteredDataProducts.filter(p => p.is_active).length}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi Game Topup</CardTitle>
              <CardDescription>
                Semua transaksi game topup dari user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter */}
              <div className="w-full sm:w-48">
                <Label htmlFor="status-filter">Filter Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Sukses">Sukses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Gagal">Gagal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transactions Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Customer No</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>SN</TableHead>
                      <TableHead>Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Belum ada transaksi
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs">{tx.ref_id}</TableCell>
                          <TableCell>{tx.username || '-'}</TableCell>
                          <TableCell className="max-w/[150px] truncate" title={tx.product_name}>
                            {tx.product_name}
                          </TableCell>
                          <TableCell>{tx.customer_no}</TableCell>
                          <TableCell className="text-right">{formatRupiah(tx.selling_price)}</TableCell>
                          <TableCell className="text-center">{getStatusBadge(tx.digiflazz_status)}</TableCell>
                          <TableCell className="font-mono text-xs max-w/[100px] truncate" title={tx.sn || ''}>
                            {tx.sn || '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(tx.created_at).toLocaleString('id-ID')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DigiflazzManager;
