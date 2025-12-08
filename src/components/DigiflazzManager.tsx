import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RefreshCw, Search, Package, History, Edit2, Check, X, Loader2 } from 'lucide-react';
import { digiflazzService, DigiflazzProduct, GameTopupTransaction } from '@/services/digiflazzService';
import { formatRupiah } from '@/constants/pricing';

const DigiflazzManager = () => {
  const [products, setProducts] = useState<DigiflazzProduct[]>([]);
  const [transactions, setTransactions] = useState<GameTopupTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
    loadTransactions();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await digiflazzService.getAdminProducts();
      setProducts(data);
      
      // Extract unique brands
      const uniqueBrands = [...new Set(data.map(p => p.brand))].sort();
      setBrands(uniqueBrands);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat produk');
    } finally {
      setIsLoading(false);
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.buyer_sku_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'all' || product.brand === filterBrand;
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
                    Kelola produk game topup dari Digiflazz
                  </CardDescription>
                </div>
                <Button onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync Produk
                </Button>
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
              <div className="rounded-md border overflow-x-auto">
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

              <p className="text-sm text-muted-foreground">
                Total: {filteredProducts.length} produk | Aktif: {filteredProducts.filter(p => p.is_active).length}
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
                          <TableCell className="max-w-[150px] truncate" title={tx.product_name}>
                            {tx.product_name}
                          </TableCell>
                          <TableCell>{tx.customer_no}</TableCell>
                          <TableCell className="text-right">{formatRupiah(tx.selling_price)}</TableCell>
                          <TableCell className="text-center">{getStatusBadge(tx.digiflazz_status)}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[100px] truncate" title={tx.sn || ''}>
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
