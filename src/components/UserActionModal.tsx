
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Lock, Unlock, User, Mail, Calendar, CreditCard, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { adminService } from '@/services/adminService';
import UserScheduledPurchases from './UserScheduledPurchases';

interface UserData {
  id: number;
  username: string;
  email: string;
  phone_number: string | null;
  balance: number;
  is_locked: boolean;
  role: 'member' | 'reseller';
  created_at: string;
  transaction_count: number;
}

interface TransactionData {
  id: number;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  reference_type: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

interface UserActionModalProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const UserActionModal = ({ user, isOpen, onClose, onUserUpdated }: UserActionModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      loadTransactions();
    }
  }, [user, isOpen]);

  const loadTransactions = async () => {
    if (!user) return;
    
    setLoadingTransactions(true);
    try {
      const data = await adminService.getUserTransactions(user.id);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleAddBalance = async () => {
    if (!user || !amount || !description) {
      toast.error('Amount dan description wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      await adminService.addUserBalance(user.id, parseInt(amount), description);
      toast.success('Saldo berhasil ditambahkan');
      setAmount('');
      setDescription('');
      onUserUpdated();
      loadTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menambahkan saldo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeductBalance = async () => {
    if (!user || !amount || !description) {
      toast.error('Amount dan description wajib diisi');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin memotong saldo user ini?')) {
      return;
    }

    setIsLoading(true);
    try {
      await adminService.deductUserBalance(user.id, parseInt(amount), description);
      toast.success('Saldo berhasil dipotong');
      setAmount('');
      setDescription('');
      onUserUpdated();
      loadTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memotong saldo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLockToggle = async () => {
    if (!user) return;

    const action = user.is_locked ? 'unlock' : 'lock';
    const actionText = user.is_locked ? 'membuka kunci' : 'mengunci';
    
    if (!confirm(`Apakah Anda yakin ingin ${actionText} user ini?`)) {
      return;
    }

    setIsLoading(true);
    try {
      if (user.is_locked) {
        await adminService.unlockUser(user.id);
        toast.success('User berhasil dibuka kuncinya');
      } else {
        await adminService.lockUser(user.id);
        toast.success('User berhasil dikunci');
      }
      onUserUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Gagal ${actionText} user`);
    } finally {
      setIsLoading(false);
    }
};

const handleChangeRole = async (targetRole: 'member' | 'reseller') => {
  if (!user) return;
  if (user.role === targetRole) return;
  const actionText = targetRole === 'reseller' ? 'mengubah menjadi reseller' : 'mengubah menjadi member';
  if (!confirm(`Apakah Anda yakin ingin ${actionText}?`)) return;
  setIsLoading(true);
  try {
    await adminService.updateUserRole(user.id, targetRole);
    toast.success(`Role user diperbarui menjadi ${targetRole}`);
    onUserUpdated();
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Gagal memperbarui role');
  } finally {
    setIsLoading(false);
  }
};

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

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Kelola User: {user.username}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Info & Actions */}
          <div className="space-y-4">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground break-all">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{user.phone_number || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{formatDate(user.created_at)}</span>
                </div>
<div className="flex items-center gap-2">
  <CreditCard className="h-4 w-4 text-muted-foreground" />
  <span className={`font-mono font-medium ${user.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
    {formatCurrency(user.balance)}
  </span>
</div>
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground">Role:</span>
  <Badge variant="outline" className="capitalize">{user.role}</Badge>
</div>
<div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
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
                </div>
              </CardContent>
            </Card>

            {/* Balance Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kelola Saldo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount">Jumlah (Rp)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Masukkan jumlah"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Masukkan alasan perubahan saldo"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleAddBalance}
                    disabled={isLoading || !amount || !description}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Saldo
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeductBalance}
                    disabled={isLoading || !amount || !description}
                    className="gap-2"
                  >
                    <Minus className="h-4 w-4" />
                    Potong Saldo
                  </Button>
                </div>
              </CardContent>
            </Card>

{/* Role Management */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Role User</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">Role saat ini:</span>
      <Badge variant="outline" className="capitalize">{user.role}</Badge>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {user.role === 'member' ? (
        <Button onClick={() => handleChangeRole('reseller')} disabled={isLoading} className="w-full">
          Jadikan Reseller
        </Button>
      ) : (
        <Button onClick={() => handleChangeRole('member')} disabled={isLoading} variant="outline" className="w-full">
          Jadikan Member
        </Button>
      )}
    </div>
  </CardContent>
</Card>

{/* Account Actions */}
<Card>
              <CardHeader>
                <CardTitle className="text-lg">Aksi Akun</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant={user.is_locked ? "default" : "destructive"}
                  onClick={handleLockToggle}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  {user.is_locked ? (
                    <>
                      <Unlock className="h-4 w-4" />
                      Buka Kunci User
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Kunci User
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Riwayat Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Belum ada transaksi
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {transactions.map((transaction, index) => (
                      <div key={transaction.id}>
                        <div className="flex justify-between items-start py-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={transaction.type === 'credit' ? 'default' : 'destructive'}>
                                {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(transaction.created_at)}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Saldo: {formatCurrency(transaction.balance_before)} → {formatCurrency(transaction.balance_after)}
                            </p>
                          </div>
                        </div>
                        {index < transactions.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Scheduled Purchases Section */}
        <div className="mt-6">
            <UserScheduledPurchases userId={user.id} />
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserActionModal;
