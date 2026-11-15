import { Link } from 'react-router-dom';

function TeamCard(props) {
  // Mendukung format passing props member={...} maupun destructuring langsung
  const data = props.member || props;
  const id = data.id;
  const name = data.name || data.namaLengkap || 'Anggota Tim';
  const role = data.role || data.posisi || 'Frontend Dev';
  const email = data.email || '';
  const avatar = data.avatar;
  const status = data.status || 'Online';
  const stars = data.stars ?? data.rating ?? 0;
  const bio = data.bio || 'Belum ada deskripsi anggota.';

  const isOnline = status === 'Online';

  const handleToggle = () => {
    if (props.onToggleStatus) props.onToggleStatus(id);
    else if (props.onToggle) props.onToggle(id);
  };

  const handleStar = () => {
    if (props.onAddStar) props.onAddStar(id);
    else if (props.onGiveStar) props.onGiveStar(id);
  };

  const handleDelete = () => {
    if (props.onDeleteMember) props.onDeleteMember(id);
    else if (props.onDelete) props.onDelete(id);
  };

  const handleEdit = () => {
    if (props.onEditMember) {
      props.onEditMember({ id, name, role, email, avatar, status, stars, bio });
    }
  };

  return (
    <div className="team-card">
      <img
        src={avatar || `https://i.pravatar.cc/150?u=${id}`}
        alt={name}
        className="card-avatar"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = 'https://placehold.co/100x100?text=User';
        }}
      />

      <div className="card-info">
        <h3 className="card-name">{name}</h3>
        <p className="card-role">{role}</p>
        <p className="card-bio">{bio}</p>

        <div className="card-badges">
          <span className={`badge ${isOnline ? 'badge-online' : 'badge-offline'}`}>
            • {status}
          </span>
          <span className="badge-stars">⭐ {stars} Bintang</span>
        </div>

        <div className="card-actions">
          <button type="button" className="btn-star" onClick={handleStar}>
            ⭐ Beri Bintang
          </button>
          <button
            type="button"
            className="btn-status-toggle"
            onClick={handleToggle}
          >
            Ubah ke {isOnline ? 'Offline' : 'Online'}
          </button>
          {(props.onEditMember || props.onEdit) && (
            <button
              type="button"
              className="btn-edit-member"
              onClick={handleEdit}
            >
              ✏️ Edit
            </button>
          )}
          {(props.onDeleteMember || props.onDelete) && (
            <button
              type="button"
              className="btn-delete-member"
              onClick={handleDelete}
            >
              🗑️ Hapus
            </button>
          )}
        </div>

        <Link to={`/member/${id}`} className="btn-view-profile">
          Lihat profil detail →
        </Link>
      </div>
    </div>
  );
}

export default TeamCard;
