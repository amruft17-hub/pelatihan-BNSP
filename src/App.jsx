
import { useState } from "react";
import "./App.css";

const initialMembers = [
  {
    id: 1,
    name: "Amru Fayian",
    email: "amru@perusahaan.com",
    role: "Frontend Dev",
    bio: "Mengembangkan tampilan aplikasi web.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    online: true,
  },
  {
    id: 2,
    name: "habib",
    email: "habib@perusahaan.com",
    role: "Frontend Dev",
    bio: "Membangun antarmuka pengguna React.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    online: true,
  },
  {
    id: 3,
    name: "arlot",
    email: "arlot@perusahaan.com",
    role: "UI/UX Designer",
    bio: "Mendesain pengalaman pengguna.",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    online: true,
  },
  {
    id: 4,
    name: "Ahmad Fauzi",
    email: "ahmad@perusahaan.com",
    role: "Backend Engineer",
    bio: "Mengelola API dan basis data.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
    online: false,
  },
];

const initialNews = [
  {
    id: 1,
    category: "MEGAPOLITAN",
    title: "CFD Bekasi Ditiadakan pada 8 dan 15 November",
    description:
      "Informasi mengenai kegiatan dan kebijakan di wilayah Bekasi.",
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=900&h=500&fit=crop",
    source: "Kompas.com",
  },
  {
    id: 2,
    category: "NASIONAL",
    title: "Kemenhaj Dukung Arab Saudi Berantas Praktik Haji Ilegal",
    description:
      "Pemerintah mendukung peningkatan keamanan dan ketertiban penyelenggaraan ibadah haji.",
    image:
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=900&h=500&fit=crop",
    source: "Kompas.com",
  },
  {
    id: 3,
    category: "NASIONAL",
    title: "Dukung Visi Pangan Presiden, Tim Pertanian Terus Bergerak",
    description:
      "Upaya meningkatkan ketahanan pangan melalui pengembangan sektor pertanian.",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&h=500&fit=crop",
    source: "Kompas.com",
  },
  {
    id: 4,
    category: "EKONOMI",
    title: "Perkembangan Ekonomi dan Peluang Usaha di Indonesia",
    description:
      "Berbagai peluang baru hadir seiring perkembangan ekonomi nasional.",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&h=500&fit=crop",
    source: "Kompas.com",
  },
  {
    id: 5,
    category: "TEKNOLOGI",
    title: "Perkembangan Teknologi Digital Terus Meningkat",
    description:
      "Inovasi teknologi digital mendorong transformasi berbagai sektor.",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&h=500&fit=crop",
    source: "Kompas.com",
  },
  {
    id: 6,
    category: "OLAHRAGA",
    title: "Berita Olahraga dan Informasi Terkini Hari Ini",
    description:
      "Simak perkembangan terbaru dari dunia olahraga nasional.",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&h=500&fit=crop",
    source: "Kompas.com",
  },
];

const emptyForm = {
  name: "",
  email: "",
  role: "Frontend Dev",
  bio: "",
};

