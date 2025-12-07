import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Loader2, Phone, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { balanceService, PublicTransactionLog } from '@/services/balanceService';
import dayjs from 'dayjs';

const TransactionLogTable = () => {
  const [transactions, setTransactions] = useState<PublicTransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('this_month');
  const [myOnly, setMyOnly] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filter, myOnly]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await balanceService.getPublicTransactionLog(filter, myOnly);
      if (response.success && response.data) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Error fetching transaction log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionTypeBadge = (referenceType: string) => {
    switch (referenceType) {
      case 'topup':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">Topup</Badge>;
      case 'account_creation':
        return <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Buat Akun VPN</Badge>;
      case 'xl_transaction':
        return <Badge variant="default" className="bg-purple-500/10 text-purple-600 border-purple-500/20">Pembelian Paket</Badge>;
      case 'admin_topup':
        return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Admin Topup</Badge>;
      case 'admin_deduction':
        return <Badge variant="default" className="bg-red-500/10 text-red-600 border-red-500/20">Admin Potongan</Badge>;
      case 'account_renewal':
        return <Badge variant="default" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20">Perpanjangan</Badge>;
      default:
        return <Badge variant="outline">{referenceType}</Badge>;
    }
  };

  const formatAmount = (type: string, amount: number) => {
    const formattedAmount = `Rp${amount.toLocaleString('id-ID')}`;
    if (type === 'credit') {
      return (
        <span className="flex items-center gap-1 text-green-600">
          <ArrowUpCircle className="w-3 h-3" />
          +{formattedAmount}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-red-600">
        <ArrowDownCircle className="w-3 h-3" />
        -{formattedAmount}
      </span>
    );
  };

  const getServerOrPackage = (tx: PublicTransactionLog) => {
    if (tx.reference_type === 'account_creation' || tx.reference_type === 'account_renewal') {
      return tx.server_name || '-';
    }
    if (tx.reference_type === 'xl_transaction') {
      return tx.package_name || '-';
    }
    return '-';
  };

  const getIpLimitOrPhone = (tx: PublicTransactionLog) => {
    if (tx.reference_type === 'account_creation' || tx.reference_type === 'account_renewal') {
      return tx.ip_limit ? `${tx.ip_limit} IP` : '-';
    }
    if (tx.reference_type === 'xl_transaction') {
      return tx.phone_number ? (
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {tx.phone_number}
        </span>
      ) : '-';
    }
    return '-';
  };

  const getFilterLabel = (value: string) => {
    switch (value) {
      case 'today': return 'Hari Ini';
      case '3days': return '3 Hari Terakhir';
      case 'this_month': return 'Bulan Ini';
      case 'last_month': return 'Bulan Kemarin';
      default: return 'Bulan Ini';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg">Log Transaksi</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="3days">3 Hari Terakhir</SelectItem>
              <SelectItem value="this_month">Bulan Ini</SelectItem>
              <SelectItem value="last_month">Bulan Kemarin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Tidak ada transaksi untuk periode {getFilterLabel(filter).toLowerCase()}
          </div>
        ) : (
          <div className="border rounded-lg">
            <ScrollArea className="h-[400px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">Username</TableHead>
                    <TableHead className="sticky top-0 bg-background">Jenis</TableHead>
                    <TableHead className="sticky top-0 bg-background">Server/Paket</TableHead>
                    <TableHead className="sticky top-0 bg-background">IP/Nomor</TableHead>
                    <TableHead className="sticky top-0 bg-background">Jumlah</TableHead>
                    <TableHead className="sticky top-0 bg-background">Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.username}</TableCell>
                      <TableCell>{getTransactionTypeBadge(tx.reference_type)}</TableCell>
                      <TableCell className="text-muted-foreground">{getServerOrPackage(tx)}</TableCell>
                      <TableCell className="text-muted-foreground">{getIpLimitOrPhone(tx)}</TableCell>
                      <TableCell>{formatAmount(tx.type, tx.amount)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {dayjs(tx.created_at).format('DD/MM HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <Button 
            variant={myOnly ? "default" : "outline"}
            onClick={() => setMyOnly(!myOnly)}
            size="sm"
          >
            <History className="w-4 h-4 mr-2" />
            {myOnly ? "Lihat Semua Transaksi" : "Transaksi Saya"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionLogTable;
