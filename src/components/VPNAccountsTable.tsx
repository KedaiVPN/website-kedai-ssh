import React, { useState } from 'react';
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
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div>
           <h3 className="text-xl font-bold text-slate-900 dark:text-white">Akun VPN Saya</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400">Kelola koneksi aktif dan server Anda.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari akun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
              />
            </div>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="px-3 py-2 border border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/20 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white/40 dark:bg-black/20 rounded-xl overflow-hidden border border-white/10">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-md bg-slate-200 dark:bg-slate-700 h-12 flex-1"></div>
              </div>
            ))}
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center animate-bounce-slow">
              <Shield className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Belum Ada Akun VPN</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {accounts.length === 0 
                ? 'Mulai perjalanan aman Anda dengan membuat akun VPN pertama.'
                : 'Tidak ada akun yang sesuai dengan filter pencarian.'
              }
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] w-full" scrollbarX>
            <Table className="min-w-max" wrapperClassName="w-max overflow-visible">
              <TableHeader className="bg-slate-100/50 dark:bg-black/40 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-b border-white/10">
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Username</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Protokol</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Server</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Lokasi</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Kedaluwarsa</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-200">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow
                    key={account.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors border-b border-white/5"
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
                        className="hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
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
        )}
      </div>
    </div>
  );
};

export default VPNAccountsTable;
