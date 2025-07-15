
// Komponen untuk menampilkan informasi akun VPN yang berhasil dibuat
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, Download, Plus, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { VPNProtocol } from '@/types/vpn';
import { toast } from 'sonner';

interface AccountSuccessProps {
  // Data akun yang berhasil dibuat
  accountData: {
    username: string;
    password?: string;
    server: string;
    port: number;
    expiry: string;
    config?: string;
  };
  // Protocol VPN yang dipilih
  protocol: VPNProtocol;
  // Callback untuk membuat akun baru
  onCreateAnother: () => void;
}

export const AccountSuccess = ({ accountData, protocol, onCreateAnother }: AccountSuccessProps) => {
  // State untuk mengontrol visibilitas password
  const [showPassword, setShowPassword] = useState(false);

  // Fungsi untuk menyalin text ke clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  // Fungsi untuk mengunduh file konfigurasi
  const downloadConfig = () => {
    if (!accountData.config) {
      toast.error('Konfigurasi tidak tersedia');
      return;
    }

    // Membuat blob dari string konfigurasi
    const blob = new Blob([accountData.config], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    // Membuat elemen anchor untuk download
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${accountData.username}-${protocol}.txt`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('File konfigurasi berhasil diunduh!');
  };

  return (
    <div className="space-y-6 animate-bounce-in">
      {/* Header sukses */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
        </div>
        <h3 className="text-2xl font-bold text-green-600">
          🎉 Akun VPN Berhasil Dibuat!
        </h3>
        <p className="text-muted-foreground">
          Akun {protocol.toUpperCase()} Anda telah siap digunakan
        </p>
      </div>

      {/* Kartu informasi akun */}
      <Card className="p-4 sm:p-6 backdrop-blur-sm bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg">📋 Detail Akun</h4>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {protocol.toUpperCase()}
            </Badge>
          </div>

          {/* Grid informasi akun */}
          <div className="grid grid-cols-1 gap-4">
            {/* Username */}
            <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Username</span>
                <p className="font-medium">{accountData.username}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(accountData.username, 'Username')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Password (khusus SSH) */}
            {accountData.password && (
              <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground">Password</span>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {showPassword ? accountData.password : '••••••••'}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(accountData.password!, 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Server */}
            <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Server</span>
                <p className="font-medium">{accountData.server}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(accountData.server, 'Server')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Port */}
            <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Port</span>
                <p className="font-medium">{accountData.port}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(accountData.port.toString(), 'Port')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Tanggal expired */}
            <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Expired</span>
                <p className="font-medium">{accountData.expiry}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(accountData.expiry, 'Tanggal Expired')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Peringatan penting */}
      <Card className="p-4 bg-yellow-50/80 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
        <div className="space-y-2">
          <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">
            ⚠️ Penting untuk Diingat
          </h4>
          <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
            <li>• Simpan informasi akun ini dengan aman</li>
            <li>• Jangan membagikan kredensial kepada orang lain</li>
            <li>• Akun akan kedaluwarsa pada tanggal yang tercantum</li>
            <li>• Gunakan aplikasi VPN client yang sesuai</li>
          </ul>
        </div>
      </Card>

      {/* Tombol aksi */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Tombol download konfigurasi */}
        {accountData.config && (
          <Button 
            onClick={downloadConfig}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Config
          </Button>
        )}
        
        {/* Tombol buat akun baru */}
        <Button 
          onClick={onCreateAnother}
          variant="outline"
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Buat Akun Lain
        </Button>
      </div>
    </div>
  );
};
