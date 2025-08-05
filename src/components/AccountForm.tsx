
import { useState, useEffect } from 'react';
import { VPNProtocol } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Shield, Calendar, Wifi, AlertTriangle } from 'lucide-react';
import { calculateQuotaFromIPLimit, getQuotaDisplayText } from '@/constants/quota';
import { calculateTotalCost, formatCurrency, getCostBreakdown } from '@/constants/pricing';
import { balanceService } from '@/services/balanceService';
import BalanceDisplay from './BalanceDisplay';

interface AccountFormProps {
  protocol: VPNProtocol;
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

// IP limit options with pricing information
const IP_LIMIT_OPTIONS = [
  { value: 1, label: '1 IP', description: 'Satu perangkat', price: 330 },
  { value: 2, label: '2 IP', description: 'Dua perangkat', price: 430 },
  { value: 4, label: '4 IP/STB', description: 'Empat perangkat / STB Open WRT', price: 600 }
];

export const AccountForm = ({ protocol, onSubmit, isLoading = false }: AccountFormProps) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    duration: 7, // Default 7 days
    ipLimit: 2   // Default 2 IP
  });

  const [userBalance, setUserBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Load user balance on component mount
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const balance = await balanceService.getUserBalance();
        setUserBalance(balance.balance);
      } catch (error) {
        console.error('Failed to load balance:', error);
      } finally {
        setBalanceLoading(false);
      }
    };

    loadBalance();
  }, []);

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
  const totalCost = calculateTotalCost(formData.ipLimit, formData.duration);
  const hasSufficientBalance = userBalance >= totalCost;

  return (
    <div className="space-y-4">
      {/* Balance Display */}
      <BalanceDisplay 
        balance={userBalance} 
        isLoading={balanceLoading}
      />

      <div className="text-center space-y-2">
        <p className="text-muted-foreground text-sm">
          Konfigurasikan akun VPN sesuai kebutuhan Anda
        </p>
        <p className="text-xs text-muted-foreground">
          💰 Sistem pembayaran otomatis berdasarkan IP limit dan durasi
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
            <SelectContent className="bg-background border shadow-lg z-50">
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
            <SelectContent className="bg-background border shadow-lg z-50">
              {IP_LIMIT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label} = {formatCurrency(option.price)}/hari</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Harga berbeda untuk setiap tier IP limit (bukan kelipatan)
          </p>
        </div>

        {/* Cost Calculation Display */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">💰 Kalkulasi Biaya</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Masa Aktif:</span>
              <span className="font-medium">{selectedDuration?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Batas IP:</span>
              <span className="font-medium">{selectedIpLimit?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kuota Bandwidth:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {getQuotaDisplayText(formData.ipLimit)}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya:</span>
                <span className="font-medium">{getCostBreakdown(formData.ipLimit, formData.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                  {formatCurrency(totalCost)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Warning */}
        {!balanceLoading && !hasSufficientBalance && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600 dark:text-red-400">
              <strong>Saldo tidak mencukupi!</strong><br />
              Dibutuhkan {formatCurrency(totalCost)}, saldo Anda {formatCurrency(userBalance)}.
              <br />Silakan top-up saldo terlebih dahulu.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105" 
          disabled={
            isLoading || 
            !formData.username || 
            (protocol === 'ssh' && !formData.password) ||
            !hasSufficientBalance ||
            balanceLoading
          }
        >
          {isLoading ? 'Membuat Akun...' : 
           balanceLoading ? 'Memuat...' :
           !hasSufficientBalance ? 'Saldo Tidak Cukup' :
           `Buat Akun VPN (${formatCurrency(totalCost)})`}
        </Button>
      </form>
    </div>
  );
};
