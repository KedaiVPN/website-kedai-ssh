
/**
 * Komponen Header utama aplikasi
 * Berisi navigasi, logo, toggle theme, dan menu mobile
 */

import { useState } from 'react';
import { Menu, X, Shield, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Data item navigasi utama
 * Setiap item memiliki label dan path tujuan
 */
const navigationItems = [
  { label: 'Beranda', path: '/' },
  { label: 'Buat Akun', path: '/create-account' },
  { label: 'Protokol', path: '/protokol' },
  { label: 'Admin', path: '/admin' }
];

/**
 * Komponen Header dengan navigasi responsif
 */
export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { isMenuOpen, setIsMenuOpen } = useSidebar();

  /**
   * Handler untuk navigasi ke halaman tertentu
   * @param path - Path tujuan navigasi
   */
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false); // Tutup menu mobile setelah navigasi
  };

  /**
   * Toggle tema antara light dan dark mode
   */
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  /**
   * Mengecek apakah path saat ini aktif
   * @param path - Path yang akan dicek
   * @returns boolean - true jika path aktif
   */
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Header utama dengan background blur */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo dan nama brand */}
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleNavigation('/')}
            >
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">VPN Pro</span>
            </div>

            {/* Navigasi desktop - tersembunyi di mobile */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActivePath(item.path) 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Kontrol di sisi kanan */}
            <div className="flex items-center space-x-4">
              
              {/* Toggle tema */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              {/* Tombol menu mobile - hanya muncul di mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay menu mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Background overlay dengan blur */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Panel menu mobile */}
          <div className="fixed top-16 left-0 right-0 bg-white dark:bg-gray-950 border-b border-border shadow-lg">
            <nav className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
