const express = require('express');
const router = express.Router();
const adminRouter = express.Router();
const OtherProductService = require('../services/otherProductService');
const sharp = require('sharp');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi Multer untuk upload gambar (meniru gameBrands.js)
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'other_products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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


// Middleware untuk menangani error umum
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ======================= ADMIN ROUTES =======================

// GET semua produk (untuk admin)
adminRouter.get('/', asyncHandler(async (req, res) => {
    const products = await OtherProductService.getAllProductsWithStockCount();
    res.json(products);
}));

// POST produk baru
adminRouter.post('/', upload.single('image'), asyncHandler(async (req, res) => {
    const { name, description, price, is_active } = req.body;
    let image_url = null;

    if (req.file) {
        const filename = `${Date.now()}-${name.replace(/\s+/g, '-')}.webp`;
        const outputPath = path.join(uploadDir, filename);

        await sharp(req.file.buffer)
            .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 80 })
            .toFile(outputPath);

        image_url = `/uploads/other_products/${filename}`;
    }

    const newProduct = await OtherProductService.createProduct({ name, description, price: parseInt(price), image_url, is_active: is_active === 'true' });
    res.status(201).json(newProduct);
}));


// PUT update produk
adminRouter.put('/:id', upload.single('image'), asyncHandler(async (req, res) => {
    const { name, description, price, is_active } = req.body;
    let image_url = req.body.image_url === 'null' ? null : req.body.image_url || undefined;


    if (req.file) {
        const filename = `${Date.now()}-${name.replace(/\s+/g, '-')}.webp`;
        const outputPath = path.join(uploadDir, filename);

        await sharp(req.file.buffer)
            .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 80 })
            .toFile(outputPath);

        image_url = `/uploads/other_products/${filename}`;
    }

    const updatedProduct = await OtherProductService.updateProduct(req.params.id, { name, description, price: parseInt(price), image_url, is_active: is_active === 'true' });
    res.json(updatedProduct);
}));

// DELETE produk
adminRouter.delete('/:id', asyncHandler(async (req, res) => {
    await OtherProductService.deleteProduct(req.params.id);
    res.status(204).send();
}));

// GET stok untuk produk tertentu
adminRouter.get('/:productId/stock', asyncHandler(async (req, res) => {
    const stock = await OtherProductService.getStockForProduct(req.params.productId);
    res.json(stock);
}));

// POST tambah stok
adminRouter.post('/:productId/stock', asyncHandler(async (req, res) => {
    const { stocks } = req.body;
    if (!Array.isArray(stocks) || stocks.length === 0) {
        return res.status(400).json({ message: 'Data stok tidak valid.' });
    }

    // Memastikan setiap item stok memiliki struktur yang diharapkan
    const formattedStocks = stocks.map(stock => ({
        stock_data_email: stock.stock_data_email,
        stock_data_password: stock.stock_data_password,
        stock_data_link: stock.stock_data_link,
        masa_aktif: stock.masa_aktif,
    }));

    await OtherProductService.addProductStock(req.params.productId, formattedStocks);
    res.status(201).json({ message: 'Stok berhasil ditambahkan.' });
}));

// DELETE stok
adminRouter.delete('/stock/:stockId', asyncHandler(async (req, res) => {
    await OtherProductService.deleteProductStock(req.params.stockId);
    res.status(204).send();
}));


// ======================= CUSTOMER ROUTES =======================

// GET daftar produk yang tersedia untuk dibeli
router.get('/', asyncHandler(async (req, res) => {
    const products = await OtherProductService.getAvailableProducts();
    res.json({ success: true, data: products });
}));

// POST untuk membeli produk
router.post('/purchase', asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
    if (!productId) {
        return res.status(400).json({ success: false, message: "Product ID diperlukan." });
    }
    const purchasedStockDetails = await OtherProductService.purchaseProduct(userId, productId);
    const product = await OtherProductService.getAllProductsWithStockCount().then(p => p.find(prod => prod.id === parseInt(productId)));

    res.status(200).json({
        success: true,
        message: `Pembelian ${product ? product.name : 'produk'} telah berhasil!`,
        data: purchasedStockDetails
    });
}));

// GET riwayat pembelian user
router.get('/history', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const history = await OtherProductService.getUserPurchaseHistory(userId);
    res.json({ success: true, data: history });
}));

// GET detail transaksi tertentu
router.get('/transaction/:transactionId', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { transactionId } = req.params;
    const transactionDetails = await OtherProductService.getTransactionDetails(userId, transactionId);
    res.json({ success: true, data: transactionDetails });
}));

// GET detail produk berdasarkan slug (HARUS DITEMPATKAN TERAKHIR)
router.get('/:slug', asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const product = await OtherProductService.getProductBySlug(slug);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }
    res.json({ success: true, data: product });
}));

// Middleware untuk error handling
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Terjadi kesalahan pada server.';
    res.status(statusCode).json({ message });
};

router.use(errorHandler);
adminRouter.use(errorHandler);

module.exports = { router, adminRouter };
