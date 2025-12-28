const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { verifyAdminToken } = require('./adminAuth');
const DigiflazzService = require('../services/digiflazzService');

const parseActiveFlag = (value, defaultValue = true) => {
  if (value === undefined) return defaultValue;
  return value !== 'false' && value !== '0';
};

// ==================== PUBLIC ROUTES (User) ====================

// Get available categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await DigiflazzService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar kategori' });
  }
});

// Get available brands
router.get('/brands', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    const brands = await DigiflazzService.getBrands(category);
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar brand' });
  }
});

// Get products (for user - active only)
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const { category, brand } = req.query;
    const products = await DigiflazzService.getProducts(category, brand, true);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar produk' });
  }
});

// Get pulsa brands
router.get('/pulsa/brands', authenticateToken, async (req, res) => {
  try {
    const activeOnly = parseActiveFlag(req.query.active, true);
    const brands = await DigiflazzService.getPulsaBrands(activeOnly);
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Error getting pulsa brands:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar brand pulsa' });
  }
});

// Get pulsa products
router.get('/pulsa/products', authenticateToken, async (req, res) => {
  try {
    const { brand, search } = req.query;
    const activeOnly = parseActiveFlag(req.query.active, true);
    const products = await DigiflazzService.getPulsaProducts(brand || null, search || null, activeOnly);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error getting pulsa products:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar produk pulsa' });
  }
});

// Get data brands
router.get('/data/brands', authenticateToken, async (req, res) => {
  try {
    const activeOnly = parseActiveFlag(req.query.active, true);
    const brands = await DigiflazzService.getDataBrands(activeOnly);
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Error getting data brands:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar brand paket data' });
  }
});

// Get data products
router.get('/data/products', authenticateToken, async (req, res) => {
  try {
    const { brand, search } = req.query;
    const activeOnly = parseActiveFlag(req.query.active, true);
    const products = await DigiflazzService.getDataProducts(brand || null, search || null, activeOnly);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error getting data products:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar produk paket data' });
  }
});

// Create game topup transaction
router.post('/topup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { buyer_sku_code, customer_no } = req.body;

    if (!buyer_sku_code || !customer_no) {
      return res.status(400).json({ 
        success: false, 
        message: 'SKU produk dan ID pelanggan wajib diisi' 
      });
    }

    const result = await DigiflazzService.createTopup(userId, buyer_sku_code, customer_no);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error creating game topup:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Gagal memproses topup game' 
    });
  }
});

// Get user transaction history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const transactions = await DigiflazzService.getTransactionHistory(userId, limit);
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat transaksi' });
  }
});

// Get pulsa & data transaction history
router.get('/telco/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const transactions = await DigiflazzService.getTelcoTransactionHistory(userId, limit);
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error getting telco transaction history:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat transaksi pulsa/paket data' });
  }
});

// ==================== ADMIN ROUTES ====================

// Sync products from Digiflazz API (Admin only)
router.post('/admin/sync', verifyAdminToken, async (req, res) => {
  try {
    const result = await DigiflazzService.syncProducts();
    res.json(result);
  } catch (error) {
    console.error('Error syncing products:', error);
    res.status(500).json({ success: false, message: 'Gagal sync produk dari Digiflazz' });
  }
});

router.post('/admin/sync-pulsa', verifyAdminToken, async (req, res) => {
  try {
    const result = await DigiflazzService.syncPulsaProducts();
    res.json(result);
  } catch (error) {
    console.error('Error syncing pulsa products:', error);
    res.status(500).json({ success: false, message: 'Gagal sync produk pulsa dari Digiflazz' });
  }
});

router.post('/admin/sync-data', verifyAdminToken, async (req, res) => {
  try {
    const result = await DigiflazzService.syncDataProducts();
    res.json(result);
  } catch (error) {
    console.error('Error syncing data products:', error);
    res.status(500).json({ success: false, message: 'Gagal sync produk paket data dari Digiflazz' });
  }
});

// Get all products including inactive (Admin only)
router.get('/admin/products', verifyAdminToken, async (req, res) => {
  try {
    const { category, brand } = req.query;
    const products = await DigiflazzService.getProducts(category, brand, false);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error getting all products:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar produk' });
  }
});

router.get('/admin/pulsa/products', verifyAdminToken, async (req, res) => {
  try {
    const { brand, search, active } = req.query;
    const activeOnly = active !== undefined ? parseActiveFlag(active, false) : false;
    const products = await DigiflazzService.getPulsaProducts(brand || null, search || null, activeOnly);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error getting pulsa products (admin):', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar produk pulsa' });
  }
});

router.get('/admin/data/products', verifyAdminToken, async (req, res) => {
  try {
    const { brand, search, active } = req.query;
    const activeOnly = active !== undefined ? parseActiveFlag(active, false) : false;
    const products = await DigiflazzService.getDataProducts(brand || null, search || null, activeOnly);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error getting data products (admin):', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar produk paket data' });
  }
});

// Update product (Admin only)
router.put('/admin/products/:sku', verifyAdminToken, async (req, res) => {
  try {
    const { sku } = req.params;
    const { is_active, selling_price } = req.body;
    
    const result = await DigiflazzService.updateProduct(sku, { is_active, selling_price });
    res.json(result);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate produk' });
  }
});

router.put('/admin/pulsa/products/:sku', verifyAdminToken, async (req, res) => {
  try {
    const { sku } = req.params;
    const { is_active, selling_price } = req.body;
    
    const result = await DigiflazzService.updatePulsaProduct(sku, { is_active, selling_price });
    res.json(result);
  } catch (error) {
    console.error('Error updating pulsa product:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate produk pulsa' });
  }
});

router.put('/admin/data/products/:sku', verifyAdminToken, async (req, res) => {
  try {
    const { sku } = req.params;
    const { is_active, selling_price } = req.body;
    
    const result = await DigiflazzService.updateDataProduct(sku, { is_active, selling_price });
    res.json(result);
  } catch (error) {
    console.error('Error updating data product:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate produk paket data' });
  }
});

// Delete product (Admin only)
router.delete('/admin/products/:sku', verifyAdminToken, async (req, res) => {
  try {
    const { sku } = req.params;
    const result = await DigiflazzService.deleteProduct(sku);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus produk' });
  }
});

// Get all transactions (Admin only)
router.get('/admin/transactions', verifyAdminToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const status = req.query.status || null;
    const transactions = await DigiflazzService.getAllTransactions(limit, status);
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error getting all transactions:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar transaksi' });
  }
});

// ==================== WEBHOOK CALLBACK ====================

// Digiflazz callback webhook
router.post('/callback', async (req, res) => {
  try {
    // 1. Validate Signature
    const secret = process.env.DIGIFLAZZ_WEBHOOK_SECRET;
    const signature = req.headers['x-hub-signature'];
    
    if (!secret || !signature) {
      console.warn('Webhook secret or signature is missing.');
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing secret or signature' });
    }

    const calculatedSignature = 'sha1=' + crypto.createHmac('sha1', secret)
      .update(req.rawBody, 'utf-8')
      .digest('hex');

    if (signature !== calculatedSignature) {
      console.warn('Invalid webhook signature.');
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid signature' });
    }

    // 2. Process Data
    const data = req.body.data;
    
    if (!data || !data.ref_id) {
      return res.status(400).json({ success: false, message: 'Invalid callback data' });
    }

    await DigiflazzService.handleCallback(data);
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling Digiflazz callback:', error);
    res.status(500).json({ success: false, message: 'Callback processing failed' });
  }
});

module.exports = router;
