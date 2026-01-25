import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Server, Wallet, CheckCircle } from 'lucide-react';
import { DashboardStats as StatsType } from '@/types/vpn';
import { formatRupiah } from '@/constants/pricing';

interface DashboardStatsProps {
  stats: StatsType;
  isLoading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading }) => {
  const statCards = [
    {
      title: 'Saldo',
      value: formatRupiah(stats.balance),
      icon: Wallet,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      isBalance: true
    },
    {
      title: 'Akun Aktif',
      value: stats.activeAccounts,
      icon: CheckCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
      borderClass: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: 'Total Akun',
      value: stats.totalAccounts,
      icon: Shield,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30 shadow-[0_0_15px_rgba(147,51,234,0.3)]',
      borderClass: 'border-purple-200 dark:border-purple-800'
    },
    {
      title: 'Server Tersedia',
      value: stats.totalServers,
      icon: Server,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
      borderClass: 'border-amber-200 dark:border-amber-800'
    }
  ];

  // Common Bento/Glass style
  const cardClass =
    'group relative overflow-hidden backdrop-blur-md bg-white/60 dark:bg-black/40 border hover:bg-white/80 dark:hover:bg-black/60 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl flex flex-col justify-between';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statCards.map((stat, index) => (
        <Card
          key={index}
          className={`${cardClass} ${stat.borderClass} ${stat.isBalance ? 'border-l-4 border-l-emerald-500' : 'border-white/20 dark:border-white/10'}`}
        >
          {/* Decorative glow background */}
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl ${stat.bgColor.split(' ')[0].replace('bg-', 'bg-')}`}></div>

          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              {/* Optional: Add a small trend indicator or secondary icon here if needed */}
            </div>

            <div>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                 {stat.title}
               </p>
               <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${stat.isBalance ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                 {isLoading ? (
                   <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 w-24 rounded-md"></div>
                 ) : (
                   stat.value
                 )}
               </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
