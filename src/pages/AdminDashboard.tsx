import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Trash2, Plus, Server, LogOut, Edit, Users, Database, MessageSquare, Bug } from 'lucide-react';
import AdminLogin from '@/components/AdminLogin';
import AdminPasswordChange from '@/components/AdminPasswordChange';
import UserManagementTable from '@/components/UserManagementTable';
import UserActionModal from '@/components/UserActionModal';
import MessageManager from '@/components/MessageManager';
import BugManager from '@/components/BugManager';
import { adminService } from '@/services/adminService';
import { adminAuthService } from '@/services/adminAuthService';
import { cn } from '@/lib/utils';

// Interfaces
interface ServerData { id: number; domain: string; auth: string; nama_server: string; location?: string; protocols?: string; status?: 'online' | 'offline' | 'maintenance'; batas_create_akun?: number; member_1ip?: number; member_2ip?: number; member_4ip?: number; reseller_1ip?: number; reseller_2ip?: number; reseller_4ip?: number; }
interface UserData { id: number; username: string; email: string; balance: number; is_locked: boolean; role: 'member' | 'reseller'; created_at: string; transaction_count: number; }
interface AddServerForm { domain: string; auth: string; nama_server: string; location: string; protocols: string; status: 'online' | 'offline' | 'maintenance'; batas_create_akun: number; member_1ip: number; member_2ip: number; member_4ip: number; reseller_1ip: number; reseller_2ip: number; reseller_4ip: number; }
interface EditServerForm { domain: string; auth: string; nama_server: string; location: string; protocols: string; status: 'online' | 'offline' | 'maintenance'; batas_create_akun: number; member_1ip: number; member_2ip: number; member_4ip: number; reseller_1ip: number; reseller_2ip: number; reseller_4ip: number; }
type AdminTab = 'servers' | 'users' | 'messages' | 'bugs';

