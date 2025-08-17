
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Ketentuan Layanan
            </h1>
            <p className="text-muted-foreground">
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Penerimaan Ketentuan</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Dengan menggunakan layanan Kedai SSH, Anda menyetujui ketentuan layanan ini. 
                  Jika Anda tidak setuju dengan ketentuan ini, mohon untuk tidak menggunakan layanan kami.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Deskripsi Layanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Kedai SSH menyediakan layanan VPN dengan berbagai protokol:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>SSH (Secure Shell) untuk koneksi aman</li>
                  <li>VMess dan VLESS untuk protokol V2Ray</li>
                  <li>Trojan untuk kamuflase HTTPS</li>
                  <li>Akses ke server premium di berbagai lokasi</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Kewajiban Pengguna</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Pengguna wajib:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Memberikan informasi yang akurat saat registrasi</li>
                  <li>Menjaga kerahasiaan akun dan password</li>
                  <li>Menggunakan layanan sesuai dengan hukum yang berlaku</li>
                  <li>Tidak menyalahgunakan layanan untuk aktivitas ilegal</li>
                  <li>Tidak membagikan akun kepada pihak lain</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Pembayaran dan Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Ketentuan pembayaran:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Pembayaran dilakukan melalui sistem topup saldo</li>
                  <li>Saldo digunakan untuk membuat akun VPN dengan durasi tertentu</li>
                  <li>Tidak ada pengembalian dana untuk layanan yang sudah digunakan</li>
                  <li>Harga dapat berubah sewaktu-waktu dengan pemberitahuan</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Ketersediaan Layanan</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Kami berusaha menyediakan layanan 24/7, namun tidak menjamin ketersediaan 100%. 
                  Pemeliharaan server dan gangguan teknis dapat mempengaruhi ketersediaan layanan. 
                  Kami tidak bertanggung jawab atas kerugian akibat gangguan layanan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Penangguhan dan Penghentian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Kami berhak menghentikan layanan jika:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Pengguna melanggar ketentuan layanan</li>
                  <li>Aktivitas yang mencurigakan atau ilegal</li>
                  <li>Penyalahgunaan server atau bandwidth berlebihan</li>
                  <li>Permintaan dari pihak berwenang</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Batasan Tanggung Jawab</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Kedai SSH tidak bertanggung jawab atas kerugian langsung atau tidak langsung yang timbul 
                  dari penggunaan layanan. Pengguna menggunakan layanan dengan risiko sendiri.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Perubahan Ketentuan</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Kami berhak mengubah ketentuan layanan ini sewaktu-waktu. Perubahan akan diberitahukan 
                  melalui website atau email. Penggunaan layanan setelah perubahan dianggap sebagai persetujuan 
                  terhadap ketentuan yang baru.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Kontak</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Untuk pertanyaan terkait ketentuan layanan, silakan hubungi kami melalui 
                  saluran komunikasi yang tersedia di website.
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

export default TermsOfService;
