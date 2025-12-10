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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
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

// GET /api/admin/game-brands/:brand/products
router.get('/:brand/products', async (req, res) => {
  try {
    const { brand } = req.params;
    const products = await gameImageService.getProductsByBrand(decodeURIComponent(brand));
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by brand:', error);
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
  const { brand, productSku } = req.body; // productSku bisa jadi 'brand-only', 'all-products-no-image', atau SKU spesifik
  if (!brand) {
    return res.status(400).json({ message: 'Brand name is required.' });
  }

  const filename = `${Date.now()}-${brand.replace(/\s+/g, '-')}-${productSku || 'brand'}.webp`;
  const outputPath = path.join(uploadDir, filename);
  const imageUrl = `/uploads/games/${filename}`;

  try {
    await sharp(req.file.buffer)
      .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 80 })
      .toFile(outputPath);

    await gameImageService.uploadImage(brand, imageUrl, productSku);

    res.status(201).json({ message: 'Image uploaded successfully.', imageUrl });
  } catch (error) {
    console.error('Error uploading brand image:', error);
    res.status(500).json({ message: 'Failed to process image.' });
  }
});

// GET /api/admin/game-brands/product-images
router.get('/product-images', async (req, res) => {
    try {
        const products = await gameImageService.getProductsWithImages();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products with images:', error);
        res.status(500).json({ message: 'Internal server error' });
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

// DELETE /api/admin/game-brands/product-image/:sku
router.delete('/product-image/:sku', async (req, res) => {
    const { sku } = req.params;
    try {
        const result = await gameImageService.deleteProductImage(decodeURIComponent(sku));
        if (result && result.affectedRows > 0) {
            res.status(200).json({ message: `Image for product ${sku} deleted successfully.` });
        } else {
            res.status(404).json({ message: `No image found for product ${sku}.` });
        }
    } catch (error) {
        console.error(`Error deleting image for product ${sku}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
