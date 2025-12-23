import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { otherProductService, AvailableProduct, PurchaseHistoryItem, PurchaseDetails, Banner } from '@/services/otherProductService';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { useRef } from 'react';
import PurchaseDetailModal from '@/components/PurchaseDetailModal';
import { balanceService } from '@/services/balanceService'; // Import balanceService
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShoppingCart, History, Copy, Download, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

const OtherProductsPage = () => {
    const [products, setProducts] = useState<AvailableProduct[]>([]);
    const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState<number | null>(null);
    const [currentBalance, setCurrentBalance] = useState<number | null>(null); // State for real-time balance
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoadingBanners, setIsLoadingBanners] = useState(true);
    const { user } = useAuth();

    const autoplayPlugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));


    useEffect(() => {
        fetchProducts();
        fetchHistory();
        fetchBalance();
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setIsLoadingBanners(true);
        try {
            const data = await otherProductService.getBanners();
            setBanners(data);
        } catch (error) {
            toast.error('Gagal memuat banner.');
        } finally {
            setIsLoadingBanners(false);
        }
    };

    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const data = await otherProductService.getAvailableProducts();
            setProducts(data);
        } catch (error) {
            toast.error('Gagal memuat produk.');
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const data = await otherProductService.getPurchaseHistory();
            setHistory(data);
        } catch (error) {
            toast.error('Gagal memuat riwayat pembelian.');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const fetchBalance = async () => {
        try {
            const response = await balanceService.getBalance();
            if (response.success) {
                setCurrentBalance(response.balance);
            }
        } catch (error) {
            console.error('Failed to fetch real-time balance:', error);
            toast.error('Gagal memuat saldo terbaru.');
        }
    };


    const handlePurchase = async (product: AvailableProduct) => {
        setIsPurchasing(product.id);
        try {
            const response = await otherProductService.purchaseProduct(product.id);
            if (response.success && response.data) {
                setPurchaseDetails(response.data);
                setIsModalOpen(true);
                toast.success(`Pembelian ${product.name} telah berhasil`);

                // Update balance locally for immediate feedback
                if (currentBalance !== null) {
                    setCurrentBalance(currentBalance - product.price);
                }
                fetchProducts(); // Refresh product list (stock count)
                fetchHistory(); // Refresh history
            } else {
                 toast.error(response.message || 'Gagal melakukan pembelian.');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Gagal melakukan pembelian.';
            toast.error(errorMessage);
        } finally {
            setIsPurchasing(null);
        }
    };

    const handleViewDetails = async (transactionId: number) => {
        setIsLoadingDetails(transactionId);
        try {
            const details = await otherProductService.getTransactionDetails(transactionId);
            // Frontend-friendly snapshot name
            const displayDetails: PurchaseDetails = { ...details, product_name_snapshot: details.product_name_snapshot || 'Produk' };
            setPurchaseDetails(displayDetails);
            setIsModalOpen(true);
        } catch (error) {
            toast.error('Gagal memuat detail transaksi.');
        } finally {
            setIsLoadingDetails(null);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
            <Header />
            <PurchaseDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                details={purchaseDetails}
            />
            <main className="pt-20 pb-12 px-4">
                <div className="max-w-6xl mx-auto">

                    {!isLoadingBanners && banners.length > 0 && (
                        <Carousel
                            className="w-full mb-12"
                            plugins={[autoplayPlugin.current]}
                            onMouseEnter={autoplayPlugin.current.stop}
                            onMouseLeave={autoplayPlugin.current.reset}
                        >
                            <CarouselContent>
                                {banners.map((banner, index) => (
                                    <CarouselItem key={index}>
                                        <Link to={`/produk-lainnya/${banner.product_slug}`}>
                                            <div className="aspect-[16/6] overflow-hidden rounded-lg">
                                                <img src={banner.image_url} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                        </Link>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    )}

                    <Tabs defaultValue="products">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="products"><ShoppingCart className="mr-2 h-4 w-4" /> Beli Produk</TabsTrigger>
                        <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Riwayat Pembelian</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products" className="mt-8">
                         <div className="mb-8 max-w-sm">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Cari produk..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        {isLoadingProducts ? (
                            <div className="flex justify-center items-center py-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-16">
                               <p className="text-muted-foreground">{searchTerm ? `Tidak ada produk yang cocok dengan "${searchTerm}".` : "Saat ini belum ada produk yang tersedia."}</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="bg-card text-card-foreground rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden border-none">
                                        <div className="aspect-video relative">
                                            <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="object-cover w-full h-full" />
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow">
                                            <h3 className="font-semibold text-base leading-snug flex-grow min-h-[40px]">{product.name}</h3>
                                            <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center">
                                                <span>Stok: <span className="font-medium text-foreground">{product.available_stock_count > 0 ? product.available_stock_count : 'Habis'}</span></span>
                                                <span>Terjual: <span className="font-medium text-foreground">{product.sold_stock_count || 0}</span></span>
                                            </div>
                                            <p className="text-lg font-bold text-primary mt-3">Rp {product.price.toLocaleString()}</p>
                                        </div>
                                        <div className="p-4 pt-0">
                                            <Button asChild className="w-full">
                                                <Link to={`/produk-lainnya/${product.slug}`}>Lihat Detail</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-8">
                        {isLoadingHistory ? (
                            <div className="flex justify-center items-center py-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
                        ) : history.length === 0 ? (
                             <div className="text-center py-16">
                               <p className="text-gray-500">Anda belum memiliki riwayat pembelian produk.</p>
                            </div>
                        ) :(
                            <ScrollArea className="h-[400px] rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Produk</TableHead>
                                            <TableHead>Harga</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{format(new Date(item.created_at), 'd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                                                <TableCell>{item.product_name_snapshot}</TableCell>
                                                <TableCell>Rp {item.price_at_purchase.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(item.id)}
                                                        disabled={isLoadingDetails === item.id}
                                                    >
                                                        {isLoadingDetails === item.id
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : 'Lihat Detail'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </TabsContent>
                </Tabs>
                </div>
            </main>
        </div>
    );
};

export default OtherProductsPage;
