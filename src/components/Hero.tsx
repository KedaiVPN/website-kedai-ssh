
import { Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Hero = () => {
  return (
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
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 inline-block mr-1 animate-bounce" />
            Kedai SSH<Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 inline-block ml-1 animate-sparkle-flow" />
          </h1>
        </div>
        <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Platform premium untuk membuat akun VPN dengan protokol SSH, VMess, VLESS, dan Trojan
        </p>
      </div>
      <ThemeToggle />
    </div>
  );
};
