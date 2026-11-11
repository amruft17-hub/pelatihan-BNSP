
import NewsCard from "./NewsCard";

const newsData = [
  {
    id: 1,
    title: "Perkembangan Teknologi Web",
    category: "Teknologi",
    date: "7 November 2026",
    description:
      "Teknologi web terus berkembang dan membantu pengembang membangun aplikasi yang modern dan interaktif.",
  },
  {
    id: 2,
    title: "Belajar React untuk Pemula",
    category: "Pendidikan",
    date: "7 November 2026",
    description:
      "React membantu pengembang membangun antarmuka pengguna menggunakan komponen yang dapat digunakan kembali.",
  },
  {
    id: 3,
    title: "Mengenal React Router",
    category: "Pemrograman",
    date: "7 November 2026",
    description:
      "React Router memudahkan navigasi antarhalaman dalam aplikasi React.",
  },
];

export default function NewsFeed() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginTop: "24px",
      }}
    >
      {newsData.map((news) => (
        <NewsCard key={news.id} news={news} />
      ))}
    </div>
  );
}
