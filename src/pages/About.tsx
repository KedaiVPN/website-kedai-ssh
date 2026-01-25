import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, Globe, Star, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThreeGlobe from '@/components/ThreeGlobe';
import RevealOnScroll from '@/components/RevealOnScroll';

const About = () => {
  const navigate = useNavigate();

  const login = () => {
    navigate('/login');
  };

  const register = () => {
    navigate('register');
  };

  const glassCardClass = "backdrop-blur-md bg-white/40 dark:bg-black/40 border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-black/60 transition-all duration-300 shadow-xl";

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

        {/* Hero Section with ThreeGlobe */}
        <section className="relative min-h-[60vh] lg:min-h-[70vh] flex items-center justify-center overflow-hidden py-10 lg:py-16">
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-100 dark:opacity-80 pointer-events-none">
             <ThreeGlobe />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 lg:mb-10">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
                VPN Terpercaya untuk Kebutuhan Internet Anda
              </h2>
              {/* Removed Glassmorphism container for text */}
              <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed drop-shadow-md font-medium">
                Nikmati akses internet menggunakan teknologi VPN terdepan dengan keamanan maksimal. 
                Pilih paket yang sesuai untuk mendapatkan pengalaman internet terbaik untuk browsing, streaming, dan gaming.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="bg-blue-600/90 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold animate-scale-in shadow-lg shadow-blue-500/20 backdrop-blur-sm transition-all hover:scale-105"
                onClick={login}
              >
                Login
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-purple-600/50 bg-white/10 backdrop-blur-md text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white px-8 py-6 text-lg font-semibold animate-scale-in animation-delay-2000 shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                onClick={register}
              >
                <Star className="w-5 h-5 mr-2" />
                Register
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <RevealOnScroll delay={100}>
          <section className="py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                  Mengapa Memilih Kedai SSH?
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className={`text-center ${glassCardClass}`}>
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-blue-100/50 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
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

                <Card className={`text-center ${glassCardClass}`}>
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-yellow-100/50 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                      <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <CardTitle className="text-lg lg:text-xl">Kecepatan Optimal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm lg:text-base">
                      Server berkualitas tinggi dengan kecepatan maximal untuk pengalaman internet terbaik
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className={`text-center ${glassCardClass}`}>
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-green-100/50 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                      <Globe className="w-6 h-6 lg:w-8 lg:h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-lg lg:text-xl">Lokasi Pilihan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm lg:text-base">
                      Server paling optimal untuk kebutuhan tunneling
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className={`text-center ${glassCardClass}`}>
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-purple-100/50 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                      <Star className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-lg lg:text-xl">Premium</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm lg:text-base">
                      Gunakan akun premium untuk mendapatkan pengalaman internet terbaik
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className={`text-center cursor-pointer group ${glassCardClass}`} onClick={() => navigate('/protokol/server-udp')}>
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-orange-500/30">
                      <span className="text-white font-bold text-sm lg:text-base">UDP</span>
                    </div>
                    <CardTitle className="text-lg lg:text-xl">UDP ZIVPN</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm lg:text-base">
                      UDP protocol untuk scrolling dan streaming
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {/* Benefits Section */}
        <RevealOnScroll delay={200}>
          <section className="py-8 lg:py-12 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm border-y border-white/20 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                  Keunggulan yang Anda Dapatkan
                </h3>
                <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Rasakan pengalaman internet terbaik dengan berbagai keunggulan yang kami tawarkan
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100/50 dark:bg-green-900/50 flex items-center justify-center mt-1">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base lg:text-lg mb-2">Streaming Berkualitas Tinggi</h4>
                      <p className="text-sm lg:text-base text-muted-foreground">
                        Nikmati streaming video HD dan 4K tanpa buffering dengan kecepatan stabil
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100/50 dark:bg-green-900/50 flex items-center justify-center mt-1">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base lg:text-lg mb-2">Perlindungan Privasi</h4>
                      <p className="text-sm lg:text-base text-muted-foreground">
                        Data pribadi dan aktivitas browsing Anda terlindungi dengan enkripsi tingkat militer
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100/50 dark:bg-green-900/50 flex items-center justify-center mt-1">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base lg:text-lg mb-2">Gaming Optimal</h4>
                      <p className="text-sm lg:text-base text-muted-foreground">
                        Mainkan game online dengan ping rendah dan koneksi stabil
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100/50 dark:bg-green-900/50 flex items-center justify-center mt-1">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base lg:text-lg mb-2">Multi Platform</h4>
                      <p className="text-sm lg:text-base text-muted-foreground">
                        Kompatibel dengan Windows, Android, iOS, dan berbagai perangkat lainnya
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100/50 dark:bg-green-900/50 flex items-center justify-center mt-1">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base lg:text-lg mb-2">Support 24/7</h4>
                      <p className="text-sm lg:text-base text-muted-foreground">
                        Admin siap membantu Anda kapan saja... kecuali admin nya lagi bobo :v
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {/* Protocol Section */}
        <RevealOnScroll delay={300}>
          <section className="py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h3 className="text-2xl lg:text-3xl font-bold mb-8">
                  Protokol yang Didukung
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Card className={`text-center cursor-pointer group ${glassCardClass}`} onClick={() => navigate('/protokol/server-ssh')}>
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-blue-500/30">
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

                <Card className={`text-center cursor-pointer group ${glassCardClass}`} onClick={() => navigate('/protokol/server-vmess')}>
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-green-500/30">
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

                <Card className={`text-center cursor-pointer group ${glassCardClass}`} onClick={() => navigate('/protokol/server-vless')}>
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-purple-500/30">
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

                <Card className={`text-center cursor-pointer group ${glassCardClass}`} onClick={() => navigate('/protokol/server-trojan')}>
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-red-500/30">
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
        </RevealOnScroll>

        {/* CTA Section */}
        <RevealOnScroll delay={400}>
          <section className="py-8 lg:py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Card className="p-8 lg:p-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
                <div className="relative z-10">
                  <CardHeader>
                    <CardTitle className="text-2xl lg:text-3xl font-bold mb-4">
                      Jangan Sampai Ketinggalan
                    </CardTitle>
                    <CardDescription className="text-blue-100 text-base lg:text-lg mb-8">
                      Bergabunglah dengan ribuan pengguna yang telah merasakan pengalaman internet terbaik dengan layanan tunneling kami.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4 bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        onClick={login}
                      >
                        Login
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4 border-white text-white hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        onClick={register}
                      >
                        Register
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          </section>
        </RevealOnScroll>
      </main>

      <Footer />
    </div>
  );
};

export default About;
