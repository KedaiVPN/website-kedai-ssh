const crypto = require('crypto');
const pool = require('../db/connection');
const BalanceService = require('./balanceService');
const TelegramService = require('./telegramService');

class DigiflazzService {
  constructor() {
    this.username = process.env.DIGIFLAZZ_USERNAME;
    this.apiKey = process.env.DIGIFLAZZ_API_KEY;
    this.baseUrl = process.env.DIGIFLAZZ_BASE_URL || 'https://api.digiflazz.com/v1';
  }

  normalizeCategory(category) {
    return (category || '').toString().trim().toLowerCase();
  }

  isGameCategory(category) {
    const normalized = this.normalizeCategory(category);
    const gameCategories = ['games', 'voucher game', 'mobile games', 'game'];
    return gameCategories.some(cat => normalized.includes(cat));
  }

  isPulsaCategory(category) {
    const normalized = this.normalizeCategory(category);
    return normalized.includes('pulsa');
  }

  isDataCategory(category) {
    const normalized = this.normalizeCategory(category);
    return (
      normalized.includes('paket data') ||
      normalized.includes('internet') ||
      normalized.includes('data')
    );
  }

  categorizeProducts(products) {
    const safeProducts = Array.isArray(products) ? products : [];
    const categorizedBuckets = { game: [], pulsa: [], data: [] };

    for (const product of safeProducts) {
      if (this.isGameCategory(product.category)) categorizedBuckets.game.push(product);
      if (this.isPulsaCategory(product.category)) categorizedBuckets.pulsa.push(product);
      if (this.isDataCategory(product.category)) categorizedBuckets.data.push(product);
    }

    console.log(
      `[Digiflazz] Pricelist stats → total=${safeProducts.length}, game=${categorizedBuckets.game.length}, pulsa=${categorizedBuckets.pulsa.length}, data=${categorizedBuckets.data.length}`
    );
    return categorizedBuckets;
  }

  calculateSellingPrice(product) {
    const basePrice = product.seller_price || product.price;
    return Math.ceil(basePrice * 1.05);
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

  // Fetch daftar harga dari Digiflazz API, bisa difilter berdasarkan tipe produk
  async fetchPriceList(type = null) {
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
      const allProducts = Array.isArray(result?.data) ? result.data : [];
      if (!Array.isArray(result?.data)) {
        console.warn('[Digiflazz] Pricelist response missing data array, received:', result);
      }
      const categorized = this.categorizeProducts(allProducts);

      switch (type) {
        case 'game':
          return categorized.game;
        case 'pulsa':
          return categorized.pulsa;
        case 'data':
          return categorized.data;
        default:
          return allProducts;
      }
    } catch (error) {
      console.error('Error fetching Digiflazz price list:', error);
      throw error;
    }
  }

