
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

const NotFound = () => {
  const location = useLocation();
  const { isMenuOpen } = useSidebar();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 relative z-10 transition-transform duration-300 overflow-x-hidden ${isMenuOpen ? 'md:translate-x-[-16rem]' : 'translate-x-0'}`}>
      <Header />
      
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="text-center glass-morphism p-8 rounded-xl max-w-md mx-4">
          <h1 className="text-6xl font-bold mb-4 text-foreground">404</h1>
          <p className="text-xl text-muted-foreground mb-6">Oops! Halaman tidak ditemukan</p>
          <p className="text-muted-foreground mb-8">
            Halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
          <Link to="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg">
              <Home className="w-5 h-5 mr-2" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
