import { useNavigate } from 'react-router-dom';
import {
  Menu, User, LogOut, Bell, Sun, Moon, Laptop, Palette, ShieldCheck,
  Server, Smartphone, Wifi, Code, Gamepad2, BookOpen, UserPlus, Fingerprint, LogIn, Package
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import { Badge } from '@/components/ui/badge';
import { messageService, UserMessage } from '@/services/messageService';
import MessageCenterModal from './MessageCenterModal';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { setTheme } = useTheme();
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logout berhasil", { description: "Anda telah berhasil logout dari akun." });
    setIsSidebarOpen(false);
    navigate('/', { replace: true });
  };

  const menuItems = [
    { path: '/tembakPaket', label: 'Tembak Paket', icon: Smartphone },
    { path: '/pulsa-dan-paket-data', label: 'Pulsa & Paket Data (all providers)', icon: Wifi },
    { path: '/topupgame', label: 'Topup Games', icon: Gamepad2 },
    { path: '/produk-lainnya', label: 'Produk Lainnya', icon: Package },
    { path: '/bug-injector', label: 'Insert Bugs', icon: Code },
  ];

  const NavLink = ({ path, children, icon: Icon, className = '' }: { path: string, children: React.ReactNode, icon: React.ElementType, className?: string }) => (
    <Button
      variant="ghost"
      className={cn("w-full justify-start gap-3 px-3 text-foreground", className)}
      onClick={() => handleNavigation(path)}
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span>{children}</span>
    </Button>
  );

  const ThemeButton = ({ theme, label, icon: Icon }: { theme: 'light' | 'dark' | 'system', label: string, icon: React.ElementType }) => (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 px-3 text-foreground"
      onClick={() => handleThemeChange(theme)}
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span>{label}</span>
    </Button>
  );

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
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-accent">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0 border-none shadow-2xl bg-white/80 dark:bg-black/80 backdrop-blur-md flex flex-col">
                  <SheetHeader className="p-4 border-b text-center">
                    <div className="flex flex-col items-center gap-2">
                      <img src="/lovable-uploads/aa532f4b-2138-497d-aa0f-ed3294e0c935.png" alt="Kedai SSH Logo" className="h-10 w-10 animate-pulse" />
                      <span className="font-semibold text-md text-foreground gradient-move">KEDAI SSH</span>
                    </div>
                  </SheetHeader>
                  {isAuthenticated && user && (
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.email}`} alt={user.username} />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-foreground">{user.username}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <nav className="flex-1 p-2 overflow-y-auto">
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="theme">
                        <AccordionTrigger className="px-3 text-base text-foreground hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Palette className="h-5 w-5 text-muted-foreground" />
                              <span>Theme</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pl-4 space-y-1">
                            <ThemeButton theme="light" label="Light" icon={Sun} />
                            <ThemeButton theme="dark" label="Dark" icon={Moon} />
                            <ThemeButton theme="system" label="System" icon={Laptop} />
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="services">
                          <AccordionTrigger className="px-3 text-base text-foreground hover:no-underline">
                             <div className="flex items-center gap-3">
                              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                              <span>VPN Service</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pl-4 space-y-1">
                            <NavLink path="/protokol/server-ssh" icon={Server}>SSH</NavLink>
                            <NavLink path="/protokol/server-vmess" icon={Server}>VMESS</NavLink>
                            <NavLink path="/protokol/server-vless" icon={Server}>VLESS</NavLink>
                            <NavLink path="/protokol/server-trojan" icon={Server}>Trojan</NavLink>
                            <NavLink path="/protokol/server-zivpn" icon={Fingerprint}>ZiVPN</NavLink>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      <Separator className="my-2" />
                      <div className="space-y-1">
                        {menuItems.map(item => <NavLink key={item.path} path={item.path} icon={item.icon}>{item.label}</NavLink>)}
                      </div>
                    </nav>
                    <div className="p-2 border-t mt-auto">
                      {isAuthenticated ? (
                        <div className="flex items-center justify-around">
                          <Button variant="ghost" className="flex-1 justify-center gap-2 px-2 text-foreground" onClick={() => handleNavigation('/tutorials')}>
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                            <span>Tutorial</span>
                          </Button>
                          <Separator orientation="vertical" className="h-6" />
                          <Button variant="ghost" className="flex-1 justify-center gap-2 px-2 text-foreground" onClick={() => handleNavigation('/profile')}>
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span>Profile</span>
                          </Button>
                          <Separator orientation="vertical" className="h-6" />
                          <Button variant="ghost" className="flex-1 justify-center gap-2 px-2 text-red-500 hover:text-red-600" onClick={handleLogout}>
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-around">
                           <Button variant="ghost" className="flex-1 justify-center gap-2 px-2 text-foreground" onClick={() => handleNavigation('/tutorials')}>
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                            <span>Blog</span>
                          </Button>
                          <Separator orientation="vertical" className="h-6" />
                           <Button variant="ghost" className="flex-1 justify-center gap-2 px-2 text-foreground" onClick={() => handleNavigation('/register')}>
                            <UserPlus className="h-5 w-5 text-muted-foreground" />
                            <span>Register</span>
                          </Button>
                          <Separator orientation="vertical" className="h-6" />
                           <Button variant="ghost" className="flex-1 justify-center gap-2 px-2 text-foreground" onClick={() => handleNavigation('/login')}>
                            <LogIn className="h-5 w-5 text-muted-foreground" />
                            <span>Login</span>
                          </Button>
                        </div>
                      )}
                    </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <MessageCenterModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        messages={messages}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
};