  // Sync products ke database
  async syncProducts(apiProducts) {
    const connection = await pool.getConnection();
    const telegramService = new TelegramService();
    try {
      await connection.beginTransaction();

      if (!Array.isArray(apiProducts)) {
        throw new Error('Invalid product list provided for game sync.');
      }

      const [existingProducts] = await connection.query('SELECT buyer_sku_code, seller_price, selling_price, is_active FROM digiflazz_products');
      const localProductMap = new Map(existingProducts.map(p => [p.buyer_sku_code, p]));
      const apiSkus = new Set(apiProducts.map(p => p.buyer_sku_code));

      // 1. Hapus produk yang tidak ada lagi di API
      const skusToDelete = existingProducts
        .map(p => p.buyer_sku_code)
        .filter(sku => !apiSkus.has(sku));

      let deletedCount = 0;
      let skippedCount = 0;

      for (const sku of skusToDelete) {
        const [transactions] = await connection.query('SELECT COUNT(*) as count FROM game_topup_transactions WHERE product_sku = ?', [sku]);
        if (transactions[0].count === 0) {
          await connection.query('DELETE FROM digiflazz_products WHERE buyer_sku_code = ?', [sku]);
          deletedCount++;
        } else {
          skippedCount++;
        }
      }

      // 2. Tambah atau update produk dari API
      let newCount = 0;
      let updatedCount = 0;

      for (const product of apiProducts) {
        const localProduct = localProductMap.get(product.buyer_sku_code);
        const newSellerPrice = product.seller_price || product.price;

        if (!localProduct) {
          // Produk baru, tidak kirim notifikasi
          const sellingPrice = this.calculateSellingPrice(product);
          await connection.query(`
            INSERT INTO digiflazz_products 
            (buyer_sku_code, product_name, category, brand, type, price, seller_price, selling_price, unlimited_stock, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              product.buyer_sku_code, product.product_name, product.category, product.brand,
              product.type || null, product.price, newSellerPrice, sellingPrice,
              product.unlimited_stock || false, product.desc || null
            ]);
          newCount++;
        } else {
          // Produk lama, cek perubahan harga dan kirim notifikasi jika perlu
          let isActive = localProduct.is_active;
          if (localProduct.seller_price !== newSellerPrice) {
            const newMargin = localProduct.selling_price - newSellerPrice;
            if (newMargin <= 0) {
              isActive = 0; // Auto-disable
            } else if (newMargin > 0 && !localProduct.is_active) {
              isActive = 1; // Auto-reactivate
            }

            try {
              await telegramService.sendAutoSyncNotification({
                brand: product.brand,
                productName: product.product_name,
                sku: product.buyer_sku_code,
                oldPrice: localProduct.seller_price,
                newPrice: newSellerPrice,
                sellingPrice: localProduct.selling_price,
                newStatus: isActive
              });
            } catch (e) { console.error("Failed to send Telegram notification:", e); }
          }

          await connection.query(`
            UPDATE digiflazz_products 
            SET product_name = ?, category = ?, brand = ?, type = ?, price = ?, 
                seller_price = ?, unlimited_stock = ?, is_active = ?,
                description = IF(description IS NOT NULL AND description != '', description, ?),
                updated_at = NOW()
            WHERE buyer_sku_code = ?`,
            [
              product.product_name, product.category, product.brand, product.type || null,
              product.price, newSellerPrice, product.unlimited_stock || false, isActive,
              product.desc || null, product.buyer_sku_code
            ]);
          updatedCount++;
        }
      }

      await connection.commit();
      const message = `Sinkronisasi selesai. ${newCount} produk baru, ${updatedCount} diupdate, ${deletedCount} dihapus, ${skippedCount} dilewati.`;
      return { success: true, new: newCount, updated: updatedCount, deleted: deletedCount, skipped: skippedCount, message: message };
    } catch (error) {
      await connection.rollback();
      console.error('Error syncing Digiflazz products:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async syncCategoryProducts(type, tableName, label, apiProducts) {
    const connection = await pool.getConnection();
    const telegramService = new TelegramService();
    try {
      await connection.beginTransaction();

      if (!Array.isArray(apiProducts)) {
        throw new Error(`Invalid product list provided for ${label} sync.`);
      }

      const [existingProducts] = await connection.query(`SELECT buyer_sku_code, seller_price, selling_price, is_active FROM ${tableName}`);
      const localProductMap = new Map(existingProducts.map(p => [p.buyer_sku_code, p]));

      let newCount = 0;
      let updatedCount = 0;

      for (const product of apiProducts) {
        const localProduct = localProductMap.get(product.buyer_sku_code);
        const newSellerPrice = product.seller_price || product.price;

        let isActive = localProduct ? localProduct.is_active : 1;
        if (localProduct && localProduct.seller_price !== newSellerPrice) {
            const newMargin = localProduct.selling_price - newSellerPrice;
            if (newMargin <= 0) {
              isActive = 0; // Auto-disable
            } else if (newMargin > 0 && !localProduct.is_active) {
              isActive = 1; // Auto-reactivate
            }

            try {
              await telegramService.sendAutoSyncNotification({
                brand: product.brand,
                productName: product.product_name,
                sku: product.buyer_sku_code,
                oldPrice: localProduct.seller_price,
                newPrice: newSellerPrice,
                sellingPrice: localProduct.selling_price,
                newStatus: isActive
              });
            } catch (e) { console.error("Failed to send Telegram notification:", e); }
        }

        const sellingPrice = localProduct ? localProduct.selling_price : this.calculateSellingPrice(product);
        const [result] = await connection.query(`
          INSERT INTO ${tableName}
          (buyer_sku_code, product_name, category, brand, type, price, seller_price, selling_price, unlimited_stock, description, image_url, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            product_name = VALUES(product_name), category = VALUES(category), brand = VALUES(brand),
            type = VALUES(type), price = VALUES(price), seller_price = VALUES(seller_price),
            unlimited_stock = VALUES(unlimited_stock), is_active = VALUES(is_active),
            description = IF(description IS NOT NULL AND description != '', description, VALUES(description)),
            image_url = IF(image_url IS NOT NULL AND image_url != '', image_url, VALUES(image_url)),
            updated_at = NOW()`,
            [
              product.buyer_sku_code, product.product_name, product.category, product.brand,
              product.type || null, product.price, newSellerPrice, sellingPrice,
              product.unlimited_stock || false, product.desc || null,
              product.icon_url || product.image_url || null, isActive
            ]);

        if (result.affectedRows === 1) newCount++;
        else if (result.affectedRows === 2) updatedCount++;
      }

      await connection.commit();
      return { success: true, new: newCount, updated: updatedCount, message: `Sinkronisasi ${label} selesai. ${newCount} produk baru, ${updatedCount} diperbarui.` };
    } catch (error) {
      await connection.rollback();
      console.error(`Error syncing Digiflazz ${label} products:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async syncPulsaProducts() {
    return this.syncCategoryProducts('pulsa', 'digiflazz_pulsa_products', 'pulsa');
  }

  async syncDataProducts() {
    return this.syncCategoryProducts('data', 'digiflazz_data_products', 'paket data');
  }

  // Get products from database
  async getProducts(category = null, brand = null, activeOnly = true) {
    let query = `
      SELECT
        dp.*,
        dp.image_url as product_image_url,
        gbi.image_url as brand_image_url
      FROM
        digiflazz_products dp
      LEFT JOIN
        game_brand_images gbi ON dp.brand = gbi.brand_name
      WHERE 1=1
    `;
    const params = [];

    if (activeOnly) {
      query += ' AND dp.is_active = 1';
    }

    if (category) {
      query += ' AND dp.category = ?';
      params.push(category);
    }

    if (brand) {
      query += ' AND dp.brand = ?';
      params.push(brand);
    }

    query += ' ORDER BY dp.brand, dp.selling_price ASC';

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
      SELECT
        dp.brand,
        dp.category,
        COUNT(*) as product_count,
        gbi.image_url
      FROM
        digiflazz_products dp
      LEFT JOIN
        game_brand_images gbi ON dp.brand = gbi.brand_name
      WHERE
        dp.is_active = 1
    `;
    const params = [];

    if (category) {
      query += ' AND dp.category = ?';
      params.push(category);
    }

    query += ' GROUP BY dp.brand, dp.category, gbi.image_url ORDER BY dp.brand';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getTelcoProducts(tableName, brand = null, search = null, activeOnly = true) {
    let query = `SELECT * FROM ${tableName} WHERE 1=1`;
    const params = [];

    if (activeOnly) {
      query += ' AND is_active = 1';
    }

    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }

    if (search) {
      const like = `%${search}%`;
      query += ' AND (product_name LIKE ? OR buyer_sku_code LIKE ? OR brand LIKE ?)';
      params.push(like, like, like);
    }

    query += ' ORDER BY brand, selling_price ASC';

    const [products] = await pool.query(query, params);
    return products;
  }

  async getTelcoBrands(tableName, activeOnly = true) {
    let query = `
      SELECT brand, category, COUNT(*) as product_count
      FROM ${tableName}
      WHERE 1=1
    `;

    if (activeOnly) {
      query += ' AND is_active = 1';
    }

    query += ' GROUP BY brand, category ORDER BY brand';
    const [rows] = await pool.query(query);
    return rows;
  }

  async getPulsaProducts(brand = null, search = null, activeOnly = true) {
    return this.getTelcoProducts('digiflazz_pulsa_products', brand, search, activeOnly);
  }

  async getDataProducts(brand = null, search = null, activeOnly = true) {
    return this.getTelcoProducts('digiflazz_data_products', brand, search, activeOnly);
  }

  async getPulsaBrands(activeOnly = true) {
    return this.getTelcoBrands('digiflazz_pulsa_products', activeOnly);
  }

  async getDataBrands(activeOnly = true) {
    return this.getTelcoBrands('digiflazz_data_products', activeOnly);
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

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
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

  async updateProductByTable(tableName, buyerSkuCode, data) {
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

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (updates.length === 0) {
      return { success: false, message: 'Tidak ada data untuk diupdate' };
    }

    updates.push('updated_at = NOW()');
    params.push(buyerSkuCode);

    await pool.query(
      `UPDATE ${tableName} SET ${updates.join(', ')} WHERE buyer_sku_code = ?`,
      params
    );

    return { success: true, message: 'Produk berhasil diupdate' };
  }

  async updatePulsaProduct(buyerSkuCode, data) {
    return this.updateProductByTable('digiflazz_pulsa_products', buyerSkuCode, data);
  }

  async updateDataProduct(buyerSkuCode, data) {
    return this.updateProductByTable('digiflazz_data_products', buyerSkuCode, data);
  }

  async deleteProduct(buyerSkuCode) {
    const connection = await pool.getConnection();
    try {
      // Periksa apakah ada transaksi terkait dengan produk ini
      const [transactions] = await connection.query(
        'SELECT COUNT(*) as count FROM game_topup_transactions WHERE product_sku = ?',
        [buyerSkuCode]
      );

      if (transactions[0].count > 0) {
        return { success: false, message: 'Produk tidak dapat dihapus karena memiliki riwayat transaksi.' };
      }

      // Hapus produk jika tidak ada transaksi
      const [result] = await connection.query(
        'DELETE FROM digiflazz_products WHERE buyer_sku_code = ?',
        [buyerSkuCode]
      );

      if (result.affectedRows === 0) {
        return { success: false, message: 'Produk tidak ditemukan.' };
      }

      return { success: true, message: 'Produk berhasil dihapus.' };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    } finally {
      connection.release();
    }
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

      console.log('Digiflazz Topup Payload:', JSON.stringify(payload, null, 2));

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
        const transactionDate = new Date();

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

        // Send success notification immediately if status sukses
        if (status === 'Sukses') {
          try {
            const [users] = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
            const username = users[0]?.username || 'Unknown';
            await new TelegramService().sendGameTopupNotification({
              username,
              userId,
              brand: product.brand,
              productName: product.product_name,
              price: product.selling_price,
              transactionCode: sn,
              transactionDate
            });
          } catch (notificationError) {
            console.error('Failed to send immediate game topup notification:', notificationError);
          }
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
    console.log('Digiflazz Webhook Received:', JSON.stringify(data, null, 2));
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { ref_id, status, sn, message } = data;

      // Get transaction (game first, then telco)
      const [gameTransactions] = await connection.query(
        'SELECT * FROM game_topup_transactions WHERE ref_id = ?',
        [ref_id]
      );

      const [telcoTransactions] = await connection.query(
        'SELECT * FROM digiflazz_telco_transactions WHERE ref_id = ?',
        [ref_id]
      );

      const isTelco = gameTransactions.length === 0 && telcoTransactions.length > 0;
      const transaction = isTelco ? telcoTransactions[0] : gameTransactions[0];

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Only process if status changed and wasn't already processed
      if (transaction.digiflazz_status !== status) {
        const tableName = isTelco ? 'digiflazz_telco_transactions' : 'game_topup_transactions';
        await connection.query(`
          UPDATE ${tableName} 
          SET digiflazz_status = ?, sn = ?, message = ?, updated_at = NOW()
          WHERE ref_id = ?
        `, [status, sn, message, ref_id]);

        // If failed and was pending, refund the balance
        if (status === 'Gagal' && transaction.digiflazz_status === 'Pending') {
          await BalanceService.addBalance(
            transaction.user_id,
            transaction.selling_price,
            isTelco ? `Refund Telco Topup (Gagal): ${transaction.product_name}` : `Refund Game Topup (Gagal): ${transaction.product_name}`,
            isTelco ? 'telco_topup_refund' : 'game_topup_refund',
            transaction.id,
            connection
          );
        }

        // Send notification on success
        if (status === 'Sukses') {
          try {
            const [users] = await connection.query('SELECT username FROM users WHERE id = ?', [transaction.user_id]);

            if (users.length > 0) {
              const user = users[0];

              if (isTelco) {
                await new TelegramService().sendTelcoPurchaseNotification({
                  username: user.username,
                  userId: transaction.user_id,
                  provider: transaction.brand,
                  product: transaction.product_name,
                  number: transaction.customer_no,
                  price: transaction.selling_price,
                  date: new Date(),
                  type: transaction.product_type
                });
              } else {
                const [products] = await connection.query('SELECT brand FROM digiflazz_products WHERE buyer_sku_code = ?', [transaction.product_sku]);

                if (products.length > 0) {
                  const product = products[0];

                  await new TelegramService().sendGameTopupNotification({
                    username: user.username,
                    userId: transaction.user_id,
                    brand: product.brand,
                    productName: transaction.product_name,
                    price: transaction.selling_price,
                    transactionCode: sn,
                    transactionDate: new Date()
                  });
                }
              }
            }
          } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
            // Do not throw error, let the main process succeed
          }
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

  // Create pulsa/data topup transaction
  async createTelcoTopup(userId, buyerSkuCode, customerNo, productType = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Determine product source table
      const tablesToCheck = [];
      if (productType === 'pulsa') tablesToCheck.push({ table: 'digiflazz_pulsa_products', type: 'pulsa' });
      if (productType === 'data') tablesToCheck.push({ table: 'digiflazz_data_products', type: 'data' });
      if (tablesToCheck.length === 0) {
        tablesToCheck.push({ table: 'digiflazz_pulsa_products', type: 'pulsa' });
        tablesToCheck.push({ table: 'digiflazz_data_products', type: 'data' });
      }

      let product = null;
      let resolvedType = productType;

      for (const entry of tablesToCheck) {
        const [rows] = await connection.query(
          `SELECT * FROM ${entry.table} WHERE buyer_sku_code = ? AND is_active = 1`,
          [buyerSkuCode]
        );
        if (rows.length > 0) {
          product = rows[0];
          resolvedType = entry.type;
          break;
        }
      }

      if (!product) {
        throw new Error('Produk tidak ditemukan atau tidak aktif');
      }

      const refId = this.generateRefId();

      // Check user balance
      await BalanceService.validateSufficientBalance(userId, product.selling_price, connection);

      // Deduct balance
      await BalanceService.deductBalance(
        userId,
        product.selling_price,
        `Telco Topup: ${product.product_name}`,
        'telco_topup',
        null,
        connection
      );

      // Insert telco transaction record
      const [insertResult] = await connection.query(`
        INSERT INTO digiflazz_telco_transactions 
        (user_id, product_sku, product_name, brand, category, product_type, customer_no, ref_id, price, selling_price, digiflazz_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
      `, [
        userId,
        buyerSkuCode,
        product.product_name,
        product.brand,
        product.category,
        resolvedType || product.type || 'pulsa',
        customerNo,
        refId,
        product.price,
        product.selling_price
      ]);

      const transactionId = insertResult.insertId;

      // Update balance transaction reference
      await connection.query(
        `UPDATE balance_transactions SET reference_id = ? WHERE user_id = ? AND reference_type = 'telco_topup' AND reference_id IS NULL ORDER BY id DESC LIMIT 1`,
        [transactionId, userId]
      );

      // Prepare payload for Digiflazz
      const signature = this.generateTransactionSignature(refId);
      const payload = {
        username: this.username,
        buyer_sku_code: buyerSkuCode,
        customer_no: customerNo,
        ref_id: refId,
        sign: signature,
        testing: process.env.NODE_ENV !== 'production'
      };

      console.log('Digiflazz Telco Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.baseUrl}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.data) {
        const status = result.data.status || 'Pending';
        const sn = result.data.sn || null;
        const message = result.data.message || null;

        await connection.query(`
          UPDATE digiflazz_telco_transactions 
          SET digiflazz_status = ?, sn = ?, message = ?, updated_at = NOW()
          WHERE id = ?
        `, [status, sn, message, transactionId]);

        if (status === 'Gagal') {
          await BalanceService.addBalance(
            userId,
            product.selling_price,
            `Refund Telco Topup (Gagal): ${product.product_name}`,
            'telco_topup_refund',
            transactionId,
            connection
          );
        }

        if (status === 'Sukses') {
          try {
            const [users] = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
            const username = users[0]?.username || 'Unknown';
            await new TelegramService().sendTelcoPurchaseNotification({
              username,
              userId,
              provider: product.brand,
              product: product.product_name,
              number: customerNo,
              price: product.selling_price,
              date: new Date(),
              type: resolvedType || product.type || 'pulsa'
            });
          } catch (notificationError) {
            console.error('Failed to send telco purchase notification:', notificationError);
          }
        }

        await connection.commit();

        return {
          success: status !== 'Gagal',
          transaction_id: transactionId,
          ref_id: refId,
          status,
          sn,
          message: message || (status === 'Sukses' ? 'Topup berhasil' : status === 'Pending' ? 'Topup sedang diproses' : 'Topup gagal'),
          product_name: product.product_name,
          customer_no: customerNo,
          amount: product.selling_price
        };
      } else {
        // API error refund
        await BalanceService.addBalance(
          userId,
          product.selling_price,
          `Refund Telco Topup (Error): ${product.product_name}`,
          'telco_topup_refund',
          transactionId,
          connection
        );

        await connection.query(`
          UPDATE digiflazz_telco_transactions 
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
      console.error('Error creating telco topup:', error);
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

  // Get pulsa & data transaction history for user
  async getTelcoTransactionHistory(userId, limit = 50) {
    const [rows] = await pool.query(`
      SELECT * FROM digiflazz_telco_transactions 
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

  // Get auto-sync settings
  async getAutoSyncSettings() {
    const [rows] = await pool.query('SELECT is_active, interval_minutes FROM auto_sync_digiflazz WHERE id = 1');
    if (rows.length === 0) {
      // If no settings found, return default
      return { is_active: true, interval_minutes: 60 };
    }
    return {
      is_active: !!rows[0].is_active,
      interval_minutes: rows[0].interval_minutes,
    };
  }

  // Update auto-sync settings
  async updateAutoSyncSettings({ is_active, interval_minutes }) {
    const updates = [];
    const params = [];

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (interval_minutes !== undefined) {
      if (isNaN(parseInt(interval_minutes)) || parseInt(interval_minutes) < 1) {
        throw new Error('Interval harus berupa angka dan minimal 1 menit.');
      }
      updates.push('interval_minutes = ?');
      params.push(parseInt(interval_minutes));
    }

    if (updates.length === 0) {
      return { success: false, message: 'Tidak ada data untuk diupdate.' };
    }

    updates.push('updated_at = NOW()');

    await pool.query(
      `UPDATE auto_sync_digiflazz SET ${updates.join(', ')} WHERE id = 1`,
      params
    );

    return { success: true, message: 'Pengaturan auto-sync berhasil diperbarui.' };
  }

  // Sync all products from Digiflazz in a single run
  async syncAllDigiflazzProducts() {
    const allProducts = await this.fetchPriceList();
    if (!Array.isArray(allProducts) || allProducts.length === 0) {
      throw new Error('Pricelist from Digiflazz is empty, sync canceled to avoid data loss.');
    }

    const categorized = this.categorizeProducts(allProducts);

    const gameResult = await this.syncProducts(categorized.game);
    const pulsaResult = await this.syncCategoryProducts('pulsa', 'digiflazz_pulsa_products', 'pulsa', categorized.pulsa);
    const dataResult = await this.syncCategoryProducts('data', 'digiflazz_data_products', 'paket data', categorized.data);

    return {
      success: true,
      message: 'All products synced successfully.',
      results: {
        game: gameResult,
        pulsa: pulsaResult,
        data: dataResult,
      }
    };
  }
}

module.exports = new DigiflazzService();
