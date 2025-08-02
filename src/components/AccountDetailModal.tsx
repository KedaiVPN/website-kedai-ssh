
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, Server, MapPin, Clock, Shield, Key } from 'lucide-react';
import { UserVPNAccount } from '@/types/vpn';
import { PROTOCOL_CONFIGS } from '@/constants/protocols';
import { toast } from 'sonner';

interface AccountDetailModalProps {
  account: UserVPNAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  isOpen,
  onClose
}) => {
  if (!account) return null;

  const protocolConfig = PROTOCOL_CONFIGS[account.protocol as keyof typeof PROTOCOL_CONFIGS];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  const downloadConfig = () => {
    const configText = generateConfigText();
    const blob = new Blob([configText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${account.username}-${account.protocol}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Konfigurasi berhasil diunduh!');
  };

  const generateConfigText = () => {
    let config = `=== AKUN VPN ${account.protocol.toUpperCase()} ===\n`;
    config += `Username: ${account.username}\n`;
    config += `Server: ${account.server_name}\n`;
    config += `Domain: ${account.server_domain}\n`;
    config += `Lokasi: ${account.server_location}\n`;
    config += `Protokol: ${account.protocol}\n`;
    config += `Kedaluwarsa: ${account.expired_date}\n`;
    config += `Status: ${account.status === 'active' ? 'Aktif' : 'Kedaluwarsa'}\n`;
    config += `IP Limit: ${account.ip_limit}\n`;
    config += `Quota: ${account.quota} GB\n\n`;

    if (account.protocol === 'ssh' && account.password) {
      config += `Password: ${account.password}\n`;
      config += `SSH WS Port: 80\n`;
      config += `SSH SSL Port: 443\n`;
    }

    config += `\nDibuat: ${new Date(account.created_at).toLocaleString('id-ID')}\n`;
    
    return config;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${protocolConfig.bgColor}`}>
              <protocolConfig.icon className={`w-5 h-5 ${protocolConfig.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>Detail Akun: {account.username}</span>
                <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                  {account.status === 'active' ? 'Aktif' : 'Kedaluwarsa'}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Server Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="w-5 h-5" />
                Informasi Server
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nama Server</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium">{account.server_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(account.server_name, 'Nama server')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Domain</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium">{account.server_domain}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(account.server_domain, 'Domain')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lokasi</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{account.server_location}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Protokol</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={`${protocolConfig.color} ${protocolConfig.borderColor}`}>
                      {protocolConfig.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Detail Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium">{account.username}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(account.username, 'Username')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {account.password && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-medium font-mono">{account.password}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(account.password!, 'Password')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Limit</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span>{account.ip_limit} perangkat</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quota</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span>{account.quota} GB</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Kedaluwarsa</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{account.expired_date}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dibuat</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span>{new Date(account.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={downloadConfig} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Konfigurasi
            </Button>
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDetailModal;
