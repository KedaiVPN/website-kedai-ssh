
// Komponen Header - navbar utama aplikasi
// Berisi logo, navigasi, dan tombol-tombol aksi utama

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, Plus, Settings, Shield } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

// Komponen utama Header
export const Header = () => {
  const navigate = useNavigate(); // Hook untuk navigasi programatik
  const location = useLocation(); // Hook untuk mendapatkan lokasi/path saat ini
  const { isMenuOpen, toggleMenu } = useSidebar(); // State dan fungsi sidebar dari context

  // State lokal untuk mengelola dropdown menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fungsi untuk menutup mobile menu setelah navigasi
  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Tutup menu mobile setelah navigasi
  };

  // Fungsi untuk mengecek apakah link sedang aktif (path saat ini)
  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  // Fungsi untuk mendapatkan class CSS berdasarkan status aktif link
  const getLinkClass = (path: string) => {
    const baseClass = "text-sm font-medium transition-colors hover:text-primary";
    return isActiveLink(path) 
      ? `${baseClass} text-primary` // Style untuk link aktif
      : `${baseClass} text-muted-foreground`; // Style untuk link tidak aktif
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo dan Brand - Sisi Kiri */}
          <div className="flex items-center space-x-4">
            {/* Logo dengan icon Shield */}
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Kedai SSH
              </span>
            </div>
          </div>

          {/* Navigasi Desktop - Tengah */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Link ke halaman utama */}
            <button 
              onClick={() => navigate('/')}
              className={getLinkClass('/')}
            >
              Beranda
            </button>
            
            {/* Link ke halaman pemilihan protocol */}
            <button 
              onClick={() => navigate('/protokol')}
              className={getLinkClass('/protokol')}
            >
              Pilih Protocol
            </button>
            
            {/* Link ke halaman buat akun */}
            <button 
              onClick={() => navigate('/create-account')}
              className={getLinkClass('/create-account')}
            >
              Buat Akun
            </button>
          </nav>

          {/* Tombol Aksi - Sisi Kanan */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Tombol Buat Akun - Hanya tampil di desktop */}
            <Button 
              onClick={() => navigate('/create-account')}
              size="sm"
              className="hidden sm:flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Buat Akun
            </Button>

            {/* Tombol Admin - Selalu tampil */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>

            {/* Toggle Tema (Light/Dark) */}
            <ThemeToggle />

            {/* Tombol Mobile Menu - Hanya tampil di mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown - Hanya tampil di mobile saat menu terbuka */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t">
              
              {/* Link mobile ke halaman utama */}
              <button
                onClick={() => handleMobileNavigation('/')}
                className={`${getLinkClass('/')} block px-3 py-2 text-base w-full text-left`}
              >
                Beranda
              </button>
              
              {/* Link mobile ke halaman protocol */}
              <button
                onClick={() => handleMobileNavigation('/protokol')}
                className={`${getLinkClass('/protokol')} block px-3 py-2 text-base w-full text-left`}
              >
                Pilih Protocol
              </button>
              
              {/* Link mobile ke halaman buat akun */}
              <button
                onClick={() => handleMobileNavigation('/create-account')}
                className={`${getLinkClass('/create-account')} block px-3 py-2 text-base w-full text-left`}
              >
                Buat Akun
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
