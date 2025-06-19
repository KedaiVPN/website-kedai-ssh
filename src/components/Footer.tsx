
import { Shield } from 'lucide-react';

export const Footer = () => {
  return (
    <div className="mt-12 sm:mt-16 text-center">
      <div className="inline-flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/20">
        <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
        <span>© 2024 Kedai SSH. Semua hak dilindungi.</span>
      </div>
    </div>
  );
};
