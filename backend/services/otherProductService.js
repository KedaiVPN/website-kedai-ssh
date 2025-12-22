const pool = require('../db/connection');
const BalanceService = require('./balanceService');
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
            const [currentProductRows] = await connection.query('SELECT name FROM other_products WHERE id = ?', [productId]);
            if (currentProductRows.length === 0) throw new Error('Produk tidak ditemukan.');

            let slug;
            if (name !== currentProductRows[0].name) {
                slug = await generateSlug(name, connection, productId);
            }

            const fieldsToUpdate = { name, description, price, is_active };
            if (slug) fieldsToUpdate.slug = slug;
            // Hanya perbarui image_url jika nilainya disediakan (bukan undefined)
            if (image_url !== undefined) {
                fieldsToUpdate.image_url = image_url;
            }

            await connection.query('UPDATE other_products SET ? WHERE id = ?', [fieldsToUpdate, productId]);

            const [rows] = await connection.query('SELECT * FROM other_products WHERE id = ?', [productId]);
            return rows[0];
        } finally {
            connection.release();
        }
    },

    deleteProduct: async (productId) => {
        const connection = await pool.getConnection();
        try {
            await connection.query('DELETE FROM other_products WHERE id = ?', [productId]);
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
