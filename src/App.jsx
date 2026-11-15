import { useEffect, useState } from 'react';
import './App.css';
import BarangPage from './pages/BarangPage';
import TeamPage from './pages/TeamPage';
import NewsFeed from './components/NewsFeed';
import {
  createMember,
  deleteMember,
  fetchMembers,
  updateMember,
} from './api/members';

const TABS = ['Direktori', 'Data Barang', 'Berita Terkini'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Direktori');
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMembers() {
      setIsLoading(true);
      setError('');
      try {
        const data = await fetchMembers({ signal: controller.signal });
        if (!Array.isArray(data)) {
          throw new Error('Respons server tidak berisi daftar anggota yang valid.');
        }
        setMembers(data);
      } catch (requestError) {
        if (requestError.name === 'AbortError') return;
        setError(
          requestError instanceof TypeError
            ? 'Tidak dapat terhubung ke server API. Pastikan backend berjalan.'
            : requestError.message
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadMembers();
    return () => controller.abort();
  }, [refreshKey]);

  async function handleAddMember(payload) {
    const created = await createMember(payload);
    setMembers((previous) => [...previous, created]);
  }

  async function handleUpdateMember(id, changes) {
    const updated = await updateMember(id, changes);
    setMembers((previous) =>
      previous.map((member) => (member.id === id ? updated : member))
    );
    setSelectedMember((member) => (member?.id === id ? updated : member));
  }

  async function handleDeleteMember(id) {
    await deleteMember(id);
    setMembers((previous) => previous.filter((member) => member.id !== id));
    setSelectedMember((member) => (member?.id === id ? null : member));
  }

  function getMember(id) {
    return members.find((member) => member.id === id);
  }

  async function handleToggleMember(id) {
    const member = getMember(id);
    if (!member) return;
    await handleUpdateMember(id, {
      status: member.status === 'Online' ? 'Offline' : 'Online',
    });
  }

  async function handleGiveStar(id) {
    const member = getMember(id);
    if (!member) return;
    await handleUpdateMember(id, { rating: Number(member.rating || 0) + 1 });
  }

  function viewProfile(member) {
    setSelectedMember(member);
    setActiveTab('Profil');
  }

  return (
    <div className="app">
      <nav className="navbar" aria-label="Navigasi utama">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">👥</span>
          <h2>TEAM WORKSPACE</h2>
        </div>
        <div className="nav-menu">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab}
              className={activeTab === tab ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'Direktori' ? '👥' : tab === 'Data Barang' ? '📦' : '📰'} {tab}
            </button>
          ))}
        </div>
        <div className="profile" aria-hidden="true">👤</div>
      </nav>

      <main className="container">
        {error && (
          <div className="alert" role="alert">
            <div className="alert-icon">!</div>
            <div className="alert-content">
              <h3>Server tidak dapat dihubungi</h3>
              <p>{error}</p>
            </div>
            <button
              type="button"
              className="retry-btn"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={isLoading}
            >
              {isLoading ? 'Memuat...' : 'Coba Lagi'}
            </button>
          </div>
        )}

        {activeTab === 'Direktori' && (
          <>
            {isLoading ? (
              <div className="team-empty" role="status">Memuat daftar anggota...</div>
            ) : (
              <TeamPage
                members={members}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                onToggle={handleToggleMember}
                onGiveStar={handleGiveStar}
                onViewProfile={viewProfile}
              />
            )}
          </>
        )}

        {activeTab === 'Profil' && (
          <section className="content-card profile-detail">
            <button
              type="button"
              className="profile-back"
              onClick={() => setActiveTab('Direktori')}
            >
              ← Kembali ke Direktori
            </button>
            {selectedMember ? (
              <>
                <img
                  src={selectedMember.avatar}
                  alt={`Foto ${selectedMember.name}`}
                  className="profile-detail-avatar"
                />
                <h1>{selectedMember.name}</h1>
                <p className="profile-detail-role">{selectedMember.role}</p>
                <p><strong>Email:</strong> {selectedMember.email || 'Belum diisi'}</p>
                <p>
                  <strong>Status:</strong> {selectedMember.status}
                </p>
                <p>
                  <strong>Bintang apresiasi:</strong> {selectedMember.stars}
                </p>
                <p className="profile-detail-bio">
                  {selectedMember.bio || 'Belum ada deskripsi anggota.'}
                </p>
              </>
            ) : (
              <p>Profil tidak tersedia. Anggota mungkin sudah dihapus.</p>
            )}
          </section>
        )}

        {activeTab === 'Data Barang' && <BarangPage />}

        {activeTab === 'Berita Terkini' && (
          <section className="content-card news-page">
            <span className="section-label">✦ TEAM WORKSPACE</span>
            <h1>Berita Terkini</h1>
            <p>Berita langsung dari CNN Indonesia dan Kompas.</p>
            <NewsFeed />
          </section>
        )}

        <footer>© 2026 Team Workspace. All Rights Reserved.</footer>
      </main>
    </div>
  );
}
