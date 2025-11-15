import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { articleService, Category } from '@/services/articleService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori tidak boleh kosong'),
});

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await articleService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Gagal memuat kategori.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onSubmit = async (data: z.infer<typeof categorySchema>) => {
    setIsSubmitting(true);
    try {
      await articleService.createCategory(data.name);
      toast.success('Kategori berhasil ditambahkan.');
      form.reset();
      loadCategories(); // Reload list
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal menambahkan kategori.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus kategori ini? Menghapus kategori juga akan melepaskannya dari semua artikel terkait.')) {
      try {
        await articleService.deleteCategory(id);
        toast.success('Kategori berhasil dihapus.');
        loadCategories(); // Reload list
      } catch (error) {
        toast.error('Gagal menghapus kategori.');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Kategori</CardTitle>
        <CardDescription>Tambah atau hapus kategori untuk artikel.</CardDescription>
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
                    <Input placeholder="Nama kategori baru..." {...field} />
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
            categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2 border rounded-lg">
                <span>{cat.name}</span>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
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

export default CategoryManager;