function App() {
  const [activeTab, setActiveTab] = useState("team");
  const [members, setMembers] = useState(initialMembers);
  const [news, setNews] = useState(initialNews);
  const [search, setSearch] = useState("");
  const [loadingNews, setLoadingNews] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const onlineCount = members.filter(
    (member) => member.online
  ).length;

  const offlineCount = members.length - onlineCount;

  const filteredMembers = members.filter((member) => {
    const keyword = search.trim().toLowerCase();

    return `${member.name} ${member.email} ${member.role}`
      .toLowerCase()
      .includes(keyword);
  });

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function addMember(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();

    if (name.length < 3) {
      alert("Nama anggota minimal 3 karakter.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Masukkan alamat email yang valid.");
      return;
    }

    const emailExists = members.some(
      (member) =>
        member.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      alert("Email tersebut sudah terdaftar.");
      return;
    }

    const newMember = {
      id: Date.now(),
      name,
      email,
      role: form.role,
      bio: form.bio.trim() || "Belum ada bio anggota.",
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=e0e7ff&color=1d4ed8&size=200`,
      online: true,
    };

    setMembers((previous) => [...previous, newMember]);
    setForm({ ...emptyForm });
    setSearch("");

    alert("Anggota berhasil ditambahkan.");
  }

  function toggleStatus(id) {
    setMembers((previous) =>
      previous.map((member) =>
        member.id === id
          ? { ...member, online: !member.online }
          : member
      )
    );
  }

  function deleteMember(id) {
    const member = members.find(
      (item) => item.id === id
    );

    if (!member) return;

    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus ${member.name}?`
    );

    if (confirmed) {
      setMembers((previous) =>
        previous.filter((item) => item.id !== id)
      );
    }
  }

  function refreshNews() {
    if (loadingNews) return;

    setLoadingNews(true);

    // Data berita masih menggunakan data lokal.
    // Hubungkan ke API berita jika ingin mengambil data terbaru.

    window.setTimeout(() => {
      setNews([...initialNews]);
      setLoadingNews(false);
    }, 600);
  }

  function resetSearch() {
    setSearch("");
  }

  return (
    <div className="app">
      {/* HEADER */}
      <header className="app-header">
        <h1 className="app-title">
          <span className="globe-icon">🌐</span>
          Portal Manajemen &amp; Informasi Tim
        </h1>

        <p className="app-subtitle">
          Aplikasi Terpadu Pelatihan Fullstack Node.js &amp; React
        </p>

        <nav className="tab-navigation" aria-label="Navigasi utama">
          <button
            type="button"
            className={`tab-button ${
              activeTab === "team" ? "active" : ""
            }`}
            onClick={() => setActiveTab("team")}
            aria-current={activeTab === "team" ? "page" : undefined}
          >
            👥 Anggota Tim
          </button>

          <button
            type="button"
            className={`tab-button ${
              activeTab === "news" ? "active" : ""
            }`}
            onClick={() => setActiveTab("news")}
            aria-current={activeTab === "news" ? "page" : undefined}
          >
            📰 Berita Terkini
          </button>
        </nav>
      </header>

      {/* KONTEN UTAMA */}
      <main className="main-content">
        {activeTab === "team" ? (
          <section className="team-page">
            {/* STATISTIK */}
            <section
              className="stats-container"
              aria-label="Statistik anggota tim"
            >
              <div className="stat-card">
                <strong className="stat-number total-number">
                  {members.length}
                </strong>
                <span>Total Members</span>
              </div>

              <div className="stat-card">
                <strong className="stat-number online-number">
                  {onlineCount}
                </strong>
                <span>Online</span>
              </div>

              <div className="stat-card">
                <strong className="stat-number offline-number">
                  {offlineCount}
                </strong>
                <span>Offline</span>
              </div>
            </section>

            {/* FORM TAMBAH ANGGOTA */}
            <section className="add-member-panel">
              <h2>
                <span className="plus-icon">✚</span>
                Tambah Anggota Tim
              </h2>

              <form onSubmit={addMember}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="member-name">
                      Nama Lengkap
                    </label>
                    <input
                      id="member-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="Masukkan nama"
                      minLength={3}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="member-email">
                      Email Perusahaan
                    </label>
                    <input
                      id="member-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleFormChange}
                      placeholder="nama@perusahaan.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="member-role">
                      Posisi / Peran
                    </label>
                    <select
                      id="member-role"
                      name="role"
                      value={form.role}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="Frontend Dev">
                        Frontend Dev
                      </option>
                      <option value="Backend Engineer">
                        Backend Engineer
                      </option>
                      <option value="UI/UX Designer">
                        UI/UX Designer
                      </option>
                      <option value="Fullstack Developer">
                        Fullstack Developer
                      </option>
                      <option value="Project Manager">
                        Project Manager
                      </option>
                      <option value="Data Analyst">
                        Data Analyst
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="member-bio">
                      Bio Singkat
                    </label>
                    <input
                      id="member-bio"
                      name="bio"
                      type="text"
                      value={form.bio}
                      onChange={handleFormChange}
                      placeholder="Ceritakan tentang anggota"
                    />
                  </div>

                  <button
                    className="add-button"
                    type="submit"
                  >
                    + Tambah
                  </button>
                </div>
              </form>
            </section>

            {/* PENCARIAN ANGGOTA */}
            <div className="search-container">
              <span className="search-icon" aria-hidden="true">
                🔍
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Cari nama, email, atau posisi anggota..."
                aria-label="Cari anggota tim"
              />
            </div>

            {/* KARTU ANGGOTA */}
            {filteredMembers.length > 0 ? (
              <div className="team-grid">
                {filteredMembers.map((member) => (
                  <article
                    className="team-card"
                    key={member.id}
                  >
                    <div className="member-avatar-container">
                      <img
                        className="member-avatar"
                        src={member.image}
                        alt={`Foto ${member.name}`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              member.name
                            )}&background=e0e7ff&color=1d4ed8&size=200`;
                        }}
                      />

                      <span
                        className={`online-indicator ${
                          member.online
                            ? "is-online"
                            : "is-offline"
                        }`}
                        title={
                          member.online ? "Online" : "Offline"
                        }
                        aria-label={
                          member.online ? "Online" : "Offline"
                        }
                      />
                    </div>

                    <h3>{member.name}</h3>

                    <p className="member-role">
                      {member.role}
                    </p>

                    <p className="member-email">
                      {member.email}
                    </p>

                    <p className="member-bio">
                      {member.bio || "Belum ada bio anggota."}
                    </p>

                    <span
                      className={`status-badge ${
                        member.online
                          ? "status-online"
                          : "status-offline"
                      }`}
                    >
                      {member.online ? "● Online" : "● Offline"}
                    </span>

                    <div className="member-actions">
                      <button
                        type="button"
                        className="status-button"
                        onClick={() => toggleStatus(member.id)}
                        aria-label={`Ubah status ${member.name}`}
                      >
                        Ubah Status
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => deleteMember(member.id)}
                        aria-label={`Hapus ${member.name}`}
                      >
                        Hapus
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span>🔎</span>
                <h3>Anggota tidak ditemukan</h3>
                <p>
                  Coba gunakan nama, email, atau posisi yang berbeda.
                </p>

                <button
                  type="button"
                  className="status-button"
                  onClick={resetSearch}
                >
                  Reset Pencarian
                </button>
              </div>
            )}
          </section>
        ) : (
          /* HALAMAN BERITA */
          <section className="news-page">
            <div className="section-heading">
              <div>
                <h2>
                  <span className="news-heading-icon">📰</span>
                  Berita Terkini Kompas
                </h2>

                <p className="news-description">
                  Menampilkan {news.length} artikel berita
                </p>
              </div>

              <button
                type="button"
                className="refresh-button"
                onClick={refreshNews}
                disabled={loadingNews}
              >
                {loadingNews
                  ? "⏳ Memuat..."
                  : "🔄 Segarkan Berita"}
              </button>
            </div>

            {news.length > 0 ? (
              <div className="news-grid">
                {news.map((article) => (
                  <article
                    className="news-card"
                    key={article.id}
                  >
                    <div className="news-image-container">
                      <img
                        className="news-image"
                        src={article.image}
                        alt={article.title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.style.display = "none";
                        }}
                      />

                      <span className="news-category">
                        {article.category}
                      </span>
                    </div>

                    <div className="news-card-content">
                      <h3>{article.title}</h3>

                      <p>{article.description}</p>

                      <div className="news-card-footer">
                        <span>{article.source}</span>
                        <span>Berita terkini</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>Belum ada berita</h3>
                <p>Artikel berita belum tersedia.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <p>
          © 2026 Portal Manajemen &amp; Informasi Tim
        </p>
        <p>
          Dibuat dengan React untuk Pelatihan Fullstack
        </p>
      </footer>
    </div>
  );
}

export default App;
