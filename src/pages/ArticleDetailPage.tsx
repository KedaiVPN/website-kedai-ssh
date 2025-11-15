import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Calendar, User } from 'lucide-react';
import '@/styles/prose.css'; // Import custom prose styles
import CopyButton from '@/components/CopyButton';

interface ArticleDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  featured_image_url?: string;
  meta_description?: string;
  published_at: string;
  author_name: string;
  categories: string; // Comma-separated
  tags: string; // Comma-separated
}

const ArticleDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Efek untuk menyuntikkan tombol salin, sekarang dengan pembersihan yang benar
    const roots: ReactDOM.Root[] = [];
    const wrappers: HTMLDivElement[] = [];

    if (contentRef.current && article) {
      const preElements = contentRef.current.querySelectorAll('pre');
      preElements.forEach(preEl => {
        // Jangan membungkus ulang jika sudah ada
        if (preEl.parentElement?.classList.contains('code-block-wrapper')) {
          return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';

        preEl.parentNode?.insertBefore(wrapper, preEl);
        wrapper.appendChild(preEl);
        wrappers.push(wrapper);

        const textToCopy = preEl.innerText;

        const copyButtonContainer = document.createElement('div');
        wrapper.appendChild(copyButtonContainer);

        const root = ReactDOM.createRoot(copyButtonContainer);
        roots.push(root);
        root.render(<CopyButton textToCopy={textToCopy} />);
      });
    }

    // Fungsi pembersihan untuk unmount komponen React dan mengembalikan DOM ke keadaan semula
    return () => {
      roots.forEach(root => root.unmount());
      wrappers.forEach(wrapper => {
        const preEl = wrapper.querySelector('pre');
        if (preEl && wrapper.parentNode) {
          // Pindahkan elemen <pre> kembali ke tempatnya semula
          wrapper.parentNode.insertBefore(preEl, wrapper);
        }
        // Hapus wrapper
        wrapper.remove();
      });
    };
  }, [article]); // Jalankan setiap kali artikel berubah

  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/articles/published/${slug}`);
        if (!response.ok) {
          throw new Error('Artikel tidak ditemukan');
        }
        const data = await response.json();
        setArticle(data);
      } catch (error) {
        toast.error('Gagal memuat artikel.');
        setArticle(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="pt-24 pb-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold">404 - Artikel Tidak Ditemukan</h1>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Maaf, artikel yang Anda cari tidak ada.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <article>
            <header className="mb-8">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl mb-4">
                {article.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{article.author_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={article.published_at}>
                    {new Date(article.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                </div>
              </div>
            </header>

            {article.featured_image_url && (
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-auto rounded-lg mb-8 shadow-lg"
              />
            )}

            <div
              ref={contentRef}
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

          </article>
        </div>
      </main>
    </div>
  );
};

export default ArticleDetailPage;
