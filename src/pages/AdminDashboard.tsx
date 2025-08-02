import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Trash2, Plus, Server, LogOut, Edit } from 'lucide-react';
import AdminLogin from '@/components/AdminLogin';
import AdminPasswordChange from '@/components/AdminPasswordChange';
import { adminService } from '@/services/adminService';
import { useSidebar } from '@/contexts/SidebarContext';

interface ServerData {
  id: number;
  domain: string;
  auth: string;
  nama_server: string;
  location?: string;
  protocols?: string;
  status?: 'online' | 'offline' | 'maintenance';
  batas_create_akun?: number;
}

interface AddServerForm {
  domain: string;
  auth: string;
  nama_server: string;
  location: string;
  protocols: string;
  status: 'online' | 'offline' | 'maintenance';
  quota: number;
  iplimit: number;
  batas_create_akun: number;
}

interface EditServerForm {
  domain: string;
  auth: string;
  nama_server: string;
  location: string;
  protocols: string;
  status: 'online' | 'offline' | 'maintenance';
  quota: number;
  iplimit: number;
  batas_create_akun: number;
}

const AdminDashboard = () => {
  const { isMenuOpen } = useSidebar();
  const [servers, setServers] = useState<ServerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingServer, setIsUpdatingServer] = useState(false);

  const form = useForm<AddServerForm>({
    defaultValues: {
      domain: '',
      auth: '',
      nama_server: '',
      location: '',
      protocols: '',
      status: 'online',
      quota: 100,
      iplimit: 2,
      batas_create_akun: 1000
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
      quota: 100,
      iplimit: 2,
      batas_create_akun: 1000
    }
  });

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem('admin_logged_in') === 'true';
    setIsLoggedIn(loggedIn);
    
    if (loggedIn) {
      loadServers();
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    loadServers();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    setIsLoggedIn(false);
    setServers([]);
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
      if (!data.domain || !data.auth || !data.nama_server || !data.location || !data.protocols || !data.status || !data.quota || !data.iplimit || !data.batas_create_akun) {
        toast.error('Semua field wajib diisi');
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
      quota: 100,
      iplimit: 2,
      batas_create_akun: server.batas_create_akun || 1000
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateServer = async (data: EditServerForm) => {
    if (!editingServer) return;
    
    setIsUpdatingServer(true);
    try {
      console.log('Updating server:', editingServer.id, data);
      
      // Validate form data
      if (!data.domain || !data.auth || !data.nama_server || !data.location || !data.protocols || !data.status || !data.quota || !data.iplimit || !data.batas_create_akun) {
        toast.error('Semua field wajib diisi');
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
                Kelola server VPN dan pengaturan sistem
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

          {/* Add Server Form */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                      name="quota"
                      rules={{ 
                        required: 'Quota wajib diisi',
                        min: { value: 1, message: 'Minimal 1 GB' }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quota (GB)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              placeholder="100" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="iplimit"
                      rules={{ 
                        required: 'IP Limit wajib diisi',
                        min: { value: 1, message: 'Minimal 1 IP' }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IP Limit</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              placeholder="2" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="batas_create_akun"
                      rules={{ 
                        required: 'Batas maksimum akun wajib diisi',
                        min: { value: 1, message: 'Minimal 1 akun' }
                      }}
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

          {/* Edit Server Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[700px]">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                      name="quota"
                      rules={{ 
                        required: 'Quota wajib diisi',
                        min: { value: 1, message: 'Minimal 1 GB' }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quota (GB)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              placeholder="100" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="iplimit"
                      rules={{ 
                        required: 'IP Limit wajib diisi',
                        min: { value: 1, message: 'Minimal 1 IP' }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IP Limit</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              placeholder="2" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="batas_create_akun"
                      rules={{ 
                        required: 'Batas maksimum akun wajib diisi',
                        min: { value: 1, message: 'Minimal 1 akun' }
                      }}
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
