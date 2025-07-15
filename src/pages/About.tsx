
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, Globe, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';

const About = () => {
  const navigate = useNavigate();
  const { isMenuOpen } = useSidebar();

  const handleCreateAccount = () => {
    navigate('/protokol');
  };

  const handlePremiumAccount = () => {
    navigate('/create-account');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 relative z-10 transition-transform duration-300 overflow-x-hidden">
      <Header />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      <main className="relative z-10 pt-20">
        <Hero />
        
        {/* CTA Section */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                VPN Terpercaya untuk Kebutuhan Internet Anda
              </h2>
              <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Nikmati akses internet menggunakan teknologi VPN terdepan dengan keamanan maksimal. 
                Pilih paket yang sesuai untuk mendapatkan pengalaman internet terbaik untuk browsing, streaming, dan gaming.
              </p>
            </div>
            
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/create-account">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold animate-scale-in">
                Free Account
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-3 text-lg font-semibold animate-scale-in animation-delay-2000"
              onClick={() => window.open('https://t.me/KedaiReseller_bot', '_blank')}
            >
              <Star className="w-5 h-5 mr-2" />
              Premium Account
            </Button>
          </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                Mengapa Memilih Kedai SSH?
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg lg:text-xl">Keamanan Tinggi</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm lg:text-base">
                    Enkripsi terdepan dengan SSH, VMess, VLESS, dan Trojan untuk melindungi data Anda
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <CardTitle className="text-lg lg:text-xl">Kecepatan Optimal</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm lg:text-base">
                    Server berkualitas tinggi dengan kecepatan premium untuk pengalaman internet terbaik
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 lg:w-8 lg:h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-lg lg:text-xl">Lokasi Pilihan</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm lg:text-base">
                    Server paling optimal untuk kebutuhan tunneling di berbagai lokasi strategis
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-lg lg:text-xl">Premium</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm lg:text-base">
                    Upgrade premium untuk mendapatkan pengalaman internet premium terbaik
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-2xl lg:text-3xl font-bold mb-8">
                Keunggulan yang Anda Dapatkan
              </h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Streaming video berkualitas tinggi tanpa buffering
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Perlindungan privasi dan data pribadi terjamin
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Akses ke konten global tanpa batasan geografis
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Gaming online dengan ping rendah dan stabil
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Multiple device support (Windows, Android, iOS)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    24/7 support dan maintenance berkala
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Protocol Section */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-2xl lg:text-3xl font-bold mb-8">
                Protokol yang Didukung
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/protokol/server-ssh')}>
                <CardHeader className="pb-4">
                  <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-sm lg:text-base">SSH</span>
                  </div>
                  <CardTitle className="text-lg lg:text-xl">SSH</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm lg:text-base">
                    Secure Shell untuk koneksi yang aman dan stabil
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/protokol/server-vmess')}>
                <CardHeader className="pb-4">
                  <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-sm lg:text-base">VMess</span>
                  </div>
                  <CardTitle className="text-lg lg:text-xl">VMess</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm lg:text-base">
                    V2Ray protocol dengan enkripsi tinggi
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/protokol/server-vless')}>
                <CardHeader className="pb-4">
                  <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-sm lg:text-base">VLESS</span>
                  </div>
                  <CardTitle className="text-lg lg:text-xl">VLESS</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm lg:text-base">
                    V2Ray protocol ringan dengan performa optimal
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/protokol/server-trojan')}>
                <CardHeader className="pb-4">
                  <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-sm lg:text-base">Trojan</span>
                  </div>
                  <CardTitle className="text-lg lg:text-xl">Trojan</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm lg:text-base">
                    Protocol dengan kamuflase HTTPS yang kuat
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Card className="p-8 lg:p-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <CardHeader>
                <CardTitle className="text-2xl lg:text-3xl font-bold mb-4">
                  Siap Memulai?
                </CardTitle>
                <CardDescription className="text-blue-100 text-base lg:text-lg mb-8">
                  Bergabunglah dengan ribuan pengguna yang telah merasakan pengalaman internet terbaik dengan layanan VPN kami.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4 bg-white text-blue-600 hover:bg-blue-50"
                    onClick={handleCreateAccount}
                  >
                    Mulai Gratis Sekarang
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4 border-white text-white hover:bg-white hover:text-blue-600"
                    onClick={handlePremiumAccount}
                  >
                    Upgrade ke Premium
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
