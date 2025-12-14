const express = require('express');
const router = express.Router();
const adminRouter = express.Router(); // Router terpisah untuk admin
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const GameBannerService = require('../services/gameBannerService');

// Middleware otentikasi tidak lagi diimpor di sini, akan diterapkan di server.js

// Pastikan direktori uploads ada
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'banners');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer untuk memproses gambar di memori
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    if (allowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format gambar tidak didukung! Hanya JPEG, PNG, dan WebP.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Rute Publik
// GET /api/banners - Mendapatkan semua banner aktif
router.get('/', async (req, res) => {
  try {
    const banners = await GameBannerService.getBanners();
    res.status(200).json(banners || []);
  } catch (error) {
    console.error("Gagal mengambil banner:", error);
    res.status(500).json([]);
  }
});


// Rute Admin dipindahkan ke adminRouter
// POST /api/admin/banners - Menambahkan banner baru
adminRouter.post('/', upload.single('bannerImage'), async (req, res) => {
  const { brand_name } = req.body;

  if (!req.file || !brand_name) {
    return res.status(400).json({ message: 'Gambar dan nama brand diperlukan.' });
  }

  const filename = `banner-${Date.now()}.webp`;
  const outputPath = path.join(uploadDir, filename);
  const imageUrl = `/uploads/banners/${filename}`;

  try {
    // Proses gambar dari buffer memori
    await sharp(req.file.buffer)
      .resize({ width: 1080, withoutEnlargement: true }) // Resize lebar maks 1080px
      .webp({ quality: 80 }) // Konversi ke WebP dengan kualitas 80%
      .toFile(outputPath);

    // Simpan path ke database
    const newBanner = await GameBannerService.addBanner(imageUrl, brand_name);
    res.status(201).json({ message: 'Banner berhasil ditambahkan', banner: newBanner });
  } catch (error) {
    console.error('Gagal memproses dan menyimpan banner:', error);
    res.status(500).json({ message: 'Gagal memproses gambar banner.', error: error.message });
  }
});

// DELETE /api/admin/banners/:id - Menghapus banner
adminRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await GameBannerService.deleteBanner(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus banner', error: error.message });
  }
});

module.exports = {
  router,
  adminRouter
};
