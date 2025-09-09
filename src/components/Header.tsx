import { useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Bell, Bug, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import { Badge } from '@/components/ui/badge';
import { messageService, UserMessage } from '@/services/messageService';
import MessageCenterModal from './MessageCenterModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const Header = () => {
  const navigate = useNavigate();
  const { isMenuOpen, setIsMenuOpen, setMenuHeight } = useSidebar();
  const { user, logout, isAuthenticated } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // --- Data Fetching and Handlers from previous implementation ---
  const fetchMessageData = async () => { if (isAuthenticated) { try { const [count, userMessages] = await Promise.all([ messageService.getUnreadCount(), messageService.getUserMessages(), ]); setUnreadCount(count); setMessages(userMessages); } catch (error) { console.error("Failed to fetch message data:", error); } } };
  useEffect(() => { if (isAuthenticated) { fetchMessageData(); const intervalId = setInterval(fetchMessageData, 60000); return () => clearInterval(intervalId); } else { setMessages([]); setUnreadCount(0); } }, [isAuthenticated]);
  const handleMarkAsRead = async (messageId: number) => { const message = messages.find(m => m.id === messageId); if (message && !message.is_read) { setMessages(messages.map(m => m.id === messageId ? { ...m, is_read: 1 } : m)); setUnreadCount(prev => Math.max(0, prev - 1)); } try { await messageService.markMessageAsRead(messageId); } catch (error) { fetchMessageData(); } };
  const handleLogoClick = () => navigate('/dashboard', { replace: false });
  const handleNavigation = (path: string) => { navigate(path); setIsMenuOpen(false); };
  const handleLogout = () => { logout(); toast.success("Logout berhasil"); setIsMenuOpen(false); navigate('/', { replace: true }); };
  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  useEffect(() => {
    if (isMenuOpen && menuRef.current) {
      setMenuHeight(menuRef.current.clientHeight);
    } else {
      setMenuHeight(0);
    }
  }, [isMenuOpen, setMenuHeight]);

  // --- New Menu Links ---
  const menuLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/profile', label: 'Profil' },
    { path: '/topup', label: 'Top Up Saldo' },
    { path: '/bug-injector', label: 'Bug Injector' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="w-full max-w-none mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
              <img src="/lovable-uploads/aa532f4b-2138-497d-aa0f-ed3294e0c935.png" alt="Kedai SSH Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
              <h1 className="text-xl sm:text-2xl font-bold">Kedai SSH</h1>
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

        {/* New Animated Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full bg-background border-b shadow-md"
            >
              <nav className="flex flex-col p-4">
                {isAuthenticated ? (
                  <>
                    {menuLinks.map(link => (
                      <button key={link.path} onClick={() => handleNavigation(link.path)} className="flex justify-between items-center text-left p-3 rounded-lg hover:bg-muted">
                        <span>{link.label}</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ))}
                    <div className="border-t my-2"></div>
                    <button onClick={handleLogout} className="flex justify-between items-center text-left p-3 rounded-lg hover:bg-muted text-red-500">
                      <span>Keluar</span>
                      <LogOut className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleNavigation('/login')} className="flex justify-between items-center text-left p-3 rounded-lg hover:bg-muted">Login</button>
                    <button onClick={() => handleNavigation('/register')} className="flex justify-between items-center text-left p-3 rounded-lg hover:bg-muted">Register</button>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MessageCenterModal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} messages={messages} onMarkAsRead={handleMarkAsRead} />
    </>
  );
};
