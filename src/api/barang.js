// Klien REST API untuk data barang dan kategori.
const BARANG_ENDPOINT = '/api/barang';
const KATEGORI_ENDPOINT = '/api/kategori';

export const fallbackKategori = [];
export const fallbackBarang = [];

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const fieldError = data?.errors ? Object.values(data.errors)[0] : null;
    throw new Error(fieldError || data?.message || `Permintaan gagal (HTTP ${res.status})`);
  }

  return data;
}

export function fetchKategori() {
  return request(KATEGORI_ENDPOINT);
}

export const listKategori = fetchKategori;

export function fetchBarang() {
  return request(BARANG_ENDPOINT);
}

export const listBarang = fetchBarang;

export function createBarang(formData) {
  return request(BARANG_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

export function updateBarang(id, changes) {
  return request(`${BARANG_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  });
}

export function deleteBarang(id) {
  return request(`${BARANG_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function createKategori(nama) {
  return request(KATEGORI_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ nama }),
  });
}

export function updateKategori(id, nama) {
  return request(`${KATEGORI_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ nama }),
  });
}

export function deleteKategori(id) {
  return request(`${KATEGORI_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
