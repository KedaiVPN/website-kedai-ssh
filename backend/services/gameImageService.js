const pool = require('../db/connection');
const fs = require('fs').promises;
const path = require('path');

class GameImageService {
  async getUniqueBrands() {
    const [rows] = await pool.query('SELECT DISTINCT brand FROM digiflazz_products ORDER BY brand ASC');
    return rows.map(row => row.brand);
  }

  async getAllBrandImages() {
    const [rows] = await pool.query('SELECT brand_name, image_url FROM game_brand_images ORDER BY brand_name ASC');
    return rows;
  }

  async addOrUpdateBrandImage(brandName, imageUrl) {
    const [existing] = await pool.query('SELECT * FROM game_brand_images WHERE brand_name = ?', [brandName]);

    if (existing.length > 0) {
      // Jika sudah ada, hapus file gambar lama sebelum update
      const oldImageUrl = existing[0].image_url;
      const oldImagePath = path.join(__dirname, '..', 'public', oldImageUrl);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error(`Gagal menghapus file lama: ${oldImagePath}`, err);
        // Lanjutkan saja meskipun file lama gagal dihapus
      }

      const [result] = await pool.query(
        'UPDATE game_brand_images SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE brand_name = ?',
        [imageUrl, brandName]
      );
      return result;
    } else {
      const [result] = await pool.query(
        'INSERT INTO game_brand_images (brand_name, image_url) VALUES (?, ?)',
        [brandName, imageUrl]
      );
      return result;
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
}

module.exports = new GameImageService();
