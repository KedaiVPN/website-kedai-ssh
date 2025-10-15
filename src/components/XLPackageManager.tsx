import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash, Loader2, RefreshCw } from 'lucide-react';
import { xlService, type XLPackage } from '@/services/xlService';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ExternalPackage {
  package_code: string;
  package_name: string;
  package_description: string;
  package_harga_int: number;
}

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

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [externalPackages, setExternalPackages] = useState<ExternalPackage[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Record<string, { fee: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.package_code || !formData.name || formData.price === undefined || formData.price === null || formData.fee === undefined || formData.fee === null) {
      toast.error('Package code, name, price, dan fee wajib diisi');
      return;
    }
    
    setIsLoading(true);
    try {
      if (formData.id) {
        const result = await xlService.adminUpdatePackage(formData.id, formData);
        toast[result.success ? 'success' : 'error'](result.message || (result.success ? 'Paket berhasil diperbarui' : 'Gagal memperbarui paket'));
      } else {
        const result = await xlService.adminAddPackage(formData);
        toast[result.success ? 'success' : 'error'](result.message || (result.success ? 'Paket berhasil ditambahkan' : 'Gagal menambahkan paket'));
      }
      
      resetForm();
      fetchPackages();
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (pkg: XLPackage) => {
    setFormData(pkg);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus paket ini?')) return;
    
    setIsLoading(true);
    try {
      const result = await xlService.adminDeletePackage(id);
      toast[result.success ? 'success' : 'error'](result.message || (result.success ? 'Paket berhasil dihapus' : 'Gagal menghapus paket'));
      if(result.success) fetchPackages();
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSyncModal = async () => {
    setIsSyncing(true);
    try {
      const result = await xlService.adminGetExternalPackages();
      if (result.status) {
        setExternalPackages(result.data);

        // Pre-fill selection with existing packages
        const existingSelection: Record<string, { fee: number }> = {};
        packages.forEach(pkg => {
          existingSelection[pkg.package_code] = { fee: pkg.fee };
        });
        setSelectedPackages(existingSelection);

        setIsSyncModalOpen(true);
      } else {
        toast.error(result.message || 'Gagal mengambil daftar paket eksternal');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengambil paket eksternal');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTogglePackageSelection = (pkg: ExternalPackage) => {
    const newSelection = { ...selectedPackages };
    if (newSelection[pkg.package_code]) {
      delete newSelection[pkg.package_code];
    } else {
      const existingPackage = packages.find(p => p.package_code === pkg.package_code);
      newSelection[pkg.package_code] = { fee: existingPackage?.fee || 1000 }; // Default fee 1000
    }
    setSelectedPackages(newSelection);
  };

  const handleFeeChange = (packageCode: string, fee: number) => {
    const newSelection = { ...selectedPackages };
    if (newSelection[packageCode]) {
      newSelection[packageCode].fee = fee;
      setSelectedPackages(newSelection);
    }
  };

  const handleSyncSubmit = async () => {
    const packagesToSync = externalPackages
      .filter(pkg => selectedPackages[pkg.package_code])
      .map(pkg => ({
        package_code: pkg.package_code,
        name: pkg.package_name,
        description: pkg.package_description,
        price: pkg.package_harga_int,
        fee: selectedPackages[pkg.package_code].fee,
      }));

    if (packagesToSync.length === 0) {
      toast.info('Tidak ada paket yang dipilih untuk disinkronkan.');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await xlService.adminSyncPackages(packagesToSync);
      toast[result.success ? 'success' : 'error'](result.message || 'Sinkronisasi gagal');
      if (result.success) {
        setIsSyncModalOpen(false);
        fetchPackages();
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredPackages = externalPackages.filter(pkg =>
    pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {isEditing ? 'Edit' : 'Tambah'} Paket XL Manual
          </CardTitle>
          <CardDescription>
            Tambah atau edit paket secara manual. Untuk sinkronisasi massal, gunakan tombol di bawah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Form remains the same */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Package Code</Label>
                <Input
                  placeholder="XL_PACKAGE_CODE"
                  value={formData.package_code || ''}
                  onChange={(e) => setFormData({ ...formData, package_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Nama Paket</Label>
                <Input
                  placeholder="Nama Paket"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi paket..."
                value={formData.description || ''}
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

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Daftar Paket Tersimpan</h3>
          <Button onClick={handleOpenSyncModal} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sinkronkan Paket dari Provider
          </Button>
        </div>

        {isLoading && packages.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          </div>
        ) : packages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada paket yang disimpan. Coba sinkronkan dari provider.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={!pkg.is_active ? 'bg-muted/50' : ''}>
                <CardContent className="p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Code: <span className="font-mono">{pkg.package_code}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                    Code: {pkg.package_code} | Harga: Rp{(pkg.price || 0).toLocaleString()} | Fee: Rp{(pkg.fee || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Status: {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(pkg)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(pkg.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sync Modal */}
      <Dialog open={isSyncModalOpen} onOpenChange={setIsSyncModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Sinkronkan Paket dari Provider</DialogTitle>
            <DialogDescription>
              Pilih paket yang ingin Anda rilis di frontend dan atur biaya layanannya.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <Input
              placeholder="Cari nama paket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-grow overflow-y-auto space-y-2 pr-4 -mr-4">
            {filteredPackages.map(pkg => (
              <Card key={pkg.package_code} className={`transition-all ${selectedPackages[pkg.package_code] ? 'border-primary' : ''}`}>
                <CardContent className="p-3 flex items-start gap-4">
                  <Checkbox
                    id={`pkg-${pkg.package_code}`}
                    checked={!!selectedPackages[pkg.package_code]}
                    onCheckedChange={() => handleTogglePackageSelection(pkg)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor={`pkg-${pkg.package_code}`} className="font-medium cursor-pointer">{pkg.package_name}</label>
                    <p className="text-xs text-muted-foreground font-mono">{pkg.package_code}</p>
                    <p className="text-xs text-muted-foreground mt-1">{pkg.package_description}</p>
                    <p className="text-sm font-semibold mt-2">Harga Provider: Rp{pkg.package_harga_int.toLocaleString()}</p>
                  </div>
                  {selectedPackages[pkg.package_code] && (
                    <div className="w-40">
                      <Label>Fee (Rp)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={selectedPackages[pkg.package_code].fee}
                        onChange={(e) => handleFeeChange(pkg.package_code, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncModalOpen(false)}>Batal</Button>
            <Button onClick={handleSyncSubmit} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan & Sinkronkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
