import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Calendar, User } from 'lucide-react';
import '@/styles/prose.css'; // Import custom prose styles
import { SEO } from '@/components/SEO';

interface ArticleDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  featured_image_url?: string;
  meta_description?: string;
  excerpt?: string;
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
    // Efek untuk menyuntikkan tombol salin ke blok kode menggunakan manipulasi DOM murni
    const wrappers: HTMLDivElement[] = [];
    const clickListeners: { button: HTMLButtonElement; listener: () => void }[] = [];

    const timeoutId = setTimeout(() => {
      if (!contentRef.current) return;

      const preElements = contentRef.current.querySelectorAll('pre');
      preElements.forEach(preEl => {
        if (preEl.parentElement?.classList.contains('code-block-wrapper')) {
          return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        preEl.parentNode?.insertBefore(wrapper, preEl);
        wrapper.appendChild(preEl);
        wrappers.push(wrapper);

        const textToCopy = preEl.innerText;

        // Buat tombol secara manual
        const button = document.createElement('button');
        button.className = 'absolute top-2 right-2 z-10 h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white inline-flex items-center justify-center rounded-md';

        // Buat ikon Salin (SVG)
        const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy h-4 w-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

        // Buat ikon Centang (SVG)
        const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4 text-green-500"><path d="M20 6 9 17l-5-5"/></svg>`;

        button.innerHTML = copyIcon;
        wrapper.appendChild(button);

        const handleCopy = () => {
          navigator.clipboard.writeText(textToCopy).then(() => {
            toast.success('Teks berhasil disalin!');
            button.innerHTML = checkIcon;
            setTimeout(() => {
              button.innerHTML = copyIcon;
            }, 2000);
          }).catch(err => {
            console.error('Gagal menyalin teks: ', err);
            toast.error('Gagal menyalin teks.');
          });
        };

        button.addEventListener('click', handleCopy);
        clickListeners.push({ button, listener: handleCopy });
      });
    }, 100); // Penundaan kecil untuk memastikan render penuh

    // Fungsi pembersihan
    return () => {
      clearTimeout(timeoutId);
      clickListeners.forEach(({ button, listener }) => {
        button.removeEventListener('click', listener);
      });
      wrappers.forEach(wrapper => {
        const preEl = wrapper.querySelector('pre');
        if (preEl && wrapper.parentNode) {
          wrapper.parentNode.insertBefore(preEl, wrapper);
        }
        wrapper.remove();
      });
    };
  }, [article]);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <SEO
          title="404 - Artikel Tidak Ditemukan"
          description="Artikel yang Anda cari tidak ditemukan atau telah dihapus."
        />
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SEO
        title={article.title}
        description={article.meta_description || article.excerpt}
        image={article.featured_image_url}
        type="article"
        canonical={`https://kedaissh.com/tutorials/${article.slug}`}
      />
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
