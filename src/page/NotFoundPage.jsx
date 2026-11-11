
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found-container">
      {/* Kode Error */}
      <h1 className="not-found-code">
        404
      </h1>

      {/* Judul Halaman */}
      <h2>
        Ups! Halaman Tidak Ditemukan
      </h2>

      {/* Pesan Error */}
      <p>
        Tautan yang Anda tuju mungkin sudah dipindahkan,
        kedaluwarsa, atau alamat URL salah diketik.
      </p>

      {/* Tombol Kembali */}
      <Link to="/" className="btn-primary">
        🏠 Kembali ke Direktori Tim
      </Link>
    </div>
  );
}
