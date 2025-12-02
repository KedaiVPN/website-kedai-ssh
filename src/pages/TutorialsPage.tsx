import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { articleService } from '@/services/articleService';
import { toast } from 'sonner';

// Tipe data untuk artikel publik
interface PublicArticle {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image_url?: string;
  published_at: string;
  author_name: string;
}

const TutorialsPage = () => {
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        // Ini adalah endpoint publik yang baru
        const response = await fetch('/api/articles/published');
        if (!response.ok) {
          throw new Error('Gagal mengambil data artikel');
        }
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        toast.error('Gagal memuat artikel. Silakan coba lagi nanti.');
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
              Tutorial & Panduan
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Temukan tips, trik, dan panduan lengkap seputar layanan kami.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">Belum ada tutorial yang dipublikasikan.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {articles.map((article) => (
                <Link to={`/tutorial/${article.slug}`} key={article.id} className="block group">
                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <div className="grid md:grid-cols-3 gap-6">
                      {article.featured_image_url && (
                        <div className="md:col-span-1">
                          <img
                            src={article.featured_image_url}
                            alt={article.title}
                            className="w-full h-48 object-cover rounded-l-lg"
                          />
                        </div>
                      )}
                      <div className={`md:col-span-${article.featured_image_url ? '2' : '3'}`}>
                        <CardHeader>
                          <CardTitle className="group-hover:text-primary transition-colors duration-300">{article.title}</CardTitle>
                          <CardDescription>
                            Ditulis oleh {article.author_name} pada {new Date(article.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 dark:text-gray-300">{article.excerpt}</p>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TutorialsPage;
