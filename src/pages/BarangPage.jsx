import { useCallback, useEffect, useState } from 'react';
import {
  createBarang,
  createKategori,
  deleteBarang,
  deleteKategori,
  fetchBarang,
  fetchKategori,
  updateBarang,
  updateKategori,
} from '../api/barang';
import './BarangPage.css';

export default function BarangPage() {
  const [barangList, setBarangList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('all');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    kategoriId: '',
    stok: 0,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [isCategorySaving, setIsCategorySaving] = useState(false);

  const handleReload = useCallback(async () => {
    try {
      const [barangData, kategoriData] = await Promise.all([
        fetchBarang(),
        fetchKategori(),
      ]);
      if (!Array.isArray(barangData) || !Array.isArray(kategoriData)) {
        throw new Error('Respons server inventaris tidak valid.');
      }
      setBarangList(barangData);
      setKategoriList(kategoriData);
      setError('');
    } catch (err) {
      setError(err.message || 'Gagal memuat data inventaris barang.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    Promise.all([fetchBarang(), fetchKategori()])
      .then(([barangData, kategoriData]) => {
        if (ignore) return;
        if (!Array.isArray(barangData) || !Array.isArray(kategoriData)) {
          throw new Error('Respons server inventaris tidak valid.');
        }
        setBarangList(barangData);
        setKategoriList(kategoriData);
        setError('');
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Gagal memuat data inventaris barang.');
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      nama: '',
      kategoriId: kategoriList[0]?.id ? String(kategoriList[0].id) : '',
      stok: 0,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      nama: item.nama,
      kategoriId: String(item.kategoriId || '1'),
      stok: item.stok,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setFormError('Nama barang tidak boleh kosong.');
      return;
    }
    if (Number(formData.stok) < 0) {
      setFormError('Stok barang tidak boleh negatif.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingId !== null) {
        const updated = await updateBarang(editingId, formData);

        setBarangList((prev) =>
          prev.map((item) => (item.id === editingId ? { ...item, ...updated } : item))
        );
      } else {
        const created = await createBarang(formData);

        setBarangList((prev) => [created, ...prev]);
      }
      handleCloseModal();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus "${nama}"?`)) {
      return;
    }

    try {
      await deleteBarang(id);
      setBarangList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || 'Gagal menghapus barang.');
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setCategoryError('');
    setIsCategorySaving(true);
    try {
      if (editingCategoryId !== null) {
        const updated = await updateKategori(editingCategoryId, categoryName);
        setKategoriList((previous) =>
          previous.map((category) =>
            category.id === updated.id ? updated : category
          )
        );
        setBarangList((previous) =>
          previous.map((item) =>
            item.kategoriId === updated.id
              ? { ...item, kategori: updated.nama }
              : item
          )
        );
      } else {
        const created = await createKategori(categoryName);
        setKategoriList((previous) =>
          [...previous, created].sort((a, b) => a.nama.localeCompare(b.nama))
        );
      }
      setEditingCategoryId(null);
      setCategoryName('');
    } catch (err) {
      setCategoryError(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setIsCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Hapus kategori "${category.nama}"?`)) return;
    setCategoryError('');
    try {
      await deleteKategori(category.id);
      setKategoriList((previous) =>
        previous.filter((item) => item.id !== category.id)
      );
      if (String(selectedKategori) === String(category.id)) {
        setSelectedKategori('all');
      }
    } catch (err) {
      setCategoryError(err.message || 'Gagal menghapus kategori.');
    }
  };

  // Filtered List
  const filteredBarang = barangList.filter((item) => {
    const matchesSearch = item.nama
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedKategori === 'all' ||
      String(item.kategoriId) === String(selectedKategori) ||
      item.kategori?.toLowerCase() === selectedKategori.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const totalStok = barangList.reduce((acc, curr) => acc + (Number(curr.stok) || 0), 0);
  const lowStockCount = barangList.filter((item) => (Number(item.stok) || 0) < 5).length;

  return (
    <div className="barang-page">
      <header className="barang-header">
        <div className="barang-heading">
          <span className="barang-eyebrow">INVENTARIS & DATABASE</span>
          <h1>Manajemen Data Barang</h1>
          <p>
            Kelola data persediaan barang, stok, dan kategori secara real-time
            terhubung dengan database MySQL.
          </p>
        </div>

        <button
          type="button"
          className="btn-add-barang"
          onClick={handleOpenAddModal}
        >
          <span aria-hidden="true">➕</span> Tambah Barang
        </button>
      </header>

      {/* Statistik Cepat */}
      <div className="barang-stats-grid">
        <div className="barang-stat-card">
          <span className="stat-label">Total Jenis Barang</span>
          <span className="stat-value">{barangList.length}</span>
        </div>
        <div className="barang-stat-card">
          <span className="stat-label">Total Stok Tersedia</span>
          <span className="stat-value">{totalStok}</span>
        </div>
        <div className="barang-stat-card">
          <span className="stat-label">Stok Kritis (&lt; 5)</span>
          <span className={`stat-value ${lowStockCount > 0 ? 'text-warning' : ''}`}>
            {lowStockCount}
          </span>
        </div>
      </div>

      {error && (
        <div className="barang-alert-banner">
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              handleReload();
            }}
          >
            {isLoading ? 'Memuat...' : 'Muat Ulang'}
          </button>
        </div>
      )}

      {/* Filter dan Pencarian */}
      <div className="barang-toolbar">
        <div className="barang-search-box">
          <span aria-hidden="true" className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Cari nama barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="barang-filter-category">
          <label htmlFor="kategori-filter">Kategori:</label>
          <select
            id="kategori-filter"
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            {kategoriList.map((kat) => (
              <option key={kat.id} value={kat.id}>
                {kat.nama}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-manage-categories"
            onClick={() => setShowCategoryManager((open) => !open)}
          >
            {showCategoryManager ? 'Tutup kategori' : 'Kelola kategori'}
          </button>
        </div>
      </div>

      {showCategoryManager && (
        <section className="category-manager" aria-labelledby="category-title">
          <div className="category-manager-heading">
            <div>
              <h2 id="category-title">Kategori barang</h2>
              <p>Tambah, ubah nama, atau hapus kategori yang tidak digunakan.</p>
            </div>
          </div>
          <form className="category-form" onSubmit={handleCategorySubmit}>
            <label htmlFor="category-name">
              {editingCategoryId !== null ? 'Ubah nama kategori' : 'Nama kategori baru'}
            </label>
            <input
              id="category-name"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              maxLength={80}
              required
            />
            <button type="submit" disabled={isCategorySaving}>
              {isCategorySaving ? 'Menyimpan...' : editingCategoryId !== null ? 'Simpan perubahan' : 'Tambah kategori'}
            </button>
            {editingCategoryId !== null && (
              <button
                type="button"
                className="category-cancel"
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryName('');
                }}
                disabled={isCategorySaving}
              >
                Batal
              </button>
            )}
          </form>
          {categoryError && <p className="category-error" role="alert">{categoryError}</p>}
          <ul className="category-list">
            {kategoriList.map((category) => (
              <li key={category.id}>
                <span>{category.nama}</span>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(category.id);
                      setCategoryName(category.nama);
                      setCategoryError('');
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="category-delete"
                    onClick={() => handleDeleteCategory(category)}
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Konten / Tabel Barang */}
      {isLoading ? (
        <div className="barang-loading">
          <div className="barang-spinner" />
          <p>Memuat inventaris barang...</p>
        </div>
      ) : filteredBarang.length === 0 ? (
        <div className="barang-empty">
          <span className="empty-icon">📦</span>
          <h3>Tidak ada barang yang ditemukan</h3>
          <p>Coba gunakan kata kunci pencarian lain atau tambahkan barang baru.</p>
        </div>
      ) : (
        <div className="barang-table-wrapper">
          <table className="barang-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: '80px' }}>ID</th>
                <th scope="col">Nama Barang</th>
                <th scope="col">Kategori</th>
                <th scope="col" style={{ width: '120px' }}>Stok</th>
                <th scope="col" style={{ width: '150px' }}>Status</th>
                <th scope="col" style={{ width: '160px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBarang.map((item) => {
                const stokNum = Number(item.stok) || 0;
                let statusBadge = { label: 'Tersedia', className: 'status-in-stock' };
                if (stokNum === 0) {
                  statusBadge = { label: 'Habis', className: 'status-out-of-stock' };
                } else if (stokNum < 5) {
                  statusBadge = { label: 'Menipis', className: 'status-low-stock' };
                }

                return (
                  <tr key={item.id}>
                    <td className="col-id">#{item.id}</td>
                    <td className="col-nama">
                      <strong>{item.nama}</strong>
                    </td>
                    <td className="col-kategori">
                      <span className="badge-kategori">
                        {item.kategori || 'Elektronik'}
                      </span>
                    </td>
                    <td className="col-stok">
                      <strong>{stokNum}</strong> unit
                    </td>
                    <td>
                      <span className={`badge-status ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleOpenEditModal(item)}
                        title="Edit Barang"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDelete(item.id, item.nama)}
                        title="Hapus Barang"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah / Edit Barang */}
      {showModal && (
        <div className="barang-modal-backdrop" onClick={handleCloseModal}>
          <div
            className="barang-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h2>{editingId !== null ? 'Edit Data Barang' : 'Tambah Barang Baru'}</h2>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {formError && (
                <div className="modal-error-message">{formError}</div>
              )}

              <div className="form-group">
                <label htmlFor="nama">Nama Barang *</label>
                <input
                  id="nama"
                  type="text"
                  required
                  placeholder="Contoh: Monitor LED 24 Inch"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="kategoriId">Kategori *</label>
                <select
                  id="kategoriId"
                  value={formData.kategoriId}
                  required
                  onChange={(e) =>
                    setFormData({ ...formData, kategoriId: e.target.value })
                  }
                >
                  {kategoriList.length === 0 && <option value="">Belum ada kategori</option>}
                  {kategoriList.map((kat) => (
                    <option key={kat.id} value={kat.id}>
                      {kat.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="stok">Jumlah Stok *</label>
                <input
                  id="stok"
                  type="number"
                  min="0"
                  required
                  value={formData.stok}
                  onChange={(e) =>
                    setFormData({ ...formData, stok: e.target.value })
                  }
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}