import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Trash2, Plus, Server, LogOut, Edit, Users, Database, MessageSquare, Bug, Cloud, FileText, Link, Gamepad2 } from 'lucide-react';
import AdminLogin from '@/components/AdminLogin';
import AdminPasswordChange from '@/components/AdminPasswordChange';
import UserManagementTable from '@/components/UserManagementTable';
import UserActionModal from '@/components/UserActionModal';
import MessageManager from '@/components/MessageManager';
import BugManager from '@/components/BugManager';
import XLPackageManager from '@/components/XLPackageManager';
import DigitalOceanManager from '@/components/DigitalOceanManager';
import ArticleManager from '@/components/ArticleManager';
import TelegramReverseProxy from '@/components/TelegramReverseProxy';
import DigiflazzManager from '@/components/DigiflazzManager';
import GameBrandImageManager from '@/components/GameBrandImageManager';
import GameBannerManager from '@/components/GameBannerManager';
import OtherProductManager from '@/components/OtherProductManager'; // Import the new component
import { adminService } from '@/services/adminService';
import { adminAuthService } from '@/services/adminAuthService';

interface ServerData {
  id: number;
  domain: string;
  auth: string;
  nama_server: string;
  location?: string;
  protocols?: string;
  status?: 'online' | 'offline' | 'maintenance';
  batas_create_akun?: number;
  // Pricing fields
  member_1ip?: number;
  member_2ip?: number;
  member_4ip?: number;
  reseller_1ip?: number;
  reseller_2ip?: number;
  reseller_4ip?: number;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  balance: number;
  is_locked: boolean;
  role: 'member' | 'reseller';
  created_at: string;
  transaction_count: number;
}

interface AddServerForm {
  domain: string;
  auth: string;
  nama_server: string;
  location: string;
  protocols: string;
  status: 'online' | 'offline' | 'maintenance';
  batas_create_akun: number;
  // Pricing fields
  member_1ip: number;
  member_2ip: number;
  member_4ip: number;
  reseller_1ip: number;
  reseller_2ip: number;
  reseller_4ip: number;
}

interface EditServerForm {
  domain: string;
  auth: string;
  nama_server: string;
  location: string;
  protocols: string;
  status: 'online' | 'offline' | 'maintenance';
  batas_create_akun: number;
  // Pricing fields
  member_1ip: number;
  member_2ip: number;
  member_4ip: number;
  reseller_1ip: number;
  reseller_2ip: number;
  reseller_4ip: number;
}

const AdminDashboard = () => {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showOnlyWithScheduled, setShowOnlyWithScheduled] = useState(false);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUpdatingServer, setIsUpdatingServer] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

const form = useForm<AddServerForm>({
  defaultValues: {
    domain: '',
    auth: '',
    nama_server: '',
    location: '',
    protocols: '',
    status: 'online',
    batas_create_akun: 1000,
    member_1ip: 330,
    member_2ip: 430,
    member_4ip: 600,
    reseller_1ip: 165,
    reseller_2ip: 215,
    reseller_4ip: 300
  }
});