const ServerManagementContent = ({ form, handleAddServer, isAddingServer, servers, isLoading, handleEditServer, handleDeleteServer, handleCleanup, isCleaning }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Plus /> Tambah Server Baru</CardTitle><CardDescription>Masukkan informasi server VPN yang ingin ditambahkan</CardDescription></CardHeader>
      <CardContent>
        <Form {...form}><form onSubmit={form.handleSubmit(handleAddServer)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="domain" rules={{ required: 'Domain wajib diisi' }} render={({ field }) => (<FormItem><FormLabel>Domain</FormLabel><FormControl><Input placeholder="example.kedaivpn.cloud" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="auth" rules={{ required: 'Auth key wajib diisi' }} render={({ field }) => (<FormItem><FormLabel>Auth Key</FormLabel><FormControl><Input placeholder="123abc" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="nama_server" rules={{ required: 'Nama server wajib diisi' }} render={({ field }) => (<FormItem><FormLabel>Nama Server</FormLabel><FormControl><Input placeholder="🇮🇩 ID-ATHA 1IP" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField control={form.control} name="location" rules={{ required: 'Lokasi wajib diisi' }} render={({ field }) => (<FormItem><FormLabel>Lokasi</FormLabel><FormControl><Input placeholder="Singapore, Indonesia" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="protocols" rules={{ required: 'Protocols wajib diisi' }} render={({ field }) => (<FormItem><FormLabel>Protocols</FormLabel><FormControl><Input placeholder="ssh,vmess,vless,trojan" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" rules={{ required: 'Status wajib dipilih' }} render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="offline">Offline</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="batas_create_akun" rules={{ required: 'Batas maksimum akun wajib diisi', min: { value: 1, message: 'Minimal 1 akun' } }} render={({ field }) => (<FormItem><FormLabel>Batas Max Akun</FormLabel><FormControl><Input type="number" min="1" placeholder="1000" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <Button type="submit" disabled={isAddingServer} className="w-full md:w-auto">{isAddingServer ? 'Menambahkan...' : 'Tambah Server'}</Button>
        </form></Form>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Server /> Daftar Server ({servers.length})</CardTitle><CardDescription>Kelola semua server VPN yang tersedia</CardDescription></CardHeader>
      <CardContent>{isLoading ? (<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>) : servers.length === 0 ? (<div className="text-center py-8 text-gray-500 dark:text-gray-400">Belum ada server yang tersedia</div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{servers.map((server) => (<Card key={server.id} className="relative"><CardHeader className="pb-3"><CardTitle className="text-lg">{server.nama_server}</CardTitle><CardDescription className="break-all">{server.domain}</CardDescription></CardHeader><CardContent><div className="space-y-2"><div><Label className="text-xs text-gray-500 dark:text-gray-400">Auth Key</Label><p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">{server.auth}</p></div><div><Label className="text-xs text-gray-500 dark:text-gray-400">Server ID</Label><p className="text-sm">#{server.id}</p></div>{server.location && (<div><Label className="text-xs text-gray-500 dark:text-gray-400">Lokasi</Label><p className="text-sm">{server.location}</p></div>)}{server.status && (<div><Label className="text-xs text-gray-500 dark:text-gray-400">Status</Label><p className="text-sm capitalize">{server.status}</p></div>)}</div><div className="space-y-2 mt-4"><Button variant="outline" size="sm" className="w-full" onClick={() => handleEditServer(server)}><Edit className="h-4 w-4 mr-2" /> Edit Server</Button><Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeleteServer(server.id)}><Trash2 className="h-4 w-4 mr-2" /> Hapus Server</Button></div></CardContent></Card>))}</div>)}</CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Database /> Tindakan Sistem</CardTitle><CardDescription>Lakukan tugas pemeliharaan untuk seluruh sistem.</CardDescription></CardHeader>
      <CardContent><div className="flex flex-col sm:flex-row sm:items-center sm:gap-4"><Button onClick={handleCleanup} disabled={isCleaning}>{isCleaning ? 'Membersihkan...' : 'Bersihkan Database'}</Button><p className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">Menghapus akun kedaluwarsa dan catatan transaksi lama secara manual.</p></div></CardContent>
    </Card>
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('servers');
  const [servers, setServers] = useState<ServerData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUpdatingServer, setIsUpdatingServer] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const form = useForm<AddServerForm>({ defaultValues: { domain: '', auth: '', nama_server: '', location: '', protocols: 'ssh,vmess,vless,trojan', status: 'online', batas_create_akun: 1000, member_1ip: 330, member_2ip: 430, member_4ip: 600, reseller_1ip: 165, reseller_2ip: 215, reseller_4ip: 300 }});
  const editForm = useForm<EditServerForm>({ defaultValues: { domain: '', auth: '', nama_server: '', location: '', protocols: 'ssh,vmess,vless,trojan', status: 'online', batas_create_akun: 1000, member_1ip: 330, member_2ip: 430, member_4ip: 600, reseller_1ip: 165, reseller_2ip: 215, reseller_4ip: 300 }});

  useEffect(() => {
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
      adminAuthService.logout();
      setIsLoggedIn(false);
      toast.error('Sesi login telah berakhir, silakan login kembali');
    }
  };

  const handleLoginSuccess = () => { setIsLoggedIn(true); loadServers(); };
  const handleLogout = () => { adminAuthService.logout(); setIsLoggedIn(false); setServers([]); setUsers([]); toast.success('Logout berhasil!'); };

  const loadServers = async () => { setIsLoading(true); try { const serverData = await adminService.getServers(); setServers(serverData); } catch (error) { toast.error('Gagal memuat daftar server'); setServers([]); } finally { setIsLoading(false); } };
  const loadUsers = async () => { setIsLoadingUsers(true); try { const userData = await adminService.getUsers(); setUsers(userData); } catch (error) { toast.error('Gagal memuat daftar user'); setUsers([]); } finally { setIsLoadingUsers(false); } };

  const handleAddServer = async (data: AddServerForm) => { setIsAddingServer(true); try { const newServer = await adminService.addServer(data); setServers([...servers, newServer]); form.reset(); toast.success('Server berhasil ditambahkan'); } catch (error: any) { let msg = 'Gagal menambahkan server'; if (error.response?.data?.message) msg = error.response.data.message; else if (error.message) msg = error.message; toast.error(msg); } finally { setIsAddingServer(false); } };
  const handleEditServer = (server: ServerData) => { setEditingServer(server); editForm.reset({ domain: server.domain, auth: server.auth, nama_server: server.nama_server, location: server.location || '', protocols: server.protocols || '', status: server.status || 'online', batas_create_akun: server.batas_create_akun || 1000, member_1ip: server.member_1ip ?? 330, member_2ip: server.member_2ip ?? 430, member_4ip: server.member_4ip ?? 600, reseller_1ip: server.reseller_1ip ?? 165, reseller_2ip: server.reseller_2ip ?? 215, reseller_4ip: server.reseller_4ip ?? 300 }); setIsEditModalOpen(true); };
  const handleUpdateServer = async (data: EditServerForm) => { if (!editingServer) return; setIsUpdatingServer(true); try { const updatedServer = await adminService.updateServer(editingServer.id, data); setServers(servers.map(s => s.id === editingServer.id ? updatedServer : s)); setIsEditModalOpen(false); setEditingServer(null); editForm.reset(); toast.success('Server berhasil diperbarui'); } catch (error: any) { let msg = 'Gagal memperbarui server'; if (error.response?.data?.message) msg = error.response.data.message; else if (error.message) msg = error.message; toast.error(msg); } finally { setIsUpdatingServer(false); } };
  const handleCloseEditModal = () => { setIsEditModalOpen(false); setEditingServer(null); editForm.reset(); };
  const handleDeleteServer = async (id: number) => { if (!confirm('Yakin hapus?')) return; try { await adminService.deleteServer(id); setServers(servers.filter(s => s.id !== id)); toast.success('Server berhasil dihapus'); } catch (error) { toast.error('Gagal menghapus server'); } };
  const handleUserAction = (user: UserData) => { setSelectedUser(user); setIsUserModalOpen(true); };
  const handleUserUpdated = () => { loadUsers(); };
  const handleCleanup = async () => { if (!confirm('Yakin bersih-bersih?')) return; setIsCleaning(true); toast.info('Memulai proses pembersihan...'); try { const result = await adminService.cleanupDatabase(); toast.success(result.message || 'Pembersihan database berhasil.'); } catch (error: any) { const msg = error.response?.data?.message || 'Gagal melakukan pembersihan.'; toast.error(msg); } finally { setIsCleaning(false); } };

  const navItems = [
    { id: 'servers', label: 'Server Management', icon: Server },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'messages', label: 'Message Management', icon: MessageSquare },
    { id: 'bugs', label: 'Bug Management', icon: Bug },
  ];

  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8 flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1><p className="text-gray-600 dark:text-gray-400">Kelola seluruh aspek sistem dari sini.</p></div>
            <Button variant="outline" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as AdminTab); if (item.id === 'users') loadUsers(); }} className={cn('p-6 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200', activeTab === item.id ? 'border-primary bg-primary/10 text-primary shadow-lg' : 'border-transparent bg-card text-card-foreground hover:bg-muted/50')}>
                <item.icon className="h-8 w-8" />
                <span className="text-sm font-medium text-center">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeTab === 'servers' && <ServerManagementContent {...{ form, handleAddServer, isAddingServer, servers, isLoading, handleEditServer, handleDeleteServer, handleCleanup, isCleaning }} />}
            {activeTab === 'users' && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users /> Daftar User ({users.length})</CardTitle><CardDescription>Kelola semua user yang terdaftar di sistem</CardDescription></CardHeader><CardContent><UserManagementTable users={users} isLoading={isLoadingUsers} onUserAction={handleUserAction} /></CardContent></Card>}
            {activeTab === 'messages' && <MessageManager />}
            {activeTab === 'bugs' && <BugManager />}
          </div>
        </div>
      </div>

      <UserActionModal user={selectedUser} isOpen={isUserModalOpen} onClose={() => {setIsUserModalOpen(false); setSelectedUser(null);}} onUserUpdated={handleUserUpdated} />
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Server</DialogTitle><DialogDescription>Perbarui informasi server VPN</DialogDescription></DialogHeader>
          <Form {...editForm}><form onSubmit={editForm.handleSubmit(handleUpdateServer)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={editForm.control} name="domain" rules={{ required: 'Domain wajib diisi' }} render={({ field }) => (<FormItem><FormLabel>Domain</FormLabel><FormControl><Input placeholder="example.kedaivpn.cloud" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="auth" rules={{ required: 'Auth key wajib diisi' }} render={({ field }) => (<FormItem><FormLabel>Auth Key</FormLabel><FormControl><Input placeholder="123abc" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="nama_server" rules={{ required: 'Nama server wajib diisi' }} render={({ field }) => (<FormItem><FormLabel>Nama Server</FormLabel><FormControl><Input placeholder="🇮🇩 ID-ATHA 1IP" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField control={editForm.control} name="location" rules={{ required: 'Lokasi wajib diisi' }} render={({ field }) => (<FormItem><FormLabel>Lokasi</FormLabel><FormControl><Input placeholder="Singapore, Indonesia" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="protocols" rules={{ required: 'Protocols wajib diisi' }} render={({ field }) => (<FormItem><FormLabel>Protocols</FormLabel><FormControl><Input placeholder="ssh,vmess,vless,trojan" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="status" rules={{ required: 'Status wajib dipilih' }} render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="offline">Offline</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="batas_create_akun" rules={{ required: 'Batas maksimum akun wajib diisi', min: { value: 1, message: 'Minimal 1 akun' } }} render={({ field }) => (<FormItem><FormLabel>Batas Max Akun</FormLabel><FormControl><Input type="number" min="1" placeholder="1000" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseEditModal}>Batal</Button>
              <Button type="submit" disabled={isUpdatingServer}>{isUpdatingServer ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
            </div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
