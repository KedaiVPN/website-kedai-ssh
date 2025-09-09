import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { messageService, UserMessage } from '@/services/messageService';
import MessageCenterModal from './MessageCenterModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export const Header = () => {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { user, logout, isAuthenticated } = useAuth();
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

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          {/* Left side: Menu toggle for the new sidebar */}
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          
          {/* Right side: Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                <Button variant="ghost" size="icon" className="relative" onClick={() => setIsMessageModalOpen(true)}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username}`} alt={user?.username} />
                        <AvatarFallback>{user?.username?.[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
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
