
import { useState } from 'react';
import { VPNProtocol } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Konfigurasi Akun {protocol.toUpperCase()}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Masukkan username (huruf dan angka saja)"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Hanya boleh menggunakan huruf dan angka, tanpa spasi
          </p>
        </div>

        {protocol === 'ssh' && (
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Masukkan password"
              required
            />
          </div>
        )}

        <div>
          <Label>Durasi Akun</Label>
          <Select
            value={formData.duration.toString()}
            onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
          >
            <SelectTrigger>
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

        {protocol !== 'ssh' && (
          <div>
            <Label>Quota Bandwidth</Label>
            <Select
              value={formData.quota.toString()}
              onValueChange={(value) => setFormData({ ...formData, quota: parseInt(value) })}
            >
              <SelectTrigger>
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

        <div>
          <Label>IP Limit</Label>
          <Select
            value={formData.ipLimit.toString()}
            onValueChange={(value) => setFormData({ ...formData, ipLimit: parseInt(value) })}
          >
            <SelectTrigger>
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

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || !formData.username}
        >
          {isLoading ? 'Membuat Akun...' : 'Buat Akun'}
        </Button>
      </form>
    </Card>
  );
};
