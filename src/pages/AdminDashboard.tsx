
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  LogOut, 
  Server, 
  Users, 
  Shield,
  Settings
} from 'lucide-react';
import AdminLogin from '@/components/AdminLogin';
import UserManagementTable from '@/components/UserManagementTable';
import VPNAccountsTable from '@/components/VPNAccountsTable';
import AdminPasswordChange from '@/components/AdminPasswordChange';
import { adminService } from '@/services/adminService';
import { adminAuthService } from '@/services/adminAuthService';
import { UserVPNAccount } from '@/types/vpn';

interface ServerData {
  id: number;
  domain: string;
  auth: string;
  nama_server: string;
  location?: string;
  protocols?: string;
  status?: string;
  batas_create_akun?: number;
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

const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loadingServers, setLoadingServers] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [vpnAccounts, setVpnAccounts] = useState<UserVPNAccount[]>([]);
  const [loadingVpnAccounts, setLoadingVpnAccounts] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const session = await adminAuthService.getCurrentAdmin();
      if (session) {
        setIsLoggedIn(true);
        setAdminData(session);
        loadServers();
        loadUsers();
        loadVpnAccounts();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadServers = async () => {
    try {
      setLoadingServers(true);
      const response = await adminService.getServers();
      setServers(response);
    } catch (error) {
      toast.error('Gagal memuat data server');
      console.error('Error loading servers:', error);
    } finally {
      setLoadingServers(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await adminService.getUsers();
      setUsers(response);
    } catch (error) {
      toast.error('Gagal memuat data user');
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadVpnAccounts = async () => {
    try {
      setLoadingVpnAccounts(true);
      // For now, we'll use empty array as this would require a new API endpoint
      setVpnAccounts([]);
    } catch (error) {
      toast.error('Gagal memuat data akun VPN');
      console.error('Error loading VPN accounts:', error);
    } finally {
      setLoadingVpnAccounts(false);
    }
  };

  const handleLoginSuccess = () => {
    checkAuthStatus();
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    adminAuthService.clearAdminSession();
    setIsLoggedIn(false);
    setAdminData(null);
    setServers([]);
    setUsers([]);
    setVpnAccounts([]);
    toast.success('Logout berhasil');
  };

  const handleUserAction = (user: UserData) => {
    // TODO: Implement user action modal
    console.log('User action for:', user);
    toast.info('Fitur kelola user akan segera tersedia');
  };

  const handleViewAccountDetails = (account: UserVPNAccount) => {
    // TODO: Implement account detail modal
    console.log('View account details for:', account);
    toast.info('Fitur detail akun akan segera tersedia');
  };

  const handleRefreshAccounts = () => {
    loadVpnAccounts();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Memuat...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Selamat datang, {adminData?.username || 'Admin'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {adminData?.email}
            </Badge>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="servers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="servers" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Server Management
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="accounts">
              VPN Accounts
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servers">
            <Card>
              <CardHeader>
                <CardTitle>Server Management</CardTitle>
                <CardDescription>
                  Kelola server VPN dan pengaturan harga
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingServers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Memuat server...
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Server management interface akan ditambahkan di sini
                    <div className="mt-4 text-sm">
                      Server ditemukan: {servers.length}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Kelola pengguna, saldo, dan role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagementTable
                  users={users}
                  isLoading={loadingUsers}
                  onUserAction={handleUserAction}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>VPN Accounts</CardTitle>
                <CardDescription>
                  Monitor semua akun VPN yang aktif
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VPNAccountsTable
                  accounts={vpnAccounts}
                  isLoading={loadingVpnAccounts}
                  onViewDetails={handleViewAccountDetails}
                  onRefresh={handleRefreshAccounts}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>
                  Pengaturan admin dan keamanan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminPasswordChange />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
