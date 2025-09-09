import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { getBugsForAdmin, createBug, updateBug, deleteBug, BugHost } from '@/services/bugService';
import { Trash2, Edit, Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BugFormValues {
  label: string;
  value: string;
  is_wildcard: boolean;
}

const BugManager: React.FC = () => {
  const [bugs, setBugs] = useState<BugHost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<BugHost | null>(null);

  const form = useForm<BugFormValues>({
    defaultValues: {
      label: '',
      value: '',
      is_wildcard: false,
    },
  });

  useEffect(() => {
    loadBugs();
  }, []);

  useEffect(() => {
    if (editingBug) {
      form.reset({
        label: editingBug.label,
        value: editingBug.value,
        is_wildcard: !!editingBug.is_wildcard,
      });
    } else {
      form.reset();
    }
  }, [editingBug, form]);

  const loadBugs = async () => {
    setIsLoading(true);
    try {
      const data = await getBugsForAdmin();
      setBugs(data);
    } catch (error) {
      toast.error('Gagal memuat daftar bug.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (bug: BugHost | null = null) => {
    setEditingBug(bug);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBug(null);
    form.reset();
  };

  const onSubmit = async (values: BugFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingBug) {
        await updateBug(editingBug.id, values);
        toast.success('Bug berhasil diperbarui!');
      } else {
        await createBug(values);
        toast.success('Bug berhasil ditambahkan!');
      }
      loadBugs();
      handleCloseDialog();
    } catch (error) {
      toast.error(editingBug ? 'Gagal memperbarui bug.' : 'Gagal menambahkan bug.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bug ini?')) return;
    try {
      await deleteBug(id);
      toast.success('Bug berhasil dihapus.');
      setBugs(bugs.filter((bug) => bug.id !== id));
    } catch (error) {
      toast.error('Gagal menghapus bug.');
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Manajemen Bug Host</CardTitle>
              <CardDescription>Tambah, edit, atau hapus bug host untuk injector.</CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Bug
              </Button>
            </DialogTrigger>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center">Memuat data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Value (Host/IP)</TableHead>
                  <TableHead>Wildcard</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bugs.map((bug) => (
                  <TableRow key={bug.id}>
                    <TableCell className="font-medium">{bug.label}</TableCell>
                    <TableCell>{bug.value}</TableCell>
                    <TableCell>{bug.is_wildcard ? 'Ya' : 'Tidak'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(bug)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(bug.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={() => handleCloseDialog()}>
        <DialogHeader>
          <DialogTitle>{editingBug ? 'Edit Bug Host' : 'Tambah Bug Host Baru'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              rules={{ required: 'Label tidak boleh kosong' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: XL VIDIO PORT 443" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              rules={{ required: 'Value tidak boleh kosong' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value (Host/IP)</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: quiz.vidio.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_wildcard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Wildcard</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'true')}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe wildcard" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">True (Gunakan Wildcard)</SelectItem>
                      <SelectItem value="false">False (Tanpa Wildcard)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingBug ? 'Simpan Perubahan' : 'Tambah Bug'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BugManager;
