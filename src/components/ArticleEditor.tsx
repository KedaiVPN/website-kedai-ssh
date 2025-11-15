import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import theme snow
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { articleService, Category, Tag, ArticleFormData } from '@/services/articleService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

// Konfigurasi editor ReactQuill
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

// Skema validasi menggunakan Zod
const articleSchema = z.object({
  title: z.string().min(1, 'Judul tidak boleh kosong'),
  content: z.string().min(10, 'Konten minimal 10 karakter'),
  status: z.enum(['draft', 'published']),
  excerpt: z.string().optional(),
  meta_description: z.string().optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  featured_image_url: z.string().optional(),
});

interface ArticleEditorProps {
  articleId?: number | null;
  onClose: () => void;
  onSave: () => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ articleId, onClose, onSave }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      content: '',
      status: 'draft',
      excerpt: '',
      meta_description: '',
      categories: [],
      tags: [],
      featured_image_url: '',
    },
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [cats, tgs] = await Promise.all([
          articleService.getCategories(),
          articleService.getTags(),
        ]);
        setCategories(cats);
        setTags(tgs);

        if (articleId) {
          toast.info('Memuat data artikel...');
          const articleData = await articleService.getArticleForEdit(articleId);
          form.reset(articleData);
          toast.success('Data artikel berhasil dimuat.');
        }
      } catch (error) {
        toast.error('Gagal memuat data awal.');
        onClose();
      }
    };
    loadInitialData();
  }, [articleId, form, onClose]);

  const handleSubmit = async (data: ArticleFormData) => {
    setIsSubmitting(true);
    const action = articleId ? 'Memperbarui' : 'Menyimpan';
    toast.info(`${action} artikel...`);

    // Sanitize konten HTML sebelum menyimpan
    const sanitizedContent = DOMPurify.sanitize(data.content, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'a', 'blockquote', 'pre', 'br',
        'iframe', // Untuk video
        'img',    // Untuk gambar
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'class',
        'src', 'alt', 'width', 'height', // Atribut gambar & iframe
        'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'title' // Atribut iframe
      ],
    });

    // Tambahkan hook untuk memperbaiki link
    DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      // Periksa apakah ini tag 'a' dan memiliki atribut 'href'
      if ('href' in node && node.nodeName === 'A') {
        const href = node.getAttribute('href') || '';
        // Jika href tidak dimulai dengan http, https, mailto, tel, /, atau #, tambahkan https://
        if (!/^(https?:\/\/|mailto:|tel:|[/]|#)/i.test(href)) {
          node.setAttribute('href', `https://${href}`);
        }
        // Selalu tambahkan target="_blank" dan rel="noopener noreferrer" untuk keamanan dan UX
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });

    const finalData = { ...data, content: sanitizedContent };

    try {
      if (articleId) {
        await articleService.updateArticle(articleId, finalData);
      } else {
        await articleService.createArticle(finalData);
      }
      toast.success(`Artikel berhasil ${action.toLowerCase()}!`);
      onSave();
      onClose();
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || `Gagal ${action.toLowerCase()} artikel.`;
        toast.error(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info('Mengupload gambar...');
    try {
      const { imageUrl } = await articleService.uploadImage(file);
      form.setValue('featured_image_url', imageUrl);
      toast.success('Gambar berhasil diupload!');
    } catch (error) {
      toast.error('Gagal mengupload gambar.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Editor Artikel</h2>
        </div>

        <div className="flex-grow p-6 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Kolom Utama: Judul dan Konten (2/3 Lebar) */}
              <div className="lg:col-span-2 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Judul Artikel" {...field} className="text-xl h-12" />
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
                       <ReactQuill
                         theme="snow"
                         modules={quillModules}
                         value={field.value}
                         onChange={field.onChange}
                         className="h-96 mb-12 bg-white dark:bg-gray-100 dark:text-black"
                       />
                       <FormMessage className="pt-12"/>
                     </FormItem>
                  )}
                />
              </div>

              {/* Sidebar: Pengaturan Artikel (1/3 Lebar) */}
              <div className="lg:col-span-1 space-y-4 lg:pr-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status publikasi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ringkasan (Excerpt)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tulis ringkasan singkat untuk SEO dan daftar artikel..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tulis deskripsi meta untuk SEO (opsional)..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Featured Image */}
                <FormItem>
                  <FormLabel>Gambar Utama</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                    />
                  </FormControl>
                  {isUploading && <p className="text-sm text-muted-foreground">Mengupload...</p>}
                  {form.watch('featured_image_url') && (
                    <div className="mt-2">
                      <img
                        src={form.watch('featured_image_url')}
                        alt="Preview"
                        className="w-full h-auto rounded-md object-cover"
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>

                {/* Categories */}
                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <div className="space-y-2">
                        {categories.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="categories"
                            render={({ field }) => {
                              return (
                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item.id])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== item.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tag</FormLabel>
                      <div className="space-y-2">
                        {tags.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="tags"
                            render={({ field }) => {
                              return (
                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item.id])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== item.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </form>
          </Form>
        </div>

        <div className="p-6 border-t flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Artikel'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
