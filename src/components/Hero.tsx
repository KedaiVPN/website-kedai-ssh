
import { ThemeToggle } from '@/components/ThemeToggle';

export const Hero = () => {
  return (
    <div className="flex justify-between items-start mb-8 sm:mb-12">
      <div className="w-12"></div> {/* Spacer to balance ThemeToggle */}
      <div className="flex-1 text-center">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/lovable-uploads/aa532f4b-2138-497d-aa0f-ed3294e0c935.png" 
            alt="Kedai SSH Logo" 
            className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse"
          />
        </div>
        <div className="flex justify-center mb-3">
          <h1 className="text-3xl sm:text-5xl font-bold gradient-move">
            Kedai SSH
          </h1>
        </div>
        <div className="flex justify-center">
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl px-4">
            Platform premium untuk membuat akun VPN dengan protokol SSH, VMess, VLESS, dan Trojan
          </p>
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
};
