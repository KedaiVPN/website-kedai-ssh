import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search, RefreshCw, Shield } from 'lucide-react';
import { UserVPNAccount } from '@/types/vpn';
import { PROTOCOL_CONFIGS } from '@/constants/protocols';

interface VPNAccountsTableProps {
  accounts: UserVPNAccount[];
  isLoading: boolean;
  onViewDetails: (account: UserVPNAccount) => void;
  onRefresh: () => void;
}

const VPNAccountsTable: React.FC<VPNAccountsTableProps> = ({
  accounts,
  isLoading,
  onViewDetails,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.server_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.server_location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProtocol = protocolFilter === 'all' || account.protocol === protocolFilter;
    
    return matchesSearch && matchesProtocol;
  });

  const getProtocolBadge = (protocol: string) => {
    const config = PROTOCOL_CONFIGS[protocol as keyof typeof PROTOCOL_CONFIGS];
    if (!config) return null;

    return (
      <Badge variant="outline" className={`${config.color} ${config.borderColor}`}>
        {config.name}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'destructive'}>
        {status === 'active' ? 'Aktif' : 'Kedaluwarsa'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="text-center mb-4">
          <CardTitle className="text-xl">Akun VPN Saya</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola dan lihat detail akun VPN Anda
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari akun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">Semua Protokol</option>
              <option value="ssh">SSH</option>
              <option value="vmess">VMess</option>
              <option value="vless">VLESS</option>
              <option value="trojan">Trojan</option>
              <option value="zivpn">ZiVPN</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-md bg-gray-200 dark:bg-gray-700 h-12 flex-1"></div>
              </div>
            ))}
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Belum Ada Akun VPN</h3>
            <p className="text-muted-foreground">
              {accounts.length === 0 
                ? 'Anda belum membuat akun VPN. Mulai dengan membuat akun pertama Anda.'
                : 'Tidak ada akun yang sesuai dengan filter pencarian.'
              }
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <ScrollArea className="h-[400px] w-full" scrollbarX>
              <Table className="min-w-max" wrapperClassName="w-max overflow-visible">
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Protokol</TableHead>
                    <TableHead>Server</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kedaluwarsa</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow 
                      key={account.id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onViewDetails(account)}
                    >
                      <TableCell className="font-medium">
                        {account.username}
                      </TableCell>
                      <TableCell>
                        {getProtocolBadge(account.protocol)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{account.server_name}</span>
                          <span className="text-xs text-muted-foreground">{account.server_domain}</span>
                        </div>
                      </TableCell>
                      <TableCell>{account.server_location}</TableCell>
                      <TableCell>
                        {getStatusBadge(account.status)}
                      </TableCell>
                      <TableCell>{account.expired_date}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(account);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VPNAccountsTable;
