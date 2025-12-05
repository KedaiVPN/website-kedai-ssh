import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, CreditCard } from 'lucide-react';
import { UserVPNAccount, DashboardStats as StatsType } from '@/types/vpn';
import { vpnService } from '@/services/vpnService';
import { balanceService } from '@/services/balanceService';
import DashboardStats from '@/components/DashboardStats';
import VPNAccountsTable from '@/components/VPNAccountsTable';
import LeaderboardTable from '@/components/LeaderboardTable';
import TransactionLogTable from '@/components/TransactionLogTable';
import AccountDetailModal from '@/components/AccountDetailModal';
import UserRoleCard from '@/components/UserRoleCard';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user data...</p>
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
              {showWelcomeMessage ? `Welcome Back, ${user.username}!` : 'Dashboard'}
            </h1>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <DashboardStats stats={stats} isLoading={isLoadingAccounts} />
          </div>

          {/* User Role Card with Action Buttons */}
          <div className="mb-8">
            <UserRoleCard
              userRole={user?.role ?? 'member'}
              onCreateAccount={handleCreateVPN}
              onTopup={handleTopup}
            />
          </div>

          {/* Tabs for VPN Accounts, Log, and Leaderboard */}
          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="accounts">My VPN Account</TabsTrigger>
              <TabsTrigger value="log">Log</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            <TabsContent value="accounts">
              <div className="mt-4">
                <VPNAccountsTable
                  accounts={accounts}
                  isLoading={isLoadingAccounts}
                  onViewDetails={handleViewAccountDetails}
                  onRefresh={handleRefreshAccounts}
                />
              </div>
            </TabsContent>
            <TabsContent value="log">
              <div className="mt-4">
                <TransactionLogTable />
              </div>
            </TabsContent>
            <TabsContent value="leaderboard">
              <div className="mt-4">
                <LeaderboardTable />
              </div>
            </TabsContent>
          </Tabs>

          {/* Getting Started Section - Only show if no accounts, simplified */}
          {!isLoadingAccounts && accounts.length === 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Start your VPN journey by creating your first account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  You don't have a VPN account yet. Click the "Create Account" button above to create your first VPN account.
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
