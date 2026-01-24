
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Kebijakan Privasi
            </h1>
            <p className="text-muted-foreground">
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Pendahuluan</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  PT KEDAI SSH DIGITAL NETWORK berkomitmen untuk melindungi privasi penggunal. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan layanan Kedai SSH.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Informasi yang Kami Kumpulkan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Kami mengumpulkan informasi berikut untuk memproses layanan:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Informasi Akun:</strong> Username, email, dan password (terenkripsi).</li>
                  <li><strong>Data Transaksi:</strong> Riwayat pembelian, metode pembayaran, dan status pembayaran.</li>
                  <li><strong>Data Produk Digital:</strong> Nomor handphone (untuk topup pulsa/data) dan ID Game (untuk topup game).</li>
                  <li><strong>Data Log Teknis:</strong> IP address dan log aktivitas sistem untuk keamanan dan pemecahan masalah (troubleshooting).</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Penggunaan Informasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Informasi yang dikumpulkan digunakan untuk:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Memproses pesanan produk digital (Pulsa, Game, Paket Data) ke provider.</li>
                  <li>Membuat dan mengelola akun VPN.</li>
                  <li>Memproses pembayaran dan verifikasi otomatis.</li>
                  <li>Menghubungi pengguna terkait status transaksi atau layanan pelanggan.</li>
                  <li>Mencegah aktivitas penipuan dan penyalahgunaan layanan.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Berbagi Informasi dengan Pihak Ketiga</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Kami tidak menjual data pribadi Anda. Namun, kami membagikan data spesifik yang diperlukan untuk menyelesaikan transaksi:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li><strong>Provider Pembayaran:</strong> Untuk memproses pembayaran.</li>
                  <li><strong>Aggregator Produk Digital:</strong> Nomor HP atau ID Game diteruskan ke provider untuk pengisian produk.</li>
                  <li><strong>Penegak Hukum:</strong> Jika diwajibkan oleh hukum yang berlaku di Indonesia.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Keamanan Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Kami menerapkan standar keamanan industri, termasuk enkripsi SSL/TLS untuk semua komunikasi data dan hashing untuk penyimpanan password. Kami terus memperbarui sistem keamanan kami untuk melindungi data Anda.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Hak Pengguna</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Anda memiliki hak untuk:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Mengakses dan memperbarui informasi profil Anda.</li>
                  <li>Meminta penghapusan akun (dengan konsekuensi hilangnya seluruh riwayat transaksi dan saldo).</li>
                  <li>Mendapatkan transparansi mengenai penggunaan data Anda.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Cookies</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Website kami menggunakan cookies untuk menyimpan sesi login dan preferensi pengguna guna meningkatkan pengalaman penggunaan website.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Kontak</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui kontak resmi PT KEDAI SSH DIGITAL NETWORK yang tersedia di website.
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

export default PrivacyPolicy;
