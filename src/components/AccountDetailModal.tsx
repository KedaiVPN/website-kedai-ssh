import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, Server, MapPin, Clock, Shield, Key, Link, RefreshCw, Trash2, Activity, HardDrive } from 'lucide-react';
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

  // Status and Quota state
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchAccountStatus = async () => {
    if (!account || account.protocol === 'zivpn') return;

    setIsLoadingStatus(true);
    setStatusError(null);
    setAccountStatus(null);

    try {
      const response = await vpnService.getAccountStatus(account.id);
      if (response.success && response.data) {
        setAccountStatus(response.data);
      } else {
        setStatusError(response.message || 'Gagal mengambil status');
      }
    } catch (err: any) {
      console.error('Failed to fetch account status:', err);
      setStatusError(err.response?.data?.message || 'Terjadi kesalahan saat mengecek status');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen && account && account.protocol !== 'zivpn') {
      fetchAccountStatus();
    }
  }, [isOpen, account]);

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
    
    if (account.protocol === 'zivpn') {
      if (account.ip_server) {
        config += `IP Server SocksIP: ${account.ip_server}\n`;
      }
      if (account.password) {
        config += `PW/username zivpn/SocksIP: ${account.password}\n`;
      }
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
        if (account.trojan_go_link) config += `Trojan GO: ${account.trojan_go_link}\n`;
        if (account.trojan_grpc_link) config += `Trojan GRPC: ${account.trojan_grpc_link}\n`;
      }
    }
    
    // Add ZiVPN link if available
    if (account.protocol === 'zivpn' && account.zivpn_link) {
      config += `\n=== URL KONFIGURASI ===\n`;
      config += `ZiVPN Link: ${account.zivpn_link}\n`;
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
            <label className="text-sm font-medium text-muted-foreground">Username</label>
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
              <label className="text-sm font-medium text-muted-foreground">Username</label>
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

          {/* Trojan GO URL */}
          {(account.protocol === 'trojan' && account.trojan_go_link) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Trojan GO URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                  {account.trojan_go_link}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(account.trojan_go_link || '', 'Trojan GO URL')}
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

  const renderStatusBox = () => {
    if (account.protocol === 'zivpn') return null;

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Live Status
            </div>
            {statusError && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAccountStatus}
                disabled={isLoadingStatus}
                className="h-8"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                Cek Ulang
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStatus ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-2 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">Menghubungi VPS Server...</span>
            </div>
          ) : statusError ? (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center justify-between">
              <span>{statusError}</span>
            </div>
          ) : accountStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-primary opacity-80" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status Akun</p>
                    <p className="font-semibold text-lg flex items-center gap-2">
                      {accountStatus.status_account === 'UNLOCKED' ? (
                        <span className="text-green-600 dark:text-green-400">UNLOCKED</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">LOCKED</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {['vmess', 'vless', 'trojan'].includes(account.protocol) && accountStatus.quota_limit_gb && (
                <div className="bg-muted/50 p-3 rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-8 h-8 text-blue-500 opacity-80" />
                    <div className="w-full min-w-[150px]">
                      <div className="flex justify-between items-end mb-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pemakaian Kuota</p>
                        <p className="text-xs font-bold">{accountStatus.quota_used_formatted} / {accountStatus.quota_limit_gb}GB</p>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        {(() => {
                          // Extract numbers from "XX.XXMB" or "XX.XXGB" and convert to GB safely
                          const usedStr = accountStatus.quota_used_formatted || "0MB";
                          const isGB = usedStr.toUpperCase().includes("GB");
                          const numStr = usedStr.replace(/[^0-9.]/g, '');
                          const usedNum = parseFloat(numStr) || 0;

                          let usedGB = usedNum;
                          if (!isGB && usedStr.toUpperCase().includes("MB")) {
                            usedGB = usedNum / 1024;
                          } else if (!isGB && usedStr.toUpperCase().includes("KB")) {
                            usedGB = usedNum / (1024 * 1024);
                          } else if (!isGB && usedStr.toUpperCase().includes("B")) {
                            usedGB = usedNum / (1024 * 1024 * 1024);
                          }

                          const limitGB = parseFloat(accountStatus.quota_limit_gb) || 1;
                          const percentage = Math.min((usedGB / limitGB) * 100, 100);

                          let colorClass = "bg-green-500";
                          if (percentage > 90) colorClass = "bg-red-500";
                          else if (percentage > 70) colorClass = "bg-yellow-500";

                          return (
                            <div
                              className={`h-full ${colorClass} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-2">
              Menunggu pembaruan status...
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderZivpnDetails = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Key className="w-5 h-5" />
          Detail Akun ZiVPN/SOCKSIP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tambahan fields bisa menyesuaikan jika ada ip_server di response */}
          {account.ip_server && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">IP Server SocksIP</label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium font-mono">{account.ip_server}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(account.ip_server!, 'IP Server SocksIP')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          {account.password && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">PW/username zivpn/SocksIP</label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium font-mono">{account.password}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(account.password!, 'PW/username zivpn/SocksIP')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        {account.zivpn_link && (
          <div className="mt-4">
            <label className="text-sm font-medium text-muted-foreground">ZiVPN Link</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                {account.zivpn_link}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(account.zivpn_link!, 'ZiVPN Link')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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

            {/* Live Status VPS */}
            {renderStatusBox()}

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
            {account.protocol === 'zivpn' && renderZivpnDetails()}
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
