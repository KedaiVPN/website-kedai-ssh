import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { messageService, UserMessage } from '@/services/messageService';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BannerDisplay: React.FC = () => {
  // Log ini harus muncul jika komponen dirender sama sekali.
  console.log('BANNER DISPLAY COMPONENT RENDERED');

  const [banners, setBanners] = useState<UserMessage[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<number[]>([]);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log(`BANNER EFFECT TRIGGERED - IsAuthenticated: ${isAuthenticated}`);

    if (isAuthenticated) {
      const fetchBanners = async () => {
        console.log(`BANNER: Fetching for path: ${location.pathname}`);
        try {
          const bannerMessages = await messageService.getUserMessages(location.pathname);
          console.log('BANNER: Fetched messages:', bannerMessages);
          setBanners(bannerMessages);
          setDismissedBanners([]); // Hapus spanduk yang ditutup sebelumnya saat memuat yang baru
        } catch (error) {
          console.error('BANNER: Failed to fetch banners:', error);
        }
      };
      fetchBanners();
    } else {
      // Jika pengguna tidak diautentikasi (misalnya, logout), hapus spanduk apa pun
      console.log('BANNER: User not authenticated, clearing banners.');
      setBanners([]);
    }
  }, [isAuthenticated, location.pathname]); // Hanya bergantung pada status login dan path

  const handleDismiss = (id: number) => {
    setDismissedBanners(prev => [...prev, id]);
  };

  const activeBanners = banners.filter(banner => !dismissedBanners.includes(banner.id));
  const isVisible = activeBanners.length > 0;

  if (!isVisible) {
    return null;
  }


  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md p-4">
        {activeBanners.map((banner) => (
          <Card
            key={banner.id}
            className="mb-4 border-blue-500 bg-white dark:bg-slate-900 shadow-xl transition-transform duration-300 ease-in-out transform scale-95 data-[state=open]:scale-100"
            data-state={isVisible ? 'open' : 'closed'}
          >
            <CardContent className="p-6 relative">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{banner.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap">{banner.content}</p>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(banner.id)}
                className="absolute top-3 right-3 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex justify-start mt-4">
                <button
                  onClick={() => handleDismiss(banner.id)}
                  className="text-xs px-3 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  Close
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BannerDisplay;
