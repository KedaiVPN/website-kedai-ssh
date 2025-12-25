const pool = require('../db/connection');
const BalanceService = require('./balanceService');
const fs = require('fs').promises;
const path = require('path');
const TelegramService = require('./telegramService');
const telegramService = new TelegramService();

// Helper function to generate a unique slug
const generateSlug = async (name, connection, productId = null) => {
    let slug = name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

    let isUnique = false;
    let counter = 1;
    while (!isUnique) {
        let query = 'SELECT id FROM other_products WHERE slug = ?';
        const params = [slug];
        if (productId) {
            query += ' AND id != ?';
            params.push(productId);
        }
        const [rows] = await connection.query(query, params);
        if (rows.length === 0) {
            isUnique = true;
        } else {
            slug = `${slug}-${counter}`;
            counter++;
        }
    }
    return slug;
};


const otherProductService = {
    // ==================== ADMIN METHODS ====================

    createProduct: async ({ name, description, price, image_url, is_active = 1 }) => {
        const connection = await pool.getConnection();
        try {
            const slug = await generateSlug(name, connection);
            const [result] = await connection.query(
                'INSERT INTO other_products (name, slug, description, price, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                [name, slug, description, price, image_url, is_active]
            );
            const [rows] = await connection.query('SELECT * FROM other_products WHERE id = ?', [result.insertId]);
            return rows[0];
        } finally {
            connection.release();
        }
    },

    updateProduct: async (productId, { name, description, price, image_url, is_active }) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Ambil data produk saat ini, termasuk URL gambar lama
            const [productRows] = await connection.query('SELECT name, image_url FROM other_products WHERE id = ?', [productId]);
            if (productRows.length === 0) {
                throw new Error('Produk tidak ditemukan.');
            }
            const oldImageUrl = productRows[0].image_url;
            const oldName = productRows[0].name;

            // 2. Siapkan data untuk pembaruan
            let slug;
            if (name && name !== oldName) {
                slug = await generateSlug(name, connection, productId);
            }

            const fieldsToUpdate = { name, description, price, is_active };
            if (slug) fieldsToUpdate.slug = slug;
            if (image_url !== undefined) {
                fieldsToUpdate.image_url = image_url;
            }

            // 3. Perbarui database
            await connection.query('UPDATE other_products SET ? WHERE id = ?', [fieldsToUpdate, productId]);

            // 4. Periksa apakah gambar perlu dihapus
            const newImageUrl = fieldsToUpdate.image_url;
            if (oldImageUrl && oldImageUrl !== newImageUrl) {
                const imagePath = path.join(__dirname, '..', 'public', oldImageUrl);
                try {
                    await fs.unlink(imagePath);
                } catch (err) {
                    if (err.code !== 'ENOENT') { // Abaikan jika file tidak ditemukan
                        console.error("Gagal menghapus gambar lama:", err); // Log error tapi jangan gagalkan transaksi
                    }
                }
            }

            await connection.commit();

            const [rows] = await connection.query('SELECT * FROM other_products WHERE id = ?', [productId]);
            return rows[0];
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    deleteProduct: async (productId) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Ambil URL gambar sebelum menghapus produk
            const [productRows] = await connection.query('SELECT image_url FROM other_products WHERE id = ?', [productId]);
            if (productRows.length === 0) {
                throw new Error('Produk tidak ditemukan.');
            }
            const imageUrl = productRows[0].image_url;

            // 2. Hapus produk dari database
            await connection.query('DELETE FROM other_products WHERE id = ?', [productId]);

            // 3. Jika ada URL gambar, hapus file dari server
            if (imageUrl) {
                const imagePath = path.join(__dirname, '..', 'public', imageUrl);
                try {
                    await fs.unlink(imagePath);
                } catch (err) {
                    if (err.code !== 'ENOENT') { // Abaikan jika file tidak ditemukan
                        throw err;
                    }
                }
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    addProductStock: async (productId, stocks) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const query = `INSERT INTO other_product_stock
                         (product_id, stock_data_email, stock_data_password, stock_data_link, masa_aktif)
                         VALUES (?, ?, ?, ?, ?)`;
            for (const stock of stocks) {
                await connection.query(query, [
                    productId,
                    stock.stock_data_email || null,
                    stock.stock_data_password || null,
                    stock.stock_data_link || null,
                    stock.masa_aktif || null
                ]);
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    deleteProductStock: async (stockId) => {
        const connection = await pool.getConnection();
        try {
            await connection.query('DELETE FROM other_product_stock WHERE id = ?', [stockId]);
        } finally {
            connection.release();
        }
    },

    getAllProductsWithStockCount: async () => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(`
                SELECT
                    p.*,
                    COALESCE(SUM(CASE WHEN s.status = 'tersedia' THEN 1 ELSE 0 END), 0) as available_stock_count,
                    COALESCE(SUM(CASE WHEN s.status = 'terjual' THEN 1 ELSE 0 END), 0) as sold_stock_count
                FROM other_products p
                LEFT JOIN other_product_stock s ON p.id = s.product_id
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `);
            return rows;
        } finally {
            connection.release();
        }
    },

    getStockForProduct: async (productId) => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                "SELECT * FROM other_product_stock WHERE product_id = ? ORDER BY created_at DESC",
                [productId]
            );
            return rows;
        } finally {
            connection.release();
        }
    },

    // ==================== BANNER METHODS (ADMIN) ====================

    createBanner: async ({ productId, imageUrl }) => {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                'INSERT INTO other_product_banners (product_id, image_url) VALUES (?, ?)',
                [productId, imageUrl]
            );
            const [rows] = await connection.query('SELECT * FROM other_product_banners WHERE id = ?', [result.insertId]);
            return rows[0];
        } finally {
            connection.release();
        }
    },

    getAllBannersWithProductInfo: async () => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(`
                SELECT b.id, b.image_url, b.created_at, p.name as product_name, p.slug as product_slug
                FROM other_product_banners b
                JOIN other_products p ON b.product_id = p.id
                ORDER BY b.created_at DESC
            `);
            return rows;
        } finally {
            connection.release();
        }
    },

    deleteBanner: async (bannerId) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [bannerRows] = await connection.query('SELECT image_url FROM other_product_banners WHERE id = ?', [bannerId]);
            if (bannerRows.length === 0) {
                throw new Error('Banner tidak ditemukan.');
            }
            const imageUrl = bannerRows[0].image_url;

            await connection.query('DELETE FROM other_product_banners WHERE id = ?', [bannerId]);

            if (imageUrl) {
                const imagePath = path.join(__dirname, '..', 'public', imageUrl);
                try {
                    await fs.unlink(imagePath);
                } catch (err) {
                    // Jika file tidak ada, tidak apa-apa, mungkin sudah dihapus sebelumnya
                    if (err.code !== 'ENOENT') {
                        throw err; // Lemparkan error lain
                    }
                }
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // ==================== BANNER METHODS (PUBLIC) ====================

    getActiveBanners: async () => {
        const connection = await pool.getConnection();
        try {
             const [rows] = await connection.query(`
                SELECT b.image_url, p.slug as product_slug
                FROM other_product_banners b
                JOIN other_products p ON b.product_id = p.id
                WHERE b.is_active = 1
                ORDER BY b.created_at DESC
            `);
            return rows;
        } finally {
            connection.release();
        }
    },


    // ==================== CUSTOMER METHODS ====================

    getAvailableProducts: async () => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(`
                SELECT
                    p.id, p.name, p.slug, p.price, p.image_url,
                    COALESCE(SUM(CASE WHEN s.status = 'tersedia' THEN 1 ELSE 0 END), 0) as available_stock_count,
                    COALESCE(SUM(CASE WHEN s.status = 'terjual' THEN 1 ELSE 0 END), 0) as sold_stock_count
                FROM other_products p
                LEFT JOIN other_product_stock s ON p.id = s.product_id
                WHERE p.is_active = 1
                GROUP BY p.id
                ORDER BY p.name ASC
            `);
            return rows;
        } finally {
            connection.release();
        }
    },

    purchaseProduct: async (userId, productId) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [productRows] = await connection.query('SELECT * FROM other_products WHERE id = ? AND is_active = 1 FOR UPDATE', [productId]);
            if (productRows.length === 0) throw new Error('Produk tidak ditemukan atau tidak aktif.');
            const product = productRows[0];
            const price = product.price;

            const userStats = await BalanceService.getUserStats(userId, connection);
            if (userStats.balance < price) throw new Error('Saldo tidak mencukupi.');

            const [stockRows] = await connection.query(
                "SELECT * FROM other_product_stock WHERE product_id = ? AND status = 'tersedia' LIMIT 1 FOR UPDATE",
                [productId]
            );
            if (stockRows.length === 0) throw new Error('Stok produk habis.');
            const stockToSell = stockRows[0];

            const description = `Pembelian Produk: ${product.name}`;
            await BalanceService.deductBalance(userId, price, description, 'other_product_purchase', stockToSell.id, connection);

            await connection.query(
                "UPDATE other_product_stock SET status = 'terjual', sold_at = NOW(), user_id_buyer = ? WHERE id = ?",
                [userId, stockToSell.id]
            );

            await connection.query(
                `INSERT INTO other_product_transactions
                 (user_id, product_id, stock_id, product_name_snapshot, price_at_purchase, stock_data_email, stock_data_password, stock_data_link, masa_aktif)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    productId,
                    stockToSell.id,
                    product.name,
                    price,
                    stockToSell.stock_data_email,
                    stockToSell.stock_data_password,
                    stockToSell.stock_data_link,
                    stockToSell.masa_aktif
                ]
            );

            await connection.commit();

            // Send Telegram notification, wrapped in try-catch to prevent purchase failure
            try {
                const [userRows] = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
                if (userRows.length > 0) {
                    await telegramService.sendOtherProductPurchaseNotification({
                        productName: product.name,
                        price: price,
                        username: userRows[0].username,
                    });
                }
            } catch (telegramError) {
                console.error('Failed to send Telegram notification for other product purchase:', telegramError);
            }

            // Return the detailed stock info for the frontend modal
            return {
                id: stockToSell.id,
                product_name: product.name,
                price_at_purchase: price,
                stock_data_email: stockToSell.stock_data_email,
                stock_data_password: stockToSell.stock_data_password,
                stock_data_link: stockToSell.stock_data_link,
                masa_aktif: stockToSell.masa_aktif,
                created_at: new Date()
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    getUserPurchaseHistory: async (userId) => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT id, product_name_snapshot, price_at_purchase, created_at
                 FROM other_product_transactions
                 WHERE user_id = ?
                 ORDER BY created_at DESC`,
                [userId]
            );
            return rows;
        } finally {
            connection.release();
        }
    },

    getTransactionDetails: async (userId, transactionId) => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT
                    id,
                    product_name_snapshot,
                    price_at_purchase,
                    stock_data_email,
                    stock_data_password,
                    stock_data_link,
                    masa_aktif,
                    created_at
                 FROM other_product_transactions
                 WHERE user_id = ? AND id = ?`,
                [userId, transactionId]
            );
            if (rows.length === 0) {
                throw new Error('Transaksi tidak ditemukan atau Anda tidak memiliki akses.');
            }
            return rows[0];
        } finally {
            connection.release();
        }
    },

    getProductBySlug: async (slug) => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(`
                SELECT
                    p.*,
                    COALESCE(SUM(CASE WHEN s.status = 'tersedia' THEN 1 ELSE 0 END), 0) as available_stock_count,
                    COALESCE(SUM(CASE WHEN s.status = 'terjual' THEN 1 ELSE 0 END), 0) as sold_stock_count
                FROM other_products p
                LEFT JOIN other_product_stock s ON p.id = s.product_id
                WHERE p.slug = ? AND p.is_active = 1
                GROUP BY p.id
            `, [slug]);

            if (rows.length === 0) {
                return null; // Mengembalikan null jika tidak ditemukan
            }
            return rows[0];
        } finally {
            connection.release();
        }
    },
};

module.exports = otherProductService;
