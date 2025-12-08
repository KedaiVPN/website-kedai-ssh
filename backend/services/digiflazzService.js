const crypto = require('crypto');
const pool = require('../db/connection');
const BalanceService = require('./balanceService');

class DigiflazzService {
  constructor() {
    this.username = process.env.DIGIFLAZZ_USERNAME;
    this.apiKey = process.env.DIGIFLAZZ_API_KEY;
    this.baseUrl = 'https://api.digiflazz.com/v1';
  }

  // Generate signature untuk price list: md5(username + apiKey + "pricelist")
  generatePricelistSignature() {
    const signString = this.username + this.apiKey + 'pricelist';
    return crypto.createHash('md5').update(signString).digest('hex');
  }

  // Generate signature untuk transaksi: md5(username + apiKey + refId)
  generateTransactionSignature(refId) {
    const signString = this.username + this.apiKey + refId;
    return crypto.createHash('md5').update(signString).digest('hex');
  }

  // Generate unique reference ID
  generateRefId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GAME${timestamp}${random}`;
  }

  // Fetch daftar harga dari Digiflazz API
  async fetchPriceList(category = null) {
    try {
      const signature = this.generatePricelistSignature();
      
      const payload = {
        cmd: 'prepaid',
        username: this.username,
        sign: signature
      };

      const response = await fetch(`${this.baseUrl}/price-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.data) {
        let products = result.data;
        
        // Filter by category if specified
        if (category) {
          products = products.filter(p => p.category === category);
        }

        // Filter only game voucher categories
        const gameCategories = ['Games', 'Voucher Game', 'Mobile Games'];
        products = products.filter(p => 
          gameCategories.some(cat => p.category?.toLowerCase().includes(cat.toLowerCase())) ||
          p.category?.toLowerCase().includes('game')
        );

        return products;
      }

      return [];
    } catch (error) {
      console.error('Error fetching Digiflazz price list:', error);
      throw error;
    }
  }

  // Sync products ke database
  async syncProducts() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const products = await this.fetchPriceList();
      
      let syncedCount = 0;
      let newCount = 0;
      let updatedCount = 0;

      for (const product of products) {
        // Check if product exists
        const [existing] = await connection.query(
          'SELECT id, price FROM digiflazz_products WHERE buyer_sku_code = ?',
          [product.buyer_sku_code]
        );

        if (existing.length === 0) {
          // Insert new product with default selling_price (price + 5% margin)
          const sellingPrice = Math.ceil(product.price * 1.05);
          
          await connection.query(`
            INSERT INTO digiflazz_products 
            (buyer_sku_code, product_name, category, brand, type, price, seller_price, selling_price, unlimited_stock, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            product.buyer_sku_code,
            product.product_name,
            product.category,
            product.brand,
            product.type || null,
            product.price,
            product.seller_price || null,
            sellingPrice,
            product.unlimited_stock || false,
            product.desc || null
          ]);
          newCount++;
        } else {
          // Update existing product price (keep selling_price if manually set)
          await connection.query(`
            UPDATE digiflazz_products 
            SET product_name = ?, category = ?, brand = ?, type = ?, price = ?, 
                seller_price = ?, unlimited_stock = ?, description = ?, updated_at = NOW()
            WHERE buyer_sku_code = ?
          `, [
            product.product_name,
            product.category,
            product.brand,
            product.type || null,
            product.price,
            product.seller_price || null,
            product.unlimited_stock || false,
            product.desc || null,
            product.buyer_sku_code
          ]);
          updatedCount++;
        }
        syncedCount++;
      }

      await connection.commit();

      return {
        success: true,
        synced: syncedCount,
        new: newCount,
        updated: updatedCount,
        message: `Berhasil sync ${syncedCount} produk (${newCount} baru, ${updatedCount} diupdate)`
      };
    } catch (error) {
      await connection.rollback();
      console.error('Error syncing Digiflazz products:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get products from database
  async getProducts(category = null, brand = null, activeOnly = true) {
    let query = 'SELECT * FROM digiflazz_products WHERE 1=1';
    const params = [];

    if (activeOnly) {
      query += ' AND is_active = 1';
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }

    query += ' ORDER BY brand, selling_price ASC';

    const [products] = await pool.query(query, params);
    return products;
  }

  // Get categories dari database
  async getCategories() {
    const [rows] = await pool.query(`
      SELECT DISTINCT category, COUNT(*) as product_count 
      FROM digiflazz_products 
      WHERE is_active = 1 
      GROUP BY category 
      ORDER BY category
    `);
    return rows;
  }

  // Get brands dari database
  async getBrands(category = null) {
    let query = `
      SELECT DISTINCT brand, category, COUNT(*) as product_count 
      FROM digiflazz_products 
      WHERE is_active = 1
    `;
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' GROUP BY brand, category ORDER BY brand';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Update product status atau selling_price (admin)
  async updateProduct(buyerSkuCode, data) {
    const updates = [];
    const params = [];

    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    if (data.selling_price !== undefined) {
      updates.push('selling_price = ?');
      params.push(data.selling_price);
    }

    if (updates.length === 0) {
      return { success: false, message: 'Tidak ada data untuk diupdate' };
    }

    updates.push('updated_at = NOW()');
    params.push(buyerSkuCode);

    await pool.query(
      `UPDATE digiflazz_products SET ${updates.join(', ')} WHERE buyer_sku_code = ?`,
      params
    );

    return { success: true, message: 'Produk berhasil diupdate' };
  }

  // Create game topup transaction
  async createTopup(userId, buyerSkuCode, customerNo) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get product info
      const [products] = await connection.query(
        'SELECT * FROM digiflazz_products WHERE buyer_sku_code = ? AND is_active = 1',
        [buyerSkuCode]
      );

      if (products.length === 0) {
        throw new Error('Produk tidak ditemukan atau tidak aktif');
      }

      const product = products[0];
      const refId = this.generateRefId();

      // Check user balance
      await BalanceService.validateSufficientBalance(userId, product.selling_price, connection);

      // Deduct balance first
      await BalanceService.deductBalance(
        userId,
        product.selling_price,
        `Game Topup: ${product.product_name}`,
        'game_topup',
        null, // Will update reference_id after insert
        connection
      );

      // Insert transaction record
      const [insertResult] = await connection.query(`
        INSERT INTO game_topup_transactions 
        (user_id, product_sku, product_name, customer_no, ref_id, price, selling_price, digiflazz_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
      `, [
        userId,
        buyerSkuCode,
        product.product_name,
        customerNo,
        refId,
        product.price,
        product.selling_price
      ]);

      const transactionId = insertResult.insertId;

      // Update balance transaction reference
      await connection.query(
        `UPDATE balance_transactions SET reference_id = ? WHERE user_id = ? AND reference_type = 'game_topup' AND reference_id IS NULL ORDER BY id DESC LIMIT 1`,
        [transactionId, userId]
      );

      // Send to Digiflazz API
      const signature = this.generateTransactionSignature(refId);
      
      const payload = {
        username: this.username,
        buyer_sku_code: buyerSkuCode,
        customer_no: customerNo,
        ref_id: refId,
        sign: signature,
        testing: process.env.NODE_ENV !== 'production' // Testing mode for development
      };

      const response = await fetch(`${this.baseUrl}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      // Update transaction with Digiflazz response
      if (result.data) {
        const status = result.data.status || 'Pending';
        const sn = result.data.sn || null;
        const message = result.data.message || null;

        await connection.query(`
          UPDATE game_topup_transactions 
          SET digiflazz_status = ?, sn = ?, message = ?, updated_at = NOW()
          WHERE id = ?
        `, [status, sn, message, transactionId]);

        // If failed immediately, refund the balance
        if (status === 'Gagal') {
          await BalanceService.addBalance(
            userId,
            product.selling_price,
            `Refund Game Topup (Gagal): ${product.product_name}`,
            'game_topup_refund',
            transactionId,
            connection
          );
        }

        await connection.commit();

        return {
          success: status !== 'Gagal',
          transaction_id: transactionId,
          ref_id: refId,
          status: status,
          sn: sn,
          message: message || (status === 'Sukses' ? 'Topup berhasil' : status === 'Pending' ? 'Topup sedang diproses' : 'Topup gagal'),
          product_name: product.product_name,
          customer_no: customerNo,
          amount: product.selling_price
        };
      } else {
        // API error, refund the balance
        await BalanceService.addBalance(
          userId,
          product.selling_price,
          `Refund Game Topup (Error): ${product.product_name}`,
          'game_topup_refund',
          transactionId,
          connection
        );

        await connection.query(`
          UPDATE game_topup_transactions 
          SET digiflazz_status = 'Gagal', message = ?, updated_at = NOW()
          WHERE id = ?
        `, [result.message || 'API Error', transactionId]);

        await connection.commit();

        return {
          success: false,
          transaction_id: transactionId,
          ref_id: refId,
          status: 'Gagal',
          message: result.message || 'Terjadi kesalahan, saldo telah dikembalikan'
        };
      }
    } catch (error) {
      await connection.rollback();
      console.error('Error creating game topup:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Handle webhook callback from Digiflazz
  async handleCallback(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { ref_id, status, sn, message } = data;

      // Get transaction
      const [transactions] = await connection.query(
        'SELECT * FROM game_topup_transactions WHERE ref_id = ?',
        [ref_id]
      );

      if (transactions.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = transactions[0];

      // Only process if status changed and wasn't already processed
      if (transaction.digiflazz_status !== status) {
        await connection.query(`
          UPDATE game_topup_transactions 
          SET digiflazz_status = ?, sn = ?, message = ?, updated_at = NOW()
          WHERE ref_id = ?
        `, [status, sn, message, ref_id]);

        // If failed and was pending, refund the balance
        if (status === 'Gagal' && transaction.digiflazz_status === 'Pending') {
          await BalanceService.addBalance(
            transaction.user_id,
            transaction.selling_price,
            `Refund Game Topup (Gagal): ${transaction.product_name}`,
            'game_topup_refund',
            transaction.id,
            connection
          );
        }
      }

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      console.error('Error handling Digiflazz callback:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get transaction history for user
  async getTransactionHistory(userId, limit = 50) {
    const [rows] = await pool.query(`
      SELECT * FROM game_topup_transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [userId, limit]);
    return rows;
  }

  // Get all transactions (admin)
  async getAllTransactions(limit = 100, status = null) {
    let query = `
      SELECT gt.*, u.username, u.email 
      FROM game_topup_transactions gt
      LEFT JOIN users u ON gt.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND gt.digiflazz_status = ?';
      params.push(status);
    }

    query += ' ORDER BY gt.created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Check transaction status dari Digiflazz
  async checkTransactionStatus(refId) {
    try {
      const signature = this.generateTransactionSignature(refId);
      
      const payload = {
        username: this.username,
        ref_id: refId,
        sign: signature
      };

      const response = await fetch(`${this.baseUrl}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw error;
    }
  }
}

module.exports = new DigiflazzService();
