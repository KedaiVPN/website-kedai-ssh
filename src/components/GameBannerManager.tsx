import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, UploadCloud, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Banner {
  id: number;
  image_url: string;
  brand_name: string;
}

interface Brand {
  brand_name: string;
}

interface FormData {
  bannerImage: FileList;
  brand_name: string;
}

const GameBannerManager = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { register, handleSubmit, formState, control, watch, reset, setValue } = useForm<FormData>({
    defaultValues: {
      brand_name: '',
    },
    mode: 'onChange', // Enable validation on change
  });
  const bannerImageFile = watch('bannerImage');
  const fileInputRef = register('bannerImage', { required: 'File gambar wajib diisi' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const file = bannerImageFile?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [bannerImageFile]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bannersData, brandsData] = await Promise.all([
        adminService.getGameBanners(),
        adminService.getGameBrands()
      ]);
      setBanners(Array.isArray(bannersData) ? bannersData : []);
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      toast.error('Gagal memuat data banner atau brand.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    reset();
    setPreview(null);
    const fileInput = document.getElementById('bannerImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!data.bannerImage[0]) {
      toast.error('Silakan pilih file gambar untuk diunggah.');
      return;
    }
    if (!data.brand_name) {
      toast.error('Silakan pilih brand yang akan ditautkan.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('bannerImage', data.bannerImage[0]);
    formData.append('brand_name', data.brand_name);

    try {
      await adminService.addGameBanner(formData);
      toast.success('Banner berhasil diunggah.');
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Gagal mengunggah banner.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setBannerToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (bannerToDelete === null) return;
    setIsDeleting(bannerToDelete);
    try {
      await adminService.deleteGameBanner(bannerToDelete);
      toast.success('Banner berhasil dihapus.');
      setBanners(banners.filter(b => b.id !== bannerToDelete));
    } catch (error) {
      toast.error('Gagal menghapus banner.');
    } finally {
      setIsDeleting(null);
      setIsDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola Banner Slider</CardTitle>
        <CardDescription>Tambah atau hapus gambar yang akan ditampilkan di slider halaman topup game.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Unggah Banner Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor="bannerImage">File Gambar</Label>
              <Input
                id="bannerImage"
                type="file"
                accept="image/*"
                {...fileInputRef}
              />
              <p className="text-xs text-muted-foreground">Rekomendasi ukuran: 1080x405 piksel.</p>
              {formState.errors.bannerImage && <p className="text-sm text-red-500 mt-1">{formState.errors.bannerImage.message}</p>}
              {preview && (
                <div className="mt-4 relative w-full aspect-[16/6] border rounded-md overflow-hidden">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white hover:text-white" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor="brand_name">Tautkan ke Brand</Label>
              <Controller
                name="brand_name"
                control={control}
                rules={{ required: 'Brand wajib dipilih' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Brand..." />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.brand_name} value={brand.brand_name}>
                          {brand.brand_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {formState.errors.brand_name && <p className="text-sm text-red-500 mt-1">{formState.errors.brand_name.message}</p>}
            </div>
            <div className="md:col-span-1 flex items-end h-full">
              <Button type="submit" disabled={isUploading || !formState.isValid} className="w-full mt-auto">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Unggah Banner
              </Button>
            </div>
          </div>
        </form>
        <div>
          <h3 className="text-lg font-medium mb-4">Daftar Banner Aktif</h3>
          {isLoading ? (
            <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !Array.isArray(banners) || banners.length === 0 ? (
            <p className="text-center text-gray-500">Belum ada banner yang diunggah.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {banners.map((banner) => (
                <Card key={banner.id} className="relative group">
                  <img src={banner.image_url} alt={banner.brand_name} className="aspect-video w-full object-cover rounded-t-lg" />
                  <div className="p-4">
                    <p className="text-sm font-medium">Tautan ke:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{banner.brand_name}</p>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(banner.id)} disabled={isDeleting === banner.id}>
                      {isDeleting === banner.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus banner ini? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default GameBannerManager;
