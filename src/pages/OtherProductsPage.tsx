import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { otherProductService, AvailableProduct, PurchaseHistoryItem, PurchaseDetails } from '@/services/otherProductService';
import PurchaseDetailModal from '@/components/PurchaseDetailModal';
import { balanceService } from '@/services/balanceService'; // Import balanceService
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShoppingCart, History, Copy, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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
    const { user } = useAuth();

    useEffect(() => {
        fetchProducts();
        fetchHistory();
        fetchBalance();
    }, []);

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


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <PurchaseDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                details={purchaseDetails}
            />
            <main className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">Produk Lainnya</h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl dark:text-gray-400">
                        Temukan berbagai akun premium dan produk digital lainnya untuk kebutuhan Anda.
                    </p>
                </div>

                <Tabs defaultValue="products">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="products"><ShoppingCart className="mr-2 h-4 w-4" /> Beli Produk</TabsTrigger>
                        <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Riwayat Pembelian</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products" className="mt-8">
                        {isLoadingProducts ? (
                            <div className="flex justify-center items-center py-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-16">
                               <p className="text-gray-500">Saat ini belum ada produk yang tersedia. Silakan kembali lagi nanti.</p>
                            </div>
                        ) : (
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {products.map(product => (
                                    <Card key={product.id} className="flex flex-col overflow-hidden">
                                        <div className="aspect-w-16 aspect-h-9">
                                            <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="object-cover w-full h-full" />
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow">
                                            <h3 className="font-semibold text-lg flex-grow">{product.name}</h3>
                                            <div className="mt-2 text-sm text-muted-foreground space-y-1">
                                                <p>Stok: <span className="font-medium text-foreground">{product.available_stock_count > 0 ? product.available_stock_count : 'Tidak Tersedia'}</span></p>
                                                <p>Terjual: <span className="font-medium text-foreground">{product.sold_stock_count || 0}</span></p>
                                            </div>
                                            <p className="text-lg font-bold text-primary mt-3">Rp {product.price.toLocaleString()}</p>
                                        </div>
                                        <CardFooter className="p-4 pt-0">
                                            <Button asChild className="w-full">
                                                <Link to={`/produk-lainnya/${product.slug}`}>Lihat Detail</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
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
                            <Card>
                                <CardContent className="p-0">
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
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default OtherProductsPage;
