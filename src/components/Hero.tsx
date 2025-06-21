
import { ThemeToggle } from '@/components/ThemeToggle';

export const Hero = () => {
  return (
    <div className="flex justify-between items-start mb-8 sm:mb-12">
      {/* Logo and website name in top-left corner */}
      <div className="flex items-center gap-3">
        <img 
          src="/lovable-uploads/aa532f4b-2138-497d-aa0f-ed3294e0c935.png" 
          alt="Kedai SSH Logo" 
          className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse"
        />
        <h1 className="text-xl sm:text-2xl font-bold gradient-move">
          Kedai SSH
        </h1>
      </div>
      
      {/* Centered slogan */}
      <div className="flex-1 text-center px-4">
        <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Platform premium untuk membuat akun VPN dengan protokol SSH, VMess, VLESS, dan Trojan
        </p>
      </div>
      
      <ThemeToggle />
    </div>
  );
};
