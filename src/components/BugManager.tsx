import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getBugsForAdmin, createBug, updateBug, deleteBug, BugHost } from '@/services/bugService';
import { Trash2, Edit, Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BugFormValues {
  protocol: 'ssh' | 'xray';
  label: string;
  value: string;
  payload?: string;
  proxy?: string;
  sni?: string;
  is_enhanced: boolean;
  mode: 'normal' | 'wildcard' | 'salto';
}

const BugManager: React.FC = () => {
  const [bugs, setBugs] = useState<BugHost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<BugHost | null>(null);

  const form = useForm<BugFormValues>({
    defaultValues: {
      protocol: 'xray',
      label: '',
      value: '',
      payload: '',
      proxy: '',
      sni: '',
      is_enhanced: false,
      mode: 'normal',
    },
  });

  useEffect(() => {
    loadBugs();
  }, []);

  useEffect(() => {
    if (editingBug) {
      let mode: 'normal' | 'wildcard' | 'salto' = 'normal';
      if (editingBug.is_salto) {
        mode = 'salto';
      } else if (editingBug.is_wildcard) {
        mode = 'wildcard';
      }
      form.reset({
        protocol: editingBug.protocol || 'xray',
        label: editingBug.label,
        value: editingBug.value,
        payload: editingBug.payload || '',
        proxy: editingBug.proxy || '',
        sni: editingBug.sni || '',
        is_enhanced: !!editingBug.is_enhanced,
        mode: mode,
      });
    } else {
      form.reset({
        protocol: 'xray',
        label: '',
        value: '',
        payload: '',
        proxy: '',
        sni: '',
        is_enhanced: false,
        mode: 'normal',
      });
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
    const bugData = {
      protocol: values.protocol,
      label: values.label,
      value: values.protocol === 'ssh' ? (values.proxy || '') : values.value,
      payload: values.payload,
      proxy: values.proxy,
      sni: values.sni,
      is_enhanced: values.is_enhanced,
      is_wildcard: values.mode === 'wildcard',
      is_salto: values.mode === 'salto',
    };
    try {
      if (editingBug) {
        await updateBug(editingBug.id, bugData);
        toast.success('Bug berhasil diperbarui!');
      } else {
        await createBug(bugData);
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
                  <TableHead>Protocol</TableHead>
                  <TableHead>Value (Host/IP)</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bugs.map((bug) => (
                  <TableRow key={bug.id}>
                    <TableCell className="font-medium">{bug.label}</TableCell>
                    <TableCell className="uppercase">{bug.protocol}</TableCell>
                    <TableCell>{bug.value}</TableCell>
                    <TableCell>
                      {bug.protocol === 'ssh' ? 'N/A' : (bug.is_salto ? 'Salto' : bug.is_wildcard ? 'Wildcard' : 'Normal')}
                    </TableCell>
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <FormField
              control={form.control}
              name="protocol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protokol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih protokol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="xray">Xray (Vmess/Vless/Trojan)</SelectItem>
                      <SelectItem value="ssh">SSH</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            {form.watch('protocol') === 'xray' && (
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
            )}
            {form.watch('protocol') === 'ssh' && (
              <>
                <FormField
                  control={form.control}
                  name="payload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payload</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Contoh: GET / HTTP/1.1[crlf]..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="proxy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proxy</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 104.21.22.52:80" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SNI</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: [host] atau quiz.vidio.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_enhanced"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enhanced</FormLabel>
                        <FormDescription>
                          Centang ini jika payload membutuhkan mode enhanced proxy.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}
            {form.watch('protocol') === 'xray' && (
              <>
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode Bug</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih mode bug" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="normal">Normal (Ganti IP/Address)</SelectItem>
                          <SelectItem value="wildcard">Wildcard (Ganti IP & SNI)</SelectItem>
                          <SelectItem value="salto">Salto (Ganti SNI & Host)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom SNI (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: bug.com" {...field} />
                      </FormControl>
                      <FormDescription>Jika diisi, ini akan menjadi SNI khusus.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <div className="flex justify-end space-x-2 pt-4 border-t">
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
