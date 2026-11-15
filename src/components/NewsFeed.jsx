import { useEffect, useState } from 'react';
import NewsCard from './NewsCard';

const SOURCES = [
  { id: 'cnn', label: 'CNN Indonesia' },
  { id: 'kompas', label: 'Kompas' },
];

async function fetchNewsItems(source, signal) {
  const response = await fetch(`/api/news/${source}`, { signal });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || `Permintaan berita gagal (HTTP ${response.status})`);
  }

  if (!Array.isArray(result.articles)) {
    throw new Error('Respons server tidak berisi daftar berita yang valid.');
  }

  return result;
}

export default function NewsFeed() {
  const [source, setSource] = useState('cnn');
  const [articles, setArticles] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setIsLoading(true);
      setError('');
      try {
        const result = await fetchNewsItems(source, controller.signal);
        setArticles(result.articles);
        setUpdatedAt(result.updatedAt);
      } catch (requestError) {
        if (requestError.name === 'AbortError') return;
        setError(requestError.message || 'Gagal mengambil berita terkini.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadNews();
    return () => controller.abort();
  }, [source, refreshKey]);

  const updatedLabel = updatedAt
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(updatedAt))
    : '';

  return (
    <div className="news-container">
      <div className="news-toolbar">
        <div>
          <h2>Berita Terkini</h2>
          <p>
            {isLoading
              ? 'Mengambil berita terbaru...'
              : `${articles.length} artikel${updatedLabel ? ` · diperbarui ${updatedLabel}` : ''}`}
          </p>
        </div>
        <button
          type="button"
          className="btn-refresh"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={isLoading}
        >
          {isLoading ? 'Memuat...' : 'Segarkan Berita'}
        </button>
      </div>

      <div className="news-source-tabs" aria-label="Pilih sumber berita">
        {SOURCES.map((item) => (
          <button
            type="button"
            key={item.id}
            className={source === item.id ? 'active' : ''}
            onClick={() => setSource(item.id)}
            aria-pressed={source === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="spinner-box" role="status">
          <div className="css-spinner" />
          <p>Mengunduh berita terbaru dari {SOURCES.find((item) => item.id === source)?.label}...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="error-banner" role="alert">
          <h3>Berita sementara tidak tersedia</h3>
          <p>{error}</p>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
            Coba lagi
          </button>
        </div>
      )}

      {!isLoading && !error && articles.length === 0 && (
        <div className="news-empty">
          Belum ada artikel dari sumber ini. Silakan coba lagi nanti.
        </div>
      )}

      {!isLoading && !error && articles.length > 0 && (
        <div className="news-grid">
          {articles.map((article) => (
            <NewsCard key={article.link} {...article} />
          ))}
        </div>
      )}
    </div>
  );
}
