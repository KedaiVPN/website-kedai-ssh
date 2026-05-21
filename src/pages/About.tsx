import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, Globe, Star, Lock, Headphones, Play, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import ThreeGlobe from '@/components/ThreeGlobe';
import RevealOnScroll from '@/components/RevealOnScroll';

const About = () => {
  const navigate = useNavigate();
  const [totalTransactions, setTotalTransactions] = useState(0);

  // Mock data for the traffic chart
  const chartData = [
    { value: 30 }, { value: 45 }, { value: 35 }, { value: 50 }, { value: 40 }, 
    { value: 60 }, { value: 55 }, { value: 70 }, { value: 65 }, { value: 80 }, 
    { value: 75 }, { value: 90 }, { value: 85 }, { value: 100 }
  ];

  useEffect(() => {
    fetch('/api/public-stats/total-transactions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTotalTransactions(data.totalTransactions);
        }
      })
      .catch((err) => console.error('Failed to fetch stats:', err));
  }, []);

  const login = () => {
    navigate('/login');
  };

  const register = () => {
    navigate('register');
  };

  const bentoCardClass =
    'group relative overflow-hidden backdrop-blur-md bg-white/40 dark:bg-black/40 border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-black/60 transition-all duration-300 shadow-xl rounded-3xl border';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative z-10 transition-transform duration-300 overflow-x-hidden">
      <Header />

      {/* Animated background elements - Cleaner & More Subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-blue-400/20 dark:bg-blue-900/20 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-purple-400/20 dark:bg-purple-900/20 rounded-full blur-[100px] opacity-60"></div>
      </div>

      <main className="relative z-10 pt-24 lg:pt-32">
        {/* Hero Section - Split Layout */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 lg:mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Text */}
            <div className="order-2 lg:order-1 text-center lg:text-left z-20">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
                VPN Terpercaya <br/>
                <span className="text-blue-600 dark:text-blue-400">untuk Internet Anda</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Kedai SSH menyediakan layanan VPN cepat dan aman, pulsa & paket data semua operator, top up game, serta produk digital dengan harga terjangkau.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 rounded-full"
                  onClick={login}
                >
                  Login
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-8 h-12 text-base font-semibold transition-all hover:scale-105 rounded-full bg-transparent"
                  onClick={register}
                >
                  Register
                </Button>
              </div>
            </div>

            {/* Right Column: Globe Visual */}
            <div className="order-1 lg:order-2 relative h-[400px] lg:h-[600px] flex items-center justify-center">
               {/* Decorative glow behind the globe */}
               <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 blur-[60px] rounded-full transform scale-75"></div>
               <div className="relative w-full h-full flex items-center justify-center">
                 <ThreeGlobe />
               </div>
            </div>

          </div>
        </section>

        {/* Bento Grid Features Section */}
        <RevealOnScroll delay={100}>
          <section className="py-8 lg:py-12 mb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h3 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">Kenapa Harus Kedai SSH?</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                  Kombinasi sempurna antara kecepatan, keamanan, dan kebebasan internet dalam satu layanan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-[minmax(180px,auto)]">
                
                {/* 1. Total Transaksi (Main Feature - Large) - REPLACED */}
                <div className={`col-span-1 md:col-span-2 lg:col-span-2 row-span-2 ${bentoCardClass} flex flex-col justify-between overflow-hidden`}>
                   <div className="p-8 pb-0 z-10">
                     <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                        <Activity className="w-8 h-8" />
                     </div>
                     <h4 className="text-xl font-bold mb-2 text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Transaksi</h4>
                     <p className="text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white my-4 tracking-tight">
                       {totalTransactions > 0 ? totalTransactions.toLocaleString('id-ID') : '...'}
                     </p>
                     <p className="text-slate-600 dark:text-slate-300 text-lg font-medium mb-4">
                       Transaksi berhasil diproses secara real-time melalui platform kami.
                     </p>
                   </div>
                   
                   {/* Traffic Chart */}
                   <div className="h-40 w-full mt-auto relative z-0 opacity-90 -mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <Tooltip content={<></>} cursor={false} />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3b82f6" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorTraffic)" 
                            isAnimationActive={true}
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* 2. Keamanan (Standard) */}
                <div className={`col-span-1 ${bentoCardClass} p-6`}>
                   <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                      <Shield className="w-6 h-6" />
                   </div>
                   <h4 className="text-xl font-bold mb-2">Aman & Privat</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-300">
                     Enkripsi data tingkat lanjut melindungi privasi digital Anda.
                   </p>
                </div>

                {/* 3. Lokasi (Standard) */}
                <div className={`col-span-1 ${bentoCardClass} p-6`}>
                   <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                      <Globe className="w-6 h-6" />
                   </div>
                   <h4 className="text-xl font-bold mb-2">Global Server</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-300">
                     Pilihan lokasi server di berbagai negara strategis.
                   </p>
                </div>

                {/* 4. Kecepatan Maksimal (Previously Gaming) */}
                <div className={`col-span-1 md:col-span-2 lg:col-span-2 ${bentoCardClass} p-8 flex items-center justify-between`}>
                   <div className="max-w-[60%]">
                      <h4 className="text-2xl font-bold mb-2">Kecepatan Maksimal</h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        Nikmati koneksi tanpa batas speed dengan server berkualitas tinggi yang dioptimalkan untuk performa terbaik.
                      </p>
                   </div>
                   <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                      <Zap className="w-10 h-10" />
                   </div>
                </div>

                {/* 5. Streaming (Standard) */}
                <div className={`col-span-1 ${bentoCardClass} p-6`}>
                   <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                      <Play className="w-6 h-6 ml-1" />
                   </div>
                   <h4 className="text-xl font-bold mb-2">Streaming 4K</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-300">
                     Bebas buffering untuk YouTube, Netflix, dan lainnya.
                   </p>
                </div>

                {/* 6. Premium (Standard) */}
                <div className={`col-span-1 ${bentoCardClass} p-6`}>
                   <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
                      <Star className="w-6 h-6" />
                   </div>
                   <h4 className="text-xl font-bold mb-2">Akun Premium</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-300">
                     Fitur eksklusif dan prioritas bandwidth untuk member.
                   </p>
                </div>

                {/* 7. Support (Wide on Mobile/Tablet, Standard on Desktop if needed, let's make it fill) */}
                 <div className={`col-span-1 md:col-span-2 lg:col-span-2 ${bentoCardClass} p-6 flex flex-col md:flex-row items-start md:items-center gap-6`}>
                   <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 flex-shrink-0">
                      <Headphones className="w-8 h-8" />
                   </div>
                   <div>
                     <h4 className="text-xl font-bold mb-2">Support & Komunitas</h4>
                     <p className="text-slate-600 dark:text-slate-300">
                       Bantuan teknis siap sedia jika Anda mengalami kendala koneksi.
                     </p>
                   </div>
                </div>
                
                {/* 8. Privasi (Standard) */}
                <div className={`col-span-1 md:col-span-1 lg:col-span-2 ${bentoCardClass} p-6 flex items-center gap-4`}>
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 flex-shrink-0">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">Privasi Terjaga</h4>
                       <p className="text-sm text-slate-600 dark:text-slate-300">
                        No-logs policy.
                      </p>
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
                <h3 className="text-2xl lg:text-3xl font-bold mb-8">Protokol yang Didukung</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                <Card
                  className={`text-center cursor-pointer group ${bentoCardClass} border-0 rounded-2xl`}
                  onClick={() => navigate('/protokol/server-ssh')}
                >
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

                <Card
                  className={`text-center cursor-pointer group ${bentoCardClass} border-0 rounded-2xl`}
                  onClick={() => navigate('/protokol/server-vmess')}
                >
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

                <Card
                  className={`text-center cursor-pointer group ${bentoCardClass} border-0 rounded-2xl`}
                  onClick={() => navigate('/protokol/server-vless')}
                >
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

                <Card
                  className={`text-center cursor-pointer group ${bentoCardClass} border-0 rounded-2xl`}
                  onClick={() => navigate('/protokol/server-trojan')}
                >
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

                <Card
                  className={`text-center cursor-pointer group ${bentoCardClass} border-0 rounded-2xl`}
                  onClick={() => navigate('/protokol/server-udp')}
                >
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-orange-500/30">
                      <span className="text-white font-bold text-sm lg:text-base">UDP</span>
                    </div>
                    <CardTitle className="text-lg lg:text-xl">ZIVPN/SOCKSIP</CardTitle>
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

        {/* CTA Section */}
        <RevealOnScroll delay={400}>
          <section className="py-8 lg:py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Card className="p-8 lg:p-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-2xl relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
                <div className="relative z-10">
                  <CardHeader>
                    <CardTitle className="text-3xl lg:text-4xl font-bold mb-4">Mulai Pengalaman Baru</CardTitle>
                    <CardDescription className="text-blue-100 text-lg lg:text-xl mb-8">
                      Bergabunglah dengan ribuan pengguna yang telah mempercayakan koneksi internet mereka kepada kami.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="text-base lg:text-lg px-8 h-12 bg-white text-blue-600 hover:bg-blue-50 shadow-xl transition-all hover:scale-105 rounded-full"
                        onClick={login}
                      >
                        Login Sekarang
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-base lg:text-lg px-8 h-12 border-2 border-white/50 text-white hover:bg-white hover:text-blue-600 transition-all hover:scale-105 rounded-full bg-transparent"
                        onClick={register}
                      >
                        Daftar Gratis
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
