
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Wallet, RefreshCw } from 'lucide-react';
import { formatRupiah } from '@/constants/pricing';
import { toast } from 'sonner';

interface BalanceDisplayProps {
  refreshTrigger?: number; // To trigger balance refresh from parent
  onBalanceChange?: (balance: number) => void; // Callback when balance changes
}

export const BalanceDisplay = ({ refreshTrigger, onBalanceChange }: BalanceDisplayProps) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setBalance(result.balance);
        if (onBalanceChange) {
          onBalanceChange(result.balance);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      toast.error('Gagal memuat saldo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  // Refresh balance when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchBalance();
    }
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchBalance();
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saldo Anda</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {isLoading ? 'Loading...' : formatRupiah(balance)}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors"
          title="Refresh saldo"
        >
          <RefreshCw className={`h-4 w-4 text-green-600 dark:text-green-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {balance < 1000 && (
        <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded">
          <p className="text-xs text-orange-600 dark:text-orange-400">
            ⚠️ Saldo rendah. Pastikan saldo mencukupi untuk membuat akun VPN.
          </p>
        </div>
      )}
    </Card>
  );
};
