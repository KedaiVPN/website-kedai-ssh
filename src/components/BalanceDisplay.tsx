
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/constants/pricing';

interface BalanceDisplayProps {
  balance: number;
  isLoading: boolean;
  className?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  balance,
  isLoading,
  className = ''
}) => {
  const getBalanceColor = (amount: number) => {
    if (amount >= 50000) return 'text-green-600 dark:text-green-400';
    if (amount >= 10000) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBalanceIcon = (amount: number) => {
    if (amount >= 10000) return <TrendingUp className="w-5 h-5" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Saldo Anda
        </CardTitle>
        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
          <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
          ) : (
            <>
              <div className={`text-2xl font-bold ${getBalanceColor(balance)}`}>
                {formatCurrency(balance)}
              </div>
              {getBalanceIcon(balance)}
            </>
          )}
        </div>
        
        {!isLoading && (
          <div className="mt-2">
            <Badge 
              variant={balance >= 10000 ? 'default' : 'secondary'}
              className={`text-xs ${
                balance >= 50000 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : balance >= 10000 
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {balance >= 50000 ? 'Saldo Sehat' : balance >= 10000 ? 'Saldo Cukup' : 'Saldo Rendah'}
            </Badge>
          </div>
        )}
        
        {!isLoading && balance < 10000 && (
          <p className="text-xs text-muted-foreground mt-2">
            💡 Top-up saldo untuk membuat akun VPN
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceDisplay;
