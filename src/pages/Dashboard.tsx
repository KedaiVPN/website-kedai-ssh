
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Shield, Plus } from 'lucide-react';
import { UserVPNAccount, DashboardStats as StatsType } from '@/types/vpn';
import { vpnService } from '@/services/vpnService';
import DashboardStats from '@/components/DashboardStats';
import VPNAccountsTable from '@/components/VPNAccountsTable';
import AccountDetailModal from '@/components/AccountDetailModal';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const [searchParams] = useSearchParams();
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [accounts, setAccounts] = useState<UserVPNAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<UserVPNAccount | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [stats, setStats] = useState<StatsType>({
    totalAccounts: 0,
    activeAccounts: 0,
    expiredAccounts: 0,
    totalServers: 0
  });

  useEffect(() => {
    // Check if user just logged in
    const justLoggedIn = searchParams.get('login') === 'success';
    if (justLoggedIn) {
      setShowWelcomeMessage(true);
      // Clean the URL parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('login');
      const newUrl = newSearchParams.toString() 
        ? `/dashboard?${newSearchParams.toString()}` 
        : '/dashboard';
      navigate(newUrl, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    loadUserAccounts();
    loadServersCount();
  }, []);

  const loadUserAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      // For now, using a dummy user ID. In real implementation, 
      // you would get this from authentication context
      const userId = 'user-123';
      const userAccounts = await vpnService.getUserAccounts(userId);
      setAccounts(userAccounts);
      
      // Calculate stats
      const activeCount = userAccounts.filter(acc => acc.status === 'active').length;
      const expiredCount = userAccounts.filter(acc => acc.status === 'expired').length;
      
      setStats(prev => ({
        ...prev,
        totalAccounts: userAccounts.length,
        activeAccounts: activeCount,
        expiredAccounts: expiredCount
      }));
    } catch (error) {
      console.error('Error loading user accounts:', error);
      toast.error('Gagal memuat akun VPN');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const loadServersCount = async () => {
    try {
      const servers = await vpnService.getServers();
      setStats(prev => ({
        ...prev,
        totalServers: servers.length
      }));
    } catch (error) {
      console.error('Error loading servers count:', error);
    }
  };

  const handleLogout = () => {
    console.log('Dashboard: Logging out user');
    
    // Clear token from localStorage
    localStorage.removeItem('auth_token');
    
    // Clear any session storage
    sessionStorage.clear();
    
    uiToast({
      title: "Logout berhasil",
      description: "Anda telah berhasil logout dari akun."
    });
    
    // Navigate to home page
    navigate('/', { replace: true });
  };

  const handleCreateVPN = () => {
    navigate('/protokol');
  };

  const handleViewAccountDetails = (account: UserVPNAccount) => {
    setSelectedAccount(account);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedAccount(null);
    setIsDetailModalOpen(false);
  };

  const handleRefreshAccounts = () => {
    loadUserAccounts();
    toast.success('Data akun berhasil diperbarui');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              {showWelcomeMessage ? 'Selamat Datang Kembali!' : 'Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              Kelola akun VPN dan layanan Anda dari sini
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <DashboardStats stats={stats} isLoading={isLoadingAccounts} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Buat Akun VPN</CardTitle>
                <CardDescription>
                  Buat akun VPN baru dengan protokol pilihan Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateVPN} className="w-full">
                  Mulai Sekarang
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Kelola pengaturan akun dan preferensi Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Lihat Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-destructive rounded-full flex items-center justify-center mb-4">
                  <LogOut className="w-6 h-6 text-destructive-foreground" />
                </div>
                <CardTitle>Logout</CardTitle>
                <CardDescription>
                  Keluar dari akun Anda dengan aman
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* VPN Accounts Table */}
          <div className="mb-8">
            <VPNAccountsTable
              accounts={accounts}
              isLoading={isLoadingAccounts}
              onViewDetails={handleViewAccountDetails}
              onRefresh={handleRefreshAccounts}
            />
          </div>

          {/* Getting Started Section - Only show if no accounts */}
          {!isLoadingAccounts && accounts.length === 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Memulai</CardTitle>
                <CardDescription>
                  Mulai perjalanan VPN Anda dengan membuat akun pertama
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Buat Akun VPN Pertama Anda</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Mulai dengan membuat akun VPN dengan protokol pilihan Anda
                    </p>
                    <Button onClick={handleCreateVPN}>
                      Mulai Sekarang
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Jelajahi Protokol</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Pelajari tentang berbagai protokol VPN: SSH, VMess, VLESS, dan Trojan
                    </p>
                    <Button variant="outline" onClick={() => navigate('/')}>
                      Pelajari Lebih Lanjut
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Account Detail Modal */}
      <AccountDetailModal
        account={selectedAccount}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />

      <Footer />
    </div>
  );
};

export default Dashboard;
