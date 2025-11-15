const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { verifyAdminToken } = require('./adminAuth'); // Middleware untuk otentikasi admin
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Konfigurasi Multer untuk penyimpanan sementara di memori
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Hanya file gambar (jpeg, jpg, png, gif, webp) yang diizinkan!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // Batas ukuran file 5MB
});

// Pastikan direktori upload ada
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Endpoint untuk upload gambar
router.post('/upload-image', verifyAdminToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file gambar yang diupload' });
  }

  try {
    const filename = `article-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const outputPath = path.join(uploadDir, filename);

    // Kompresi dan konversi ke WebP
    await sharp(req.file.buffer)
      .resize(1024, null, { withoutEnlargement: true }) // Resize lebar maks 1024px, tinggi auto
      .webp({ quality: 80 }) // Kualitas kompresi
      .toFile(outputPath);

    // URL yang akan dikembalikan ke client
    const imageUrl = `/uploads/${filename}`;

    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses gambar', error: error.message });
  }
});

// Fungsi utilitas untuk mengubah string menjadi slug
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// =================================================================================
// == KATEGORI
// =================================================================================

// [ADMIN] GET semua kategori
router.get('/categories', verifyAdminToken, async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil kategori', error: error.message });
  }
});

// [ADMIN] POST kategori baru
router.post('/categories', verifyAdminToken, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Nama kategori tidak boleh kosong' });
  }
  const slug = slugify(name);

  try {
    const [result] = await db.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
    res.status(201).json({ id: result.insertId, name, slug });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Kategori dengan nama atau slug ini sudah ada' });
    }
    res.status(500).json({ message: 'Gagal membuat kategori baru', error: error.message });
  }
});

// [ADMIN] PUT update kategori
router.put('/categories/:id', verifyAdminToken, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Nama kategori tidak boleh kosong' });
    }
    const slug = slugify(name);

    try {
      const [result] = await db.query('UPDATE categories SET name = ?, slug = ? WHERE id = ?', [name, slug, id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Kategori tidak ditemukan' });
      }
      res.json({ id, name, slug });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Kategori dengan nama atau slug ini sudah ada' });
      }
      res.status(500).json({ message: 'Gagal memperbarui kategori', error: error.message });
    }
  });

// [ADMIN] DELETE kategori
router.delete('/categories/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // Relasi akan terhapus otomatis karena ON DELETE CASCADE
    const [result] = await connection.query('DELETE FROM categories WHERE id = ?', [id]);
    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    res.status(204).send();
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Gagal menghapus kategori', error: error.message });
  } finally {
    connection.release();
  }
});


// =================================================================================
// == TAGS
// =================================================================================

// [ADMIN] GET semua tag
router.get('/tags', verifyAdminToken, async (req, res) => {
    try {
      const [tags] = await db.query('SELECT * FROM tags ORDER BY name ASC');
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: 'Gagal mengambil tag', error: error.message });
    }
  });

  // [ADMIN] POST tag baru
  router.post('/tags', verifyAdminToken, async (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Nama tag tidak boleh kosong' });
    }
    const slug = slugify(name);

    try {
      const [result] = await db.query('INSERT INTO tags (name, slug) VALUES (?, ?)', [name, slug]);
      res.status(201).json({ id: result.insertId, name, slug });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Tag dengan nama atau slug ini sudah ada' });
      }
      res.status(500).json({ message: 'Gagal membuat tag baru', error: error.message });
    }
  });

  // [ADMIN] PUT update tag
  router.put('/tags/:id', verifyAdminToken, async (req, res) => {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Nama tag tidak boleh kosong' });
      }
      const slug = slugify(name);

      try {
        const [result] = await db.query('UPDATE tags SET name = ?, slug = ? WHERE id = ?', [name, slug, id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Tag tidak ditemukan' });
        }
        res.json({ id, name, slug });
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Tag dengan nama atau slug ini sudah ada' });
        }
        res.status(500).json({ message: 'Gagal memperbarui tag', error: error.message });
      }
    });

  // [ADMIN] DELETE tag
  router.delete('/tags/:id', verifyAdminToken, async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      // Relasi akan terhapus otomatis karena ON DELETE CASCADE
      const [result] = await connection.query('DELETE FROM tags WHERE id = ?', [id]);
      await connection.commit();

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Tag tidak ditemukan' });
      }
      res.status(204).send();
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ message: 'Gagal menghapus tag', error: error.message });
    } finally {
      connection.release();
    }
  });

// =================================================================================
// == ARTIKEL
// =================================================================================

// [ADMIN] GET semua artikel (termasuk draft)
router.get('/', verifyAdminToken, async (req, res) => {
    try {
      const query = `
        SELECT a.id, a.title, a.slug, a.status, a.updated_at, adm.username as author_name
        FROM articles a
        JOIN admins adm ON a.author_id = adm.id
        ORDER BY a.updated_at DESC
      `;
      const [articles] = await db.query(query);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: 'Gagal mengambil semua artikel', error: error.message });
    }
});

// [ADMIN] POST artikel baru
router.post('/', verifyAdminToken, async (req, res) => {
    const { title, content, status, featured_image_url, meta_description, excerpt, categories, tags } = req.body;
    const author_id = req.admin.id;

    if (!title || !content) {
      return res.status(400).json({ message: 'Judul dan konten tidak boleh kosong' });
    }

    const slug = slugify(title);
    const published_at = status === 'published' ? new Date() : null;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [articleResult] = await connection.query(
        'INSERT INTO articles (title, slug, content, author_id, status, featured_image_url, meta_description, excerpt, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, slug, content, author_id, status, featured_image_url, meta_description, excerpt, published_at]
      );
      const articleId = articleResult.insertId;

      if (categories && categories.length > 0) {
        const categoryValues = categories.map(catId => [articleId, catId]);
        await connection.query('INSERT INTO article_categories (article_id, category_id) VALUES ?', [categoryValues]);
      }

      if (tags && tags.length > 0) {
        const tagValues = tags.map(tagId => [articleId, tagId]);
        await connection.query('INSERT INTO article_tags (article_id, tag_id) VALUES ?', [tagValues]);
      }

      await connection.commit();
      res.status(201).json({ id: articleId, message: 'Artikel berhasil dibuat' });
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Artikel dengan judul atau slug ini sudah ada' });
      }
      res.status(500).json({ message: 'Gagal membuat artikel baru', error: error.message });
    } finally {
      connection.release();
    }
});

// [PUBLIC] GET list artikel yang sudah publish
router.get('/published', async (req, res) => {
    try {
        const query = `
            SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image_url, a.published_at, adm.username as author_name
            FROM articles a
            JOIN admins adm ON a.author_id = adm.id
            WHERE a.status = 'published'
            ORDER BY a.published_at DESC
        `;
        const [articles] = await db.query(query);
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil artikel', error: error.message });
    }
});

// [PUBLIC] GET satu artikel berdasarkan slug
router.get('/published/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const query = `
        SELECT
          a.id, a.title, a.slug, a.content, a.featured_image_url, a.meta_description, a.published_at,
          adm.username AS author_name,
          (SELECT GROUP_CONCAT(c.name SEPARATOR ', ') FROM categories c JOIN article_categories ac ON c.id = ac.category_id WHERE ac.article_id = a.id) AS categories,
          (SELECT GROUP_CONCAT(t.name SEPARATOR ', ') FROM tags t JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = a.id) AS tags
        FROM articles a
        JOIN admins adm ON a.author_id = adm.id
        WHERE a.slug = ? AND a.status = 'published'
      `;
      const [articles] = await db.query(query, [slug]);

      if (articles.length === 0) {
        return res.status(404).json({ message: 'Artikel tidak ditemukan' });
      }
      res.json(articles[0]);
    } catch (error) {
      res.status(500).json({ message: 'Gagal mengambil detail artikel', error: error.message });
    }
  });

// [ADMIN] GET satu artikel untuk diedit
router.get('/:id', verifyAdminToken, async (req, res) => {
    const { id } = req.params;
    try {
        const articleQuery = 'SELECT id, title, content, status, featured_image_url, meta_description, excerpt FROM articles WHERE id = ?';
        const [articleRows] = await db.query(articleQuery, [id]);

        if (articleRows.length === 0) {
            return res.status(404).json({ message: 'Artikel tidak ditemukan' });
        }

        const article = articleRows[0];

        const categoriesQuery = 'SELECT category_id FROM article_categories WHERE article_id = ?';
        const [categoryRows] = await db.query(categoriesQuery, [id]);
        article.categories = categoryRows.map(row => row.category_id);

        const tagsQuery = 'SELECT tag_id FROM article_tags WHERE article_id = ?';
        const [tagRows] = await db.query(tagsQuery, [id]);
        article.tags = tagRows.map(row => row.tag_id);

        res.json(article);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data artikel untuk diedit', error: error.message });
    }
});

// [ADMIN] PUT update artikel
router.put('/:id', verifyAdminToken, async (req, res) => {
    const { id } = req.params;
    const { title, content, status, featured_image_url, meta_description, excerpt, categories, tags } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Judul dan konten tidak boleh kosong' });
    }

    const slug = slugify(title);
    // Only update published_at if status is changing to 'published'
    const published_at_update = status === 'published' ? 'published_at = COALESCE(published_at, NOW()),' : '';


    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const updateQuery = `
            UPDATE articles SET
                title = ?,
                slug = ?,
                content = ?,
                ${published_at_update}
                status = ?,
                featured_image_url = ?,
                meta_description = ?,
                excerpt = ?
            WHERE id = ?`;

        const queryParams = [title, slug, content, status, featured_image_url, meta_description, excerpt, id];

        await connection.query(updateQuery, queryParams);

        // Update categories
        await connection.query('DELETE FROM article_categories WHERE article_id = ?', [id]);
        if (categories && categories.length > 0) {
            const categoryValues = categories.map(catId => [id, catId]);
            await connection.query('INSERT INTO article_categories (article_id, category_id) VALUES ?', [categoryValues]);
        }

        // Update tags
        await connection.query('DELETE FROM article_tags WHERE article_id = ?', [id]);
        if (tags && tags.length > 0) {
            const tagValues = tags.map(tagId => [id, tagId]);
            await connection.query('INSERT INTO article_tags (article_id, tag_id) VALUES ?', [tagValues]);
        }

        await connection.commit();
        res.json({ id, message: 'Artikel berhasil diperbarui' });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Artikel dengan judul atau slug ini sudah ada' });
        }
        res.status(500).json({ message: 'Gagal memperbarui artikel', error: error.message });
    } finally {
        connection.release();
    }
});

// [ADMIN] DELETE artikel
router.delete('/:id', verifyAdminToken, async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Ambil URL gambar sebelum menghapus artikel
        const [articleRows] = await connection.query('SELECT featured_image_url FROM articles WHERE id = ?', [id]);

        // 2. Hapus artikel dari database (relasi akan terhapus oleh ON DELETE CASCADE)
        const [result] = await connection.query('DELETE FROM articles WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Artikel tidak ditemukan' });
        }

        // 3. Hapus file gambar jika ada
        if (articleRows.length > 0 && articleRows[0].featured_image_url) {
            const imageUrl = articleRows[0].featured_image_url;
            const filename = path.basename(imageUrl);
            const imagePath = path.join(uploadDir, filename);

            fs.unlink(imagePath, (err) => {
                if (err) {
                    // Log error tapi jangan gagalkan transaksi karena artikel sudah terhapus
                    console.error(`Gagal menghapus file gambar: ${imagePath}`, err);
                } else {
                    console.log(`Berhasil menghapus file gambar: ${imagePath}`);
                }
            });
        }

        await connection.commit();
        res.status(204).send();
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Gagal menghapus artikel', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
