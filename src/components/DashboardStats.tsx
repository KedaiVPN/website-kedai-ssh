
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Server, Clock, CheckCircle } from 'lucide-react';
import { DashboardStats as StatsType } from '@/types/vpn';
import BalanceDisplay from './BalanceDisplay';

interface DashboardStatsProps {
  stats: StatsType;
  isLoading: boolean;
  userBalance?: number;
  balanceLoading?: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  isLoading, 
  userBalance = 0, 
  balanceLoading = false 
}) => {
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
    <div className="space-y-4">
      {/* Balance Display Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <BalanceDisplay 
            balance={userBalance} 
            isLoading={balanceLoading}
          />
        </div>
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            {statCards.slice(0, 2).map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                    <stat.icon className={`w-3 h-3 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">
                    {isLoading ? (
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-6 rounded"></div>
                    ) : (
                      stat.value
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Rest of Stats */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.slice(2).map((stat, index) => (
          <Card key={index + 2} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-6 rounded"></div>
                ) : (
                  stat.value
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;
