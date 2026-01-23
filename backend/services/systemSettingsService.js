const pool = require('../db/connection');

class SystemSettingsService {
  static async getSetting(key) {
    const [rows] = await pool.query('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
    return rows.length ? rows[0].setting_value : null;
  }

  static async setSetting(key, value) {
    await pool.query(
      'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      [key, value]
    );
    return value;
  }

  static async getActivePaymentGateway() {
    const gateway = await this.getSetting('active_payment_gateway');
    return gateway || 'TRIPAY'; // Default to TRIPAY
  }
}

module.exports = SystemSettingsService;
