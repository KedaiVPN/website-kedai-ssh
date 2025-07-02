import { AccountData, VPNProtocol } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface AccountResultProps {
  accountData: AccountData;
  protocol: VPNProtocol;
}

export const AccountResult = ({ accountData, protocol }: AccountResultProps) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  const downloadAsTXT = () => {
    // Create text content for the account data
    let content = `========================================\n`;
    content += `🌟 AKUN ${protocol.toUpperCase()} PREMIUM\n`;
    content += `========================================\n\n`;
    
    content += `🔹 INFORMASI AKUN ${protocol.toUpperCase()}\n`;
    content += `Username: ${accountData.username}\n`;
    content += `Domain: ${accountData.domain}\n`;
    
    if (protocol === 'ssh' && accountData.password) {
      content += `Password: ${accountData.password}\n`;
      content += `SSH WS: 80\n`;
      content += `SSH SSL WS: 443\n`;
    }
    
    if (accountData.ns_domain) {
      content += `NS Domain: ${accountData.ns_domain}\n`;
    }
    
    if (accountData.uuid) {
      content += `UUID: ${accountData.uuid}\n`;
    }
    
    content += `\n`;
    
    // Add connection formats/URLs
    if (protocol === 'ssh') {
      content += `🔗 FORMAT KONEKSI\n`;
      content += `WS Format: ${accountData.domain}:80@${accountData.username}:${accountData.password}\n`;
      content += `TLS Format: ${accountData.domain}:443@${accountData.username}:${accountData.password}\n`;
    } else {
      content += `🔗 URL KONFIGURASI\n`;
      
      if (accountData.vmess_tls_link || accountData.vless_tls_link || accountData.trojan_tls_link) {
        content += `TLS URL: ${accountData.vmess_tls_link || accountData.vless_tls_link || accountData.trojan_tls_link}\n`;
      }
      
      if (accountData.vmess_nontls_link || accountData.vless_nontls_link || accountData.trojan_nontls_link1) {
        content += `Non-TLS URL: ${accountData.vmess_nontls_link || accountData.vless_nontls_link || accountData.trojan_nontls_link1}\n`;
      }
      
      if (accountData.vmess_grpc_link || accountData.vless_grpc_link || accountData.trojan_grpc_link) {
        content += `GRPC URL: ${accountData.vmess_grpc_link || accountData.vless_grpc_link || accountData.trojan_grpc_link}\n`;
      }
    }
    
    content += `\n📋 INFORMASI TAMBAHAN\n`;
    content += `Expired: ${accountData.expired}\n`;
    content += `IP Limit: ${accountData.ip_limit === '0' ? 'Unlimited' : `${accountData.ip_limit} Device`}\n`;
    
    if (accountData.quota) {
      content += `Quota: ${accountData.quota}\n`;
    }
    
    content += `\n========================================\n`;
    content += `♨ᵗᵉʳⁱᵐᵃᵏᵃˢⁱʰ ᵗᵉˡᵃʰ ᵐᵉⁿᵍᵍᵘⁿᵃᵏᵃⁿ ˡᵃʸᵃⁿᵃⁿ ᵏᵃᵐⁱ♨\n`;
    content += `Generated on ${new Date().toLocaleString('id-ID')}\n`;
    content += `========================================`;

    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `akun-${protocol}-${accountData.username}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('File TXT berhasil diunduh!');
  };

  const renderSSHResult = () => (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-semibold mb-2">🔹 Informasi Akun SSH</h4>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between items-center">
            <span>Username:</span>
            <div className="flex items-center space-x-2">
              <code className="bg-background px-2 py-1 rounded">{accountData.username}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(accountData.username, 'Username')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>Password:</span>
            <div className="flex items-center space-x-2">
              <code className="bg-background px-2 py-1 rounded">{accountData.password}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(accountData.password!, 'Password')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>Domain:</span>
            <code className="bg-background px-2 py-1 rounded">{accountData.domain}</code>
          </div>
          <div className="flex justify-between items-center">
            <span>SSH WS:</span>
            <code className="bg-background px-2 py-1 rounded">80</code>
          </div>
          <div className="flex justify-between items-center">
            <span>SSH SSL WS:</span>
            <code className="bg-background px-2 py-1 rounded">443</code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold">🔗 Format Koneksi</h4>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium">WS Format:</span>
            <div className="flex items-center space-x-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-xs flex-1">
                {accountData.domain}:80@{accountData.username}:{accountData.password}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(`${accountData.domain}:80@${accountData.username}:${accountData.password}`, 'WS Format')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm font-medium">TLS Format:</span>
            <div className="flex items-center space-x-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-xs flex-1">
                {accountData.domain}:443@{accountData.username}:{accountData.password}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(`${accountData.domain}:443@${accountData.username}:${accountData.password}`, 'TLS Format')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderV2RayResult = (protocolName: string) => (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-semibold mb-2">🔹 Informasi Akun {protocolName}</h4>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between items-center">
            <span>Username:</span>
            <code className="bg-background px-2 py-1 rounded">{accountData.username}</code>
          </div>
          <div className="flex justify-between items-center">
            <span>Domain:</span>
            <code className="bg-background px-2 py-1 rounded">{accountData.domain}</code>
          </div>
          {accountData.ns_domain && (
            <div className="flex justify-between items-center">
              <span>NS Domain:</span>
              <code className="bg-background px-2 py-1 rounded">{accountData.ns_domain}</code>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span>UUID:</span>
            <div className="flex items-center space-x-2">
              <code className="bg-background px-2 py-1 rounded text-xs">{accountData.uuid}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(accountData.uuid!, 'UUID')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold">🔗 URL Konfigurasi</h4>
        
        {(accountData.vmess_tls_link || accountData.vless_tls_link || accountData.trojan_tls_link) && (
          <div>
            <span className="text-sm font-medium">TLS URL:</span>
            <div className="flex items-center space-x-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                {accountData.vmess_tls_link || accountData.vless_tls_link || accountData.trojan_tls_link}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(
                  accountData.vmess_tls_link || accountData.vless_tls_link || accountData.trojan_tls_link!,
                  'TLS URL'
                )}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {(accountData.vmess_nontls_link || accountData.vless_nontls_link || accountData.trojan_nontls_link1) && (
          <div>
            <span className="text-sm font-medium">Non-TLS URL:</span>
            <div className="flex items-center space-x-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                {accountData.vmess_nontls_link || accountData.vless_nontls_link || accountData.trojan_nontls_link1}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(
                  accountData.vmess_nontls_link || accountData.vless_nontls_link || accountData.trojan_nontls_link1!,
                  'Non-TLS URL'
                )}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {(accountData.vmess_grpc_link || accountData.vless_grpc_link || accountData.trojan_grpc_link) && (
          <div>
            <span className="text-sm font-medium">GRPC URL:</span>
            <div className="flex items-center space-x-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                {accountData.vmess_grpc_link || accountData.vless_grpc_link || accountData.trojan_grpc_link}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(
                  accountData.vmess_grpc_link || accountData.vless_grpc_link || accountData.trojan_grpc_link!,
                  'GRPC URL'
                )}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🌟 Akun {protocol.toUpperCase()} Premium</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadAsTXT}
        >
          <Download className="h-4 w-4 mr-2" />
          Download TXT
        </Button>
      </div>

      {protocol === 'ssh' && renderSSHResult()}
      {(protocol === 'vmess' || protocol === 'vless' || protocol === 'trojan') && 
        renderV2RayResult(protocol.toUpperCase())}

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">📋 Informasi Tambahan</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Expired:</span>
            <div>{accountData.expired}</div>
          </div>
          <div>
            <span className="font-medium">IP Limit:</span>
            <div>{accountData.ip_limit === '0' ? 'Unlimited' : `${accountData.ip_limit} Device`}</div>
          </div>
          {accountData.quota && (
            <div>
              <span className="font-medium">Quota:</span>
              <div>{accountData.quota}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 text-center">
          ♨ᵗᵉʳⁱᵐᵃᵏᵃˢⁱʰ ᵗᵉˡᵃʰ ᵐᵉⁿᵍᵍᵘⁿᵃᵏᵃⁿ ˡᵃʸᵃⁿᵃⁿ ᵏᵃᵐⁱ♨
        </p>
      </div>
    </Card>
  );
};
