
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Shield } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  useEffect(() => {
    // Check if user just logged in (no token processing here, just for welcome message)
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

  const handleLogout = () => {
    console.log('Dashboard: Logging out user');
    
    // Clear token from localStorage
    localStorage.removeItem('auth_token');
    
    // Clear any session storage
    sessionStorage.clear();
    
    toast({
      title: "Logout berhasil",
      description: "Anda telah berhasil logout dari akun."
    });
    
    // Navigate to home page
    navigate('/', { replace: true });
  };

  const handleCreateVPN = () => {
    navigate('/protokol');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              {showWelcomeMessage ? 'Selamat Datang Kembali!' : 'Selamat Datang di Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              Kelola akun VPN dan layanan Anda dari sini
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-primary-foreground" />
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
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Layanan VPN</CardTitle>
                <CardDescription>
                  Buat dan kelola akun VPN Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateVPN} className="w-full">
                  Buat Akun VPN
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

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Memulai</CardTitle>
              <CardDescription>
                Berikut adalah beberapa tindakan cepat yang dapat Anda lakukan
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
