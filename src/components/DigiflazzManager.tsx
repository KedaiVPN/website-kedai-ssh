import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RefreshCw, Search, Package, History, Edit2, Check, X, Loader2, FileText, CaseSensitive } from 'lucide-react';
import { digiflazzService, DigiflazzProduct, GameTopupTransaction } from '@/services/digiflazzService';
import { formatRupiah } from '@/constants/pricing';
import PulsaDataDescriptionEditor from './PulsaDataDescriptionEditor';

// Definisikan tipe untuk productType agar konsisten
type ProductType = 'game' | 'pulsa' | 'data';

const DigiflazzManager = () => {
  const [products, setProducts] = useState<DigiflazzProduct[]>([]);
  const [pulsaProducts, setPulsaProducts] = useState<DigiflazzProduct[]>([]);
  const [dataProducts, setDataProducts] = useState<DigiflazzProduct[]>([]);
  const [transactions, setTransactions] = useState<GameTopupTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPulsa, setIsLoadingPulsa] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pulsaSearchTerm, setPulsaSearchTerm] = useState('');
  const [dataSearchTerm, setDataSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [pulsaFilterBrand, setPulsaFilterBrand] = useState<string>('all');
  const [dataFilterBrand, setDataFilterBrand] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // State untuk edit harga
  const [editingPrice, setEditingPrice] = useState<{ sku: string; type: ProductType } | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);

  // State untuk edit nama
  const [editingName, setEditingName] = useState<{ sku: string; type: ProductType } | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const [brands, setBrands] = useState<string[]>([]);
  const [pulsaBrands, setPulsaBrands] = useState<string[]>([]);
  const [dataBrands, setDataBrands] = useState<string[]>([]);

  const [editingDescriptionProduct, setEditingDescriptionProduct] = useState<DigiflazzProduct | null>(null);
  const [editingDescriptionType, setEditingDescriptionType] = useState<'pulsa' | 'data' | null>(null);
  const [isDescriptionEditorOpen, setIsDescriptionEditorOpen] = useState(false);

  const [autoSyncSettings, setAutoSyncSettings] = useState({ is_active: true, interval_minutes: 60 });
  const [isSyncSettingsLoading, setIsSyncSettingsLoading] = useState(false);
  const [isSyncSettingsUpdating, setIsSyncSettingsUpdating] = useState(false);

  // Handlers untuk Editor Deskripsi
  const openDescriptionEditor = (product: DigiflazzProduct, type: 'pulsa' | 'data') => {
    setEditingDescriptionProduct(product);
    setEditingDescriptionType(type);
    setIsDescriptionEditorOpen(true);
  };

  const closeDescriptionEditor = () => {
    setEditingDescriptionProduct(null);
    setEditingDescriptionType(null);
    setIsDescriptionEditorOpen(false);
  };

  const handleSaveDescription = async (sku: string, description: string, productType: 'pulsa' | 'data') => {
    try {
      const updater = productType === 'pulsa' ? digiflazzService.updatePulsaProduct : digiflazzService.updateDataProduct;
      await updater(sku, { description });

      const productSetter = productType === 'pulsa' ? setPulsaProducts : setDataProducts;
      productSetter(prev => prev.map(p => p.buyer_sku_code === sku ? { ...p, description } : p));

      toast.success('Deskripsi produk berhasil diperbarui');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan deskripsi');
      throw error;
    }
  };

  // Efek untuk memuat data saat komponen pertama kali dimuat
  useEffect(() => {
    loadProducts();
    loadPulsaProducts();
    loadDataProducts();
    loadTransactions();
    loadAutoSyncSettings();
  }, []);

  // Fungsi-fungsi untuk memuat data dari service
  const loadAutoSyncSettings = async () => {
    setIsSyncSettingsLoading(true);
    try {
      const settings = await digiflazzService.getAutoSyncSettings();
      setAutoSyncSettings(settings);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat pengaturan auto-sync.');
    } finally {
      setIsSyncSettingsLoading(false);
    }
  };

  const handleSyncSettingsChange = async (updates: { is_active?: boolean; interval_minutes?: number }) => {
    const previousSettings = autoSyncSettings;
    const nextSettings = { ...autoSyncSettings, ...updates };
    setAutoSyncSettings(nextSettings);
    setIsSyncSettingsUpdating(true);
    try {
      const result = await digiflazzService.updateAutoSyncSettings(updates);
      if (!result.success) {
        throw new Error(result.message);
      }
      toast.success(result.message || 'Pengaturan auto-sync berhasil diperbarui');
    } catch (error: any) {
      setAutoSyncSettings(previousSettings);
      toast.error(error.message || 'Gagal memperbarui pengaturan auto-sync.');
    } finally {
      setIsSyncSettingsUpdating(false);
    }
  };

  const loadProducts = async () => { setIsLoading(true); try { const data = await digiflazzService.getAdminProducts(); setProducts(data); setBrands([...new Set(data.map(p => p.brand))].sort()); } catch (error: any) { toast.error(error.message || 'Gagal memuat produk'); } finally { setIsLoading(false); } };
  const loadPulsaProducts = async () => { setIsLoadingPulsa(true); try { const data = await digiflazzService.getAdminPulsaProducts(); setPulsaProducts(data); setPulsaBrands([...new Set(data.map(p => p.brand))].sort()); } catch (error: any) { toast.error(error.message || 'Gagal memuat produk pulsa'); } finally { setIsLoadingPulsa(false); } };
  const loadDataProducts = async () => { setIsLoadingData(true); try { const data = await digiflazzService.getAdminDataProducts(); setDataProducts(data); setDataBrands([...new Set(data.map(p => p.brand))].sort()); } catch (error: any) { toast.error(error.message || 'Gagal memuat produk paket data'); } finally { setIsLoadingData(false); } };
  const loadTransactions = async () => { try { const data = await digiflazzService.getAdminTransactions(100); setTransactions(data); } catch (error: any) { console.error('Error loading transactions:', error); } };

  // Handler untuk sinkronisasi
  const handleSync = async (syncType: 'all' | 'games' | 'pulsa' | 'data') => {
    setIsSyncing(true);
    try {
      let result;
      const syncMap = {
        games: { fn: digiflazzService.syncGameProducts, loader: loadProducts },
        pulsa: { fn: digiflazzService.syncPulsaProducts, loader: loadPulsaProducts },
        data: { fn: digiflazzService.syncDataProducts, loader: loadDataProducts },
        all: { fn: digiflazzService.syncAllProducts, loader: () => { loadProducts(); loadPulsaProducts(); loadDataProducts(); } }
      };
      result = await syncMap[syncType].fn();
      syncMap[syncType].loader();
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || `Gagal sync produk ${syncType}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler untuk mengubah status aktif/nonaktif
  const handleToggleActive = async (product: DigiflazzProduct, type: ProductType) => {
    try {
      const updaterMap = {
        game: digiflazzService.updateProduct,
        pulsa: digiflazzService.updatePulsaProduct,
        data: digiflazzService.updateDataProduct
      };
      const setterMap = {
        game: setProducts,
        pulsa: setPulsaProducts,
        data: setDataProducts
      };

      await updaterMap[type](product.buyer_sku_code, { is_active: !product.is_active });
      setterMap[type](prev => prev.map(p => p.buyer_sku_code === product.buyer_sku_code ? { ...p, is_active: !p.is_active } : p));
      toast.success(`Produk ${!product.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupdate produk');
    }
  };

  // Handlers untuk edit harga
  const handleEditPrice = (product: DigiflazzProduct, type: ProductType) => {
    setEditingPrice({ sku: product.buyer_sku_code, type });
    setEditPriceValue(product.selling_price);
  };

  const handleSavePrice = async (sku: string, type: ProductType) => {
    try {
      const updaterMap = {
        game: digiflazzService.updateProduct,
        pulsa: digiflazzService.updatePulsaProduct,
        data: digiflazzService.updateDataProduct
      };
      const setterMap = {
        game: setProducts,
        pulsa: setPulsaProducts,
        data: setDataProducts
      };

      await updaterMap[type](sku, { selling_price: editPriceValue });
      setterMap[type](prev => prev.map(p => p.buyer_sku_code === sku ? { ...p, selling_price: editPriceValue } : p));
      setEditingPrice(null);
      toast.success('Harga jual berhasil diupdate');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupdate harga');
    }
  };

  // Handlers untuk edit nama
  const handleEditName = (product: DigiflazzProduct, type: ProductType) => {
    setEditingName({ sku: product.buyer_sku_code, type });
    setEditNameValue(product.custom_product_name || product.product_name);
  };

  const handleSaveName = async (sku: string, type: ProductType) => {
    try {
      const updaterMap = {
        game: digiflazzService.updateProduct,
        pulsa: digiflazzService.updatePulsaProduct,
        data: digiflazzService.updateDataProduct
      };
      const setterMap = {
        game: setProducts,
        pulsa: setPulsaProducts,
        data: setDataProducts
      };

      await updaterMap[type](sku, { custom_product_name: editNameValue });
      setterMap[type](prev => prev.map(p => p.buyer_sku_code === sku ? { ...p, product_name: editNameValue, custom_product_name: editNameValue } : p));
      setEditingName(null);
      toast.success('Nama produk berhasil diupdate');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengupdate nama produk');
    }
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
    setEditingName(null);
  };

  // Filter produk berdasarkan pencarian dan brand
  const filteredProducts = products.filter(p => (p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.buyer_sku_code.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase())) && (filterBrand === 'all' || p.brand === filterBrand));
  const filteredPulsaProducts = pulsaProducts.filter(p => (p.product_name.toLowerCase().includes(pulsaSearchTerm.toLowerCase()) || p.buyer_sku_code.toLowerCase().includes(pulsaSearchTerm.toLowerCase()) || p.brand.toLowerCase().includes(pulsaSearchTerm.toLowerCase())) && (pulsaFilterBrand === 'all' || p.brand === pulsaFilterBrand));
  const filteredDataProducts = dataProducts.filter(p => (p.product_name.toLowerCase().includes(dataSearchTerm.toLowerCase()) || p.buyer_sku_code.toLowerCase().includes(dataSearchTerm.toLowerCase()) || p.brand.toLowerCase().includes(dataSearchTerm.toLowerCase())) && (dataFilterBrand === 'all' || p.brand === dataFilterBrand));
  const filteredTransactions = transactions.filter(tx => filterStatus === 'all' || tx.digiflazz_status === filterStatus);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      Sukses: "bg-green-500",
      Pending: "bg-yellow-500",
      Gagal: "bg-red-500",
    };
    return <Badge className={statusMap[status as keyof typeof statusMap] || ''}>{status}</Badge>;
  };

  const renderProductTable = (
    type: ProductType,
    products: DigiflazzProduct[],
    isLoading: boolean,
    searchTerm: string,
    setSearchTerm: (val: string) => void,
    filterBrand: string,
    setFilterBrand: (val: string) => void,
    brands: string[],
    showTypeColumn = false
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>Produk {type.charAt(0).toUpperCase() + type.slice(1)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Kontrol filter dan pencarian */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor={`${type}-search`}>Cari Produk</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id={`${type}-search`} placeholder="Cari nama, SKU, atau brand..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Label htmlFor={`${type}-brand-filter`}>Filter Brand</Label>
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger><SelectValue placeholder="Semua Brand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Brand</SelectItem>
                {brands.map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabel Produk */}
        <ScrollArea className="h-[500px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                {showTypeColumn && <TableHead>Tipe</TableHead>}
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
                <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Tidak ada produk.</TableCell></TableRow>
              ) : (
                products.map(product => (
                  <TableRow key={product.buyer_sku_code}>
                    <TableCell className="font-mono text-xs">{product.buyer_sku_code}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={product.product_name}>
                      {editingName?.sku === product.buyer_sku_code ? (
                        <Input value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} className="w-full"/>
                      ) : (
                        product.product_name
                      )}
                    </TableCell>
                    {showTypeColumn && (
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {product.type || 'data'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell><Badge variant="outline">{product.brand}</Badge></TableCell>
                    <TableCell className="text-right">{formatRupiah(product.price)}</TableCell>
                    <TableCell className="text-right">
                      {editingPrice?.sku === product.buyer_sku_code ? (
                        <Input type="number" value={editPriceValue} onChange={(e) => setEditPriceValue(Number(e.target.value))} className="w-28 text-right" />
                      ) : (
                        formatRupiah(product.selling_price)
                      )}
                    </TableCell>
                    <TableCell className="text-right"><span className={product.selling_price > product.price ? 'text-green-600' : 'text-red-600'}>{formatRupiah(product.selling_price - product.price)}</span></TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" className={`w-16 ${product.is_active ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`} onClick={() => handleToggleActive(product, type)}>
                        {product.is_active ? 'On' : 'Off'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      {editingPrice?.sku === product.buyer_sku_code || editingName?.sku === product.buyer_sku_code ? (
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => editingPrice ? handleSavePrice(product.buyer_sku_code, type) : handleSaveName(product.buyer_sku_code, type)}><Check className="h-4 w-4 text-green-600" /></Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEdit}><X className="h-4 w-4 text-red-600" /></Button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEditPrice(product, type)} title="Edit Harga"><Edit2 className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEditName(product, type)} title="Edit Nama"><CaseSensitive className="h-4 w-4" /></Button>
                          {type !== 'game' && <Button size="icon" variant="ghost" onClick={() => openDescriptionEditor(product, type)} title="Edit Deskripsi"><FileText className="h-4 w-4" /></Button>}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <p className="text-sm text-muted-foreground">Total: {products.length} produk | Aktif: {products.filter(p => p.is_active).length}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2"><Package className="h-4 w-4" />Produk</TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2"><History className="h-4 w-4" />Transaksi</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Card Pengaturan Auto Sync */}
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Auto Sync</CardTitle>
              <CardDescription>Atur sinkronisasi otomatis untuk semua produk Digiflazz.</CardDescription>
            </CardHeader>
            <CardContent>
              {isSyncSettingsLoading ? <p>Memuat pengaturan...</p> : (
                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="auto-sync-toggle">Status Auto Sync</Label>
                    <Switch
                      id="auto-sync-toggle"
                      checked={autoSyncSettings.is_active}
                      onCheckedChange={(checked) => handleSyncSettingsChange({ is_active: checked })}
                      disabled={isSyncSettingsUpdating}
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:hover:bg-green-600 data-[state=unchecked]:bg-red-500 data-[state=unchecked]:hover:bg-red-600"
                    />
                    <span className="text-sm font-medium">{autoSyncSettings.is_active ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="sync-interval">Interval (menit)</Label>
                    <Input
                      id="sync-interval"
                      type="number"
                      className="w-24"
                      value={autoSyncSettings.interval_minutes}
                      onChange={(e) => setAutoSyncSettings(prev => ({ ...prev, interval_minutes: parseInt(e.target.value, 10) || 1 }))}
                      onBlur={() => handleSyncSettingsChange({ interval_minutes: autoSyncSettings.interval_minutes })}
                      min="1"
                      disabled={isSyncSettingsUpdating}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Tombol Sinkronisasi Manual */}
          <Card>
            <CardHeader>
              <CardTitle>Sinkronisasi Manual</CardTitle>
              <CardDescription>Jalankan sinkronisasi produk dari Digiflazz secara manual.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => handleSync('games')} disabled={isSyncing}><RefreshCw className="h-4 w-4 mr-2" />Sync Games</Button>
              <Button onClick={() => handleSync('pulsa')} disabled={isSyncing}><RefreshCw className="h-4 w-4 mr-2" />Sync Pulsa</Button>
              <Button onClick={() => handleSync('data')} disabled={isSyncing}><RefreshCw className="h-4 w-4 mr-2" />Sync Data</Button>
              <Button onClick={() => handleSync('all')} disabled={isSyncing}>{isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />} Sync All</Button>
            </CardContent>
          </Card>

          {/* Render Tabel Produk */}
          {renderProductTable('game', filteredProducts, isLoading, searchTerm, setSearchTerm, filterBrand, setFilterBrand, brands)}
          {renderProductTable('pulsa', filteredPulsaProducts, isLoadingPulsa, pulsaSearchTerm, setPulsaSearchTerm, pulsaFilterBrand, setPulsaFilterBrand, pulsaBrands)}
          {renderProductTable('data', filteredDataProducts, isLoadingData, dataSearchTerm, setDataSearchTerm, dataFilterBrand, setDataFilterBrand, dataBrands, true)}

          <PulsaDataDescriptionEditor product={editingDescriptionProduct} productType={editingDescriptionType} isOpen={isDescriptionEditorOpen} onClose={closeDescriptionEditor} onSave={handleSaveDescription} />
        </TabsContent>

        {/* Tab Transaksi */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Riwayat Transaksi</CardTitle><CardDescription>Riwayat semua transaksi topup.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full sm:w-48">
                <Label htmlFor="status-filter">Filter Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger><SelectValue placeholder="Semua Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Sukses">Sukses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Gagal">Gagal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-[600px] rounded-md border">
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
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada transaksi</TableCell></TableRow>
                    ) : (
                      filteredTransactions.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs">{tx.ref_id}</TableCell>
                          <TableCell>{tx.username || '-'}</TableCell>
                          <TableCell className="max-w-[150px] truncate" title={tx.product_name}>{tx.product_name}</TableCell>
                          <TableCell>{tx.customer_no}</TableCell>
                          <TableCell className="text-right">{formatRupiah(tx.selling_price)}</TableCell>
                          <TableCell className="text-center">{getStatusBadge(tx.digiflazz_status)}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[100px] truncate" title={tx.sn || ''}>{tx.sn || '-'}</TableCell>
                          <TableCell className="text-xs">{new Date(tx.created_at).toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DigiflazzManager;
