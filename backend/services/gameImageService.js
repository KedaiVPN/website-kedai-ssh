const pool = require('../db/connection');
const fs = require('fs').promises;
const path = require('path');

class GameImageService {
  async getUniqueBrands() {
    const [rows] = await pool.query('SELECT DISTINCT brand AS brand_name FROM digiflazz_products WHERE brand IS NOT NULL AND brand != "" ORDER BY brand ASC');
    return rows;
  }

  async getProductsByBrand(brandName) {
    const [rows] = await pool.query('SELECT buyer_sku_code, product_name FROM digiflazz_products WHERE brand = ? ORDER BY product_name ASC', [brandName]);
    return rows;
  }

  async getAllBrandImages() {
    const [rows] = await pool.query('SELECT brand_name, image_url FROM game_brand_images ORDER BY brand_name ASC');
    return rows;
  }

  async getProductsWithImages() {
    const [rows] = await pool.query('SELECT buyer_sku_code, product_name, brand, image_url FROM digiflazz_products WHERE image_url IS NOT NULL ORDER BY brand, product_name ASC');
    return rows;
  }

  async uploadImage(brandName, imageUrl, productSku = 'brand-only') {
    // Skenario 1: Update gambar produk spesifik
    if (productSku && productSku !== 'brand-only' && productSku !== 'all-products-no-image') {
      const [existing] = await pool.query('SELECT image_url FROM digiflazz_products WHERE buyer_sku_code = ?', [productSku]);
      if (existing.length > 0 && existing[0].image_url) {
        await this._deleteFile(existing[0].image_url);
      }
      return pool.query('UPDATE digiflazz_products SET image_url = ? WHERE buyer_sku_code = ?', [imageUrl, productSku]);
    }

    // Skenario 2: Update untuk semua produk dalam brand yang belum punya gambar
    if (productSku === 'all-products-no-image') {
        return pool.query('UPDATE digiflazz_products SET image_url = ? WHERE brand = ? AND image_url IS NULL', [imageUrl, brandName]);
    }

    // Skenario 3: Update gambar brand (default)
    if (productSku === 'brand-only') {
        const [existingBrand] = await pool.query('SELECT image_url FROM game_brand_images WHERE brand_name = ?', [brandName]);
        if (existingBrand.length > 0) {
          await this._deleteFile(existingBrand[0].image_url);
          return pool.query('UPDATE game_brand_images SET image_url = ? WHERE brand_name = ?', [imageUrl, brandName]);
        } else {
          return pool.query('INSERT INTO game_brand_images (brand_name, image_url) VALUES (?, ?)', [brandName, imageUrl]);
        }
    }
  }

  // Helper to delete a file safely
  async _deleteFile(imageUrl) {
    if (!imageUrl) return;
    const imagePath = path.join(__dirname, '..', 'public', imageUrl);
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.error(`Gagal menghapus file: ${imagePath}`, err);
    }
  }

  async deleteBrandImage(brandName) {
    const [existing] = await pool.query('SELECT image_url FROM game_brand_images WHERE brand_name = ?', [brandName]);

    if (existing.length > 0) {
      const imageUrl = existing[0].image_url;
      const imagePath = path.join(__dirname, '..', 'public', imageUrl);

      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.error(`Gagal menghapus file: ${imagePath}`, err);
        // Tetap lanjutkan menghapus dari DB meskipun file tidak ada
      }

      const [result] = await pool.query('DELETE FROM game_brand_images WHERE brand_name = ?', [brandName]);
      return result;
    }

    return null;
  }

  async deleteProductImage(productSku) {
    const [existing] = await pool.query('SELECT image_url FROM digiflazz_products WHERE buyer_sku_code = ?', [productSku]);

    if (existing.length > 0 && existing[0].image_url) {
      await this._deleteFile(existing[0].image_url);
      const [result] = await pool.query('UPDATE digiflazz_products SET image_url = NULL WHERE buyer_sku_code = ?', [productSku]);
      return result;
    }

    return null;
  }
}

module.exports = new GameImageService();
