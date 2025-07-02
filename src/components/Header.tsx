
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    // Use navigate('/') with replace: false (default) to properly push to history
    // This allows users to go back from homepage to previous page
    navigate('/', { replace: false });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and website name in top-left corner */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          >
            <img 
              src="/lovable-uploads/aa532f4b-2138-497d-aa0f-ed3294e0c935.png" 
              alt="Kedai SSH Logo" 
              className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse"
            />
            <h1 className="text-xl sm:text-2xl font-bold gradient-move">
              Kedai SSH
            </h1>
          </div>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
