
import { useState } from 'react';
import AddMemberForm from '../components/AddMemberForm';
import TeamCard from '../components/TeamCard';

export default function TeamPage({
  members,
  onAddMember,
  onToggle,
  onGiveStar,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOnline, setFilterOnline] = useState(false);

  // Statistik anggota
  const totalMembers = members.length;

  const onlineMembers = members.filter(
    (member) => member.status === 'Online'
  ).length;

  const offlineMembers = totalMembers - onlineMembers;

  // Filter nama dan status anggota
  const filteredMembers = members.filter((member) => {
    const matchName = member.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchStatus = filterOnline
      ? member.status === 'Online'
      : true;

    return matchName && matchStatus;
  });

  return (
    <div className="directory-container">

      {/* Header Halaman */}
      <div className="page-header">
        <div>
          <span className="page-subtitle">
            TEAM WORKSPACE
          </span>

          <h1>Direktori Tim</h1>

          <p>
            Kelola anggota tim, pantau aktivitas, dan apresiasi
            kontribusi mereka.
          </p>
        </div>
      </div>

      {/* Statistik Anggota */}
      <div className="stats-bar">

        {/* Total Members */}
        <div className="stat-box">
          <span className="stat-label">
            Total Members
          </span>

          <span className="stat-num">
            {totalMembers}
          </span>

          <span className="stat-description">
            Seluruh anggota tim
          </span>
        </div>

        {/* Online */}
        <div className="stat-box">
          <span className="stat-label">
            Online
          </span>

          <span className="stat-num online">
            {onlineMembers}
          </span>

          <span className="stat-description">
            Anggota sedang online
          </span>
        </div>

        {/* Offline */}
        <div className="stat-box">
          <span className="stat-label">
            Offline
          </span>

          <span className="stat-num offline">
            {offlineMembers}
          </span>

          <span className="stat-description">
            Anggota sedang offline
          </span>
        </div>

      </div>

      {/* Form Tambah Anggota */}
      <AddMemberForm
        onAddMember={onAddMember}
      />

      {/* Pencarian dan Filter */}
      <div className="search-bar">

        <input
          type="text"
          placeholder="🔍 Cari nama anggota tim..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <button
          type="button"
          onClick={() => setFilterOnline(!filterOnline)}
          className={`filter-btn ${
            filterOnline ? 'active' : ''
          }`}
        >
          {filterOnline
            ? '🟢 Tampilkan Semua'
            : '⚪ Hanya Online'}
        </button>

      </div>

      {/* Grid Kartu Anggota */}
      <div className="team-grid">

        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <TeamCard
              key={member.id}
              member={member}
              onToggle={onToggle}
              onGiveStar={onGiveStar}
            />
          ))
        ) : (
          <div className="empty-state">
            <h3>Anggota Tidak Ditemukan</h3>

            <p>
              Tidak ada anggota yang sesuai dengan pencarian.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
