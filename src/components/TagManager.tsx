import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { articleService, Tag } from '@/services/articleService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

const tagSchema = z.object({
  name: z.string().min(1, 'Nama tag tidak boleh kosong'),
});

const TagManager: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: '' },
  });

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const data = await articleService.getTags();
      setTags(data);
    } catch (error) {
      toast.error('Gagal memuat tag.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const onSubmit = async (data: z.infer<typeof tagSchema>) => {
    setIsSubmitting(true);
    try {
      await articleService.createTag(data.name);
      toast.success('Tag berhasil ditambahkan.');
      form.reset();
      loadTags(); // Reload list
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal menambahkan tag.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus tag ini? Menghapus tag juga akan melepaskannya dari semua artikel terkait.')) {
      try {
        await articleService.deleteTag(id);
        toast.success('Tag berhasil dihapus.');
        loadTags(); // Reload list
      } catch (error) {
        toast.error('Gagal menghapus tag.');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Tag</CardTitle>
        <CardDescription>Tambah atau hapus tag untuk artikel.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 mb-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="Nama tag baru..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tambah'}
            </Button>
          </form>
        </Form>
        <div className="space-y-2">
          {isLoading ? (
            <p>Memuat...</p>
          ) : (
            tags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between p-2 border rounded-lg">
                <span>{tag.name}</span>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TagManager;