const editForm = useForm<EditServerForm>({
  defaultValues: {
    domain: '',
    auth: '',
    nama_server: '',
    location: '',
    protocols: '',
    status: 'online',
    batas_create_akun: 1000,
    member_1ip: 330,
    member_2ip: 430,
    member_4ip: 600,
    reseller_1ip: 165,
    reseller_2ip: 215,
    reseller_4ip: 300
  }
});

  useEffect(() => {
    // Check if user is logged in using the new auth service
    const isAuthenticated = adminAuthService.isLoggedIn();
    setIsLoggedIn(isAuthenticated);

    if (isAuthenticated) {
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    try {
      await adminAuthService.getMe();
      setIsLoggedIn(true);
      loadServers();
    } catch (error) {
      console.error('Token verification failed:', error);
      adminAuthService.logout();
      setIsLoggedIn(false);
      toast.error('Sesi login telah berakhir, silakan login kembali');
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    loadServers();
  };

  const handleLogout = () => {
    adminAuthService.logout();
    setIsLoggedIn(false);
    setServers([]);
    setUsers([]);
    toast.success('Logout berhasil!');
  };

  const loadServers = async () => {
    setIsLoading(true);
    try {
      console.log('Loading servers from admin service...');
      const serverData = await adminService.getServers();
      console.log('Servers loaded:', serverData);
      setServers(serverData);
    } catch (error) {
      console.error('Error loading servers:', error);
      toast.error('Gagal memuat daftar server');
      setServers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddServer = async (data: AddServerForm) => {
    setIsAddingServer(true);
    try {
      console.log('Adding server:', data);

// Validate form data
if (!data.domain || !data.auth || !data.nama_server || !data.location || !data.protocols || !data.status || data.batas_create_akun == null ||
    data.member_1ip == null || data.member_2ip == null || data.member_4ip == null ||
    data.reseller_1ip == null || data.reseller_2ip == null || data.reseller_4ip == null) {
  toast.error('Semua field wajib diisi termasuk harga harian member/reseller untuk 1/2/4 IP');
  return;
}

      const newServer = await adminService.addServer(data);
      console.log('Server added successfully:', newServer);

      // Update local state
      setServers([...servers, newServer]);

      // Reset form
      form.reset();

      toast.success('Server berhasil ditambahkan');
    } catch (error: any) {
      console.error('Error adding server:', error);

      // Improved error handling
      let errorMessage = 'Gagal menambahkan server';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsAddingServer(false);
    }
  };

  const handleEditServer = (server: ServerData) => {
    setEditingServer(server);
editForm.reset({
  domain: server.domain,
  auth: server.auth,
  nama_server: server.nama_server,
  location: server.location || '',
  protocols: server.protocols || '',
  status: server.status || 'online',
  batas_create_akun: server.batas_create_akun || 1000,
  member_1ip: server.member_1ip ?? 330,
  member_2ip: server.member_2ip ?? 430,
  member_4ip: server.member_4ip ?? 600,
  reseller_1ip: server.reseller_1ip ?? 165,
  reseller_2ip: server.reseller_2ip ?? 215,
  reseller_4ip: server.reseller_4ip ?? 300
});
    setIsEditModalOpen(true);
  };

  const handleUpdateServer = async (data: EditServerForm) => {
    if (!editingServer) return;

    setIsUpdatingServer(true);
    try {
      console.log('Updating server:', editingServer.id, data);

// Validate form data
if (!data.domain || !data.auth || !data.nama_server || !data.location || !data.protocols || !data.status || data.batas_create_akun == null ||
    data.member_1ip == null || data.member_2ip == null || data.member_4ip == null ||
    data.reseller_1ip == null || data.reseller_2ip == null || data.reseller_4ip == null) {
  toast.error('Semua field wajib diisi termasuk harga harian member/reseller untuk 1/2/4 IP');
  return;
}

      const updatedServer = await adminService.updateServer(editingServer.id, data);
      console.log('Server updated successfully:', updatedServer);

      // Update local state
      setServers(servers.map(server =>
        server.id === editingServer.id ? updatedServer : server
      ));

      // Close modal and reset form
      setIsEditModalOpen(false);
      setEditingServer(null);
      editForm.reset();

      toast.success('Server berhasil diperbarui');
    } catch (error: any) {
      console.error('Error updating server:', error);

      // Improved error handling
      let errorMessage = 'Gagal memperbarui server';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsUpdatingServer(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingServer(null);
    editForm.reset();
  };

  const handleDeleteServer = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus server ini?')) {
      return;
    }

    try {
      console.log('Deleting server with ID:', id);
      await adminService.deleteServer(id);
      setServers(servers.filter(server => server.id !== id));
      toast.success('Server berhasil dihapus');
    } catch (error) {
      console.error('Error deleting server:', error);
      toast.error('Gagal menghapus server');
    }
  };

  const loadUsers = async (searchTerm = '', filterScheduled = showOnlyWithScheduled) => {
    setIsLoadingUsers(true);
    try {
      console.log(`Loading users from admin service... (Search: ${searchTerm}, FilterScheduled: ${filterScheduled})`);
      const userData = await adminService.getUsers(searchTerm, filterScheduled);
      console.log('Users loaded:', userData);
      setUsers(userData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Gagal memuat daftar user');
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Trigger user load when filter changes
  useEffect(() => {
    if (isLoggedIn) { // Only load if a tab is active
        loadUsers('', showOnlyWithScheduled);
    }
  }, [showOnlyWithScheduled]);

  const handleUserAction = (user: UserData) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleUserUpdated = () => {
    loadUsers(); // Reload users after any update
  };

  const handleCleanup = async () => {
    if (!confirm('Apakah Anda yakin ingin memulai proses pembersihan database? Ini akan menghapus data lama dan akun yang sudah kedaluwarsa.')) {
      return;
    }
    setIsCleaning(true);
    toast.info('Memulai proses pembersihan database...');
    try {
      const result = await adminService.cleanupDatabase();
      toast.success(result.message || 'Pembersihan database berhasil diselesaikan.');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal melakukan pembersihan database.';
      toast.error(errorMessage);
    } finally {
      setIsCleaning(false);
    }
  };

  console.log('Rendering AdminDashboard, servers:', servers, 'isLoading:', isLoading);

  // Show login form if not logged in
  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 relative z-10 transition-transform duration-300 overflow-x-hidden">
      <Header />

      <div className="pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Page Header with Logout */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola server VPN dan user sistem
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="servers" className="space-y-6">
            <TabsList className="flex justify-start overflow-x-auto -mx-4 px-4 border-b sm:grid sm:w-full sm:grid-cols-6 sm:justify-center sm:border-b-0 sm:mx-0 sm:px-0">
              <TabsTrigger value="servers" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Server Management
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2" onClick={() => loadUsers()}>
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message Management
              </TabsTrigger>
              <TabsTrigger value="bugs" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Bug Management
              </TabsTrigger>
              <TabsTrigger value="xl-packages" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                XL Packages
              </TabsTrigger>
              <TabsTrigger value="do-management" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                DO Management
              </TabsTrigger>
              <TabsTrigger value="articles" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="reverse" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Reverse
              </TabsTrigger>
              <TabsTrigger value="digiflazz" className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                Game Topup
              </TabsTrigger>
               <TabsTrigger value="other-products" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Produk Lainnya
              </TabsTrigger>
            </TabsList>

            {/* Server Management Tab */}
            <TabsContent value="servers" className="space-y-6">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Tambah Server Baru
                  </CardTitle>
                  <CardDescription>
                    Masukkan informasi server VPN yang ingin ditambahkan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddServer)} className="space-y-6">
                      {/* First Row - Original Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="domain"
                          rules={{ required: 'Domain wajib diisi' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Domain</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="example.kedaivpn.cloud"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="auth"
                          rules={{ required: 'Auth key wajib diisi' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Auth Key</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123abc"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="nama_server"
                          rules={{ required: 'Nama server wajib diisi' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Server</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="🇮🇩 ID-ATHA 1IP"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

{/* Second Row - Additional Fields */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <FormField
    control={form.control}
    name="location"
    rules={{ required: 'Lokasi wajib diisi' }}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Lokasi</FormLabel>
        <FormControl>
          <Input
            placeholder="Singapore, Indonesia"
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="protocols"
    rules={{ required: 'Protocols wajib diisi' }}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Protocols</FormLabel>
        <FormControl>
          <Input
            placeholder="ssh,vmess,vless,trojan"
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="status"
    rules={{ required: 'Status wajib dipilih' }}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Status</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="batas_create_akun"
    rules={{ required: 'Batas maksimum akun wajib diisi', min: { value: 1, message: 'Minimal 1 akun' } }}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Batas Max Akun</FormLabel>
        <FormControl>
          <Input
            type="number"
            min="1"
            placeholder="1000"
            {...field}
            onChange={(e) => field.onChange(Number(e.target.value))}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

{/* Pricing Settings */}
<div className="space-y-4">
  <h3 className="text-base font-semibold">Harga Harian (Rp)</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Harga Member</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="member_1ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>1 IP</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="330" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="member_2ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>2 IP</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="430" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="member_4ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>4 IP/STB</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="600" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Harga Reseller</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="reseller_1ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>1 IP</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="165" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reseller_2ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>2 IP</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="215" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reseller_4ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>4 IP/STB</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="300" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  </div>
</div>

                      <Button
                        type="submit"
                        disabled={isAddingServer}
                        className="w-full md:w-auto"
                      >
                        {isAddingServer ? 'Menambahkan...' : 'Tambah Server'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Servers List */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Daftar Server ({servers.length})
                  </CardTitle>
                  <CardDescription>
                    Kelola semua server VPN yang tersedia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : servers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Belum ada server yang tersedia
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {servers.map((server) => (
                        <Card key={server.id} className="relative">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{server.nama_server}</CardTitle>
                            <CardDescription className="break-all">
                              {server.domain}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">
                                  Auth Key
                                </Label>
                                <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                                  {server.auth}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">
                                  Server ID
                                </Label>
                                <p className="text-sm">#{server.id}</p>
                              </div>
                              {server.location && (
                                <div>
                                  <Label className="text-xs text-gray-500 dark:text-gray-400">
                                    Lokasi
                                  </Label>
                                  <p className="text-sm">{server.location}</p>
                                </div>
                              )}
                              {server.status && (
                                <div>
                                  <Label className="text-xs text-gray-500 dark:text-gray-400">
                                    Status
                                  </Label>
                                  <p className="text-sm capitalize">{server.status}</p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleEditServer(server)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Server
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-full"
                                onClick={() => handleDeleteServer(server.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Server
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Tindakan Sistem
                  </CardTitle>
                  <CardDescription>
                    Lakukan tugas pemeliharaan untuk seluruh sistem.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <Button onClick={handleCleanup} disabled={isCleaning}>
                      {isCleaning ? 'Membersihkan...' : 'Bersihkan Database'}
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
                      Menghapus akun kedaluwarsa dan catatan transaksi lama secara manual.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Daftar User ({users.length})
                  </CardTitle>
                  <CardDescription>
                    Kelola semua user yang terdaftar di sistem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="scheduled-filter"
                      checked={showOnlyWithScheduled}
                      onChange={(e) => setShowOnlyWithScheduled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="scheduled-filter">
                      Hanya tampilkan user dengan pembelian terjadwal
                    </Label>
                  </div>
                  <UserManagementTable
                    users={users}
                    isLoading={isLoadingUsers}
                    onUserAction={handleUserAction}
                    onSearch={loadUsers}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <MessageManager />
            </TabsContent>

            <TabsContent value="bugs" className="space-y-6">
              <BugManager />
            </TabsContent>

            {/* XL Package Management Tab */}
            <TabsContent value="xl-packages" className="space-y-6">
              <XLPackageManager />
            </TabsContent>

            {/* DigitalOcean Management Tab */}
            <TabsContent value="do-management" className="space-y-6">
              <DigitalOceanManager />
            </TabsContent>

            {/* Article Management Tab */}
            <TabsContent value="articles" className="space-y-6">
              <ArticleManager />
            </TabsContent>

            {/* Telegram Reverse Proxy Tab */}
            <TabsContent value="reverse" className="space-y-6">
              <TelegramReverseProxy />
            </TabsContent>

            {/* Digiflazz Game Topup Management Tab */}
            <TabsContent value="digiflazz" className="space-y-6">
              <DigiflazzManager />
              <GameBrandImageManager />
              <GameBannerManager />
            </TabsContent>

            {/* Other Products Management Tab */}
            <TabsContent value="other-products" className="space-y-6">
              <OtherProductManager />
            </TabsContent>
          </Tabs>

          {/* User Action Modal */}
          <UserActionModal
            user={selectedUser}
            isOpen={isUserModalOpen}
            onClose={() => {
              setIsUserModalOpen(false);
              setSelectedUser(null);
            }}
            onUserUpdated={handleUserUpdated}
          />

          {/* Edit Server Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Server</DialogTitle>
                <DialogDescription>
                  Perbarui informasi server VPN
                </DialogDescription>
              </DialogHeader>

              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleUpdateServer)} className="space-y-6">
                  {/* First Row - Original Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={editForm.control}
                      name="domain"
                      rules={{ required: 'Domain wajib diisi' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="example.kedaivpn.cloud"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="auth"
                      rules={{ required: 'Auth key wajib diisi' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auth Key</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123abc"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="nama_server"
                      rules={{ required: 'Nama server wajib diisi' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Server</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="🇮🇩 ID-ATHA 1IP"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

{/* Second Row - Additional Fields */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <FormField
    control={editForm.control}
    name="location"
    rules={{ required: 'Lokasi wajib diisi' }}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Lokasi</FormLabel>
        <FormControl>
          <Input
            placeholder="Singapore, Indonesia"
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={editForm.control}
    name="protocols"
    rules={{ required: 'Protocols wajib diisi' }}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Protocols</FormLabel>
        <FormControl>
          <Input
            placeholder="ssh,vmess,vless,trojan"
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={editForm.control}
    name="status"
    rules={{ required: 'Status wajib dipilih' }}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Status</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={editForm.control}
    name="batas_create_akun"
    rules={{ required: 'Batas maksimum akun wajib diisi', min: { value: 1, message: 'Minimal 1 akun' } }}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Batas Max Akun</FormLabel>
        <FormControl>
          <Input
            type="number"
            min="1"
            placeholder="1000"
            {...field}
            onChange={(e) => field.onChange(Number(e.target.value))}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

{/* Pricing Settings */}
<div className="space-y-4">
  <h3 className="text-base font-semibold">Harga Harian (Rp)</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Harga Member</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={editForm.control}
          name="member_1ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>1 IP</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="330" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="member_2ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>2 IP</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="430" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="member_4ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>4 IP/STB</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="600" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Harga Reseller</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={editForm.control}
          name="reseller_1ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>1 IP</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="165" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="reseller_2ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>2 IP</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="215" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="reseller_4ip"
          rules={{ required: 'Wajib' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>4 IP/STB</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="300" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  </div>
</div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseEditModal}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUpdatingServer}
                    >
                      {isUpdatingServer ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Password Change Form */}
          <AdminPasswordChange />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
