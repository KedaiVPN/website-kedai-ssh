
/**
 * Halaman utama (About) yang menampilkan informasi tentang aplikasi VPN
 * Berisi hero section, fitur-fitur, dan call-to-action
 */

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Server, Zap, Clock, Users, Globe, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';

/**
 * Data fitur-fitur utama aplikasi VPN
 * Setiap fitur memiliki ikon, judul, dan deskripsi
 */
const features = [
  {
    icon: Shield,
    title: 'Keamanan Tinggi',
    description: 'Enkripsi tingkat militer untuk melindungi data Anda'
  },
  {
    icon: Server,
    title: 'Multi Protocol',
    description: 'Mendukung SSH, VMess, VLess, dan Trojan'
  },
  {
    icon: Zap,
    title: 'Koneksi Cepat',
    description: 'Server berkualitas tinggi dengan latensi rendah'
  },
  {
    icon: Clock,
    title: 'Uptime 99.9%',
    description: 'Layanan yang dapat diandalkan 24/7'
  },
  {
    icon: Users,
    title: 'Multi Device',
    description: 'Gunakan di berbagai perangkat secara bersamaan'
  },
  {
    icon: Globe,
    title: 'Server Global',
    description: 'Lokasi server di berbagai negara'
  }
];

/**
 * Data statistik layanan VPN
 * Menampilkan angka-angka pencapaian
 */
const stats = [
  { label: 'Pengguna Aktif', value: '10,000+', icon: Users },
  { label: 'Server Tersedia', value: '50+', icon: Server },
  { label: 'Negara', value: '15+', icon: Globe },
  { label: 'Uptime', value: '99.9%', icon: CheckCircle }
];

/**
 * Komponen halaman About utama
 */
export default function About() {
  const navigate = useNavigate();
  const { isMenuOpen } = useSidebar();
  
  // State untuk mengatur animasi loading pada tombol
  const [isNavigating, setIsNavigating] = useState(false);

  /**
   * Handler untuk navigasi ke halaman pembuatan akun
   * Menambahkan sedikit delay untuk UX yang lebih baik
   */
  const handleGetStarted = async () => {
    setIsNavigating(true);
    // Simulasi loading untuk UX yang lebih baik
    await new Promise(resolve => setTimeout(resolve, 500));
    navigate('/create-account');
    setIsNavigating(false);
  };

  /**
   * Handler untuk navigasi ke halaman protokol
   */
  const handleExploreProtocols = () => {
    navigate('/protokol');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 relative z-10 transition-transform duration-300 overflow-x-hidden">
      {/* Komponen header dengan navigasi */}
      <Header />
      
      {/* Elemen background animasi untuk visual effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Konten utama halaman */}
      <main className="relative z-10">
        {/* Hero Section - Bagian utama dengan judul dan CTA */}
        <section className="pt-32 pb-20 px-4 sm:px-6 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Badge untuk menunjukkan status layanan */}
            <Badge variant="secondary" className="mb-4 animate-bounce-in">
              ✨ Layanan VPN Terpercaya
            </Badge>
            
            {/* Judul utama dengan gradient effect */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 gradient-move animate-fade-in">
              VPN Berkualitas Tinggi
              <br />
              <span className="text-primary">Untuk Semua Kebutuhan</span>
            </h1>
            
            {/* Deskripsi layanan */}
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-in-right">
              Dapatkan akses internet yang aman, cepat, dan tanpa batas dengan layanan VPN premium kami. 
              Mendukung berbagai protokol dan server di seluruh dunia.
            </p>
            
            {/* Tombol call-to-action */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={handleGetStarted}
                disabled={isNavigating}
              >
                {isNavigating ? 'Memuat...' : 'Mulai Sekarang'}
                {!isNavigating && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6"
                onClick={handleExploreProtocols}
              >
                Jelajahi Protokol
              </Button>
            </div>
          </div>
        </section>

        {/* Section Statistik */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={stat.label} className="text-center border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <CardContent className="pt-6">
                      <IconComponent className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section Fitur-fitur */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header section fitur */}
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Mengapa Memilih Layanan Kami?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Kami menyediakan fitur-fitur terdepan untuk pengalaman VPN yang optimal
              </p>
            </div>
            
            {/* Grid fitur-fitur */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={feature.title} className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section - Ajakan untuk memulai */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden relative">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-black/10"></div>
              
              <CardContent className="relative pt-12 pb-12">
                <div className="flex items-center justify-center mb-4">
                  <Star className="h-8 w-8 mr-2" />
                  <h3 className="text-2xl sm:text-3xl font-bold">
                    Siap Memulai Perjalanan Anda?
                  </h3>
                </div>
                
                <p className="text-xl mb-8 opacity-90">
                  Bergabunglah dengan ribuan pengguna yang telah merasakan keamanan dan kecepatan layanan kami
                </p>
                
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="text-lg px-8 py-6"
                  onClick={handleGetStarted}
                  disabled={isNavigating}
                >
                  {isNavigating ? 'Memuat...' : 'Buat Akun Sekarang'}
                  {!isNavigating && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer aplikasi */}
      <Footer />
    </div>
  );
}
