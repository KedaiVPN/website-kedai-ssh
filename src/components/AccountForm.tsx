
import { useState } from 'react';
import { VPNProtocol } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Shield } from 'lucide-react';

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
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username: formData.username,
      password: protocol === 'ssh' ? formData.password : undefined,
      duration: 7, // Fixed to 7 days
      quota: 100, // Fixed to 100 GB
      ipLimit: 2 // Fixed to 2 devices
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground text-sm">
          Akun akan dibuat dengan konfigurasi: 7 hari masa aktif, 100GB bandwidth, 2 device limit
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

        {/* Account Configuration Info */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">📋 Konfigurasi Akun</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Masa Aktif:</span>
              <span className="font-medium">7 Hari</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bandwidth:</span>
              <span className="font-medium">100 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP Limit:</span>
              <span className="font-medium">2 Device</span>
            </div>
          </div>
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
    </div>
  );
};
