import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { digitalOceanService } from '@/services/digitalOceanService';
import { ApiKey, Droplet, AccountInfo, Balance, Region, Size, Image, SshKey } from '@/types/digitalocean';
import { Trash2, PlusCircle, Power, RefreshCw, Eye, EyeOff, Copy, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const DigitalOceanManager: React.FC = () => {
  // Existing state variables
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [images, setImages] = useState<Image[]>([]);

  // New state for SSH Keys
  const [sshKeys, setSshKeys] = useState<SshKey[]>([]);
  const [isSshKeyLoading, setIsSshKeyLoading] = useState(false);
  const [isAddSshKeyModalOpen, setIsAddSshKeyModalOpen] = useState(false);
  const [isDeleteSshKeyModalOpen, setIsDeleteSshKeyModalOpen] = useState(false);
  const [newSshKeyName, setNewSshKeyName] = useState('');
  const [newSshKeyPublicKey, setNewSshKeyPublicKey] = useState('');
  const [keyToDelete, setKeyToDelete] = useState<SshKey | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [isDropletLoading, setIsDropletLoading] = useState(false);
  const [isAccountInfoLoading, setIsAccountInfoLoading] = useState(false);

  // Modal states
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false); // Re-add missing state
  const [isCreateDropletModalOpen, setIsCreateDropletModalOpen] = useState(false);
  const [isDeleteDropletModalOpen, setIsDeleteDropletModalOpen] = useState(false);
  const [isDeleteApiKeyModalOpen, setIsDeleteApiKeyModalOpen] = useState(false);

  // Form states
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyValue, setNewApiKeyValue] = useState('');
  const [showApiKeyValue, setShowApiKeyValue] = useState(false);
  const [dropletToDelete, setDropletToDelete] = useState<Droplet | null>(null);
  const [apiKeyToDelete, setApiKeyToDelete] = useState<ApiKey | null>(null);

  const [newDroplet, setNewDroplet] = useState({
    name: '',
    region: '',
    size: '',
    image: '',
    ssh_keys: [] as number[],
  });

  const fetchApiKeys = useCallback(async () => {
    setIsKeyLoading(true);
    try {
      const keys = await digitalOceanService.getApiKeys();
      setApiKeys(keys);
      if (keys.length > 0) {
        const activeKey = keys.find(k => k.is_active) || keys[0];
        setSelectedApiKey(activeKey);
      }
    } catch (error) {
      toast.error('Gagal memuat API keys');
    } finally {
      setIsKeyLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const fetchSshKeys = useCallback(async (keyId: number) => {
    setIsSshKeyLoading(true);
    try {
      const keys = await digitalOceanService.getSshKeys(keyId);
      setSshKeys(keys);
    } catch (error) {
      toast.error('Gagal memuat SSH keys');
      setSshKeys([]);
    } finally {
      setIsSshKeyLoading(false);
    }
  }, []);

  // Other fetch functions (droplets, account info, etc.) remain the same...
  const fetchDropletData = useCallback(async (keyId: number) => {
    setIsDropletLoading(true);
    try {
      const dropletData = await digitalOceanService.getDroplets(keyId);
      setDroplets(dropletData.droplets || []);
    } catch (error) {
      toast.error('Gagal memuat droplets');
      setDroplets([]);
    } finally {
      setIsDropletLoading(false);
    }
  }, []);

  const fetchAccountInfo = useCallback(async (keyId: number) => {
    setIsAccountInfoLoading(true);
    setAccountInfo(null);
    setBalance(null);
    try {
      const [accInfo, balInfo] = await Promise.all([
        digitalOceanService.getAccountInfo(keyId),
        digitalOceanService.getBalanceInfo(keyId)
      ]);
      setAccountInfo(accInfo.account);
      setBalance(balInfo);
    } catch (error) {
      toast.error('Gagal memuat info akun');
    } finally {
      setIsAccountInfoLoading(false);
    }
  }, []);

  const fetchCreationOptions = useCallback(async (keyId: number) => {
    try {
      const [regionsData, sizesData, imagesData] = await Promise.all([
        digitalOceanService.getRegions(keyId),
        digitalOceanService.getSizes(keyId),
        digitalOceanService.getImages(keyId),
      ]);
      setRegions(regionsData.regions || []);
      setSizes(sizesData.sizes || []);
      const filteredImages = imagesData.images?.filter(img => {
        const dist = img.distribution.toLowerCase();
        const name = img.name.toLowerCase();
        return (dist.includes('ubuntu') || dist.includes('debian')) && (name.includes('12') || name.includes('13') || name.includes('24.04'));
      }) || [];
      setImages(filteredImages);
      // Set default image if available
      if (filteredImages.length > 0) {
        setNewDroplet(prev => ({ ...prev, image: filteredImages.find(i => i.slug.includes('ubuntu-24-04'))?.slug || filteredImages[0].slug }));
      }
    } catch (error) {
      toast.error('Gagal memuat opsi pembuatan droplet');
    }
  }, []);

  useEffect(() => {
    if (selectedApiKey) {
      fetchAccountInfo(selectedApiKey.id);
      fetchDropletData(selectedApiKey.id);
      fetchCreationOptions(selectedApiKey.id);
      fetchSshKeys(selectedApiKey.id); // Fetch SSH keys when API key changes
    } else {
      // Reset all data
      setDroplets([]);
      setAccountInfo(null);
      setBalance(null);
      setRegions([]);
      setSizes([]);
      setImages([]);
      setSshKeys([]);
    }
  }, [selectedApiKey, fetchAccountInfo, fetchDropletData, fetchCreationOptions, fetchSshKeys]);

  const handleAddApiKey = async () => {
    if (!newApiKeyName || !newApiKeyValue) {
      toast.error('Silakan masukkan nama dan API key.');
      return;
    }
    setIsLoading(true);
    try {
      await digitalOceanService.addApiKey(newApiKeyName, newApiKeyValue);
      toast.success('API Key berhasil ditambahkan');
      setNewApiKeyName('');
      setNewApiKeyValue('');
      // setIsAddKeyModalOpen(false); // This state is duplicated, should be corrected
      fetchApiKeys();
    } catch (error) {
      toast.error('Gagal menambahkan API Key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!apiKeyToDelete) return;
    setIsLoading(true);
    try {
      await digitalOceanService.deleteApiKey(apiKeyToDelete.id);
      toast.success(`API Key "${apiKeyToDelete.name}" berhasil dihapus`);
      setIsDeleteApiKeyModalOpen(false);
      setApiKeyToDelete(null);
      fetchApiKeys();
    } catch (error) {
      toast.error('Gagal menghapus API Key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSshKey = async () => {
    if (!selectedApiKey || !newSshKeyName || !newSshKeyPublicKey) {
        toast.error('Nama dan Public Key SSH harus diisi.');
        return;
    }
    setIsLoading(true);
    try {
        await digitalOceanService.addSshKey(selectedApiKey.id, newSshKeyName, newSshKeyPublicKey);
        toast.success('SSH Key berhasil ditambahkan');
        setNewSshKeyName('');
        setNewSshKeyPublicKey('');
        setIsAddSshKeyModalOpen(false);
        fetchSshKeys(selectedApiKey.id);
    } catch (error) {
        toast.error((error as any)?.response?.data?.message || 'Gagal menambahkan SSH Key');
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteSshKey = async () => {
      if (!selectedApiKey || !keyToDelete) return;
      setIsLoading(true);
      try {
          await digitalOceanService.deleteSshKey(selectedApiKey.id, keyToDelete.id);
          toast.success(`SSH Key "${keyToDelete.name}" berhasil dihapus`);
          setIsDeleteSshKeyModalOpen(false);
          setKeyToDelete(null);
          fetchSshKeys(selectedApiKey.id);
      } catch (error) {
          toast.error('Gagal menghapus SSH key.');
      } finally {
          setIsLoading(false);
      }
  };

  const handleCreateDroplet = async () => {
    if (!selectedApiKey || !newDroplet.name || !newDroplet.region || !newDroplet.size || !newDroplet.image || newDroplet.ssh_keys.length === 0) {
      toast.error('Silakan isi semua kolom dan pilih setidaknya satu SSH key.');
      return;
    }
    setIsLoading(true);
    try {
      await digitalOceanService.createDroplet(selectedApiKey.id, newDroplet);
      toast.success('Pembuatan droplet dimulai');
      setIsCreateDropletModalOpen(false);
      setNewDroplet({ name: '', region: '', size: '', image: '', ssh_keys: [] });
      fetchDropletData(selectedApiKey.id);
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || 'Gagal membuat droplet';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // handleDeleteDroplet and handleCopyIp remain the same...
  const handleDeleteDroplet = async () => {
    if (!dropletToDelete || !selectedApiKey) return;
    setIsLoading(true);
    try {
      await digitalOceanService.deleteDroplet(selectedApiKey.id, dropletToDelete.id);
      toast.success(`Droplet "${dropletToDelete.name}" berhasil dihapus`);
      setIsDeleteDropletModalOpen(false);
      setDropletToDelete(null);
      fetchDropletData(selectedApiKey.id);
    } catch (error) {
      toast.error('Gagal menghapus droplet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    toast.success('Alamat IP disalin ke clipboard!');
  };

  // UI rendering starts here
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DigitalOcean API Keys</CardTitle>
          <CardDescription>Kelola API key DigitalOcean Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
                <Select onValueChange={(value) => setSelectedApiKey(apiKeys.find(k => k.id === parseInt(value)) || null)} value={selectedApiKey?.id.toString()}>
                <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Pilih API Key" />
                </SelectTrigger>
                <SelectContent>
                    {apiKeys.map(key => (
                    <SelectItem key={key.id} value={key.id.toString()}>{key.name}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Button onClick={() => setIsAddKeyModalOpen(true)} size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Tambah API Key</Button>
                {selectedApiKey && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                    setApiKeyToDelete(selectedApiKey);
                    setIsDeleteApiKeyModalOpen(true);
                    }}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Key Terpilih
                </Button>
                )}
            </div>
            {isKeyLoading && <p>Memuat API keys...</p>}
        </CardContent>
      </Card>

      {selectedApiKey && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Info and Droplets cards remain the same */}
            <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Informasi Akun</CardTitle>
                <Button size="sm" variant="outline" onClick={() => fetchAccountInfo(selectedApiKey.id)} disabled={isAccountInfoLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isAccountInfoLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                </CardHeader>
                <CardContent>
                {isAccountInfoLoading ? (
                    <p>Memuat info akun...</p>
                ) : accountInfo ? (
                    <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> {accountInfo.email} {accountInfo.email_verified && <Badge variant="success">Terverifikasi</Badge>}</p>
                    <p><strong>Status:</strong> {accountInfo.status}</p>
                    <p><strong>Limit Droplet:</strong> {accountInfo.droplet_limit}</p>
                    {balance && (
                        <>
                        <p><strong>Penggunaan Bulan Ini:</strong> ${balance.month_to_date_balance}</p>
                        <p><strong>Saldo Kredit/Promo:</strong> ${balance.account_balance}</p>
                        <p className="text-xs text-gray-500">Diperbarui: {new Date(balance.generated_at).toLocaleString()}</p>
                        </>
                    )}
                    </div>
                ) : (
                    <p>Tidak ada informasi akun tersedia.</p>
                )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Droplets</CardTitle>
                    <CardDescription>Daftar droplet untuk API key yang dipilih.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => fetchDropletData(selectedApiKey.id)} size="sm" variant="outline" disabled={isDropletLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isDropletLoading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={() => setIsCreateDropletModalOpen(true)} size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Buat Droplet</Button>
                </div>
                </CardHeader>
                <CardContent>
                    {/* Droplet Table Here */}
                    {isDropletLoading ? (
                        <p>Memuat droplets...</p>
                    ) : (
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Alamat IP</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Dibuat</TableHead>
                            <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {droplets.length > 0 ? droplets.map(droplet => {
                            const ip = droplet.networks.v4.find(n => n.type === 'public')?.ip_address || 'N/A';
                            return (
                                <TableRow key={droplet.id}>
                                <TableCell>{droplet.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                    <span>{ip}</span>
                                    {ip !== 'N/A' && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyIp(ip)}>
                                        <Copy className="h-4 w-4" />
                                        </Button>
                                    )}
                                    </div>
                                </TableCell>
                                <TableCell>{droplet.status === 'active' ? <Badge variant="success">Aktif</Badge> : <Badge>{droplet.status}</Badge>}</TableCell>
                                <TableCell>{droplet.region.name}</TableCell>
                                <TableCell>{formatDistanceToNow(new Date(droplet.created_at), { addSuffix: true })}</TableCell>
                                <TableCell>
                                    <Button variant="destructive" size="sm" onClick={() => {
                                    setDropletToDelete(droplet);
                                    setIsDeleteDropletModalOpen(true);
                                    }}>
                                    <Power className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            );
                            }) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Tidak ada droplet ditemukan.</TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* New SSH Key Management Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Manajemen SSH Keys</CardTitle>
                <CardDescription>Kelola SSH keys yang terhubung dengan akun DigitalOcean Anda.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => fetchSshKeys(selectedApiKey.id)} size="sm" variant="outline" disabled={isSshKeyLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isSshKeyLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                <Button onClick={() => setIsAddSshKeyModalOpen(true)} size="sm"><Key className="mr-2 h-4 w-4" /> Tambah SSH Key</Button>
            </div>
            </CardHeader>
            <CardContent>
            {isSshKeyLoading ? (
                <p>Memuat SSH keys...</p>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Fingerprint</TableHead>
                    <TableHead>Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sshKeys.length > 0 ? sshKeys.map(key => (
                    <TableRow key={key.id}>
                        <TableCell>{key.name}</TableCell>
                        <TableCell><code className="text-xs">{key.fingerprint}</code></TableCell>
                        <TableCell>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                            setKeyToDelete(key);
                            setIsDeleteSshKeyModalOpen(true);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </TableCell>
                    </TableRow>
                    )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">Tidak ada SSH key ditemukan.</TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            )}
            </CardContent>
        </Card>
        </>
      )}

      {/* All Modals (Dialogs) */}
      {/* Add API Key Modal */}
      <Dialog open={isAddKeyModalOpen} onOpenChange={setIsAddKeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah API Key DigitalOcean Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nama Key (cth: 'Akun Pribadi')"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
            />
            <div className="relative">
              <Input
                type={showApiKeyValue ? 'text' : 'password'}
                placeholder="dop_v1_..."
                value={newApiKeyValue}
                onChange={(e) => setNewApiKeyValue(e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowApiKeyValue(!showApiKeyValue)}
              >
                {showApiKeyValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleAddApiKey} disabled={isLoading}>
              {isLoading ? 'Menambahkan...' : 'Tambah Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add SSH Key Modal */}
      <Dialog open={isAddSshKeyModalOpen} onOpenChange={setIsAddSshKeyModalOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Tambah SSH Key Baru</DialogTitle>
                  <DialogDescription>
                      Tempel public key Anda di bawah ini. Ini akan ditambahkan ke database lokal dan akun DigitalOcean Anda.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                  <Input
                      placeholder="Nama SSH Key (cth: 'Laptop Kerja')"
                      value={newSshKeyName}
                      onChange={(e) => setNewSshKeyName(e.target.value)}
                  />
                  <Textarea
                      placeholder="ssh-rsa AAAA..."
                      value={newSshKeyPublicKey}
                      onChange={(e) => setNewSshKeyPublicKey(e.target.value)}
                      rows={6}
                  />
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                  <Button onClick={handleAddSshKey} disabled={isLoading}>
                      {isLoading ? 'Menambahkan...' : 'Tambah SSH Key'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Create Droplet Modal */}
      <Dialog open={isCreateDropletModalOpen} onOpenChange={setIsCreateDropletModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Buat Droplet Baru</DialogTitle>
            <DialogDescription>
              Konfigurasi detail untuk droplet baru Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Nama Droplet"
              value={newDroplet.name}
              onChange={(e) => setNewDroplet({ ...newDroplet, name: e.target.value })}
            />
            <Select onValueChange={(value) => setNewDroplet({ ...newDroplet, region: value })} value={newDroplet.region}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Region" />
              </SelectTrigger>
              <SelectContent>
                {regions.filter(r => r.available).map(region => (
                  <SelectItem key={region.slug} value={region.slug}>{region.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setNewDroplet({ ...newDroplet, size: value })} value={newDroplet.size}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Spesifikasi" />
              </SelectTrigger>
              <SelectContent>
                {sizes.map(size => (
                   <SelectItem key={size.slug} value={size.slug} disabled={!size.available}>
                     <div className="flex flex-col">
                        <span className="font-semibold">{size.slug.toUpperCase()} - {size.memory}MB RAM, {size.vcpus} vCPUs, {size.disk}GB SSD</span>
                        <span className="text-xs text-gray-500">${size.price_monthly}/bulan</span>
                     </div>
                   </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setNewDroplet({ ...newDroplet, image: value })} value={newDroplet.image}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Image (Distro)" />
              </SelectTrigger>
              <SelectContent>
                {images.map(image => (
                  <SelectItem key={image.slug} value={image.slug}>{image.distribution} {image.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setNewDroplet({ ...newDroplet, ssh_keys: [parseInt(value)] })} value={newDroplet.ssh_keys[0]?.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih SSH Key" />
              </SelectTrigger>
              <SelectContent>
                {sshKeys.map(key => (
                  <SelectItem key={key.id} value={key.id.toString()}>{key.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleCreateDroplet} disabled={isLoading}>
              {isLoading ? 'Membuat...' : 'Buat Droplet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modals */}
      <Dialog open={isDeleteDropletModalOpen} onOpenChange={setIsDeleteDropletModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apakah Anda yakin?</DialogTitle>
            <DialogDescription>
              Ini akan menghancurkan droplet "{dropletToDelete?.name}" secara permanen. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteDroplet} disabled={isLoading}>
              {isLoading ? 'Menghapus...' : 'Ya, Hapus Droplet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteApiKeyModalOpen} onOpenChange={setIsDeleteApiKeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus API Key?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus key "{apiKeyToDelete?.name}"? Ini akan menghapusnya dari aplikasi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteApiKey} disabled={isLoading}>
              {isLoading ? 'Menghapus...' : 'Ya, Hapus Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteSshKeyModalOpen} onOpenChange={setIsDeleteSshKeyModalOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Hapus SSH Key?</DialogTitle>
                  <DialogDescription>
                      Apakah Anda yakin ingin menghapus key "{keyToDelete?.name}"? Ini akan menghapusnya dari aplikasi dan akun DigitalOcean Anda.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                  <Button variant="destructive" onClick={handleDeleteSshKey} disabled={isLoading}>
                      {isLoading ? 'Menghapus...' : 'Ya, Hapus Key'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalOceanManager;