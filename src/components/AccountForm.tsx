
import { useState } from 'react';
import { VPNProtocol } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Clock, Database, Users, Shield } from 'lucide-react';

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

export const AccountForm = ({ protocol, onSubmit, isLoading = false }: AccountFormProps) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    duration: 30,
    quota: 0,
    ipLimit: 2
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username: formData.username,
      password: protocol === 'ssh' ? formData.password : undefined,
      duration: formData.duration,
      quota: formData.quota > 0 ? formData.quota : undefined,
      ipLimit: formData.ipLimit
    });
  };

  const durations = [
    { value: 1, label: '1 Hari' },
    { value: 3, label: '3 Hari' },
    { value: 7, label: '7 Hari' },
    { value: 30, label: '30 Hari' },
    { value: 60, label: '60 Hari' },
    { value: 90, label: '90 Hari' }
  ];

  const quotaOptions = [
    { value: 0, label: 'Unlimited' },
    { value: 1, label: '1 GB' },
    { value: 5, label: '5 GB' },
    { value: 10, label: '10 GB' },
    { value: 50, label: '50 GB' },
    { value: 100, label: '100 GB' }
  ];

  const ipLimits = [
    { value: 1, label: '1 Device' },
    { value: 2, label: '2 Devices' },
    { value: 3, label: '3 Devices' },
    { value: 5, label: '5 Devices' },
    { value: 10, label: '10 Devices' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Konfigurasi Akun {protocol.toUpperCase()}
        </h3>
        <p className="text-muted-foreground text-sm">
          Atur detail akun VPN sesuai kebutuhan Anda
        </p>
      </div>
      
      <Card className="p-4 sm:p-6 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
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

          {/* Duration Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Durasi Akun</span>
            </Label>
            <Select
              value={formData.duration.toString()}
              onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value.toString()}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quota Field (Non-SSH protocols) */}
          {protocol !== 'ssh' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Quota Bandwidth</span>
              </Label>
              <Select
                value={formData.quota.toString()}
                onValueChange={(value) => setFormData({ ...formData, quota: parseInt(value) })}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quotaOptions.map((quota) => (
                    <SelectItem key={quota.value} value={quota.value.toString()}>
                      {quota.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* IP Limit Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>IP Limit</span>
            </Label>
            <Select
              value={formData.ipLimit.toString()}
              onValueChange={(value) => setFormData({ ...formData, ipLimit: parseInt(value) })}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ipLimits.map((limit) => (
                  <SelectItem key={limit.value} value={limit.value.toString()}>
                    {limit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105" 
            disabled={isLoading || !formData.username}
          >
            {isLoading ? 'Membuat Akun...' : 'Buat Akun VPN'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
