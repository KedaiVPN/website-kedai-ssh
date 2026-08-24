const pool = require('../db/connection');

class BugService {
  /**
   * Retrieves all bug hosts from the database.
   * @returns {Promise<Array<object>>} A list of all bug hosts.
   */
  static async getAllBugs() {
    const [rows] = await pool.query('SELECT * FROM bug_hosts ORDER BY label ASC');
    return rows;
  }

  /**
   * Creates a new bug host.
   * @param {object} bugData - The data for the new bug.
   * @param {string} bugData.label - The display label.
   * @param {string} bugData.value - The host/IP value.
   * @param {boolean} bugData.is_wildcard - The wildcard flag.
   * @returns {Promise<object>} The created bug host object.
   */
  static async createBug({ protocol, label, value, payload, proxy, sni, is_enhanced, is_wildcard, is_salto }) {
    const query = 'INSERT INTO bug_hosts (protocol, label, value, payload, proxy, sni, is_enhanced, is_wildcard, is_salto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await pool.query(query, [protocol || 'xray', label, value, payload || null, proxy || null, sni || null, is_enhanced ? 1 : 0, is_wildcard ? 1 : 0, is_salto ? 1 : 0]);
    const [rows] = await pool.query('SELECT * FROM bug_hosts WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  /**
   * Updates an existing bug host.
   * @param {number} id - The ID of the bug to update.
   * @param {object} bugData - The data to update.
   * @returns {Promise<object>} The updated bug host object.
   */
  static async updateBug(id, { protocol, label, value, payload, proxy, sni, is_enhanced, is_wildcard, is_salto }) {
    const query = `
      UPDATE bug_hosts
      SET protocol = ?, label = ?, value = ?, payload = ?, proxy = ?, sni = ?, is_enhanced = ?, is_wildcard = ?, is_salto = ?, updated_at = NOW()
      WHERE id = ?
    `;
    await pool.query(query, [protocol || 'xray', label, value, payload || null, proxy || null, sni || null, is_enhanced ? 1 : 0, is_wildcard ? 1 : 0, is_salto ? 1 : 0, id]);
    const [rows] = await pool.query('SELECT * FROM bug_hosts WHERE id = ?', [id]);
    return rows[0];
  }

  /**
   * Deletes a bug host by its ID.
   * @param {number} id - The ID of the bug to delete.
   * @returns {Promise<void>}
   */
  static async deleteBug(id) {
    const [result] = await pool.query('DELETE FROM bug_hosts WHERE id = ?', [id]);
    return { changes: result.affectedRows };
  }
}

module.exports = BugService;
