import { MessageCircle, Send, Smartphone, Gamepad2, Globe, Heart, Bug } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="mt-12 sm:mt-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">

          {/* Kolom 1: Perusahaan */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/aa532f4b-2138-497d-aa0f-ed3294e0c935.png" alt="Kedai SSH Logo" className="h-10 w-10 animate-pulse" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Kedai SSH
              </span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">PT KEDAI SSH DIGITAL NETWORK</p>
              <p>AHU-004870.AH.01.30.Tahun 2026</p>
              <p className="pt-2">
                Penyedia layanan VPN Premium dan Produk Digital terpercaya di Indonesia.
              </p>
            </div>
          </div>

          {/* Kolom 2: Produk VPN */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Produk VPN
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/protokol/ssh" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  SSH Websocket
                </Link>
              </li>
              <li>
                <Link to="/protokol/vmess" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  VMess V2Ray
                </Link>
              </li>
              <li>
                <Link to="/protokol/vless" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  VLESS V2Ray
                </Link>
              </li>
              <li>
                <Link to="/protokol/trojan" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Trojan WS
                </Link>
              </li>
              <li>
                <Link to="/protokol/zivpn" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  ZiVPN UDP
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Produk Digital */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Produk Digital
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/topupgame" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" /> Topup Game
                </Link>
              </li>
              <li>
                <Link to="/pulsa-dan-paket-data" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> Pulsa & Data
                </Link>
              </li>
              <li>
                <Link to="/produk-lainnya" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Produk Lainnya
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Tools */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Tools
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/tembakPaket" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> Tembak Paket
                </Link>
              </li>
              <li>
                <Link to="/bug-injector" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <Bug className="w-4 h-4" /> Insert Bug
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 5: Dukungan & Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Dukungan
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/tutorials" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Ketentuan Layanan
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/6287777694482"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-2"
                >
                  WhatsApp Support
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 5: Komunitas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Komunitas
            </h3>
            <div className="space-y-3">
              <a
                href="https://t.me/kedaissh"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
              >
                <div className="p-2 bg-blue-500 rounded-full text-white group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Telegram Group</p>
                  <p className="text-xs text-muted-foreground">Gabung diskusi</p>
                </div>
              </a>

              <a
                href="https://whatsapp.com/channel/0029Vb6cBYH4yltYm5fNY63r"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300"
              >
                <div className="p-2 bg-green-500 rounded-full text-white group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">WhatsApp Channel</p>
                  <p className="text-xs text-muted-foreground">Info terbaru</p>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © 2025 - {new Date().getFullYear()} PT KEDAI SSH DIGITAL NETWORK. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 animate-pulse fill-current" />
              <span>in Indonesia</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
