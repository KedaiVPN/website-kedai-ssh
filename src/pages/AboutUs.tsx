
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, Globe, Users, Heart, Target } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Tentang Kami
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Kedai SSH adalah penyedia layanan VPN terpercaya yang berkomitmen memberikan 
              akses internet yang aman, cepat, dan terjangkau untuk semua pengguna.
            </p>
          </div>

          <div className="space-y-8">
            {/* Visi & Misi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-xl">Visi Kami</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Menjadi penyedia layanan VPN terdepan di Indonesia yang memberikan akses internet 
                    bebas, aman, dan berkualitas tinggi untuk mendukung kehidupan digital masyarakat.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-xl">Misi Kami</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Menyediakan layanan VPN yang handal, terjangkau, dan mudah digunakan dengan 
                    dukungan teknologi terdepan dan layanan pelanggan yang responsif.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Keunggulan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Keunggulan Kedai SSH</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Keamanan Tinggi</h3>
                    <p className="text-sm text-muted-foreground">
                      Enkripsi militer dengan protokol SSH, VMess, VLESS, dan Trojan
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Performa Optimal</h3>
                    <p className="text-sm text-muted-foreground">
                      Server premium dengan kecepatan tinggi dan ping rendah
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Akses Global</h3>
                    <p className="text-sm text-muted-foreground">
                      Server di berbagai lokasi strategis untuk akses optimal
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cerita Kami */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Cerita Kami</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Kedai SSH lahir dari kebutuhan akan layanan VPN yang handal dan terjangkau di Indonesia. 
                  Kami memahami pentingnya akses internet yang bebas dan aman dalam era digital ini.
                </p>
                <p>
                  Dengan pengalaman bertahun-tahun di bidang teknologi jaringan, tim kami berkomitmen 
                  untuk terus berinovasi dan memberikan layanan terbaik kepada seluruh pengguna.
                </p>
                <p>
                  Hingga saat ini, ribuan pengguna telah mempercayai Kedai SSH sebagai solusi 
                  kebutuhan VPN mereka untuk berbagai keperluan seperti browsing, streaming, gaming, 
                  dan aktivitas online lainnya.
                </p>
              </CardContent>
            </Card>

            {/* Komitmen */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Komitmen Kami</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Kepuasan Pelanggan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Memberikan layanan pelanggan yang responsif dan membantu menyelesaikan 
                      setiap masalah dengan cepat dan profesional.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Privasi Terjamin
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Melindungi privasi pengguna dengan tidak menyimpan log aktivitas 
                      dan menggunakan enkripsi tingkat tinggi.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      Inovasi Berkelanjutan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Terus mengembangkan teknologi dan menambah fitur baru untuk 
                      memberikan pengalaman terbaik kepada pengguna.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                      Harga Terjangkau
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Menyediakan layanan berkualitas premium dengan harga yang 
                      terjangkau untuk semua kalangan masyarakat.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kontak */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-center">Hubungi Kami</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Ada pertanyaan atau butuh bantuan? Tim support kami siap membantu Anda 24/7
                </p>
                <p className="text-sm text-muted-foreground">
                  Klik tombol WhatsApp yang tersedia di pojok kanan bawah website 
                  atau hubungi kami melalui kontak yang tersedia.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
