
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <div className="mt-12 sm:mt-16 text-center">
      <div className="inline-flex flex-col items-center space-y-3 text-xs sm:text-sm text-muted-foreground bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-white/20">
        <div className="flex items-center space-x-2">
          <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>©2024 Kedai SSH</span>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          <Link 
            to="/privacy-policy" 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Kebijakan Privasi
          </Link>
          <span className="text-muted-foreground/50">•</span>
          <Link 
            to="/terms-of-service" 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Ketentuan Layanan
          </Link>
          <span className="text-muted-foreground/50">•</span>
          <Link 
            to="/about-us" 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Tentang Kami
          </Link>
        </div>
      </div>
    </div>
  );
};
