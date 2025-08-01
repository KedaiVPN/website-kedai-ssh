
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  useEffect(() => {
    const handleTokenFromUrl = async () => {
      const tokenFromUrl = searchParams.get('token');
      
      if (tokenFromUrl && !isProcessingToken) {
        console.log('Dashboard: Processing token from URL');
        setIsProcessingToken(true);
        
        try {
          // Validate token format (basic check)
          if (tokenFromUrl.length > 10) {
            localStorage.setItem('auth_token', tokenFromUrl);
            console.log('Dashboard: Token saved to localStorage');
            
            toast({
              title: "Login berhasil",
              description: "Selamat datang kembali! Anda telah berhasil login.",
            });

            // Clean URL by removing token parameter
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('token');
            
            // Navigate to clean dashboard URL
            const newUrl = newSearchParams.toString() 
              ? `/dashboard?${newSearchParams.toString()}` 
              : '/dashboard';
              
            console.log('Dashboard: Redirecting to clean URL');
            navigate(newUrl, { replace: true });
          } else {
            console.error('Dashboard: Invalid token format');
            toast({
              title: "Token tidak valid",
              description: "Silakan coba login kembali.",
              variant: "destructive"
            });
            navigate('/login', { replace: true });
          }
        } catch (error) {
          console.error('Dashboard: Error processing token:', error);
          toast({
            title: "Error",
            description: "Terjadi kesalahan saat memproses login. Silakan coba lagi.",
            variant: "destructive"
          });
          navigate('/login', { replace: true });
        } finally {
          setIsProcessingToken(false);
        }
      }
    };

    handleTokenFromUrl();
  }, [searchParams, navigate, toast, isProcessingToken]);

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

  // Show loading if processing token
  if (isProcessingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memproses login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Selamat Datang di Dashboard</h1>
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
