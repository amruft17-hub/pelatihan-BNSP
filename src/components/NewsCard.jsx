
export default function NewsCard({ news }) {
  return (
    <article
      style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        backgroundColor: "#fff",
        color: "#222",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "5px 10px",
          borderRadius: "20px",
          backgroundColor: "#e0ecff",
          color: "#1d4ed8",
          fontSize: "12px",
        }}
      >
        {news.category}
      </span>

      <h3 style={{ marginTop: "14px" }}>
        {news.title}
      </h3>

      <p style={{ color: "#666", fontSize: "13px" }}>
        {news.date}
      </p>

      <p style={{ lineHeight: 1.6 }}>
        {news.description}
      </p>
    </article>
  );
}
