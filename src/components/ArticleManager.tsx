import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, FileText, Edit, Trash2 } from 'lucide-react';
import { articleService, ArticleSummary } from '@/services/articleService';
import ArticleEditor from './ArticleEditor';
import CategoryManager from './CategoryManager';
import TagManager from './TagManager';

const ArticleManager: React.FC = () => {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await articleService.getArticles();
      setArticles(data);
    } catch (error) {
      toast.error('Gagal memuat daftar artikel.');
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingArticleId(null);
  };

  const handleEditorSave = () => {
    loadArticles();
  };

  const handleEditClick = (id: number) => {
    setEditingArticleId(id);
    setIsEditorOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
      try {
        await articleService.deleteArticle(id);
        toast.success('Artikel berhasil dihapus.');
        loadArticles();
      } catch (error) {
        toast.error('Gagal menghapus artikel.');
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
              <div>
                  <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Manajemen Artikel
                  </CardTitle>
                  <CardDescription>
                      Buat, edit, dan kelola semua artikel untuk halaman tutorial.
                  </CardDescription>
              </div>
              <Button onClick={() => setIsEditorOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tulis Artikel Baru
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border rounded-lg">
              <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[60%]">Judul</th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Penulis</th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Terakhir Diperbarui</th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Aksi</th>
                          </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                          {articles.map((article) => (
                              <tr key={article.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                  <td className="p-4 align-middle font-medium">{article.title}</td>
                                  <td className="p-4 align-middle text-muted-foreground">{article.status}</td>
                                  <td className="p-4 align-middle text-muted-foreground">{article.author_name}</td>
                                  <td className="p-4 align-middle text-muted-foreground">{new Date(article.updated_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                  <td className="p-4 align-middle">
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon" onClick={() => handleEditClick(article.id)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(article.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditorOpen && (
        <ArticleEditor
          articleId={editingArticleId}
          onClose={handleEditorClose}
          onSave={handleEditorSave}
        />
      )}

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <CategoryManager />
        <TagManager />
      </div>
    </>
  );
};

export default ArticleManager;
