import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
                  Dengan menggunakan layanan Kedai SSH (dikelola oleh <strong>PT KEDAI SSH DIGITAL NETWORK</strong>), Anda menyetujui ketentuan layanan ini.
                  Jika Anda tidak setuju dengan ketentuan ini, mohon untuk tidak menggunakan layanan kami.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Deskripsi Layanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Kedai SSH menyediakan berbagai layanan digital, antara lain:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Layanan VPN Premium:</strong> SSH, VMess, VLESS, Trojan, dan ZiVPN UDP.</li>
                  <li><strong>Topup Game:</strong> Pembelian mata uang atau item game secara instan.</li>
                  <li><strong>Pulsa & Paket Data:</strong> Isi ulang pulsa dan paket internet untuk semua operator.</li>
                  <li><strong>Produk Digital Lainnya:</strong> Capcut Pro, Chatgpt Plus, Gemini Pro dan Lain-lain.</li>
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
                  <li>Memberikan informasi yang akurat saat registrasi.</li>
                  <li>Tidak menggunakan layanan VPN untuk aktivitas ilegal seperti hacking, carding, spamming, torrenting ilegal, atau tindakan yang melanggar hukum di Indonesia.</li>
                  <li>Memastikan nomor HP atau ID Game yang dimasukkan benar saat melakukan transaksi produk digital.</li>
                  <li>Tidak membagikan akses akun kepada pihak lain.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Pembayaran dan Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Ketentuan pembayaran:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Pembayaran dilakukan melalui metode yang tersedia (Transfer Bank, E-Wallet, QRIS).</li>
                  <li>Untuk produk digital (Pulsa/Game), transaksi yang sudah berstatus sukses di sistem kami tidak dapat dibatalkan atau dikembalikan (refund) jika kesalahan ada pada pengguna (salah nomor/ID).</li>
                  <li>Refund hanya diberikan jika terjadi kegagalan sistem dari pihak kami dan produk tidak terkirim.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Ketersediaan Layanan</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Kami berusaha menyediakan layanan 24/7. Namun, gangguan teknis dari pihak provider (Telkomsel, Mobile Legends, dll) atau pemeliharaan server dapat terjadi sewaktu-waktu.
                  Kami tidak bertanggung jawab atas kerugian tidak langsung akibat gangguan layanan tersebut.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Penangguhan dan Penghentian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Kami berhak memblokir atau menghapus akun tanpa pemberitahuan jika:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Terindikasi melakukan kecurangan atau penipuan.</li>
                  <li>Melanggar hukum atau ketentuan penggunaan VPN.</li>
                  <li>Melakukan spam atau beban berlebih pada server kami.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Batasan Tanggung Jawab</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  PT KEDAI SSH DIGITAL NETWORK tidak bertanggung jawab atas kerugian yang timbul akibat kesalahan pengguna, gangguan jaringan pihak ketiga, atau Force Majeure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Perubahan Ketentuan</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Kami berhak mengubah ketentuan layanan ini sewaktu-waktu. Perubahan akan berlaku efektif segera setelah diposting di website.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Kontak & Legalitas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">
                  Layanan ini dioperasikan secara legal oleh:
                </p>
                <p className="font-semibold">PT KEDAI SSH DIGITAL NETWORK</p>
                <p className="text-sm text-muted-foreground mb-4">AHU-004870.AH.01.30.Tahun 2026</p>
                <p>
                  Jika ada pertanyaan, silakan hubungi Customer Service kami melalui WhatsApp.
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
