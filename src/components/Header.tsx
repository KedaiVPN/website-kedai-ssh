
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';

export const Header = () => {
  const navigate = useNavigate();
  const { isMenuOpen, setIsMenuOpen } = useSidebar();
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = () => {
    navigate('/', { replace: false });
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const closeSidebar = () => {
    setIsMenuOpen(false);
    setIsServiceOpen(false);
  };

  // Click outside and ESC key to close sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        closeSidebar();
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        closeSidebar();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isMenuOpen]);

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
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {/* Custom Sidebar Menu */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-accent"
              onClick={() => isMenuOpen ? closeSidebar() : setIsMenuOpen(true)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-40 z-50 transform transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } bg-white dark:bg-black text-black dark:text-white border-l border-border shadow-lg`}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!isMenuOpen}
      >
        <div className="flex flex-col h-full py-6">
          <nav className="flex flex-col space-y-2 px-6">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Home
            </button>
            
            <div className="border-t border-border my-2"></div>
            
            {/* Service Submenu */}
            <div>
              <button
                onClick={() => setIsServiceOpen(!isServiceOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span>Service</span>
                {isServiceOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {isServiceOpen && (
                <div className="ml-4 mt-2 space-y-1 animate-fade-in">
                  <button
                    onClick={() => handleNavigation('/protokol/server-ssh')}
                    className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    SSH
                  </button>
                  <button
                    onClick={() => handleNavigation('/protokol/server-vmess')}
                    className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    VMESS
                  </button>
                  <button
                    onClick={() => handleNavigation('/protokol/server-vless')}
                    className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    VLESS
                  </button>
                  <button
                    onClick={() => handleNavigation('/protokol/server-trojan')}
                    className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    Trojan
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={closeSidebar}
        />
      )}
    </header>
  );
};
