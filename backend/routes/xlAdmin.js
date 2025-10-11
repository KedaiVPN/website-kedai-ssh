const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db/connection');

// Middleware: Only admin (reuse from adminAuth)
const { verifyAdminToken } = require('./adminAuth');

// Get all packages
router.get('/packages', verifyAdminToken, async (req, res) => {
  try {
    const [packages] = await pool.query(
      'SELECT * FROM xl_packages ORDER BY created_at DESC'
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
    const { package_code, name, description, price, fee } = req.body;
    
    if (!package_code || !name || !price || !fee) {
      return res.json({ 
        success: false, 
        message: 'Package code, name, price, dan fee wajib diisi' 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO xl_packages (package_code, name, description, price, fee) VALUES (?, ?, ?, ?, ?)',
      [package_code, name, description || '', price, fee]
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
    const { package_code, name, description, price, fee, is_active } = req.body;
    
    if (!package_code || !name || price == null || fee == null) {
      return res.json({ 
        success: false, 
        message: 'Package code, name, price, dan fee wajib diisi' 
      });
    }
    
    await pool.query(
      'UPDATE xl_packages SET package_code = ?, name = ?, description = ?, price = ?, fee = ?, is_active = ? WHERE id = ?',
      [package_code, name, description || '', price, fee, is_active ?? 1, id]
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

module.exports = router;
