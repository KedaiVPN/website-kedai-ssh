import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { otherProductService, ProductDetail } from '@/services/otherProductService';
import { balanceService } from '@/services/balanceService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShoppingCart, Package, Info, CheckCircle } from 'lucide-react';
import PurchaseDetailModal, { PurchaseDetails } from '@/components/PurchaseDetailModal';

const OtherProductDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [currentBalance, setCurrentBalance] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);

    useEffect(() => {
        if (slug) {
            fetchProductDetails(slug);
        }
        if (user) {
            fetchBalance();
        }
    }, [slug, user]);

    const fetchProductDetails = async (productSlug: string) => {
        setIsLoading(true);
        try {
            const data = await otherProductService.getProductBySlug(productSlug);
            setProduct(data);
        } catch (error) {
            toast.error('Gagal memuat detail produk.');
            navigate('/produk-lainnya'); // Kembali ke halaman daftar jika produk tidak ditemukan
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBalance = async () => {
        try {
            const response = await balanceService.getBalance();
            if (response.success) {
                setCurrentBalance(response.balance);
            }
        } catch (error) {
            console.error('Gagal memuat saldo:', error);
        }
    };

    const handlePurchase = async () => {
        if (!product || !user) {
            toast.error('Anda harus login untuk melakukan pembelian.');
            return;
        }
        setIsPurchasing(true);
        try {
            const response = await otherProductService.purchaseProduct(product.id);
            if (response.success && response.data) {
                setPurchaseDetails(response.data);
                setIsModalOpen(true);
                toast.success(`Pembelian ${product.name} telah berhasil`);
                fetchProductDetails(product.slug); // Muat ulang detail produk untuk update stok
                fetchBalance(); // Muat ulang saldo
            } else {
                toast.error(response.message || 'Gagal melakukan pembelian.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Terjadi kesalahan.');
        } finally {
            setIsPurchasing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                <Header />
                <main className="pt-24 pb-12 max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-2xl font-bold">Produk Tidak Ditemukan</h1>
                    <p className="mt-4">Produk yang Anda cari tidak ada atau mungkin telah dihapus.</p>
                    <Button onClick={() => navigate('/produk-lainya')} className="mt-6">Kembali ke Daftar Produk</Button>
                </main>
            </div>
        );
    }

    const isStockAvailable = product.available_stock_count > 0;
    const canAfford = currentBalance !== null && currentBalance >= product.price;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Header />
            <PurchaseDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} details={purchaseDetails} />
            <main className="pt-20 pb-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-xl border-none">
                        <CardHeader>
                        <div className="flex items-start gap-6">
                            <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-24 h-24 object-cover rounded-lg border" />
                            <div className="flex-1">
                                <CardTitle className="text-3xl font-bold">{product.name}</CardTitle>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2"><Package className="h-4 w-4" />Stok: <span className="font-semibold text-foreground">{isStockAvailable ? product.available_stock_count : 'Tidak Tersedia'}</span></div>
                                    <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />Terjual: <span className="font-semibold text-foreground">{product.sold_stock_count || 0}</span></div>
                                </div>
                                <p className="text-2xl font-bold text-primary mt-3">Rp {product.price.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Separator className="my-6" />
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Deskripsi Produk</h3>
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                                <p style={{ whiteSpace: 'pre-wrap' }}>{product.description || 'Tidak ada deskripsi untuk produk ini.'}</p>
                            </div>
                        </div>
                        <Separator className="my-6" />
                        <div className="flex justify-center">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="lg" className="w-full max-w-xs" disabled={!isStockAvailable || !canAfford || isPurchasing}>
                                        {isPurchasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                                        {!isStockAvailable ? 'Stok Habis' : !canAfford ? 'Saldo Kurang' : 'Beli Sekarang'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Konfirmasi Pembelian</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Anda akan membeli <strong>{product.name}</strong> seharga <strong>Rp {product.price.toLocaleString()}</strong>. Saldo Anda akan dipotong. Lanjutkan?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={handlePurchase}>Ya, Beli Sekarang</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default OtherProductDetailPage;
