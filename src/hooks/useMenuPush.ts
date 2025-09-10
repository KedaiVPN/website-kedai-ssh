import { useSidebar } from '@/contexts/SidebarContext';

export const useMenuPush = () => {
  const { menuHeight } = useSidebar();

  const mainContentStyle = {
    paddingTop: `calc(4.5rem + ${menuHeight}px)`, // 4.5rem is h-18 (header height + a little buffer)
    transition: 'padding-top 0.3s ease-in-out',
  };

  return { mainContentStyle };
};
