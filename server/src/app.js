import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';
import Parser from 'rss-parser';
import { pool } from './db.js';
import {
  createBarangSchema,
  createMemberSchema,
  updateBarangSchema,
  updateMemberSchema,
  createKategoriSchema,
  updateKategoriSchema,
} from './schema.js';

const COLUMNS = 'id, nama_lengkap, email, posisi, status, rating, avatar, bio';

const BARANG_COLUMNS = 'b.id, b.nama, b.kategori_id, k.nama AS kategori, b.stok';

// Pemetaan kolom snake_case (MySQL) → field camelCase (kontrak API/frontend)
function mapRow(row) {
  return {
    id: row.id,
    namaLengkap: row.nama_lengkap,
    email: row.email,
    posisi: row.posisi,
    status: row.status,
    rating: row.rating,
    avatar: row.avatar,
    bio: row.bio,
  };
}

function mapBarangRow(row) {
  return {
    id: row.id,
    nama: row.nama,
    kategoriId: row.kategori_id,
    kategori: row.kategori,
    stok: row.stok,
  };
}

// ID dari URL harus bilangan bulat positif; selain itu dianggap tidak valid.
function parseId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function findBarangById(id) {
  const [rows] = await pool.query(
    `SELECT ${BARANG_COLUMNS} FROM barang b
     JOIN kategori k ON k.id = b.kategori_id
     WHERE b.id = ?`,
    [id]
  );
  return rows.length > 0 ? mapBarangRow(rows[0]) : null;
}

async function kategoriExists(id) {
  const [rows] = await pool.query('SELECT id FROM kategori WHERE id = ?', [id]);
  return rows.length > 0;
}

// ======================================================
// RSS NEWS SERVICE (CNN INDONESIA & KOMPAS)
// ======================================================
const NEWS_CACHE_TTL_MS = 5 * 60 * 1000;
const NEWS_ARTICLE_LIMIT = 12;
const NEWS_IMAGE_CONCURRENCY = 4;
const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content', { keepArray: true }],
      ['media:thumbnail', 'media:thumbnail', { keepArray: true }],
    ],
  },
});

const NEWS_SOURCES = {
  cnn: {
    label: 'CNN Indonesia',
    urls: ['https://www.cnnindonesia.com/rss'],
  },
  kompas: {
    label: 'Kompas',
    urls: [
      'https://www.bing.com/news/search?q=site%3Akompas.com%2Fread&format=rss&mkt=id-ID&setlang=id&cc=id',
      'https://www.bing.com/news/search?q=site%3Akompas.id%2Fartikel&format=rss&mkt=id-ID&setlang=id&cc=id',
    ],
  },
};

const newsCache = {};

function normalizeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function isKompasHost(hostname) {
  return ['kompas.com', 'kompas.id'].some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

function normalizeKompasArticleUrl(value) {
  const link = normalizeHttpUrl(value);
  if (!link) return null;

  let url = new URL(link);
  if (
    (url.hostname === 'www.bing.com' || url.hostname === 'bing.com') &&
    url.pathname === '/news/apiclick.aspx' &&
    !url.port &&
    !url.username &&
    !url.password
  ) {
    const articleUrl = normalizeHttpUrl(url.searchParams.get('url'));
    if (!articleUrl) return null;
    url = new URL(articleUrl);
  }

  if (
    url.protocol !== 'https:' ||
    (url.port && url.port !== '443') ||
    url.username ||
    url.password ||
    !isKompasHost(url.hostname) ||
    !/^\/(?:read|artikel)\//.test(url.pathname)
  ) {
    return null;
  }

  return url.href;
}

function getMediaImageUrl(item) {
  const mediaItems = [
    item['media:content'],
    item['media:thumbnail'],
  ].flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []));

  return mediaItems.find((media) => media?.$?.url)?.$?.url || null;
}

function normalizeNewsItem(item, sourceLabel) {
  const link = sourceLabel === 'Kompas'
    ? normalizeKompasArticleUrl(item?.link)
    : normalizeHttpUrl(item?.link);
  if (!item?.title || !link) return null;

  const content = [
    item['content:encoded'],
    item.content,
    item.contentSnippet,
    item.description,
    item.summary,
  ].filter(Boolean).join(' ');

  const imageMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  const imageUrl =
    item.enclosure?.url ||
    getMediaImageUrl(item) ||
    imageMatch?.[1] ||
    item.image?.url ||
    null;
  const publishedAt = item.isoDate || item.pubDate || null;
  const parsedDate = publishedAt ? new Date(publishedAt) : null;
  const date = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(parsedDate)
    : 'Tanggal tidak tersedia';

  const description = String(
    item.contentSnippet || item.summary || item.description || 'Buka artikel untuk membaca berita selengkapnya.'
  )
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    id: item.guid || link,
    title: item.title,
    description,
    image: normalizeHttpUrl(imageUrl),
    link,
    url: link,
    source: sourceLabel,
    category: sourceLabel,
    publishedAt,
    date,
  };
}

