import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, CreditCard, User } from 'lucide-react';
import { UserVPNAccount, DashboardStats as StatsType } from '@/types/vpn';
import { vpnService } from '@/services/vpnService';
import { balanceService } from '@/services/balanceService';
import DashboardStats from '@/components/DashboardStats';
import VPNAccountsTable from '@/components/VPNAccountsTable';
import LeaderboardTable from '@/components/LeaderboardTable';
import TransactionLogTable from '@/components/TransactionLogTable';
import AccountDetailModal from '@/components/AccountDetailModal';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [accounts, setAccounts] = useState<UserVPNAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<UserVPNAccount | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [stats, setStats] = useState<StatsType>({
    balance: 0,
    activeAccounts: 0,
    totalAccounts: 0,
    totalServers: 0
  });

  // Add logging for user data
  console.log('Dashboard: Current user data:', user);
  console.log('Dashboard: User role:', user?.role);

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
      const activeAccounts = userAccounts.filter(acc => acc.status === 'active');
      
      setAccounts(activeAccounts);
      
      // Calculate active accounts stat
      setStats(prev => ({
        ...prev,
        activeAccounts: activeAccounts.length
      }));
    } catch (error) {
      console.error('Error loading user accounts:', error);
      toast.error('Failed to load VPN accounts');
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
          balance: response.balance || 0,
          totalAccounts: response.totalAccounts || 0,
        }));
      }
    } catch (error) {
      console.error('Error loading user balance:', error);
      toast.error('Failed to load balance');
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
    loadUserBalance();
    toast.success('Account data updated successfully');
  };

  const handleRefreshAccounts = () => {
    loadUserAccounts();
    loadUserBalance();
    toast.success('Account data updated successfully');
  };

  // Show loading if user data is not yet available
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Define glassy styling similar to About.tsx
  const glassPanelClass =
    'backdrop-blur-xl bg-white/40 dark:bg-black/40 border-white/20 dark:border-white/10 shadow-xl rounded-2xl border';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative z-10 overflow-x-hidden">
      <Header />

      {/* Background Animated Blobs - Consistent with Landing Page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[10%] -right-[10%] w-[800px] h-[800px] bg-blue-400/20 dark:bg-blue-900/20 rounded-full blur-[100px] opacity-60 animate-blob"></div>
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-purple-400/20 dark:bg-purple-900/20 rounded-full blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
      </div>
      
      <main className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Modern Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {showWelcomeMessage ? `Selamat Datang, ${user.username}!` : 'Dashboard'}
                 </h1>
                 <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                   user.role === 'reseller'
                     ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50'
                     : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50'
                 }`}>
                    {user.role === 'reseller' ? 'Reseller' : 'Member'}
                 </span>
              </div>
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
               <Button
                  onClick={handleCreateVPN}
                  size="lg"
                  className="flex-1 lg:flex-none shadow-lg shadow-blue-500/20 hover:scale-105 transition-all bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Buat Akun
                </Button>
                <Button
                  onClick={handleTopup}
                  size="lg"
                  className="flex-1 lg:flex-none shadow-lg shadow-purple-500/20 hover:scale-105 transition-all bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Isi Saldo
                </Button>
            </div>
          </div>

          {/* Stats Cards - Bento Grid Style */}
          <div className="mb-10">
            <DashboardStats stats={stats} isLoading={isLoadingAccounts} />
          </div>

          {/* Main Content Area - Glassmorphism */}
          <div className={`${glassPanelClass} p-1`}>
             <Tabs defaultValue="accounts" className="w-full">
                <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <TabsList className="bg-slate-100/50 dark:bg-black/20 p-1 rounded-xl w-full sm:w-auto">
                    <TabsTrigger value="accounts" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all px-4 py-2">My VPN</TabsTrigger>
                    <TabsTrigger value="log" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all px-4 py-2">Log</TabsTrigger>
                    <TabsTrigger value="leaderboard" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all px-4 py-2">Leaderboard</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-4 sm:p-6">
                  <TabsContent value="accounts" className="mt-0 focus-visible:outline-none">
                     <VPNAccountsTable
                        accounts={accounts}
                        isLoading={isLoadingAccounts}
                        onViewDetails={handleViewAccountDetails}
                        onRefresh={handleRefreshAccounts}
                      />
                  </TabsContent>
                  <TabsContent value="log" className="mt-0 focus-visible:outline-none">
                     <TransactionLogTable />
                  </TabsContent>
                  <TabsContent value="leaderboard" className="mt-0 focus-visible:outline-none">
                     <LeaderboardTable />
                  </TabsContent>
                </div>
             </Tabs>
          </div>

          {/* Getting Started Section - Only show if no accounts, styled beautifully */}
          {!isLoadingAccounts && accounts.length === 0 && (
             <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 md:p-12 text-center text-white shadow-2xl">
                <div className="relative z-10">
                   <h3 className="text-2xl font-bold mb-4">Mulai Perjalanan Anda</h3>
                   <p className="text-blue-100 max-w-2xl mx-auto mb-8 text-lg">
                      Anda belum memiliki akun VPN. Buat akun pertama Anda sekarang untuk menikmati koneksi internet yang aman dan cepat.
                   </p>
                   <Button
                      onClick={handleCreateVPN}
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50 border-0 rounded-full px-8 text-lg font-semibold shadow-xl transition-transform hover:scale-105"
                   >
                      Buat Akun Sekarang
                   </Button>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
             </div>
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
