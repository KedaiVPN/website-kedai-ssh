
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Shield, Zap, Globe, Users, Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const features = [
    {
      icon: <Shield className="w-8 h-8 text-blue-500" />,
      title: "Keamanan Tinggi",
      description: "Protokol enkripsi terdepan dengan SSH, VMess, VLESS, dan Trojan untuk melindungi data Anda"
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: "Kecepatan Optimal",
      description: "Server berkualitas tinggi dengan bandwidth unlimited untuk pengalaman browsing yang lancar"
    },
    {
      icon: <Globe className="w-8 h-8 text-green-500" />,
      title: "Multi Lokasi",
      description: "Server tersebar di berbagai negara: Singapore, Japan, USA untuk akses global"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500" />,
      title: "Support 24/7",
      description: "Tim support profesional siap membantu Anda kapan saja melalui Telegram"
    }
  ];

  const benefits = [
    "Akses unlimited ke semua website yang diblokir",
    "Streaming video berkualitas tinggi tanpa buffering",
    "Gaming online dengan ping rendah dan stabil",
    "Perlindungan privasi dan data pribadi terjamin",
    "Setup mudah dengan panduan lengkap",
    "Multiple device support (Windows, Android, iOS)"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 sm:mb-12">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/lovable-uploads/aa532f4b-2138-497d-aa0f-ed3294e0c935.png" 
                alt="Kedai SSH Logo" 
                className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse"
              />
            </div>
            <div className="relative inline-block">
              <h1 className="text-3xl sm:text-5xl font-bold gradient-move mb-3">
                Kedai SSH
              </h1>
            </div>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Platform premium untuk membuat akun VPN dengan protokol SSH, VMess, VLESS, dan Trojan
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-foreground">
            Solusi VPN Terpercaya untuk Kebutuhan Internet Anda
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            Nikmati akses internet tanpa batas dengan teknologi VPN terdepan. 
            Dapatkan kecepatan optimal, keamanan maksimal, dan dukungan 24/7 untuk pengalaman browsing terbaik.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/create-account">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold animate-scale-in">
                Free Account
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-3 text-lg font-semibold animate-scale-in animation-delay-2000"
              onClick={() => window.open('https://t.me/KedaiReseller_bot', '_blank')}
            >
              <Star className="w-5 h-5 mr-2" />
              Premium Account
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-foreground">
            Mengapa Memilih Kedai SSH?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-morphism p-6 rounded-xl text-center animate-slide-in-right"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-semibold mb-3 text-foreground">
                  {feature.title}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-foreground">
            Keunggulan yang Anda Dapatkan
          </h3>
          <div className="glass-morphism p-8 rounded-xl max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Protocols Section */}
        <div className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-foreground">
            Protokol yang Didukung
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['SSH', 'VMess', 'VLESS', 'Trojan'].map((protocol, index) => (
              <div 
                key={protocol}
                className="glass-morphism p-6 rounded-xl text-center animate-bounce-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">{protocol}</span>
                </div>
                <h4 className="text-lg font-semibold text-foreground">
                  {protocol}
                </h4>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center glass-morphism p-8 rounded-xl animate-scale-in">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">
            Siap Memulai?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pengguna yang telah merasakan kecepatan dan keamanan VPN premium kami. 
            Mulai dengan akun gratis atau upgrade ke premium untuk fitur lebih lengkap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/create-account">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold">
                Mulai Gratis Sekarang
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-3 text-lg font-semibold"
              onClick={() => window.open('https://t.me/KedaiReseller_bot', '_blank')}
            >
              <Star className="w-5 h-5 mr-2" />
              Upgrade ke Premium
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="glass-morphism p-6 rounded-xl">
            <p className="text-muted-foreground mb-4">
              Butuh bantuan? Hubungi kami melalui:
            </p>
            <Button 
              variant="ghost" 
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
              onClick={() => window.open('https://t.me/KedaiReseller_bot', '_blank')}
            >
              📱 Telegram Support
            </Button>
          </div>
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              © 2024 Kedai SSH. Semua hak dilindungi undang-undang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
