
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Server, Clock, CheckCircle } from 'lucide-react';
import { DashboardStats as StatsType } from '@/types/vpn';

interface DashboardStatsProps {
  stats: StatsType;
  isLoading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading }) => {
  const statCards = [
    {
      title: 'Total Akun',
      value: stats.totalAccounts,
      icon: Shield,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30'
    },
    {
      title: 'Akun Aktif',
      value: stats.activeAccounts,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30'
    },
    {
      title: 'Kedaluwarsa',
      value: stats.expiredAccounts,
      icon: Clock,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30'
    },
    {
      title: 'Server Tersedia',
      value: stats.totalServers,
      icon: Server,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-8 rounded"></div>
              ) : (
                stat.value
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
