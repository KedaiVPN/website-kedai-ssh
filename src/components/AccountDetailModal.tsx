import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, Server, MapPin, Clock, Shield, Key, Link, RefreshCw, Trash2 } from 'lucide-react';
import { UserVPNAccount, RenewAccountRequest } from '@/types/vpn';
import { PROTOCOL_CONFIGS } from '@/constants/protocols';
import { toast } from 'sonner';
import { vpnService } from '@/services/vpnService';
import RenewAccountDialog from './RenewAccountDialog';
import DeleteAccountDialog from './DeleteAccountDialog';
import { BalanceDisplay } from './BalanceDisplay';

interface AccountDetailModalProps {
  account: UserVPNAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onAccountUpdated?: () => void;
}

const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  isOpen,
  onClose,
  onAccountUpdated
}) => {
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenewLoading, setIsRenewLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);

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

  const handleRenewAccount = async (renewData: RenewAccountRequest) => {
    setIsRenewLoading(true);
    try {
      const response = await vpnService.renewAccount(renewData);
      if (response.success) {
        toast.success(`Akun berhasil diperpanjang! Biaya: Rp${response.data?.cost?.toLocaleString('id-ID')}`);
        setIsRenewDialogOpen(false);
        setBalanceRefreshTrigger(prev => prev + 1); // Trigger balance refresh
        onAccountUpdated?.();
      } else {
        toast.error(response.message || 'Gagal memperpanjang akun');
      }
    } catch (error: any) {
      console.error('Error renewing account:', error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Terjadi kesalahan saat memperpanjang akun');
      }
    } finally {
      setIsRenewLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleteLoading(true);
    try {
      const response = await vpnService.deleteAccount(account.id);
      if (response.success) {
        const refundMsg = response.refund > 0 ? ` Refund: Rp${response.refund.toLocaleString('id-ID')}` : '';
        toast.success(`Akun berhasil dihapus!${refundMsg}`);
        setIsDeleteDialogOpen(false);
        setBalanceRefreshTrigger(prev => prev + 1); // Trigger balance refresh
        onClose(); // Close the detail modal
        onAccountUpdated?.();
      } else {
        toast.error(response.message || 'Gagal menghapus akun');
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Terjadi kesalahan saat menghapus akun');
      }
    } finally {
      setIsDeleteLoading(false);
    }
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
      config += `SSH WS Port: ${account.ssh_ws_port || '80'}\n`;
      config += `SSH SSL Port: ${account.ssh_ssl_port || '443'}\n`;
    }

    // Add V2Ray protocol details
    if (['vmess', 'vless', 'trojan'].includes(account.protocol)) {
      if (account.uuid) {
        config += `UUID: ${account.uuid}\n`;
      }
      if (account.ns_domain) {
        config += `NS Domain: ${account.ns_domain}\n`;
      }
      
      config += `\n=== URL KONFIGURASI ===\n`;
      
      if (account.protocol === 'vmess') {
        if (account.vmess_tls_link) config += `VMess TLS: ${account.vmess_tls_link}\n`;
        if (account.vmess_nontls_link) config += `VMess Non-TLS: ${account.vmess_nontls_link}\n`;
        if (account.vmess_grpc_link) config += `VMess GRPC: ${account.vmess_grpc_link}\n`;
      } else if (account.protocol === 'vless') {
        if (account.vless_tls_link) config += `VLess TLS: ${account.vless_tls_link}\n`;
        if (account.vless_nontls_link) config += `VLess Non-TLS: ${account.vless_nontls_link}\n`;
        if (account.vless_grpc_link) config += `VLess GRPC: ${account.vless_grpc_link}\n`;
      } else if (account.protocol === 'trojan') {
        if (account.trojan_tls_link) config += `Trojan TLS: ${account.trojan_tls_link}\n`;
        if (account.trojan_nontls_link1) config += `Trojan Non-TLS: ${account.trojan_nontls_link1}\n`;
        if (account.trojan_grpc_link) config += `Trojan GRPC: ${account.trojan_grpc_link}\n`;
      }
    }

    config += `\nDibuat: ${new Date(account.created_at).toLocaleString('id-ID')}\n`;
    
    return config;
  };

  const renderSSHDetails = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Key className="w-5 h-5" />
          Detail Akun SSH
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Username (dari server)</label>
            <div className="flex items-center justify-between mt-1">
              <span className="font-medium font-mono">{account.username}</span>
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
            <label className="text-sm font-medium text-muted-foreground">SSH WS Port</label>
            <div className="mt-1">
              <span className="font-medium">{account.ssh_ws_port || '80'}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">SSH SSL Port</label>
            <div className="mt-1">
              <span className="font-medium">{account.ssh_ssl_port || '443'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderV2RayDetails = () => (
    <div className="space-y-6">
      {/* Basic V2Ray Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5" />
            Detail Akun {account.protocol.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Username (dari server)</label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium font-mono">{account.username}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(account.username, 'Username')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {account.uuid && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">UUID</label>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium font-mono text-xs">{account.uuid}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(account.uuid!, 'UUID')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {account.ns_domain && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">NS Domain</label>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium">{account.ns_domain}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(account.ns_domain!, 'NS Domain')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration URLs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="w-5 h-5" />
            URL Konfigurasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* TLS URL */}
          {((account.protocol === 'vmess' && account.vmess_tls_link) ||
            (account.protocol === 'vless' && account.vless_tls_link) ||
            (account.protocol === 'trojan' && account.trojan_tls_link)) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">TLS URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                  {account.protocol === 'vmess' ? account.vmess_tls_link :
                   account.protocol === 'vless' ? account.vless_tls_link :
                   account.trojan_tls_link}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(
                    (account.protocol === 'vmess' ? account.vmess_tls_link :
                     account.protocol === 'vless' ? account.vless_tls_link :
                     account.trojan_tls_link) || '',
                    'TLS URL'
                  )}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Non-TLS URL */}
          {((account.protocol === 'vmess' && account.vmess_nontls_link) ||
            (account.protocol === 'vless' && account.vless_nontls_link) ||
            (account.protocol === 'trojan' && account.trojan_nontls_link1)) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Non-TLS URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                  {account.protocol === 'vmess' ? account.vmess_nontls_link :
                   account.protocol === 'vless' ? account.vless_nontls_link :
                   account.trojan_nontls_link1}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(
                    (account.protocol === 'vmess' ? account.vmess_nontls_link :
                     account.protocol === 'vless' ? account.vless_nontls_link :
                     account.trojan_nontls_link1) || '',
                    'Non-TLS URL'
                  )}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* GRPC URL */}
          {((account.protocol === 'vmess' && account.vmess_grpc_link) ||
            (account.protocol === 'vless' && account.vless_grpc_link) ||
            (account.protocol === 'trojan' && account.trojan_grpc_link)) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">GRPC URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                  {account.protocol === 'vmess' ? account.vmess_grpc_link :
                   account.protocol === 'vless' ? account.vless_grpc_link :
                   account.trojan_grpc_link}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(
                    (account.protocol === 'vmess' ? account.vmess_grpc_link :
                     account.protocol === 'vless' ? account.vless_grpc_link :
                     account.trojan_grpc_link) || '',
                    'GRPC URL'
                  )}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
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
            {/* Balance Display */}
            <BalanceDisplay refreshTrigger={balanceRefreshTrigger} />

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

            {/* Protocol-specific Details */}
            {account.protocol === 'ssh' && renderSSHDetails()}
            {['vmess', 'vless', 'trojan'].includes(account.protocol) && renderV2RayDetails()}

            {/* General Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Informasi Umum
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex gap-3 pt-4 flex-wrap">
              <Button onClick={downloadConfig} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Konfigurasi
              </Button>
              <Button 
                onClick={() => setIsRenewDialogOpen(true)} 
                variant="default"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                Perpanjang Akun
              </Button>
              <Button 
                onClick={() => setIsDeleteDialogOpen(true)} 
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Akun
              </Button>
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renew Account Dialog */}
      <RenewAccountDialog
        account={account}
        isOpen={isRenewDialogOpen}
        onClose={() => setIsRenewDialogOpen(false)}
        onConfirm={handleRenewAccount}
        isLoading={isRenewLoading}
      />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        account={account}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleteLoading}
      />
    </>
  );
};

export default AccountDetailModal;
