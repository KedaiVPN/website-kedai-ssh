
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
                <CardTitle>1. Informasi yang Kami Kumpulkan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Kami mengumpulkan informasi berikut dari pengguna:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Informasi akun: username, email, dan password terenkripsi</li>
                  <li>Data penggunaan layanan VPN dan akun yang dibuat</li>
                  <li>Informasi transaksi dan pembayaran</li>
                  <li>Log aktivitas untuk keamanan dan pemeliharaan layanan</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Penggunaan Informasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Informasi yang dikumpulkan digunakan untuk:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Menyediakan dan memelihara layanan VPN</li>
                  <li>Memproses pembayaran dan transaksi</li>
                  <li>Memberikan dukungan pelanggan</li>
                  <li>Meningkatkan kualitas layanan</li>
                  <li>Mengirim pemberitahuan penting terkait layanan</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Keamanan Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Kami menggunakan enkripsi tingkat tinggi dan protokol keamanan terdepan untuk melindungi data pengguna. 
                  Password disimpan dalam bentuk hash yang aman, dan semua komunikasi menggunakan SSL/TLS.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Berbagi Informasi</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Kami tidak membagikan, menjual, atau menyewakan informasi pribadi pengguna kepada pihak ketiga, 
                  kecuali dalam situasi berikut: (1) Atas persetujuan pengguna, (2) Untuk mematuhi kewajiban hukum, 
                  (3) Untuk melindungi hak dan keamanan layanan kami.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Hak Pengguna</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Pengguna memiliki hak untuk:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Mengakses dan memperbarui informasi pribadi</li>
                  <li>Menghapus akun dan data pribadi</li>
                  <li>Menerima salinan data pribadi</li>
                  <li>Menolak pemrosesan data untuk tujuan tertentu</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Cookies dan Teknologi Pelacakan</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Kami menggunakan cookies untuk meningkatkan pengalaman pengguna, menyimpan preferensi, 
                  dan menganalisis penggunaan layanan. Pengguna dapat mengatur preferensi cookies melalui browser.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Kontak</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui 
                  WhatsApp atau email yang tersedia di website kami.
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
