import { useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Bell, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import { Badge } from '@/components/ui/badge';
import { messageService, UserMessage } from '@/services/messageService';
import MessageCenterModal from './MessageCenterModal';
import { motion, AnimatePresence } from 'framer-motion';

export const Header = () => {
  const navigate = useNavigate();
  const { isMenuOpen, setIsMenuOpen, setMenuHeight } = useSidebar();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  // State for old submenus
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // State for message feature
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // --- Data Fetching and Handlers ---
  const fetchMessageData = async () => { if (isAuthenticated) { try { const [count, userMessages] = await Promise.all([ messageService.getUnreadCount(), messageService.getUserMessages(), ]); setUnreadCount(count); setMessages(userMessages); } catch (error) { console.error("Failed to fetch message data:", error); } } };
  useEffect(() => { if (isAuthenticated) { fetchMessageData(); const intervalId = setInterval(fetchMessageData, 60000); return () => clearInterval(intervalId); } else { setMessages([]); setUnreadCount(0); } }, [isAuthenticated]);
  const handleMarkAsRead = async (messageId: number) => { const message = messages.find(m => m.id === messageId); if (message && !message.is_read) { setMessages(messages.map(m => m.id === messageId ? { ...m, is_read: 1 } : m)); setUnreadCount(prev => Math.max(0, prev - 1)); } try { await messageService.markMessageAsRead(messageId); } catch (error) { fetchMessageData(); } };

  const handleLogoClick = () => navigate('/dashboard', { replace: false });
  const handleNavigation = (path: string) => { navigate(path); setIsMenuOpen(false); };
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => { setTheme(newTheme); };
  const handleLogout = () => { logout(); toast.success("Logout berhasil"); setIsMenuOpen(false); navigate('/', { replace: true }); };
  const toggleMenu = () => {
    // Reset submenu states when main menu is closed
    if (isMenuOpen) {
        setIsServiceOpen(false);
        setIsThemeOpen(false);
    }
    setIsMenuOpen(prev => !prev);
  }

  useEffect(() => {
    if (isMenuOpen && menuRef.current) {
      setMenuHeight(menuRef.current.clientHeight);
    } else {
      setMenuHeight(0);
    }
    // This effect should re-run whenever the menu's content height might change
  }, [isMenuOpen, isServiceOpen, isThemeOpen, isAuthenticated]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="w-full max-w-none mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
              <img src="/lovable-uploads/aa532f4b-2138-497d-aa0f-ed3294e0c935.png" alt="Kedai SSH Logo" className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold gradient-move">Kedai SSH</h1>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <Button variant="ghost" size="icon" className="relative" onClick={() => setIsMessageModalOpen(true)}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs">{unreadCount}</Badge>}
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={toggleMenu}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 w-full bg-background border-b shadow-lg"
            >
              <nav className="flex flex-col p-4">
                {/* Re-implementing the old menu structure */}
                <div><button onClick={() => setIsThemeOpen(!isThemeOpen)} className="flex items-center justify-between w-full p-3 text-left rounded-lg hover:bg-muted"><span>Theme</span>{isThemeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                {isThemeOpen && (<div className="ml-4 mt-2 space-y-1 animate-fade-in"><button onClick={() => handleThemeChange('light')} className="block w-full p-2 text-left rounded-lg hover:bg-muted/50 text-sm">Light</button><button onClick={() => handleThemeChange('dark')} className="block w-full p-2 text-left rounded-lg hover:bg-muted/50 text-sm">Dark</button><button onClick={() => handleThemeChange('system')} className="block w-full p-2 text-left rounded-lg hover:bg-muted/50 text-sm">System</button></div>)}</div>
                <div className="border-t my-2"></div>
                <button onClick={() => handleNavigation('/dashboard')} className="flex items-center p-3 text-left rounded-lg hover:bg-muted">Dashboard</button>
                <button onClick={() => handleNavigation('/bug-injector')} className="flex items-center p-3 text-left rounded-lg hover:bg-muted"><Bug className="h-4 w-4 mr-2" />Bug Injector</button>
                <div className="border-t my-2"></div>
                <div><button onClick={() => setIsServiceOpen(!isServiceOpen)} className="flex items-center justify-between w-full p-3 text-left rounded-lg hover:bg-muted"><span>Service</span>{isServiceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                {isServiceOpen && (<div className="ml-4 mt-2 space-y-1 animate-fade-in"><button onClick={() => handleNavigation('/protokol/server-ssh')} className="block w-full p-2 text-left rounded-lg hover:bg-muted/50 text-sm">SSH</button><button onClick={() => handleNavigation('/protokol/server-vmess')} className="block w-full p-2 text-left rounded-lg hover:bg-muted/50 text-sm">VMESS</button><button onClick={() => handleNavigation('/protokol/server-vless')} className="block w-full p-2 text-left rounded-lg hover:bg-muted/50 text-sm">VLESS</button><button onClick={() => handleNavigation('/protokol/server-trojan')} className="block w-full p-2 text-left rounded-lg hover:bg-muted/50 text-sm">Trojan</button></div>)}</div>
                <div className="border-t my-2"></div>
                {!isAuthenticated ? (<><button onClick={() => handleNavigation('/login')} className="flex items-center p-3 text-left rounded-lg hover:bg-muted">Login</button><button onClick={() => handleNavigation('/register')} className="flex items-center p-3 text-left rounded-lg hover:bg-muted">Register</button></>) : (<>
                  <button onClick={() => handleNavigation('/profile')} className="flex items-center p-3 text-left rounded-lg hover:bg-muted"><User className="h-4 w-4 mr-2" />Profile</button>
                  <button onClick={handleLogout} className="flex items-center p-3 text-left rounded-lg text-red-500 hover:bg-red-500/10"><LogOut className="h-4 w-4 mr-2" />Logout</button>
                </>)}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MessageCenterModal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} messages={messages} onMarkAsRead={handleMarkAsRead} />
    </>
  );
};
