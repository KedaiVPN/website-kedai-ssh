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

// Konfigurasi Multer untuk penyimpanan gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `banner-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Hanya file gambar yang diizinkan!'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Middleware untuk kompresi gambar
const compressImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const newPath = path.join(uploadDir, `compressed-${req.file.filename}`);
  try {
    await sharp(req.file.path)
      .resize(1080) // Resize lebar ke 1080px, tinggi otomatis
      .webp({ quality: 80 }) // Konversi ke WebP dengan kualitas 80%
      .toFile(newPath);

    // Hapus file asli setelah kompresi
    fs.unlinkSync(req.file.path);

    // Ganti path file di request dengan path file yang sudah dikompresi
    req.file.path = newPath;
    req.file.filename = `compressed-${req.file.filename}`;
    next();
  } catch (error) {
    console.error('Gagal mengkompres gambar:', error);
    next(error);
  }
};


// Rute Publik
// GET /api/banners - Mendapatkan semua banner aktif
router.get('/', async (req, res) => {
  try {
    const banners = await GameBannerService.getBanners();
    // Selalu kembalikan array, bahkan jika kosong
    res.status(200).json(banners || []);
  } catch (error) {
    console.error("Gagal mengambil banner:", error);
    // Kembalikan array kosong jika terjadi error
    res.status(500).json([]);
  }
});


// Rute Admin dipindahkan ke adminRouter
// POST /api/admin/banners - Menambahkan banner baru
adminRouter.post('/', upload.single('bannerImage'), compressImage, async (req, res) => {
  const { brand_name } = req.body;

  if (!req.file || !brand_name) {
    return res.status(400).json({ message: 'Gambar dan nama brand diperlukan.' });
  }

  const imageUrl = `/uploads/banners/${req.file.filename}`;

  try {
    const newBanner = await GameBannerService.addBanner(imageUrl, brand_name);
    res.status(201).json({ message: 'Banner berhasil ditambahkan', banner: newBanner });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan banner', error: error.message });
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
