const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db/connection');

// Middleware: Only admin (reuse from adminAuth)
const { verifyAdminToken } = require('./adminAuth');
const xlService = require('../services/xlService');

// Get external packages for admin sync
router.get('/external-packages', verifyAdminToken, async (req, res) => {
  try {
    const result = await xlService.getExternalPackages();
    res.json(result);
  } catch (error) {
    console.error('[XL Admin] Get External Packages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all packages
router.get('/packages', verifyAdminToken, async (req, res) => {
  try {
    const [packages] = await pool.query(
      'SELECT id, package_code, name, description, price, fee, is_active, payment_method, kategori, created_at, updated_at FROM xl_packages ORDER BY created_at DESC'
    );
    
    res.json({ 
      success: true, 
      data: packages 
    });
  } catch (error) {
    console.error('[XL Admin] Get Packages error:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Add package
router.post('/packages', verifyAdminToken, async (req, res) => {
  try {
    const { package_code, name, description, price, fee, payment_method, kategori } = req.body;
    
    if (!package_code || !name || !price || !fee) {
      return res.json({ 
        success: false, 
        message: 'Package code, name, price, dan fee wajib diisi' 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO xl_packages (package_code, name, description, price, fee, payment_method, kategori) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [package_code, name, description || '', price, fee, payment_method || 'e-wallet', kategori || 'tidak resmi']
    );
    
    res.json({ 
      success: true, 
      data: { id: result.insertId } 
    });
  } catch (error) {
    console.error('[XL Admin] Add Package error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.json({ 
        success: false, 
        message: 'Package code sudah digunakan' 
      });
    }
    
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update package
router.put('/packages/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { package_code, name, description, price, fee, is_active, payment_method, kategori } = req.body;
    
    if (!package_code || !name || price == null || fee == null) {
      return res.json({ 
        success: false, 
        message: 'Package code, name, price, dan fee wajib diisi' 
      });
    }
    
    await pool.query(
      'UPDATE xl_packages SET package_code = ?, name = ?, description = ?, price = ?, fee = ?, is_active = ?, payment_method = ?, kategori = ? WHERE id = ?',
      [package_code, name, description || '', price, fee, is_active ?? 1, payment_method || 'e-wallet', kategori || 'tidak resmi', id]
    );
    
    res.json({ 
      success: true 
    });
  } catch (error) {
    console.error('[XL Admin] Update Package error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.json({ 
        success: false, 
        message: 'Package code sudah digunakan' 
      });
    }
    
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete package
router.delete('/packages/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM xl_packages WHERE id = ?', [id]);
    
    res.json({ 
      success: true 
    });
  } catch (error) {
    console.error('[XL Admin] Delete Package error:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get all XL transactions (admin view)
router.get('/transactions', verifyAdminToken, async (req, res) => {
  try {
    const [transactions] = await pool.query(
      `SELECT 
        xl.*, 
        u.username, 
        u.email 
       FROM xl_transactions xl
       LEFT JOIN users u ON xl.user_id = u.id
       ORDER BY xl.created_at DESC 
       LIMIT 100`
    );
    
    res.json({ 
      success: true, 
      data: transactions 
    });
  } catch (error) {
    console.error('[XL Admin] Get Transactions error:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Sync packages from external source
router.post('/sync-packages', verifyAdminToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const packagesToSync = req.body.packages;
    if (!Array.isArray(packagesToSync) || packagesToSync.length === 0) {
      return res.status(400).json({ success: false, message: 'No packages to sync' });
    }

    await connection.beginTransaction();

    let updatedCount = 0;
    let insertedCount = 0;

    for (const pkg of packagesToSync) {
      const { package_code, name, description, price, fee, kategori } = pkg;

      // Basic validation for each package
      if (!package_code || !name || price == null || fee == null) {
        throw new Error(`Invalid package data for ${package_code}. All fields are required.`);
      }

      const [existing] = await connection.query(
        'SELECT id FROM xl_packages WHERE package_code = ?',
        [package_code]
      );

      if (existing.length > 0) {
        // Update existing package, but leave payment_method untouched
        await connection.query(
          'UPDATE xl_packages SET name = ?, description = ?, price = ?, fee = ? WHERE package_code = ?',
          [name, description || '', price, fee, package_code]
        );
        updatedCount++;
      } else {
        // Insert new package
        await connection.query(
          'INSERT INTO xl_packages (package_code, name, description, price, fee, is_active, payment_method, kategori) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [package_code, name, description || '', price, fee, 1, 'e-wallet', kategori || 'tidak resmi']
        );
        insertedCount++;
      }
    }

    await connection.commit();
    res.json({
      success: true,
      message: `Sync complete. ${insertedCount} packages added, ${updatedCount} packages updated.`,
      data: {
        inserted: insertedCount,
        updated: updatedCount,
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('[XL Admin] Sync Packages error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
