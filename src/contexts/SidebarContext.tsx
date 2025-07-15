
// Context untuk mengelola state sidebar di seluruh aplikasi
// Menyediakan state dan fungsi untuk membuka/menutup sidebar

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Interface untuk tipe data yang disediakan oleh SidebarContext
interface SidebarContextType {
  isMenuOpen: boolean; // Status apakah menu sidebar terbuka
  setIsMenuOpen: (open: boolean) => void; // Fungsi untuk mengatur status menu
  toggleMenu: () => void; // Fungsi untuk toggle (buka/tutup) menu
}

// Membuat context dengan nilai default undefined
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Interface untuk props SidebarProvider
interface SidebarProviderProps {
  children: ReactNode; // Komponen anak yang akan dibungkus provider
}

// Provider component yang menyediakan state sidebar ke seluruh aplikasi
export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  // State untuk mengelola status buka/tutup sidebar
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fungsi untuk toggle status menu (buka jika tutup, tutup jika buka)
  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  // Nilai yang akan disediakan ke semua komponen yang menggunakan context ini
  const value = {
    isMenuOpen,
    setIsMenuOpen,
    toggleMenu
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

// Custom hook untuk menggunakan SidebarContext
// Memberikan error yang jelas jika digunakan di luar SidebarProvider
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  
  // Validasi bahwa hook digunakan dalam SidebarProvider
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  
  return context;
};
