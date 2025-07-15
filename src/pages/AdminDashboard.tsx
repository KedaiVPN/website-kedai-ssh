
// Dashboard admin untuk mengelola sistem VPN
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import AdminLogin from '@/components/AdminLogin';
import AdminPasswordChange from '@/components/AdminPasswordChange';
import { Users, Server, Activity, Settings, LogOut } from 'lucide-react';
import { getAdminStats } from '@/services/adminService';
import { toast } from 'sonner';

const AdminDashboard = () => {
  // State untuk mengontrol status login admin
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // State untuk menyimpan statistik admin
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeConnections: 0,
    serverStatus: 'online' as 'online' | 'offline',
    totalBandwidth: 0
  });

  // Effect untuk mengecek status login saat komponen dimount
  useEffect(() => {
    // Mengecek apakah admin sudah login dari localStorage
    const adminLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    setIsLoggedIn(adminLoggedIn);

    // Jika sudah login, ambil data statistik
    if (adminLoggedIn) {
      loadStats();
    }
  }, []);

  // Fungsi untuk memuat statistik admin
  const loadStats = async () => {
    try {
      const adminStats = await getAdminStats();
      setStats(adminStats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
      toast.error('Gagal memuat statistik admin');
    }
  };

  // Fungsi untuk menangani login sukses
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    loadStats();
  };

  // Fungsi untuk logout admin
  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    setIsLoggedIn(false);
    toast.success('Berhasil logout');
  };

  // Jika belum login, tampilkan halaman login
  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header dashboard dengan tombol logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Dashboard Admin
            </h1>
            <p className="text-muted-foreground mt-2">
              Kelola sistem VPN dan monitor penggunaan
            </p>
          </div>
          
          {/* Tombol logout */}
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Grid kartu statistik */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Kartu total pengguna */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Akun VPN terdaftar
              </p>
            </CardContent>
          </Card>

          {/* Kartu koneksi aktif */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Koneksi Aktif</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeConnections}</div>
              <p className="text-xs text-muted-foreground">
                Pengguna online
              </p>
            </CardContent>
          </Card>

          {/* Kartu status server */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Server</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.serverStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                {stats.serverStatus === 'online' ? 'Online' : 'Offline'}
              </div>
              <p className="text-xs text-muted-foreground">
                Server VPN
              </p>
            </CardContent>
          </Card>

          {/* Kartu total bandwidth */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bandwidth</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBandwidth} GB</div>
              <p className="text-xs text-muted-foreground">
                Bandwidth terpakai
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab navigasi untuk fitur admin */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Kelola Pengguna</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          {/* Konten tab overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Sistem</CardTitle>
                <CardDescription>
                  Informasi umum tentang sistem VPN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Uptime Server</span>
                    <span className="font-medium">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rata-rata Load</span>
                    <span className="font-medium">0.85</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Memory Usage</span>
                    <span className="font-medium">65%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Konten tab kelola pengguna */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kelola Pengguna VPN</CardTitle>
                <CardDescription>
                  Daftar dan kelola akun pengguna VPN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Fitur manajemen pengguna akan ditambahkan di versi mendatang
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Konten tab pengaturan */}
          <TabsContent value="settings" className="space-y-6">
            {/* Komponen untuk mengubah password admin */}
            <AdminPasswordChange />
            
            {/* Kartu pengaturan sistem */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Pengaturan Sistem
                </CardTitle>
                <CardDescription>
                  Konfigurasi umum sistem VPN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Auto Backup</span>
                    <span className="text-green-600 font-medium">Aktif</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Monitoring</span>
                    <span className="text-green-600 font-medium">Aktif</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Log Retention</span>
                    <span className="font-medium">30 hari</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
