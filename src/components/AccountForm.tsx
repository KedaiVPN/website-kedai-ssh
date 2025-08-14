import { useState, useEffect } from 'react';
import { VPNProtocol } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Shield, Calendar, Wifi, DollarSign, Crown } from 'lucide-react';
import { calculateQuotaFromIPLimit, getQuotaDisplayText } from '@/constants/quota';
import { calculateTotalCost, getDailyPrice, formatRupiah, getPricingBreakdown } from '@/constants/pricing';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { balanceService } from '@/services/balanceService';

interface AccountFormProps {
  protocol: VPNProtocol;
  serverId: string;
  onSubmit: (formData: {
    username: string;
    password?: string;
    duration: number;
    quota?: number;
    ipLimit: number;
  }) => void;
  isLoading?: boolean;
}

// Duration options in days
const DURATION_OPTIONS = [
  { value: 1, label: '1 Hari' },
  { value: 3, label: '3 Hari' },
  { value: 7, label: '7 Hari' },
  { value: 15, label: '15 Hari' },
  { value: 30, label: '30 Hari' }
];

// IP limit options with pricing info
const IP_LIMIT_OPTIONS = [
  { value: 1, label: '1 IP', description: 'Satu perangkat', quota: '200GB' },
  { value: 2, label: '2 IP', description: 'Dua perangkat', quota: '400GB' },
  { value: 4, label: '4 IP/STB', description: 'Empat perangkat / STB Open WRT', quota: '600GB' }
];

