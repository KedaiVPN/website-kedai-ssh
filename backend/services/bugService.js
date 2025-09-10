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
  static async createBug({ label, value, is_wildcard }) {
    const query = 'INSERT INTO bug_hosts (label, value, is_wildcard) VALUES (?, ?, ?)';
    // Ensure boolean is converted to 0 or 1
    const isWildcardValue = is_wildcard ? 1 : 0;
    const [result] = await pool.execute(query, [label, value, isWildcardValue]);
    const [rows] = await pool.execute('SELECT * FROM bug_hosts WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  /**
   * Updates an existing bug host.
   * @param {number} id - The ID of the bug to update.
   * @param {object} bugData - The data to update.
   * @returns {Promise<object>} The updated bug host object.
   */
  static async updateBug(id, { label, value, is_wildcard }) {
    // The `updated_at` field updates automatically in MySQL via the table schema.
    const query = 'UPDATE bug_hosts SET label = ?, value = ?, is_wildcard = ? WHERE id = ?';
    // Ensure boolean is converted to 0 or 1
    const isWildcardValue = is_wildcard ? 1 : 0;
    const [result] = await pool.execute(query, [label, value, isWildcardValue, id]);

    if (result.affectedRows === 0) {
      return null; // Or throw an error if preferred
    }

    const [rows] = await pool.execute('SELECT * FROM bug_hosts WHERE id = ?', [id]);
    return rows[0];
  }

  /**
   * Deletes a bug host by its ID.
   * @param {number} id - The ID of the bug to delete.
   * @returns {Promise<{affectedRows: number}>}
   */
  static async deleteBug(id) {
    const [result] = await pool.execute('DELETE FROM bug_hosts WHERE id = ?', [id]);
    return { affectedRows: result.affectedRows };
  }
}

module.exports = BugService;
