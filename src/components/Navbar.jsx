
import { NavLink } from 'react-router-dom';

export default function Navbar({ totalMembers }) {
  // Helper untuk class aktif otomatis
  const getLinkClass = ({ isActive }) =>
    isActive ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar-container">
      {/* Logo dan Judul */}
      <div className="navbar-brand">
        <span className="brand-icon">⚡</span>
        <span className="brand-title">Direktori Tim</span>
      </div>

      {/* Menu Navigasi */}
      <div className="navbar-menu">
        {/* Prop end agar rute "/" tidak selalu aktif */}
        <NavLink to="/" end className={getLinkClass}>
          👥 Direktori
        </NavLink>

        <NavLink to="/news" className={getLinkClass}>
          📰 Berita Terkini
        </NavLink>
      </div>

      {/* Jumlah Anggota */}
      <div className="navbar-meta">
        <span className="badge-count">
          {totalMembers} Anggota
        </span>
      </div>
    </nav>
  );
}
