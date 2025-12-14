const pool = require('../db/connection');
const fs = require('fs');
const path = require('path');

class GameBannerService {
  /**
   * Mengambil semua banner yang aktif.
   */
  async getBanners() {
    const [banners] = await pool.query(
      'SELECT id, image_url, brand_name FROM game_topup_banners WHERE is_active = 1 ORDER BY created_at DESC'
    );
    return banners;
  }

  /**
   * Menambahkan banner baru.
   * @param {string} imageUrl - Path relatif ke gambar.
   * @param {string} brandName - Nama brand yang ditautkan.
   */
  async addBanner(imageUrl, brandName) {
    const [result] = await pool.query(
      'INSERT INTO game_topup_banners (image_url, brand_name) VALUES (?, ?)',
      [imageUrl, brandName]
    );
    return { id: result.insertId, imageUrl, brandName };
  }

  /**
   * Menghapus banner berdasarkan ID.
   * @param {number} id - ID banner yang akan dihapus.
   */
  async deleteBanner(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Dapatkan informasi banner untuk mengambil path file gambar
      const [banners] = await connection.query(
        'SELECT image_url FROM game_topup_banners WHERE id = ?',
        [id]
      );

      if (banners.length === 0) {
        throw new Error('Banner tidak ditemukan');
      }

      const banner = banners[0];

      // 2. Hapus record dari database
      const [result] = await connection.query(
        'DELETE FROM game_topup_banners WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Gagal menghapus banner dari database');
      }

      // 3. Hapus file gambar dari server
      const imagePath = path.join(__dirname, '..', 'public', banner.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      await connection.commit();
      return { success: true, message: 'Banner berhasil dihapus.' };
    } catch (error) {
      await connection.rollback();
      console.error('Error saat menghapus banner:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new GameBannerService();
