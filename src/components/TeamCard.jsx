
import { Link } from 'react-router-dom';

export default function TeamCard({ member, onToggle, onGiveStar }) {
  const { id, name, role, status, stars, bio, avatar } = member;

  const isOnline = status === 'Online';

  return (
    <div className="team-card">
      {/* Foto Avatar */}
      <img
        src={avatar}
        alt={name}
        className="card-avatar"
      />

      {/* Informasi Anggota */}
      <div className="card-info">
        <h3 className="card-name">{name}</h3>

        <p className="card-role">{role}</p>

        <p className="card-bio">"{bio}"</p>

        {/* Status Online / Offline */}
        <span className={isOnline ? 'badge-on' : 'badge-off'}>
          {isOnline ? '● Online' : '○ Offline'}
        </span>

        {/* Jumlah Bintang */}
        <div className="card-stars">
          ⭐ {stars} Bintang
        </div>

        {/* Tombol Aksi */}
        <div className="card-actions">
          <button
            onClick={() => onGiveStar(id)}
            className="btn-action btn-star"
          >
            ⭐ Beri Bintang
          </button>

          <button
            onClick={() => onToggle(id)}
            className="btn-action btn-toggle"
          >
            {isOnline ? 'Ubah ke Offline' : 'Ubah ke Online'}
          </button>
        </div>

        {/* Tautan SPA ke Rute Dinamis Detail Profil */}
        <Link
          to={`/profile/${id}`}
          className="btn-view-profile"
        >
          Lihat Profil Detail
        </Link>
      </div>
    </div>
  );
}