function readHtmlAttribute(tag, attribute) {
  const match = tag.match(
    new RegExp(`\\b${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  );
  return (match?.[1] || match?.[2] || match?.[3] || '').replace(/&amp;/g, '&');
}

function extractOpenGraphImage(html) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    const name = (
      readHtmlAttribute(tag, 'property') ||
      readHtmlAttribute(tag, 'name')
    ).toLowerCase();
    if (name === 'og:image' || name === 'og:image:url' || name === 'twitter:image') {
      const image = normalizeHttpUrl(readHtmlAttribute(tag, 'content'));
      if (image) return image;
    }
  }
  return null;
}

async function fetchKompasArticleImage(link) {
  let articleUrl = normalizeKompasArticleUrl(link);
  if (!articleUrl) return null;

  for (let redirects = 0; redirects <= 2; redirects += 1) {
    const url = new URL(articleUrl);
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; DirektoriTim/1.0)',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      const redirectedUrl = normalizeKompasArticleUrl(new URL(location, url).href);
      if (!redirectedUrl) return null;
      articleUrl = redirectedUrl;
      continue;
    }

    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return null;
    }

    return extractOpenGraphImage(await response.text());
  }

  return null;
}

async function addKompasArticleImages(articles) {
  const visibleArticles = articles.slice(0, NEWS_ARTICLE_LIMIT);
  let nextIndex = 0;

  async function enrichNextArticle() {
    while (nextIndex < visibleArticles.length) {
      const index = nextIndex;
      nextIndex += 1;
      const article = visibleArticles[index];
      if (article.image) continue;

      try {
        article.image = await fetchKompasArticleImage(article.link);
      } catch (error) {
        console.warn(`[news] Gagal mengambil gambar artikel Kompas:`, error.message);
      }
    }
  }

  const workerCount = Math.min(NEWS_IMAGE_CONCURRENCY, visibleArticles.length);
  await Promise.all(Array.from({ length: workerCount }, () => enrichNextArticle()));
  return visibleArticles;
}

async function readNewsFeed(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml',
      'User-Agent': 'Mozilla/5.0 (compatible; DirektoriTim/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const xml = await response.text();
  if (!xml.trim().startsWith('<')) {
    throw new Error('Respons sumber bukan XML RSS yang valid.');
  }

  return rssParser.parseString(xml);
}

async function fetchNewsFromSource(source) {
  const config = NEWS_SOURCES[source];
  if (!config) {
    throw new Error('Sumber berita tidak dikenal.');
  }

  const now = Date.now();
  const cached = newsCache[source];
  if (cached?.data?.length && now < cached.expiresAt) {
    return { articles: cached.data, cached: true, updatedAt: cached.updatedAt };
  }

  const collected = [];
  for (const url of config.urls) {
    try {
      const feed = await readNewsFeed(url);
      const items = (feed.items || [])
        .map((item) => normalizeNewsItem(item, config.label))
        .filter(Boolean);
      collected.push(...items);
    } catch (err) {
      console.warn(`[news] Gagal mengambil dari ${url}:`, err.message);
    }
  }

  let uniqueArticles = Array.from(
    new Map(collected.map((a) => [a.link, a])).values()
  );

  if (source === 'kompas') {
    uniqueArticles = await addKompasArticleImages(uniqueArticles);
  } else {
    uniqueArticles = uniqueArticles.slice(0, NEWS_ARTICLE_LIMIT);
  }

  newsCache[source] = {
    data: uniqueArticles,
    expiresAt: now + NEWS_CACHE_TTL_MS,
    updatedAt: new Date().toISOString(),
  };

  return { articles: uniqueArticles, cached: false, updatedAt: new Date().toISOString() };
}

// Express 5 meneruskan error async otomatis; helper ini menjaga kompatibilitas Express 4.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function validate(schema, body) {
  const result = schema.safeParse(body);
  if (result.success) return { data: result.data };

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field !== undefined && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }

  return { errors, message: result.error.issues[0].message };
}

export function createApp() {
  const app = express();

  // Bagian 4: izinkan frontend dari origin (port) berbeda.
  // Default: Vite dev di localhost/127.0.0.1 port 5173 atau 5174.
  // Ubah lewat CORS_ORIGIN di .env (pisahkan dengan koma bila lebih dari satu).
  const allowedOrigins = (
    process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Backend Direktori Tim berjalan.',
      timestamp: new Date().toISOString(),
    });
  });

  // Daftar anggota (urut dari yang paling lama agar seed tampil sesuai spesifikasi)
  app.get(
    '/api/members',
    asyncHandler(async (req, res) => {
      const [rows] = await pool.query(
        `SELECT ${COLUMNS} FROM members ORDER BY created_at ASC, id ASC`
      );
      res.json(rows.map(mapRow));
    })
  );

  // Tambah anggota: id, status, rating, dan avatar ditentukan server
  app.post(
    '/api/members',
    asyncHandler(async (req, res) => {
      const parsed = validate(createMemberSchema, req.body);
      if (parsed.errors) {
        return res.status(400).json({
          message: parsed.message,
          errors: parsed.errors,
        });
      }

      const id = randomUUID();
      const member = {
        id,
        ...parsed.data,
        status: 'Online',
        rating: 0,
        avatar: parsed.data.avatar || `https://i.pravatar.cc/150?u=${id}`,
        bio: parsed.data.bio || '',
      };

      await pool.query(
        `INSERT INTO members (id, nama_lengkap, email, posisi, status, rating, avatar, bio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          member.id,
          member.namaLengkap,
          member.email,
          member.posisi,
          member.status,
          member.rating,
          member.avatar,
          member.bio,
        ]
      );

      res.status(201).json(member);
    })
  );

  // Ubah anggota (body boleh sebagian)
  app.put(
    '/api/members/:id',
    asyncHandler(async (req, res) => {
      const parsed = validate(updateMemberSchema, req.body);
      if (parsed.errors) {
        return res.status(400).json({
          message: parsed.message,
          errors: parsed.errors,
        });
      }

      const columnByField = {
        namaLengkap: 'nama_lengkap',
        email: 'email',
        posisi: 'posisi',
        status: 'status',
        rating: 'rating',
        avatar: 'avatar',
        bio: 'bio',
      };

      const assignments = [];
      const values = [];
      for (const [field, column] of Object.entries(columnByField)) {
        if (parsed.data[field] !== undefined) {
          assignments.push(`${column} = ?`);
          values.push(parsed.data[field]);
        }
      }

      await pool.query(`UPDATE members SET ${assignments.join(', ')} WHERE id = ?`, [
        ...values,
        req.params.id,
      ]);

      const [rows] = await pool.query(
        `SELECT ${COLUMNS} FROM members WHERE id = ?`,
        [req.params.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Anggota tim tidak ditemukan' });
      }

      res.json(mapRow(rows[0]));
    })
  );

  // Hapus anggota
  app.delete(
    '/api/members/:id',
    asyncHandler(async (req, res) => {
      const [result] = await pool.query('DELETE FROM members WHERE id = ?', [
        req.params.id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Anggota tim tidak ditemukan' });
      }

      res.status(204).end();
    })
  );

  // Daftar kategori (dipakai untuk dropdown form barang)
  app.get(
    '/api/kategori',
    asyncHandler(async (req, res) => {
      const [rows] = await pool.query(
        'SELECT id, nama FROM kategori ORDER BY nama ASC'
      );
      res.json(rows);
    })
  );

  app.post(
    '/api/kategori',
    asyncHandler(async (req, res) => {
      const parsed = validate(createKategoriSchema, req.body);
      if (parsed.errors) {
        return res.status(400).json({
          message: parsed.message,
          errors: parsed.errors,
        });
      }

      try {
        const [result] = await pool.query(
          'INSERT INTO kategori (nama) VALUES (?)',
          [parsed.data.nama]
        );
        return res.status(201).json({ id: result.insertId, nama: parsed.data.nama });
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Nama kategori sudah digunakan' });
        }
        throw error;
      }
    })
  );

  app.put(
    '/api/kategori/:id',
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: 'ID kategori harus berupa angka positif' });
      }

      const parsed = validate(updateKategoriSchema, req.body);
      if (parsed.errors) {
        return res.status(400).json({
          message: parsed.message,
          errors: parsed.errors,
        });
      }

      try {
        await pool.query('UPDATE kategori SET nama = ? WHERE id = ?', [
          parsed.data.nama,
          id,
        ]);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Nama kategori sudah digunakan' });
        }
        throw error;
      }

      const [rows] = await pool.query('SELECT id, nama FROM kategori WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Kategori tidak ditemukan' });
      }

      return res.json(rows[0]);
    })
  );

  app.delete(
    '/api/kategori/:id',
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: 'ID kategori harus berupa angka positif' });
      }

      try {
        const [result] = await pool.query('DELETE FROM kategori WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        }
      } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
          return res.status(409).json({
            message: 'Kategori masih digunakan oleh barang dan tidak dapat dihapus',
          });
        }
        throw error;
      }

      return res.status(204).end();
    })
  );

  // Daftar barang + nama kategori (query JOIN)
  app.get(
    '/api/barang',
    asyncHandler(async (req, res) => {
      const [rows] = await pool.query(
        `SELECT ${BARANG_COLUMNS} FROM barang b
         JOIN kategori k ON k.id = b.kategori_id
         ORDER BY b.id ASC`
      );
      res.json(rows.map(mapBarangRow));
    })
  );

  app.get(
    '/api/barang/:id',
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: 'ID barang harus berupa angka positif' });
      }

      const barang = await findBarangById(id);
      if (!barang) {
        return res.status(404).json({ message: 'Barang tidak ditemukan' });
      }

      res.json(barang);
    })
  );

  // Tambah barang: nama wajib, stok bilangan bulat >= 0, kategori harus ada.
  app.post(
    '/api/barang',
    asyncHandler(async (req, res) => {
      const parsed = validate(createBarangSchema, req.body);
      if (parsed.errors) {
        return res.status(400).json({
          message: parsed.message,
          errors: parsed.errors,
        });
      }

      if (!(await kategoriExists(parsed.data.kategoriId))) {
        return res.status(400).json({
          message: 'Kategori tidak ditemukan',
          errors: { kategoriId: 'Kategori tidak ditemukan' },
        });
      }

      const [result] = await pool.query(
        'INSERT INTO barang (nama, kategori_id, stok) VALUES (?, ?, ?)',
        [parsed.data.nama, parsed.data.kategoriId, parsed.data.stok]
      );

      res.status(201).json(await findBarangById(result.insertId));
    })
  );

  // PUT dan PATCH memakai handler yang sama (body boleh sebagian).
  const updateBarang = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: 'ID barang harus berupa angka positif' });
    }

    const parsed = validate(updateBarangSchema, req.body);
    if (parsed.errors) {
      return res.status(400).json({
        message: parsed.message,
        errors: parsed.errors,
      });
    }

    const existing = await findBarangById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }

    if (parsed.data.kategoriId !== undefined && !(await kategoriExists(parsed.data.kategoriId))) {
      return res.status(400).json({
        message: 'Kategori tidak ditemukan',
        errors: { kategoriId: 'Kategori tidak ditemukan' },
      });
    }

    const columnByField = { nama: 'nama', kategoriId: 'kategori_id', stok: 'stok' };
    const assignments = [];
    const values = [];
    for (const [field, column] of Object.entries(columnByField)) {
      if (parsed.data[field] !== undefined) {
        assignments.push(`${column} = ?`);
        values.push(parsed.data[field]);
      }
    }

    await pool.query(`UPDATE barang SET ${assignments.join(', ')} WHERE id = ?`, [
      ...values,
      id,
    ]);

    res.json(await findBarangById(id));
  });

  app.put('/api/barang/:id', updateBarang);
  app.patch('/api/barang/:id', updateBarang);

  app.delete(
    '/api/barang/:id',
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: 'ID barang harus berupa angka positif' });
      }

      const [result] = await pool.query('DELETE FROM barang WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Barang tidak ditemukan' });
      }

      res.status(204).end();
    })
  );

  // Endpoint Berita RSS (CNN & Kompas)
  const handleNewsRequest = asyncHandler(async (req, res) => {
    const source = String(req.params.source || req.query.source || 'cnn').toLowerCase();
    if (!Object.hasOwn(NEWS_SOURCES, source)) {
      return res.status(400).json({
        success: false,
        message: 'Sumber berita tidak dikenal. Gunakan cnn atau kompas.',
        articles: [],
      });
    }

    try {
      const result = await fetchNewsFromSource(source);
      return res.json({
        success: true,
        source: NEWS_SOURCES[source].label,
        updatedAt: result.updatedAt,
        cached: result.cached,
        articles: result.articles,
      });
    } catch (error) {
      console.error(`[server] Berita ${NEWS_SOURCES[source].label} gagal:`, error.message);
      return res.status(502).json({
        success: false,
        message: `Berita ${NEWS_SOURCES[source].label} sementara tidak tersedia.`,
        articles: [],
      });
    }
  });

  app.get('/api/news', handleNewsRequest);
  app.get('/api/news/:source', handleNewsRequest);

  app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint tidak ditemukan' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Body JSON tidak valid' });
    }
    console.error('[server] Kesalahan tak terduga:', err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  });

  return app;
}
