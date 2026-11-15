// Klien REST API untuk data anggota tim
const ENDPOINT = '/api/members';

export const fallbackMembers = [
  {
    id: 1,
    name: 'Budi Santoso',
    namaLengkap: 'Budi Santoso',
    email: 'budi.santoso@perusahaan.com',
    role: 'Frontend Dev',
    posisi: 'Frontend Dev',
    bio: 'Mengembangkan antarmuka aplikasi web modern dan responsif.',
    avatar: 'https://i.pravatar.cc/150?u=1',
    status: 'Online',
    stars: 2,
    rating: 2,
  },
  {
    id: 2,
    name: 'Siti Rahma',
    namaLengkap: 'Siti Rahma',
    email: 'siti.rahma@perusahaan.com',
    role: 'UI/UX Designer',
    posisi: 'UI/UX Designer',
    bio: 'Mendesain pengalaman pengguna yang intuitif dan menarik.',
    avatar: 'https://i.pravatar.cc/150?u=2',
    status: 'Offline',
    stars: 5,
    rating: 5,
  },
  {
    id: 3,
    name: 'Ahmad Fauzi',
    namaLengkap: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@perusahaan.com',
    role: 'Backend Engineer',
    posisi: 'Backend Engineer',
    bio: 'Mengelola database MySQL dan arsitektur REST API terpadu.',
    avatar: 'https://i.pravatar.cc/150?u=3',
    status: 'Online',
    stars: 1,
    rating: 1,
  },
];

export function normalizeMember(m) {
  if (!m) return null;
  const name = m.name || m.namaLengkap || m.nama_lengkap || 'Anggota Tim';
  const role = m.role || m.posisi || 'Frontend Dev';
  const stars = m.stars ?? m.rating ?? 0;
  const bio = m.bio || 'Belum ada bio anggota.';
  const avatar = m.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(m.email || m.id || 'user')}`;

  return {
    id: m.id,
    name,
    namaLengkap: name,
    email: m.email || '',
    role,
    posisi: role,
    status: m.status === 'Offline' ? 'Offline' : 'Online',
    stars,
    rating: stars,
    bio,
    avatar,
  };
}

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

export async function fetchMembers(options) {
  const data = await request(ENDPOINT, options);
  if (!Array.isArray(data)) {
    throw new Error('Respons server tidak berisi daftar anggota yang valid.');
  }
  return data.map(normalizeMember);
}

export const listMembers = fetchMembers;

export async function createMember(formData) {
  const payload = {
    namaLengkap: formData.name || formData.namaLengkap,
    email: formData.email,
    posisi: formData.role || formData.posisi,
    bio: formData.bio || '',
    avatar: formData.avatar || formData.image,
  };

  const created = await request(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeMember({
    ...created,
    bio: formData.bio || 'Belum ada bio anggota.',
  });
}

export async function updateMember(id, changes) {
  const payload = {};

  if (changes.name || changes.namaLengkap) {
    payload.namaLengkap = changes.name || changes.namaLengkap;
  }
  if (changes.email) {
    payload.email = changes.email;
  }
  if (changes.role || changes.posisi) {
    payload.posisi = changes.role || changes.posisi;
  }
  if (changes.status) {
    payload.status = changes.status;
  }
  if (changes.stars !== undefined || changes.rating !== undefined) {
    payload.rating = changes.stars ?? changes.rating;
  }
  if (changes.bio !== undefined) {
    payload.bio = changes.bio;
  }
  if (changes.avatar || changes.image) {
    payload.avatar = changes.avatar || changes.image;
  }

  const updated = await request(`${ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return normalizeMember({
    ...updated,
    bio: changes.bio ?? updated.bio,
    avatar: changes.avatar || changes.image || updated.avatar,
  });
}

export function deleteMember(id) {
  return request(`${ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
