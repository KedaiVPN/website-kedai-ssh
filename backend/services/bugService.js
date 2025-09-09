const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../db/database.sqlite');

const getDb = () => new sqlite3.Database(dbPath);

class BugService {
  /**
   * Retrieves all bug hosts from the database.
   * @returns {Promise<Array<object>>} A list of all bug hosts.
   */
  static getAllBugs() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all('SELECT * FROM bug_hosts ORDER BY label ASC', [], (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Creates a new bug host.
   * @param {object} bugData - The data for the new bug.
   * @param {string} bugData.label - The display label.
   * @param {string} bugData.value - The host/IP value.
   * @param {boolean} bugData.is_wildcard - The wildcard flag.
   * @returns {Promise<object>} The created bug host object.
   */
  static createBug({ label, value, is_wildcard }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const query = 'INSERT INTO bug_hosts (label, value, is_wildcard) VALUES (?, ?, ?)';
      db.run(query, [label, value, is_wildcard], function (err) {
        if (err) {
          db.close();
          return reject(err);
        }
        db.get('SELECT * FROM bug_hosts WHERE id = ?', [this.lastID], (err, row) => {
          db.close();
          if (err) reject(err);
          else resolve(row);
        });
      });
    });
  }

  /**
   * Updates an existing bug host.
   * @param {number} id - The ID of the bug to update.
   * @param {object} bugData - The data to update.
   * @returns {Promise<object>} The updated bug host object.
   */
  static updateBug(id, { label, value, is_wildcard }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const query = `
        UPDATE bug_hosts
        SET label = ?, value = ?, is_wildcard = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      db.run(query, [label, value, is_wildcard, id], function (err) {
        if (err) {
          db.close();
          return reject(err);
        }
        db.get('SELECT * FROM bug_hosts WHERE id = ?', [id], (err, row) => {
          db.close();
          if (err) reject(err);
          else resolve(row);
        });
      });
    });
  }

  /**
   * Deletes a bug host by its ID.
   * @param {number} id - The ID of the bug to delete.
   * @returns {Promise<void>}
   */
  static deleteBug(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run('DELETE FROM bug_hosts WHERE id = ?', [id], function (err) {
        db.close();
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = BugService;
