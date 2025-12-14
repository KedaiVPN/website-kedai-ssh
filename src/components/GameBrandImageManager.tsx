import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Trash2, Loader2, Image, X } from 'lucide-react';
import { gameImageAdminService } from '@/services/gameImageAdminService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BrandImage {
  brand_name: string;
  image_url: string;
}

interface Product {
    buyer_sku_code: string;
    product_name: string;
}

interface ProductWithImage extends Product {
    brand: string;
    image_url: string;
}

interface Brand {
  brand_name: string;
}

const GameBrandImageManager = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<BrandImage[]>([]);
  const [productImages, setProductImages] = useState<ProductWithImage[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('brand-only'); // Default to brand image
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isLoadingProductImages, setIsLoadingProductImages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store brand name or SKU being deleted
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBrands();
    fetchImages();
    fetchProductImages();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetchProductsByBrand(selectedBrand);
    } else {
      setProducts([]);
    }
    setSelectedProduct('brand-only'); // Reset product selection when brand changes
  }, [selectedBrand]);

  const fetchBrands = async () => {
    setIsLoadingBrands(true);
    try {
      const uniqueBrands = await gameImageAdminService.getUniqueBrands();
      setBrands(uniqueBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Gagal memuat daftar brand game.');
    } finally {
      setIsLoadingBrands(false);
    }
  };

  const fetchImages = async () => {
    setIsLoadingImages(true);
    try {
      const brandImages = await gameImageAdminService.getAllBrandImages();
      setImages(brandImages);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Gagal memuat daftar gambar brand.');
    } finally {
      setIsLoadingImages(false);
    }
  };

  const fetchProductsByBrand = async (brand: string) => {
    setIsLoadingProducts(true);
    try {
      const productList = await gameImageAdminService.getProductsByBrand(brand);
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(`Gagal memuat produk untuk brand ${brand}.`);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
      setSelectedBrand('');
      setSelectedProduct('brand-only');
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  }

  const handleUpload = async () => {
    if (!selectedBrand || !selectedFile) {
      toast.warning('Silakan pilih brand dan file gambar terlebih dahulu.');
      return;
    }
    setIsUploading(true);
    try {
      await gameImageAdminService.uploadImage(selectedBrand, selectedFile, selectedProduct);
      toast.success(`Gambar berhasil diunggah.`);
      resetForm();
      fetchImages(); // Refresh brand image list
      fetchProductImages(); // Refresh product image list
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal mengunggah gambar.';
      console.error('Upload error:', error);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchProductImages = async () => {
    setIsLoadingProductImages(true);
    try {
        const data = await gameImageAdminService.getProductsWithImages();
        setProductImages(data);
    } catch (error) {
        console.error('Error fetching product images:', error);
        toast.error('Gagal memuat gambar produk.');
    } finally {
        setIsLoadingProductImages(false);
    }
  };

  const handleDeleteBrandImage = async (brandName: string) => {
    setIsDeleting(brandName);
    try {
      await gameImageAdminService.deleteBrandImage(brandName);
      toast.success(`Gambar untuk brand ${brandName} berhasil dihapus.`);
      fetchImages(); // Refresh image list
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Gagal menghapus gambar untuk ${brandName}.`;
      console.error('Delete error:', error);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteProductImage = async (sku: string) => {
    setIsDeleting(sku);
    try {
      await gameImageAdminService.deleteProductImage(sku);
      toast.success(`Gambar untuk produk ${sku} berhasil dihapus.`);
      fetchProductImages(); // Refresh product image list
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Gagal menghapus gambar untuk produk ${sku}.`;
      console.error('Delete error:', error);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Manajemen Gambar Brand Game
        </CardTitle>
        <CardDescription>
          Unggah atau hapus gambar yang akan ditampilkan untuk setiap brand game di halaman top-up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Form */}
        <div className="p-4 border rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Unggah Gambar Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              {/* Brand Dropdown */}
              <div className="space-y-2">
                  <Label htmlFor="brand-select">1. Pilih Brand Game</Label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand} disabled={isLoadingBrands}>
                      <SelectTrigger id="brand-select">
                          <SelectValue placeholder={isLoadingBrands ? "Memuat..." : "Pilih Brand"} />
                      </SelectTrigger>
                      <SelectContent>
                          {Array.isArray(brands) && brands.map((brand) => (
                              <SelectItem key={brand.brand_name} value={brand.brand_name}>
                                  {brand.brand_name}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>

              {/* Product Dropdown (conditional) */}
              {selectedBrand && (
                <div className="space-y-2">
                    <Label htmlFor="product-select">2. Pilih Target Gambar</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={isLoadingProducts}>
                        <SelectTrigger id="product-select">
                            <SelectValue placeholder={isLoadingProducts ? "Memuat Produk..." : "Pilih Produk"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="brand-only">Hanya untuk Gambar Brand</SelectItem>
                            <SelectItem value="all-products-no-image">Terapkan ke Produk Tanpa Gambar</SelectItem>
                            {products.map((product) => (
                                <SelectItem key={product.buyer_sku_code} value={product.buyer_sku_code}>
                                    {product.product_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="image-upload">3. Pilih File Gambar (JPG, PNG, WEBP)</Label>
                    <Input id="image-upload" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} ref={fileInputRef} disabled={!selectedBrand} />
                </div>
                {preview && (
                    <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                        <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={resetForm}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
            <Button onClick={handleUpload} disabled={isUploading || !selectedBrand || !selectedFile}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? 'Mengunggah...' : 'Unggah Gambar'}
            </Button>
        </div>

        {/* Image Gallery */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Galeri Gambar Brand</h3>
          {isLoadingImages ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Belum ada gambar brand yang diunggah.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image) => (
                <div key={image.brand_name} className="relative group border rounded-lg p-2 flex flex-col items-center space-y-2">
                  <img src={image.image_url} alt={image.brand_name} className="h-24 w-24 object-contain" />
                  <p className="text-sm font-medium text-center truncate w-full">{image.brand_name}</p>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            disabled={isDeleting === image.brand_name}
                          >
                            {isDeleting === image.brand_name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Hapus
                          </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini akan menghapus gambar untuk brand <span className="font-bold">{image.brand_name}</span>. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteBrandImage(image.brand_name)}>
                          Ya, Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Image Gallery */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Galeri Gambar Produk</h3>
          {isLoadingProductImages ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : productImages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Belum ada gambar produk spesifik yang diunggah.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {productImages.map((product) => (
                <div key={product.buyer_sku_code} className="relative group border rounded-lg p-2 flex flex-col items-center space-y-2">
                  <img src={product.image_url} alt={product.product_name} className="h-24 w-24 object-contain" />
                  <p className="text-sm font-medium text-center truncate w-full" title={product.product_name}>{product.product_name}</p>
                   <p className="text-xs text-muted-foreground">{product.brand}</p>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            disabled={isDeleting === product.buyer_sku_code}
                          >
                            {isDeleting === product.buyer_sku_code ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Hapus
                          </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini akan menghapus gambar untuk produk <span className="font-bold">{product.product_name}</span>. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteProductImage(product.buyer_sku_code)}>
                          Ya, Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GameBrandImageManager;
