const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const gameImageService = require('../services/gameImageService');

// Pastikan direktori upload ada
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'games');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer
const storage = multer.memoryStorage(); // Simpan file di memory untuk diproses sharp
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb('Error: File type not supported! Only JPEG, PNG, and WebP are allowed.');
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/admin/game-brands/unique
router.get('/unique', async (req, res) => {
  try {
    const brands = await gameImageService.getUniqueBrands();
    res.json(brands);
  } catch (error) {
    console.error('Error fetching unique game brands:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/game-brands/images
router.get('/images', async (req, res) => {
  try {
    const images = await gameImageService.getAllBrandImages();
    res.json(images);
  } catch (error) {
    console.error('Error fetching brand images:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/admin/game-brands/upload
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided.' });
  }
  const { brand } = req.body;
  if (!brand) {
    return res.status(400).json({ message: 'Brand name is required.' });
  }

  const filename = `${Date.now()}-${brand.replace(/\s+/g, '-')}.webp`;
  const outputPath = path.join(uploadDir, filename);
  const imageUrl = `/uploads/games/${filename}`;

  try {
    await sharp(req.file.buffer)
      .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 80 })
      .toFile(outputPath);

    await gameImageService.addOrUpdateBrandImage(brand, imageUrl);

    res.status(201).json({ message: 'Image uploaded and associated with brand successfully.', imageUrl });
  } catch (error) {
    console.error('Error uploading brand image:', error);
    res.status(500).json({ message: 'Failed to process image.' });
  }
});

// DELETE /api/admin/game-brands/images/:brand_name
router.delete('/images/:brand_name', async (req, res) => {
  const { brand_name } = req.params;
  try {
    const result = await gameImageService.deleteBrandImage(decodeURIComponent(brand_name));
    if (result && result.affectedRows > 0) {
      res.status(200).json({ message: `Image for brand ${brand_name} deleted successfully.` });
    } else {
      res.status(404).json({ message: `No image found for brand ${brand_name}.` });
    }
  } catch (error) {
    console.error(`Error deleting image for brand ${brand_name}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
