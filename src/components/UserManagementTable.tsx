
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';

interface UserData {
  id: number;
  username: string;
  email: string;
  balance: number;
  is_locked: boolean;
  role: 'member' | 'reseller';
  created_at: string;
  transaction_count: number;
}

interface UserManagementTableProps {
  users: UserData[];
  isLoading: boolean;
  onUserAction: (user: UserData) => void;
}

const UserManagementTable = ({ users, isLoading, onUserAction }: UserManagementTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Belum ada user yang terdaftar
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <ScrollArea className="h-[500px] w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-center">Transaksi</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Terdaftar</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell className="text-sm text-muted-foreground break-all">
                  {user.email}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={user.balance < 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrency(user.balance)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">
                    {user.transaction_count}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {user.is_locked ? (
                    <Badge variant="destructive" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Locked
                    </Badge>
                  ) : (
                    <Badge variant="default" className="gap-1">
                      <Unlock className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUserAction(user)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Kelola
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default UserManagementTable;
