
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { VPNProtocol } from '@/types/vpn';

interface LoadingOverlayProps {
  isCreatingAccount: boolean;
  selectedProtocol: VPNProtocol;
}

export const LoadingOverlay = ({ isCreatingAccount, selectedProtocol }: LoadingOverlayProps) => {
  if (!isCreatingAccount) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="p-6 sm:p-8 text-center max-w-md mx-4 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-0 shadow-2xl animate-scale-in">
        <div className="relative mb-6">
          <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin mx-auto text-primary" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse"></div>
        </div>
        <h3 className="text-lg sm:text-xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Membuat Akun...
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          Mohon tunggu, sedang memproses pembuatan akun {selectedProtocol.toUpperCase()}
        </p>
      </Card>
    </div>
  );
};
