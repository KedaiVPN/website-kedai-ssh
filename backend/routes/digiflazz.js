const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { verifyAdminToken } = require('./adminAuth');
const DigiflazzService = require('../services/digiflazzService');

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
