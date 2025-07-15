
/**
 * Komponen Footer aplikasi
 * Berisi informasi copyright, link, dan branding
 */

import { Shield, Github, Twitter, Globe } from 'lucide-react';

/**
 * Data link footer yang diorganisir dalam kolom
 */
const footerLinks = {
  layanan: [
    { label: 'SSH Tunnel', href: '#' },
    { label: 'VMess', href: '#' },
    { label: 'VLess', href: '#' },
    { label: 'Trojan', href: '#' }
  ],
  dukungan: [
    { label: 'Dokumentasi', href: '#' },
    { label: 'Tutorial', href: '#' },
    { label: 'FAQ', href: '#' },
    { label: 'Kontak', href: '#' }
  ],
  perusahaan: [
    { label: 'Tentang Kami', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Karir', href: '#' },
    { label: 'Press Kit', href: '#' }
  ]
};

/**
 * Data social media links
 */
const socialLinks = [
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Globe, href: '#', label: 'Website' }
];

/**
 * Komponen Footer utama
 */
export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Bagian utama footer dengan grid layout */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Kolom brand dan deskripsi */}
          <div className="col-span-1 md:col-span-1">
            {/* Logo dan nama brand */}
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">VPN Pro</span>
            </div>
            
            {/* Deskripsi singkat */}
            <p className="text-muted-foreground text-sm mb-4">
              Layanan VPN terpercaya dengan enkripsi tingkat militer. 
              Akses internet aman dan cepat untuk semua kebutuhan Anda.
            </p>
            
            {/* Social media links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={social.label}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Kolom link Layanan */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Layanan</h3>
            <ul className="space-y-2">
              {footerLinks.layanan.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom link Dukungan */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Dukungan</h3>
            <ul className="space-y-2">
              {footerLinks.dukungan.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom link Perusahaan */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Perusahaan</h3>
            <ul className="space-y-2">
              {footerLinks.perusahaan.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bagian bawah footer dengan copyright */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            
            {/* Copyright text */}
            <p className="text-muted-foreground text-sm">
              © 2024 VPN Pro. Seluruh hak cipta dilindungi.
            </p>
            
            {/* Link legal */}
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                Kebijakan Privasi
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                Syarat Layanan
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
