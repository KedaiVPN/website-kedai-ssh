
// Halaman About - halaman utama (landing page) aplikasi
// Menampilkan informasi tentang layanan VPN dan navigasi ke fitur utama

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { 
  Shield, 
  Zap, 
  Globe, 
  Lock, 
  Server, 
  Users, 
  ArrowRight,
  CheckCircle,
  Wifi,
  Smartphone
} from 'lucide-react';

// Komponen utama halaman About
const About = () => {
  const navigate = useNavigate(); // Hook untuk navigasi programatik

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header navigasi */}
      <Header />
      
      {/* Elemen background animasi untuk visual yang menarik */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Lingkaran blur purple */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse"></div>
        {/* Lingkaran blur yellow */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        {/* Lingkaran blur pink */}
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Container utama dengan padding atas untuk header fixed */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        
        {/* Hero Section - Bagian utama dengan judul dan deskripsi */}
        <div className="text-center mb-16 animate-fade-in">
          {/* Badge status layanan */}
          <Badge className="mb-4 px-4 py-2 text-sm font-medium">
            🚀 Layanan VPN Premium
          </Badge>
          
          {/* Judul utama dengan gradient */}
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Kedai SSH Premium
          </h1>
          
          {/* Deskripsi layanan */}
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Layanan VPN premium dengan multiple protocol support. 
            Nikmati koneksi internet yang aman, cepat, dan stabil untuk semua kebutuhan Anda.
          </p>
          
          {/* Tombol Call-to-Action utama */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate('/create-account')}
            >
              Buat Akun Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate('/protokol')}
            >
              Lihat Protocol
            </Button>
          </div>
        </div>

        {/* Features Grid - Menampilkan fitur-fitur utama */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Card: Multiple Protocol */}
          <Card className="hover:shadow-lg transition-all duration-300 hover-scale">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <CardTitle>Multiple Protocol</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Mendukung SSH, VMess, VLess, dan Trojan. Pilih protocol yang sesuai dengan kebutuhan Anda.
              </CardDescription>
              {/* List protocol yang didukung */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="secondary">SSH</Badge>
                <Badge variant="secondary">VMess</Badge>
                <Badge variant="secondary">VLess</Badge>
                <Badge variant="secondary">Trojan</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card: Server Berkualitas */}
          <Card className="hover:shadow-lg transition-all duration-300 hover-scale">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Server className="h-8 w-8 text-primary" />
                <CardTitle>Server Berkualitas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Server premium dengan uptime 99.9% dan bandwidth unlimited untuk pengalaman terbaik.
              </CardDescription>
              {/* Fitur server */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Uptime 99.9%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Bandwidth Unlimited</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Keamanan Tinggi */}
          <Card className="hover:shadow-lg transition-all duration-300 hover-scale">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Lock className="h-8 w-8 text-primary" />
                <CardTitle>Keamanan Tinggi</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Enkripsi military-grade dan no-log policy untuk menjaga privasi dan keamanan data Anda.
              </CardDescription>
              {/* Fitur keamanan */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Enkripsi AES-256</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">No-Log Policy</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Koneksi Cepat */}
          <Card className="hover:shadow-lg transition-all duration-300 hover-scale">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Zap className="h-8 w-8 text-primary" />
                <CardTitle>Koneksi Cepat</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Optimasi khusus untuk streaming, gaming, dan browsing dengan latensi rendah.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Card: Global Network */}
          <Card className="hover:shadow-lg transition-all duration-300 hover-scale">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Globe className="h-8 w-8 text-primary" />
                <CardTitle>Global Network</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Server tersebar di berbagai negara untuk akses konten global tanpa batas.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Card: Multi Platform */}
          <Card className="hover:shadow-lg transition-all duration-300 hover-scale">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-8 w-8 text-primary" />
                <CardTitle>Multi Platform</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Kompatibel dengan semua device: Android, iOS, Windows, macOS, dan Linux.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action Section - Ajakan untuk mulai menggunakan */}
        <div className="text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-white/20 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Siap Untuk Memulai?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pengguna yang sudah merasakan kecepatan dan keamanan layanan VPN premium kami.
          </p>
          
          {/* Statistik pengguna */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-8">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold">10,000+</span>
              <span className="text-muted-foreground">Pengguna Aktif</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wifi className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold">99.9%</span>
              <span className="text-muted-foreground">Uptime</span>
            </div>
          </div>
          
          {/* Tombol aksi akhir */}
          <Button 
            size="lg" 
            className="text-lg px-12 py-6 shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate('/create-account')}
          >
            Mulai Sekarang - Gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default About;
