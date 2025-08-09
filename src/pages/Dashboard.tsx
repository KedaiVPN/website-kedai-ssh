
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, CreditCard } from 'lucide-react';
import { UserVPNAccount, DashboardStats as StatsType } from '@/types/vpn';
import { vpnService } from '@/services/vpnService';
import { balanceService } from '@/services/balanceService';
import DashboardStats from '@/components/DashboardStats';
import VPNAccountsTable from '@/components/VPNAccountsTable';
import AccountDetailModal from '@/components/AccountDetailModal';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [accounts, setAccounts] = useState<UserVPNAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<UserVPNAccount | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [stats, setStats] = useState<StatsType>({
    totalAccounts: 0,
    activeAccounts: 0,
    balance: 0,
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
    if (user) {
      loadUserAccounts();
      loadServersCount();
      loadUserBalance();
    }
  }, [user]);

  const loadUserAccounts = async () => {
    if (!user) {
      console.log('No authenticated user found');
      return;
    }

    setIsLoadingAccounts(true);
    try {
      console.log(`Loading VPN accounts for user: ${user.username} (ID: ${user.id})`);
      const userAccounts = await vpnService.getUserAccounts();
      setAccounts(userAccounts);
      
      // Calculate stats
      const activeCount = userAccounts.filter(acc => acc.status === 'active').length;
      
      setStats(prev => ({
        ...prev,
        totalAccounts: userAccounts.length,
        activeAccounts: activeCount
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

  const loadUserBalance = async () => {
    try {
      const response = await balanceService.getBalance();
      if (response.success) {
        setStats(prev => ({
          ...prev,
          balance: response.balance || 0
        }));
      }
    } catch (error) {
      console.error('Error loading user balance:', error);
      toast.error('Gagal memuat saldo');
    }
  };

  const handleCreateVPN = () => {
    navigate('/protokol');
  };

  const handleTopup = () => {
    navigate('/topup');
  };

  const handleViewAccountDetails = (account: UserVPNAccount) => {
    setSelectedAccount(account);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedAccount(null);
    setIsDetailModalOpen(false);
  };

  const handleAccountUpdated = () => {
    loadUserAccounts();
    loadUserBalance(); // Refresh balance after account operations
    toast.success('Data akun berhasil diperbarui');
  };

  const handleRefreshAccounts = () => {
    loadUserAccounts();
    loadUserBalance(); // Refresh balance when refreshing accounts
    toast.success('Data akun berhasil diperbarui');
  };

  // Show loading if user data is not yet available
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              {showWelcomeMessage ? `Selamat Datang Kembali, ${user.username}!` : 'Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              Kelola akun VPN dan layanan Anda dari sini
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <DashboardStats stats={stats} isLoading={isLoadingAccounts} />
          </div>

          {/* Quick Actions - Only buttons without cards */}
          <div className="flex flex-col items-center mb-8 space-y-3">
            <Button onClick={handleCreateVPN} size="lg" className="min-w-[200px]">
              <Plus className="w-5 h-5 mr-2" />
              Mulai Sekarang
            </Button>
            <Button 
              onClick={handleTopup} 
              size="lg" 
              className="min-w-[200px] bg-purple-600 hover:bg-purple-700 text-white"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Topup Saldo
            </Button>
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

          {/* Getting Started Section - Only show if no accounts, simplified */}
          {!isLoadingAccounts && accounts.length === 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Memulai</CardTitle>
                <CardDescription>
                  Mulai perjalanan VPN Anda dengan membuat akun pertama
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Anda belum memiliki akun VPN. Klik tombol "Mulai Sekarang" di atas untuk membuat akun VPN pertama Anda.
                </p>
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
        onAccountUpdated={handleAccountUpdated}
      />

      <Footer />
    </div>
  );
};

export default Dashboard;
