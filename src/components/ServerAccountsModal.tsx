import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ServerAccountData } from '@/services/adminService';
import { adminService } from '@/services/adminService';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
interface ServerAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: any;
}

export const ServerAccountsModal: React.FC<ServerAccountsModalProps> = ({
  isOpen,
  onClose,
  server,
}) => {
  const [accounts, setAccounts] = useState<ServerAccountData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // States for Renew Modal
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedAccountForRenew, setSelectedAccountForRenew] = useState<ServerAccountData | null>(null);
  const [renewDuration, setRenewDuration] = useState<number>(30);
  const [isRenewing, setIsRenewing] = useState(false);

  // States for Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAccountForDelete, setSelectedAccountForDelete] = useState<ServerAccountData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAccounts = async () => {
    if (!server) return;
    setIsLoading(true);
    try {
      const data = await adminService.getServerAccounts(server.id);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Gagal mengambil daftar akun server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && server) {
      fetchAccounts();
    }
  }, [isOpen, server]);

  const filteredAccounts = accounts.filter(account =>
    account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.owner_username && account.owner_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openRenewModal = (account: ServerAccountData) => {
    setSelectedAccountForRenew(account);
    setRenewDuration(30);
    setIsRenewModalOpen(true);
  };

  const handleRenewAccount = async () => {
    if (!selectedAccountForRenew || !renewDuration) return;
    setIsRenewing(true);
    try {
      const result = await adminService.renewServerAccount(
        selectedAccountForRenew.id,
        renewDuration
      );
      toast.success(result.message || `Akun ${selectedAccountForRenew.username} berhasil diperpanjang.`);
      setIsRenewModalOpen(false);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperpanjang akun');
    } finally {
      setIsRenewing(false);
    }
  };

  const openDeleteModal = (account: ServerAccountData) => {
    setSelectedAccountForDelete(account);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccountForDelete) return;
    setIsDeleting(true);
    try {
      const result = await adminService.deleteServerAccount(selectedAccountForDelete.id);
      toast.success(result.message || `Akun ${selectedAccountForDelete.username} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus akun');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Informasi Akun Server: {server?.nama_server}</DialogTitle>
            <DialogDescription>
              Daftar semua akun VPN yang terdaftar di server ini.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4 mt-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Cari username akun atau pemilik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" size="icon" onClick={fetchAccounts} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  <TableHead>Pemilik</TableHead>
                  <TableHead>Username Akun</TableHead>
                  <TableHead>Protokol</TableHead>
                  <TableHead>Masa Aktif</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-gray-500">Memuat data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Tidak ada akun ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="font-medium">{account.owner_username || '-'}</div>
                        <div className="text-xs text-gray-500">{account.owner_email || '-'}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{account.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">{account.protocol}</Badge>
                      </TableCell>
                      <TableCell>{account.expired_date_formatted}</TableCell>
                      <TableCell>
                        <Badge variant={account.status === 'active' ? 'default' : 'destructive'} >
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openRenewModal(account)}>
                            <RefreshCw className="w-3 h-3 mr-1" /> Renew
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openDeleteModal(account)}>
                            <Trash2 className="w-3 h-3 mr-1" /> Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renew Modal */}
      <Dialog open={isRenewModalOpen} onOpenChange={setIsRenewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Perpanjang Akun</DialogTitle>
            <DialogDescription>
              Perpanjang akun <strong>{selectedAccountForRenew?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Durasi (Hari)</label>
              <Input
                type="number"
                min="1"
                value={renewDuration}
                onChange={(e) => setRenewDuration(parseInt(e.target.value) || 1)}
              />
            </div>
            <p className="text-xs text-yellow-600">
              *Catatan: Perpanjangan ini akan memotong saldo user sesuai harga normal/reseller.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRenewModalOpen(false)}>Batal</Button>
            <Button onClick={handleRenewAccount} disabled={isRenewing}>
              {isRenewing ? 'Memproses...' : 'Perpanjang'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Akun</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akun <strong>{selectedAccountForDelete?.username}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
