import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Gamepad2, Search, Wallet, History, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { digiflazzService, DigiflazzBrand, GameTopupTransaction } from '@/services/digiflazzService';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { formatRupiah } from '@/constants/pricing';

const GameTopupList = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<DigiflazzBrand[]>([]);
  const [transactions, setTransactions] = useState<GameTopupTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadBrands();
    loadTransactions();
  }, []);

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

  const loadTransactions = async () => {
    try {
      const data = await digiflazzService.getHistory(20);
      setTransactions(data);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleSelectBrand = (brand: DigiflazzBrand) => {
    const slug = brand.brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    navigate(`/topupgame/${slug}`, { state: { brand: brand.brand } });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
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
            <BalanceDisplay refreshTrigger={refreshTrigger} onBalanceChange={() => {}} />
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
              <Card>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                        <div
                          key={brand.brand}
                          className="group cursor-pointer rounded-xl border bg-card p-4 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 active:scale-95"
                          onClick={() => handleSelectBrand(brand)}
                        >
                          <div className="flex flex-col items-center gap-3">
                            {/* Game Image placeholder - will show icon if no image */}
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                              <Gamepad2 className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                {brand.brand}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {brand.product_count} produk
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
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
      </main>

      <Footer />
    </div>
  );
};

export default GameTopupList;
