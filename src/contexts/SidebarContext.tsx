import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  menuHeight: number;
  setMenuHeight: (height: number) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuHeight, setMenuHeight] = useState(0);

  return (
    <SidebarContext.Provider value={{ isMenuOpen, setIsMenuOpen, menuHeight, setMenuHeight }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};