import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { messageService, AdminMessage } from '@/services/messageService';
import { Trash2, Send, Loader2 } from 'lucide-react';

interface MessageFormValues {
  title: string;
  content: string;
  targetRole: 'all' | 'member' | 'reseller';
  durationDays: string; // Use string for form select
}

const MessageManager: React.FC = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const form = useForm<MessageFormValues>({
    defaultValues: {
      title: '',
      content: '',
      targetRole: 'all',
      durationDays: '7',
    },
  });

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const data = await messageService.getAdminMessages();
      setMessages(data);
    } catch (error) {
      toast.error('Gagal memuat pesan.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: MessageFormValues) => {
    setIsSending(true);
    try {
      const duration = values.durationDays === '0' ? null : parseInt(values.durationDays, 10);
      await messageService.createMessage({
        title: values.title,
        content: values.content,
        targetRole: values.targetRole,
        durationDays: duration,
      });
      toast.success('Pesan berhasil dikirim!');
      form.reset();
      loadMessages(); // Refresh the list
    } catch (error) {
      toast.error('Gagal mengirim pesan.');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;

    try {
      await messageService.deleteMessage(id);
      toast.success('Pesan berhasil dihapus.');
      setMessages(messages.filter((msg) => msg.id !== id));
    } catch (error) {
      toast.error('Gagal menghapus pesan.');
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kirim Pesan Baru</CardTitle>
          <CardDescription>Kirim pesan ke semua pengguna atau grup tertentu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Pesan</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Promo Kemerdekaan!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Isi Pesan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tulis pesan Anda di sini..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penerima</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Semua Pengguna</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="reseller">Reseller</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durasi Pesan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3">3 Hari</SelectItem>
                          <SelectItem value="7">7 Hari</SelectItem>
                          <SelectItem value="15">15 Hari</SelectItem>
                          <SelectItem value="30">30 Hari</SelectItem>
                          <SelectItem value="0">Permanen</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isSending}>
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSending ? 'Mengirim...' : 'Kirim Pesan'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pesan Terkirim</CardTitle>
          <CardDescription>Daftar semua pesan yang telah Anda kirim.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center">Memuat pesan...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Tgl Kirim</TableHead>
                  <TableHead>Kedaluwarsa</TableHead>
                  <TableHead>Dibaca</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium">{msg.title}</TableCell>
                    <TableCell>{msg.target_role}</TableCell>
                    <TableCell>{formatDate(msg.created_at)}</TableCell>
                    <TableCell>{msg.expires_at ? formatDate(msg.expires_at) : 'Permanen'}</TableCell>
                    <TableCell>{msg.read_count}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(msg.id)}>
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
    </div>
  );
};

export default MessageManager;
