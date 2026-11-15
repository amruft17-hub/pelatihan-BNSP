
import { useParams, Link } from 'react-router-dom';

export default function MemberDetailPage({ members }) {
  const { id } = useParams();

  // Mencari anggota berdasarkan ID (mendukung format angka maupun UUID)
  const member = members.find((m) => String(m.id) === String(id));

  // Penanganan aman jika data ID tidak ditemukan
  if (!member) {
    return (
      <div className="not-found-container">
        <h2>Anggota Tidak Ditemukan!</h2>

        <p>
          Data dengan ID #{id} tidak terdaftar di direktori.
        </p>

        <Link to="/" className="btn-primary">
          ← Kembali ke Direktori
        </Link>
      </div>
    );
  }

  // Mengecek status anggota
  const isOnline = member.status === 'Online';

  return (
    <div className="profile-detail-container">
      {/* Tombol Kembali */}
      <Link to="/" className="btn-back">
        ← Kembali ke Direktori Tim
      </Link>

      {/* Kartu Detail Profil */}
      <div className="profile-card">
        {/* Avatar */}
        <img
          src={member.avatar}
          alt={member.name}
          className="avatar-large"
        />

        {/* Nama Anggota */}
        <h2>{member.name}</h2>

        {/* Jabatan */}
        <p className="profile-role">
          {member.role}
        </p>

        {/* Status Online / Offline */}
        <span className={isOnline ? 'badge-on' : 'badge-off'}>
          {isOnline ? '● Online' : '○ Offline'}
        </span>

        {/* Email Anggota */}
        <p className="profile-email">
          📧 {member.name.toLowerCase().replace(' ', '.')}
          @perusahaan.com
        </p>

        {/* Biodata */}
        <p className="profile-bio">
          "{member.bio}"
        </p>

        {/* Jumlah Bintang */}
        <div className="profile-stars">
          ⭐ {member.stars} Bintang Apresiasi
        </div>
      </div>
    </div>
  );
}
