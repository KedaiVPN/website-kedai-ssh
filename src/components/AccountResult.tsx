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

  const downloadAsPDF = () => {
    // Create a new window with the account data
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup diblokir. Silakan izinkan popup untuk mengunduh PDF.');
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Akun ${protocol.toUpperCase()} - ${accountData.username}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              max-width: 800px; 
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .info-section { 
              margin-bottom: 25px; 
              background: #f5f5f5; 
              padding: 15px; 
              border-radius: 8px;
            }
            .info-title { 
              font-weight: bold; 
              font-size: 18px; 
              margin-bottom: 15px; 
              color: #333;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px; 
            }
            .label { 
              font-weight: bold; 
              color: #555;
            }
            .value { 
              font-family: monospace; 
              background: white; 
              padding: 2px 6px; 
              border-radius: 4px;
              word-break: break-all;
            }
            .links-section {
              margin-top: 20px;
            }
            .link-item {
              margin-bottom: 15px;
              padding: 10px;
              background: white;
              border: 1px solid #ddd;
              border-radius: 6px;
            }
            .link-label {
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            .link-value {
              font-family: monospace;
              font-size: 12px;
              word-break: break-all;
              background: #f8f8f8;
              padding: 8px;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌟 Akun ${protocol.toUpperCase()} Premium</h1>
            <p>Username: ${accountData.username}</p>
          </div>

          <div class="info-section">
            <div class="info-title">🔹 Informasi Akun ${protocol.toUpperCase()}</div>
            <div class="info-row">
              <span class="label">Username:</span>
              <span class="value">${accountData.username}</span>
            </div>
            <div class="info-row">
              <span class="label">Domain:</span>
              <span class="value">${accountData.domain}</span>
            </div>
            ${protocol === 'ssh' && accountData.password ? `
            <div class="info-row">
              <span class="label">Password:</span>
              <span class="value">${accountData.password}</span>
            </div>
            <div class="info-row">
              <span class="label">SSH WS:</span>
              <span class="value">80</span>
            </div>
            <div class="info-row">
              <span class="label">SSH SSL WS:</span>
              <span class="value">443</span>
            </div>
            ` : ''}
            ${accountData.ns_domain ? `
            <div class="info-row">
              <span class="label">NS Domain:</span>
              <span class="value">${accountData.ns_domain}</span>
            </div>
            ` : ''}
            ${accountData.uuid ? `
            <div class="info-row">
              <span class="label">UUID:</span>
              <span class="value">${accountData.uuid}</span>
            </div>
            ` : ''}
          </div>

          ${protocol === 'ssh' ? `
          <div class="info-section">
            <div class="info-title">🔗 Format Koneksi</div>
            <div class="link-item">
              <div class="link-label">WS Format:</div>
              <div class="link-value">${accountData.domain}:80@${accountData.username}:${accountData.password}</div>
            </div>
            <div class="link-item">
              <div class="link-label">TLS Format:</div>
              <div class="link-value">${accountData.domain}:443@${accountData.username}:${accountData.password}</div>
            </div>
          </div>
          ` : `
          <div class="info-section">
            <div class="info-title">🔗 URL Konfigurasi</div>
            ${accountData.vmess_tls_link || accountData.vless_tls_link || accountData.trojan_tls_link ? `
            <div class="link-item">
              <div class="link-label">TLS URL:</div>
              <div class="link-value">${accountData.vmess_tls_link || accountData.vless_tls_link || accountData.trojan_tls_link}</div>
            </div>
            ` : ''}
            ${accountData.vmess_nontls_link || accountData.vless_nontls_link || accountData.trojan_nontls_link1 ? `
            <div class="link-item">
              <div class="link-label">Non-TLS URL:</div>
              <div class="link-value">${accountData.vmess_nontls_link || accountData.vless_nontls_link || accountData.trojan_nontls_link1}</div>
            </div>
            ` : ''}
            ${accountData.vmess_grpc_link || accountData.vless_grpc_link || accountData.trojan_grpc_link ? `
            <div class="link-item">
              <div class="link-label">GRPC URL:</div>
              <div class="link-value">${accountData.vmess_grpc_link || accountData.vless_grpc_link || accountData.trojan_grpc_link}</div>
            </div>
            ` : ''}
          </div>
          `}

          <div class="info-section">
            <div class="info-title">📋 Informasi Tambahan</div>
            <div class="info-row">
              <span class="label">Expired:</span>
              <span class="value">${accountData.expired}</span>
            </div>
            <div class="info-row">
              <span class="label">IP Limit:</span>
              <span class="value">${accountData.ip_limit === '0' ? 'Unlimited' : `${accountData.ip_limit} Device`}</span>
            </div>
            ${accountData.quota ? `
            <div class="info-row">
              <span class="label">Quota:</span>
              <span class="value">${accountData.quota}</span>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>♨ᵗᵉʳⁱᵐᵃᵏᵃˢⁱʰ ᵗᵉˡᵃʰ ᵐᵉⁿᵍᵍᵘⁿᵃᵏᵃⁿ ˡᵃʸᵃⁿᵃⁿ ᵏᵃᵐⁱ♨</p>
            <p>Generated on ${new Date().toLocaleString('id-ID')}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();

    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close the window after printing
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500);
    };

    toast.success('PDF sedang dipersiapkan untuk diunduh...');
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
          onClick={downloadAsPDF}
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
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
