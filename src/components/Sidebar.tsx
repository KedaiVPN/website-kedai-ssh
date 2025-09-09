import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Bug, User, Settings, MessageSquare } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


const navLinks = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/bug-injector", icon: Bug, label: "Bug Injector" },
    { to: "/messages", icon: MessageSquare, label: "Pesan" },
    { to: "/profile", icon: User, label: "Profil" },
];

const Sidebar = () => {
    const { isCollapsed } = useSidebar();

    return (
        <aside className={cn(
            "h-screen sticky top-0 left-0 flex flex-col bg-card border-r transition-all duration-300 ease-in-out",
            isCollapsed ? "w-20" : "w-64"
        )}>
            <div className="flex items-center justify-center h-20 border-b">
                {/* Placeholder for Logo */}
                <div className="w-10 h-10 bg-primary rounded-full" />
            </div>
            <nav className="flex-grow px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                    <Tooltip key={link.to}>
                        <TooltipTrigger asChild>
                            <NavLink
                                to={link.to}
                                className={({ isActive }) => cn(
                                    "flex items-center p-3 rounded-lg transition-colors",
                                    "hover:bg-muted hover:text-primary",
                                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                                    isCollapsed ? "justify-center" : ""
                                )}
                            >
                                <link.icon className="h-5 w-5" />
                                <span className={cn(
                                    "ml-4 transition-opacity",
                                    isCollapsed ? "opacity-0 w-0" : "opacity-100"
                                )}>
                                    {link.label}
                                </span>
                            </NavLink>
                        </TooltipTrigger>
                        {isCollapsed && (
                            <TooltipContent side="right">
                                <p>{link.label}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                ))}
            </nav>
            <div className="p-4 border-t">
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <NavLink
                            to="/settings" // Assuming a settings page
                            className={({ isActive }) => cn(
                                "flex items-center p-3 rounded-lg transition-colors",
                                "hover:bg-muted hover:text-primary",
                                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                                isCollapsed ? "justify-center" : ""
                            )}
                        >
                            <Settings className="h-5 w-5" />
                             <span className={cn(
                                "ml-4 transition-opacity",
                                isCollapsed ? "opacity-0 w-0" : "opacity-100"
                            )}>
                                Pengaturan
                            </span>
                        </NavLink>
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right">
                            <p>Pengaturan</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </div>
        </aside>
    );
};

export default Sidebar;
