import NewsFeed from '../components/NewsFeed';

export default function NewsPage() {
  return (
    <main
      style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <h1>Berita Terkini</h1>

      <p>
        Selamat datang di halaman berita.
        Berikut adalah informasi terbaru.
      </p>

      <NewsFeed />
    </main>
  );
}