export const AccountForm = ({ protocol, serverId, onSubmit, isLoading = false }: AccountFormProps) => {
  const { user } = useAuth();
  const userRole = user?.role || 'member';
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    duration: 7, // Default 7 days
    ipLimit: 2   // Default 2 IP
  });
  
  const [userBalance, setUserBalance] = useState<number>(0);
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedQuota = calculateQuotaFromIPLimit(formData.ipLimit);
    
    onSubmit({
      username: formData.username,
      password: protocol === 'ssh' ? formData.password : undefined,
      duration: formData.duration,
      quota: calculatedQuota,
      ipLimit: formData.ipLimit
    });
  };

  const selectedDuration = DURATION_OPTIONS.find(opt => opt.value === formData.duration);
  const selectedIpLimit = IP_LIMIT_OPTIONS.find(opt => opt.value === formData.ipLimit);
  const calculatedQuota = calculateQuotaFromIPLimit(formData.ipLimit);
  
  // Pricing state (server-aware)
  const [dailyPrice, setDailyPrice] = useState<number>(getDailyPrice(formData.ipLimit, userRole));
  const [totalCost, setTotalCost] = useState<number>(calculateTotalCost(formData.ipLimit, formData.duration, userRole));
  const [breakdownText, setBreakdownText] = useState<string>(
    `${formatRupiah(getDailyPrice(formData.ipLimit, userRole))} × ${formData.duration} hari = ${formatRupiah(calculateTotalCost(formData.ipLimit, formData.duration, userRole))}${userRole === 'reseller' ? ' (Diskon Reseller 50%)' : ''}`
  );
  
  useEffect(() => {
    let cancelled = false;
    const fetchCost = async () => {
      try {
        const resp = await balanceService.calculateCost(formData.ipLimit, formData.duration, serverId);
        if (!cancelled && resp.success && resp.data) {
          setDailyPrice(resp.data.dailyPrice);
          setTotalCost(resp.data.totalCost);
          setBreakdownText(resp.data.breakdown);
          return;
        }
      } catch (e) {
        // Fallback to client pricing on error
      }
      if (!cancelled) {
        const fallbackDaily = getDailyPrice(formData.ipLimit, userRole);
        const fallbackTotal = calculateTotalCost(formData.ipLimit, formData.duration, userRole);
        setDailyPrice(fallbackDaily);
        setTotalCost(fallbackTotal);
        setBreakdownText(`${formatRupiah(fallbackDaily)} × ${formData.duration} hari = ${formatRupiah(fallbackTotal)}${userRole === 'reseller' ? ' (Diskon Reseller 50%)' : ''}`);
      }
    };
    fetchCost();
    return () => { cancelled = true; };
  }, [formData.ipLimit, formData.duration, serverId, userRole]);
  
  // Check if user has sufficient balance
  const hasSufficientBalance = userBalance >= totalCost;
  const shortage = Math.max(0, totalCost - userBalance);

  const handleBalanceChange = (balance: number) => {
    setUserBalance(balance);
  };

  return (
    <div className="space-y-4">
      {/* Balance Display */}
      <BalanceDisplay 
        refreshTrigger={balanceRefreshTrigger}
        onBalanceChange={handleBalanceChange}
      />

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {userRole === 'reseller' && (
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full border border-yellow-300 dark:border-yellow-700">
              <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">RESELLER</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Konfigurasikan akun VPN sesuai kebutuhan Anda
        </p>
        <p className="text-xs text-muted-foreground">
          {userRole === 'reseller' ? 
            '👑 Anda mendapat diskon 50% sebagai Reseller!' : 
            '💰 Sistem pembayaran berdasarkan saldo dengan harga tetap per IP'
          }
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username Field */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Username</span>
          </Label>
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Masukkan username (huruf dan angka saja)"
            className="h-12 text-base"
            required
          />
          <p className="text-xs text-muted-foreground">
            Hanya boleh menggunakan huruf dan angka, tanpa spasi
          </p>
        </div>

        {/* Password Field (SSH only) */}
        {protocol === 'ssh' && (
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Password</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Masukkan password"
              className="h-12 text-base"
              required
            />
          </div>
        )}

        {/* Duration Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Durasi Akun</span>
          </Label>
          <Select 
            value={formData.duration.toString()} 
            onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Pilih durasi akun" />
            </SelectTrigger>
            <SelectContent className="bg-black text-white border-neutral-800 z-50">
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Masa aktif akun VPN yang akan dibuat
          </p>
        </div>

        {/* IP Limit Selection with Pricing */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Wifi className="h-4 w-4" />
            <span>Batas IP & Harga</span>
          </Label>
          <Select 
            value={formData.ipLimit.toString()} 
            onValueChange={(value) => setFormData({ ...formData, ipLimit: parseInt(value) })}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Pilih batas IP" />
            </SelectTrigger>
            <SelectContent className="bg-black text-white border-neutral-800 z-50">
              {IP_LIMIT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {option.label} = {formatRupiah(getDailyPrice(option.value, userRole))}/hari
                      {userRole === 'reseller' && <span className="text-yellow-600 ml-1">(-50%)</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.description} | {option.quota}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {userRole === 'reseller' ? 
              'Harga khusus Reseller dengan diskon 50%' : 
              'Harga tetap per IP limit, tidak tergantung durasi'
            }
          </p>
        </div>

        {/* Pricing Calculation Display */}
        <div className={`p-4 bg-gradient-to-r ${
          userRole === 'reseller' 
            ? 'from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800' 
            : 'from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800'
        } border rounded-lg`}>
          <h4 className="font-semibold mb-3 text-sm flex items-center space-x-2">
            {userRole === 'reseller' ? <Crown className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
            <span>{userRole === 'reseller' ? '👑 Rincian Biaya Reseller' : '💰 Rincian Biaya'}</span>
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga per hari:</span>
              <span className="font-medium">{formatRupiah(dailyPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durasi:</span>
              <span className="font-medium">{selectedDuration?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kuota Bandwidth:</span>
              <span className="font-medium">{getQuotaDisplayText(formData.ipLimit)}</span>
            </div>
            {userRole === 'reseller' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diskon Reseller:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">50%</span>
              </div>
            )}
            <hr className={`${
              userRole === 'reseller' 
                ? 'border-yellow-200 dark:border-yellow-800' 
                : 'border-blue-200 dark:border-blue-800'
            }`} />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total Biaya:</span>
              <span className={`font-bold ${
                userRole === 'reseller' 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {formatRupiah(totalCost)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {breakdownText}
            </div>
          </div>
        </div>

        {/* Balance Validation */}
        {!hasSufficientBalance && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              ❌ Saldo Tidak Mencukupi
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Anda membutuhkan tambahan {formatRupiah(shortage)} untuk membuat akun ini.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          className={`w-full h-12 text-base ${
            userRole === 'reseller' 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          } transition-all duration-300 hover:scale-105`}
          disabled={
            isLoading || 
            !formData.username || 
            (protocol === 'ssh' && !formData.password) ||
            !hasSufficientBalance
          }
        >
          {isLoading ? 'Membuat Akun...' : 
           !hasSufficientBalance ? 'Saldo Tidak Mencukupi' :
           `Buat Akun VPN (${formatRupiah(totalCost)})`}
        </Button>
      </form>
    </div>
  );
};
