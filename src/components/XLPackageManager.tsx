import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';
import { xlService, type XLPackage } from '@/services/xlService';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function XLPackageManager() {
  const [packages, setPackages] = useState<XLPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<XLPackage>>({
    package_code: '',
    name: '',
    description: '',
    price: 0,
    fee: 0,
    is_active: 1
  });

  // Fetch packages
  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const data = await xlService.adminGetPackages();
      setPackages(data);
    } catch (error) {
      toast.error('Gagal memuat paket XL');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      package_code: '',
      name: '',
      description: '',
      price: 0,
      fee: 0,
      is_active: 1
    });
    setIsEditing(false);
  };

  // Add/Update package
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.package_code || !formData.name || formData.price === undefined || formData.price === null || formData.fee === undefined || formData.fee === null) {
      toast.error('Package code, name, price, dan fee wajib diisi');
      return;
    }
    
    setIsLoading(true);
    try {
      if (formData.id) {
        // Update
        const result = await xlService.adminUpdatePackage(formData.id, formData);
        if (result.success) {
          toast.success('Paket berhasil diperbarui');
        } else {
          toast.error(result.message || 'Gagal memperbarui paket');
        }
      } else {
        // Add
        const result = await xlService.adminAddPackage(formData);
        if (result.success) {
          toast.success('Paket berhasil ditambahkan');
        } else {
          toast.error(result.message || 'Gagal menambahkan paket');
        }
      }
      
      resetForm();
      fetchPackages();
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit package
  const handleEdit = (pkg: XLPackage) => {
    setFormData(pkg);
    setIsEditing(true);
  };

  // Delete package
  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus paket ini?')) return;
    
    setIsLoading(true);
    try {
      const result = await xlService.adminDeletePackage(id);
      if (result.success) {
        toast.success('Paket berhasil dihapus');
        fetchPackages();
      } else {
        toast.error(result.message || 'Gagal menghapus paket');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {isEditing ? 'Edit' : 'Tambah'} Paket XL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Package Code</Label>
                <Input
                  placeholder="XL_PACKAGE_CODE"
                  value={formData.package_code}
                  onChange={(e) => setFormData({ ...formData, package_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Nama Paket</Label>
                <Input
                  placeholder="Nama Paket"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi paket..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Harga (Rupiah)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.price ?? ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Fee Website (Rupiah)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.fee ?? ''}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            
            {isEditing && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active === 1}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked ? 1 : 0 })}
                />
                <Label>Aktif</Label>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEditing ? 'Update' : 'Tambah'} Paket
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold">Daftar Paket</h3>
        {isLoading && packages.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          </div>
        ) : packages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada paket</p>
        ) : (
          packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{pkg.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Code: {pkg.package_code} | Harga: Rp{pkg.price.toLocaleString()} | Fee: Rp{pkg.fee.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(pkg)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(pkg.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
