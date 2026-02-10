import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, CreditCard, Shield, Smartphone } from 'lucide-react';
import { SEO } from '@/components/SEO';

const FAQ = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SEO
        title="FAQ - Frequently Asked Questions"
        description="Temukan jawaban atas pertanyaan umum seputar layanan VPN SSH, VMess, VLESS, Trojan, serta produk digital lainnya di Kedai SSH."
        canonical="https://kedaissh.com/faq"
      />
      <Header />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Temukan jawaban atas pertanyaan yang sering diajukan seputar layanan kami
            </p>
          </div>

          <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="sr-only">Kategori FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 h-auto p-1">
                  <TabsTrigger value="general" className="py-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Umum
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="py-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Pembayaran
                  </TabsTrigger>
                  <TabsTrigger value="vpn" className="py-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    VPN & SSH
                  </TabsTrigger>
                  <TabsTrigger value="digital" className="py-2 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Produk Digital
                  </TabsTrigger>
                </TabsList>

                {/* Umum */}
                <TabsContent value="general">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Apa itu Kedai SSH?</AccordionTrigger>
                      <AccordionContent>
                        Kedai SSH adalah platform penyedia layanan VPN Premium (SSH, VMess, VLESS, Trojan) dan produk digital lainnya seperti Topup Game, Pulsa, dan Paket Data yang dikelola oleh PT KEDAI SSH DIGITAL NETWORK.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Bagaimana cara mendaftar akun?</AccordionTrigger>
                      <AccordionContent>
                        Klik tombol "Register" pada pojok kanan atas, isi data yang diperlukan seperti username, email, dan password. Pastikan menggunakan email aktif untuk verifikasi.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Saya lupa password, apa yang harus dilakukan?</AccordionTrigger>
                      <AccordionContent>
                        Gunakan fitur "Lupa Password" di halaman login. Masukkan email yang terdaftar, dan kami akan mengirimkan instruksi reset password ke email Anda.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                {/* Pembayaran */}
                <TabsContent value="payment">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Metode pembayaran apa saja yang tersedia?</AccordionTrigger>
                      <AccordionContent>
                        Kami mendukung berbagai metode pembayaran termasuk QRIS, Virtual Account Bank (BCA, BRI, Mandiri, BNI), dan E-Wallet (GoPay, OVO, Dana).
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Apakah saldo masuk otomatis?</AccordionTrigger>
                      <AccordionContent>
                        Ya, sistem kami bekerja secara otomatis 24 jam. Saldo akan masuk segera setelah pembayaran Anda terverifikasi oleh sistem pembayaran.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Bagaimana jika saldo tidak masuk setelah transfer?</AccordionTrigger>
                      <AccordionContent>
                        Jika saldo belum masuk dalam 10-15 menit, silakan hubungi Customer Service kami melalui WhatsApp dengan menyertakan bukti transfer dan ID akun Anda.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                {/* VPN & SSH */}
                <TabsContent value="vpn">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Apa perbedaan SSH, VMess, VLESS, dan Trojan?</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc ml-4 space-y-2">
                          <li><strong>SSH:</strong> Protokol tunneling dasar, cocok untuk browsing aman.</li>
                          <li><strong>VMess:</strong> Protokol V2Ray, lebih stabil dan mendukung banyak fitur.</li>
                          <li><strong>VLESS:</strong> Versi ringan dari V2Ray tanpa enkripsi ganda, performa lebih cepat.</li>
                          <li><strong>Trojan:</strong> Menyerupai traffic HTTPS biasa, sulit dideteksi firewall.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Bagaimana cara menggunakan akun VPN yang sudah dibuat?</AccordionTrigger>
                      <AccordionContent>
                        Setelah membuat akun, Anda akan mendapatkan detail akun atau config. Salin config tersebut ke aplikasi VPN client yang sesuai (seperti HTTP Injector, NetMod, V2RayNG, atau Clash) di perangkat Anda.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Apakah bandwidth dibatasi?</AccordionTrigger>
                      <AccordionContent>
                        Kami menyediakan layanan dengan bandwidth unlimited, namun harap gunakan secara bijak (Fair Usage Policy) dan dilarang digunakan untuk aktivitas ilegal seperti hacking, spamming, atau torrenting yang melanggar hukum.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                {/* Produk Digital */}
                <TabsContent value="digital">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Berapa lama proses masuk pulsa atau topup game?</AccordionTrigger>
                      <AccordionContent>
                        Transaksi produk digital diproses secara instan (detik). Namun dalam kondisi gangguan provider, proses bisa memakan waktu sedikit lebih lama.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Bagaimana jika status sukses tapi pulsa/item belum masuk?</AccordionTrigger>
                      <AccordionContent>
                        Tunggu maksimal 1x24 jam. Jika masih belum masuk, hubungi CS kami dengan menyertakan Nomor HP/ID Game dan ID Transaksi. Kami akan membantu pengecekan ke provider.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Bisakah membatalkan transaksi yang salah nomor?</AccordionTrigger>
                      <AccordionContent>
                        Mohon maaf, transaksi yang sudah diproses oleh sistem provider tidak dapat dibatalkan atau direfund. Mohon periksa kembali nomor tujuan atau ID Game sebelum melakukan pembayaran.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
