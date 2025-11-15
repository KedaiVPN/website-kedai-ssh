import { useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronUp, User, LogOut, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import { Badge } from '@/components/ui/badge';
import { messageService, UserMessage } from '@/services/messageService';
import MessageCenterModal from './MessageCenterModal';

export const Header = () => {
  const navigate = useNavigate();
  const { isMenuOpen, setIsMenuOpen } = useSidebar();
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const fetchMessageData = async () => {
    if (!isAuthenticated) return;
    try {
      const [count, userMessages] = await Promise.all([
        messageService.getUnreadCount(),
        messageService.getUserMessages(),
      ]);
      setUnreadCount(count);
      setMessages(userMessages);
    } catch (error) {
      console.error("Failed to fetch message data:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessageData();
      const intervalId = setInterval(fetchMessageData, 60000);
      return () => clearInterval(intervalId);
    } else {
      setMessages([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const handleMarkAsRead = async (messageId: number) => {
    const message = messages.find(m => m.id === messageId);
    if (message && !message.is_read) {
      setMessages(messages.map(m => m.id === messageId ? { ...m, is_read: 1 } : m));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    try {
      await messageService.markMessageAsRead(messageId);
    } catch (error) {
      fetchMessageData();
    }
  };

  const handleLogoClick = () => navigate('/dashboard', { replace: false });
  const handleNavigation = (path: string) => { navigate(path); setIsMenuOpen(false); setIsServiceOpen(false); setIsThemeOpen(false); };
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => { setTheme(newTheme); setIsThemeOpen(false); };

  const handleLogout = () => {
    logout();
    toast.success("Logout berhasil", { description: "Anda telah berhasil logout dari akun." });
    setIsMenuOpen(false);
    navigate('/', { replace: true });
  };

  const closeSidebar = () => { setIsMenuOpen(false); setIsServiceOpen(false); setIsThemeOpen(false); };
  const toggleSidebar = () => { if (isMenuOpen) closeSidebar(); else setIsMenuOpen(true); };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isMenuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        closeSidebar();
      }
    };
    const handleEscKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && isMenuOpen) closeSidebar(); };
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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="w-full max-w-none mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleLogoClick}>
              <img src="/lovable-uploads/aa532f4b-2138-497d-aa0f-ed3294e0c935.png" alt="Kedai SSH Logo" className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold gradient-move">Kedai SSH</h1>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <Button variant="ghost" size="icon" className="relative hover:bg-accent" onClick={() => setIsMessageModalOpen(true)}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">{unreadCount}</Badge>}
                </Button>
              )}
              <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={toggleSidebar}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div ref={sidebarRef} className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-40 z-50 transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} bg-white dark:bg-black text-black dark:text-white border-l border-border shadow-lg`} role="navigation" aria-label="Main navigation" aria-hidden={!isMenuOpen}>
        <div className="flex flex-col h-full py-6"><nav className="flex flex-col space-y-2 px-6">
          <div>
            <button onClick={() => setIsThemeOpen(!isThemeOpen)} className="flex items-center justify-between w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>Theme</span>
              {isThemeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isThemeOpen && (<div className="ml-4 mt-2 space-y-1 animate-fade-in">
              <button onClick={() => handleThemeChange('light')} className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">Light</button>
              <button onClick={() => handleThemeChange('dark')} className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">Dark</button>
              <button onClick={() => handleThemeChange('system')} className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">System</button>
            </div>)}
          </div>
          <div className="border-t border-border my-2"></div>
          <div>
            <button onClick={() => setIsServiceOpen(!isServiceOpen)} className="flex items-center justify-between w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>Service</span>
              {isServiceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isServiceOpen && (<div className="ml-4 mt-2 space-y-1 animate-fade-in">
              <button onClick={() => handleNavigation('/protokol/server-ssh')} className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">SSH</button>
              <button onClick={() => handleNavigation('/protokol/server-vmess')} className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">VMESS</button>
              <button onClick={() => handleNavigation('/protokol/server-vless')} className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">VLESS</button>
              <button onClick={() => handleNavigation('/protokol/server-trojan')} className="block w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">Trojan</button>
            </div>)}
              <button onClick={() => handleNavigation('/tutorials')} className="flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Tutorial</button>
              <button onClick={() => handleNavigation('/bug-injector')} className="flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Insert Bug</button>
              <button onClick={() => handleNavigation('/tembakPaket')} className="flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Dor-XL</button>
          </div>
          <div className="border-t border-border my-2"></div>
          {!isAuthenticated ? (<button onClick={() => handleNavigation('/register')} className="flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Register</button>) : (<>
            <button onClick={() => handleNavigation('/profile')} className="flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><User className="h-4 w-4 mr-2" />Profile</button>
            <button onClick={handleLogout} className="flex items-center px-4 py-3 text-left rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"><LogOut className="h-4 w-4 mr-2" />Logout</button>
          </>)}
        </nav></div>
      </div>
      {isMenuOpen && (<div className="fixed inset-0 z-30 bg-black/20" onClick={closeSidebar} />)}

      <MessageCenterModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        messages={messages}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
};
