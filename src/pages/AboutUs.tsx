
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, Globe, Users, Heart, Target, Gamepad2, Smartphone } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Tentang Kami
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Kedai SSH adalah bagian dari <strong>PT KEDAI SSH DIGITAL NETWORK</strong> yang berkomitmen menyediakan layanan VPN Premium dan Produk Digital terlengkap di Indonesia.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Nomor AHU: AHU-004870.AH.01.30.Tahun 2026
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
                    Menjadi platform digital one-stop-solution yang menyediakan akses internet aman, layanan topup game, dan kebutuhan digital lainnya untuk seluruh masyarakat Indonesia.
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
                    Menghadirkan layanan yang stabil, transaksi otomatis 24 jam, dan harga bersaing untuk semua produk, mulai dari VPN, Topup Game, hingga Pulsa & Paket Data.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Keunggulan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Layanan Kami</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold mb-2">VPN Premium</h3>
                    <p className="text-sm text-muted-foreground">
                      Akses internet aman dengan protokol SSH, VMess, VLESS, Trojan, dan ZiVPN/SOCKSIP.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Gamepad2 className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Topup Game</h3>
                    <p className="text-sm text-muted-foreground">
                      Topup berbagai game populer dengan proses instan dan harga termurah.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Pulsa & Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Isi ulang pulsa dan paket data semua operator dengan mudah dan cepat.
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
                  PT KEDAI SSH DIGITAL NETWORK berawal dari sebuah komunitas kecil pecinta teknologi jaringan.
                  Melihat tingginya kebutuhan akan akses internet yang privat dan aman, kami mulai mengembangkan layanan VPN.
                </p>
                <p>
                  Seiring berjalannya waktu, kami menyadari bahwa kebutuhan digital tidak hanya terbatas pada keamanan internet.
                  Oleh karena itu, kami memperluas layanan kami untuk mencakup kebutuhan harian seperti Topup Game,
                  Pulsa, dan Paket Data, menjadikan Kedai SSH sebagai platform digital yang lengkap.
                </p>
                <p>
                  Kini, dengan dukungan ribuan pengguna setia, kami terus berkomitmen untuk memberikan layanan
                  terbaik dengan infrastruktur yang handal dan sistem yang aman.
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
                      Pelayanan Terbaik
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tim support kami siap membantu kendala Anda, baik seputar koneksi VPN maupun transaksi produk digital.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Legalitas & Keamanan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Beroperasi di bawah naungan PT KEDAI SSH DIGITAL NETWORK dengan legalitas resmi, menjamin keamanan transaksi Anda.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      Proses Otomatis
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Sistem kami berjalan otomatis 24 jam, memastikan pesanan Anda diproses detik itu juga tanpa menunggu lama.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                      Harga Bersahabat
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Kami percaya layanan berkualitas tidak harus mahal. Dapatkan harga terbaik untuk semua produk kami.
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
                  Ada pertanyaan atau butuh bantuan?
                </p>
                <p className="text-sm text-muted-foreground">
                  PT KEDAI SSH DIGITAL NETWORK<br/>
                  AHU-004870.AH.01.30.Tahun 2026
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
