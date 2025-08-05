
import { useState } from 'react';
import { VPNProtocol } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Shield, Calendar, Wifi } from 'lucide-react';
import { calculateQuotaFromIPLimit, getQuotaDisplayText } from '@/constants/quota';

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

// IP limit options with auto-calculated quota
const IP_LIMIT_OPTIONS = [
  { value: 1, label: '1 IP', description: 'Satu perangkat', quota: '200GB' },
  { value: 2, label: '2 IP', description: 'Dua perangkat', quota: '400GB' },
  { value: 4, label: '4 IP/STB', description: 'Empat perangkat / STB Open WRT', quota: '600GB' }
];

export const AccountForm = ({ protocol, onSubmit, isLoading = false }: AccountFormProps) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    duration: 7, // Default 7 days
    ipLimit: 2   // Default 2 IP
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedQuota = calculateQuotaFromIPLimit(formData.ipLimit);
    
    onSubmit({
      username: formData.username,
      password: protocol === 'ssh' ? formData.password : undefined,
      duration: formData.duration,
      quota: calculatedQuota, // Use calculated quota instead of hardcoded
      ipLimit: formData.ipLimit
    });
  };

  const selectedDuration = DURATION_OPTIONS.find(opt => opt.value === formData.duration);
  const selectedIpLimit = IP_LIMIT_OPTIONS.find(opt => opt.value === formData.ipLimit);
  const calculatedQuota = calculateQuotaFromIPLimit(formData.ipLimit);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground text-sm">
          Konfigurasikan akun VPN sesuai kebutuhan Anda
        </p>
        <p className="text-xs text-muted-foreground">
          💡 Kuota akan otomatis disesuaikan dengan jumlah IP yang dipilih
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

        {/* IP Limit Selection with Auto Quota */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Wifi className="h-4 w-4" />
            <span>Batas IP & Kuota</span>
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
                    <span className="font-medium">{option.label} = {option.quota}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Kuota bandwidth akan disesuaikan otomatis dengan jumlah IP
          </p>
        </div>

        {/* Account Configuration Info with Auto Quota */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">📋 Konfigurasi Akun</h4>
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
              <span className="font-medium text-green-600 dark:text-green-400">
                {getQuotaDisplayText(formData.ipLimit)} ✨
              </span>
            </div>
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 Kuota otomatis: 1 IP = 200GB, 2 IP = 400GB, 4 IP = 600GB
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105" 
          disabled={isLoading || !formData.username || (protocol === 'ssh' && !formData.password)}
        >
          {isLoading ? 'Membuat Akun...' : `Buat Akun VPN (${getQuotaDisplayText(formData.ipLimit)})`}
        </Button>
      </form>
    </div>
  );
};
