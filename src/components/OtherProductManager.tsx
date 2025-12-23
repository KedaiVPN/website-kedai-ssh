import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminOtherProductService, OtherProduct, ProductStock } from '@/services/adminOtherProductService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Edit, Trash2, Package, PackagePlus, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';

const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string().optional(),
  price: z.preprocess(val => Number(val), z.number().min(0, 'Harga harus positif')),
  is_active: z.boolean().default(true),
  image: z.any().optional(),
});

const stockSchema = z.object({
    stock_data_email: z.string().optional(),
    stock_data_password: z.string().optional(),
    stock_data_link: z.string().optional(),
    masa_aktif: z.string().optional(),
}).refine(data => data.stock_data_email || data.stock_data_password || data.stock_data_link, {
    message: "Setidaknya salah satu dari Email, Password, atau Link harus diisi.",
    path: ["stock_data_link"], // Menampilkan pesan error di bawah field link
});

const OtherProductManager = () => {
    const [products, setProducts] = useState<OtherProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<OtherProduct | null>(null);
    const [selectedProductForStock, setSelectedProductForStock] = useState<OtherProduct | null>(null);
    const [currentStock, setCurrentStock] = useState<ProductStock[]>([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: { name: '', description: '', price: 0, is_active: true },
    });

    const { formState: { isDirty } } = form;

    const stockForm = useForm<z.infer<typeof stockSchema>>({
        resolver: zodResolver(stockSchema),
        defaultValues: { stock_data_email: '', stock_data_password: '', stock_data_link: '', masa_aktif: '' },
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await adminOtherProductService.getProducts();
            setProducts(data);
        } catch (error) {
            toast.error('Gagal memuat produk.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductSubmit = async (values: z.infer<typeof productSchema>) => {
        setIsSubmitting(true);
        const formData = new FormData();

        // Selalu tambahkan field teks
        formData.append('name', values.name);
        formData.append('description', values.description || '');
        formData.append('price', String(values.price));
        formData.append('is_active', String(values.is_active));

        // Logika penanganan gambar yang diperbaiki
        const newImageFile = values.image && values.image[0];
        if (newImageFile) {
            // Jika ada file gambar baru, tambahkan
            formData.append('image', newImageFile);
        } else if (editingProduct && editingProduct.image_url) {
            // Jika tidak ada file baru DAN kita dalam mode edit DAN ada image_url lama,
            // kirim kembali image_url yang lama untuk dipertahankan.
            formData.append('image_url', editingProduct.image_url);
        }
        // Jika tidak ada file baru dan tidak ada image_url lama, tidak perlu mengirim apa pun.
        // Backend akan menanganinya sebagai null.

        try {
            if (editingProduct) {
                await adminOtherProductService.updateProduct(editingProduct.id, formData);
                toast.success('Produk berhasil diperbarui.');
            } else {
                await adminOtherProductService.addProduct(formData);
                toast.success('Produk berhasil ditambahkan.');
            }
            fetchProducts();
            setIsProductModalOpen(false);
            setEditingProduct(null);
            form.reset();
        } catch (error) {
            toast.error(`Gagal ${editingProduct ? 'memperbarui' : 'menambahkan'} produk.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditProduct = (product: OtherProduct) => {
        setEditingProduct(product);
        form.reset({
            name: product.name,
            description: product.description,
            price: product.price,
            is_active: product.is_active,
            image: undefined, // Reset input file
        });
        setIsProductModalOpen(true);
    };

    const handleDeleteProduct = async (productId: number) => {
        try {
            await adminOtherProductService.deleteProduct(productId);
            toast.success('Produk berhasil dihapus.');
            fetchProducts();
        } catch (error) {
            toast.error('Gagal menghapus produk.');
        }
    };

    const openStockManager = async (product: OtherProduct) => {
        setSelectedProductForStock(product);
        setIsStockModalOpen(true);
        setIsLoadingStock(true);
        try {
            const stockData = await adminOtherProductService.getStock(product.id);
            setCurrentStock(stockData);
        } catch (error) {
            toast.error('Gagal memuat stok.');
        } finally {
            setIsLoadingStock(false);
        }
    };

    const handleAddStock = async (values: z.infer<typeof stockSchema>) => {
        if (!selectedProductForStock) return;
        setIsSubmitting(true);
        try {
            // Mengirim array dengan satu objek stok
            const stocksToAdd = [
                {
                    stock_data_email: values.stock_data_email,
                    stock_data_password: values.stock_data_password,
                    stock_data_link: values.stock_data_link,
                    masa_aktif: values.masa_aktif,
                }
            ];

            await adminOtherProductService.addStock(selectedProductForStock.id, stocksToAdd);
            toast.success(`1 stok berhasil ditambahkan.`);
            stockForm.reset(); // Kosongkan form setelah berhasil
            openStockManager(selectedProductForStock); // Muat ulang daftar stok
            fetchProducts(); // Muat ulang daftar produk untuk update jumlah stok
        } catch (error) {
            toast.error('Gagal menambahkan stok.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStock = async (stockId: number) => {
        if (!selectedProductForStock) return;
        try {
            await adminOtherProductService.deleteStock(stockId);
            toast.success('Stok berhasil dihapus.');
            openStockManager(selectedProductForStock); // Refresh stock list
            fetchProducts(); // Refresh product list to update count
        } catch (error) {
            toast.error('Gagal menghapus stok.');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Manajemen Produk Lainnya</CardTitle>
                        <CardDescription>Tambah, edit, dan kelola produk digital seperti akun premium, link, dll.</CardDescription>
                    </div>
                    <Button onClick={() => { setEditingProduct(null); form.reset({ name: '', description: '', price: 0, is_active: true }); setIsProductModalOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Produk
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Gambar</TableHead>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead>Harga</TableHead>
                                <TableHead>Stok Tersedia</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell><img src={product.image_url || '/placeholder.svg'} alt={product.name} className="h-12 w-12 object-cover rounded-md" /></TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>Rp {product.price.toLocaleString()}</TableCell>
                                    <TableCell>{product.available_stock_count}</TableCell>
                                    <TableCell><Badge variant={product.is_active ? 'default' : 'destructive'}>{product.is_active ? 'Aktif' : 'Nonaktif'}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openStockManager(product)}><Package className="mr-2 h-4 w-4" />Kelola Stok</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Hapus</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tindakan ini akan menghapus produk "{product.name}" secara permanen beserta semua stoknya. Tindakan ini tidak dapat dibatalkan.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Hapus</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

             {/* Product Modal */}
            <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit' : 'Tambah'} Produk</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleProductSubmit)} className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nama Produk</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Harga</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="image" render={({ field }) => (<FormItem><FormLabel>Gambar Produk</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="is_active" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Aktifkan Produk</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            <DialogFooter>
                                <Button type="submit" disabled={!isDirty || isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Stock Modal */}
            <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Kelola Stok: {selectedProductForStock?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold mb-4">Tambah Stok Baru</h3>
                            <Form {...stockForm}>
                                <form onSubmit={stockForm.handleSubmit(handleAddStock)} className="space-y-4">
                                    <FormField control={stockForm.control} name="stock_data_email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} placeholder="contoh@email.com" /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={stockForm.control} name="stock_data_password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input {...field} placeholder="******" /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={stockForm.control} name="stock_data_link" render={({ field }) => (<FormItem><FormLabel>Link</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={stockForm.control} name="masa_aktif" render={({ field }) => (<FormItem><FormLabel>Masa Aktif</FormLabel><FormControl><Input {...field} placeholder="cth: 30 Hari, Lifetime" /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" disabled={isSubmitting} className="w-full"><PackagePlus className="mr-2 h-4 w-4" />{isSubmitting ? 'Menambahkan...' : 'Tambah Stok'}</Button>
                                </form>
                            </Form>
                        </div>
                        <div>
                             <h3 className="font-semibold mb-4">Stok Saat Ini ({currentStock.length})</h3>
                             <div className="h-[350px] overflow-y-auto border rounded-md">
                                {isLoadingStock ? (
                                     <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Detail Stok</TableHead><TableHead>Masa Aktif</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {currentStock.map(stock => (
                                                <TableRow key={stock.id}>
                                                    <TableCell className="font-mono text-xs">
                                                        {stock.stock_data_email && <div>E: {stock.stock_data_email}</div>}
                                                        {stock.stock_data_password && <div>P: {stock.stock_data_password}</div>}
                                                        {stock.stock_data_link && <div className="truncate">L: {stock.stock_data_link}</div>}
                                                    </TableCell>
                                                    <TableCell>{stock.masa_aktif || '-'}</TableCell>
                                                    <TableCell><Badge variant={stock.status === 'tersedia' ? 'secondary' : 'outline'}>{stock.status}</Badge></TableCell>
                                                    <TableCell>
                                                        {stock.status === 'tersedia' && (
                                                            <Button variant="destructive" size="icon" onClick={() => handleDeleteStock(stock.id)}><Trash2 className="h-4 w-4" /></Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                             </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default OtherProductManager;
