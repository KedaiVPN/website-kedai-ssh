const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../db/database.sqlite');

// Helper to get a database connection
const getDb = () => new sqlite3.Database(dbPath);

class MessageService {
  /**
   * Creates a new message and calculates its expiration date.
   */
  static createMessage({ content, targetRole, durationDays, adminId }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      let expiresAt = null;
      if (durationDays) {
        const now = new Date();
        now.setDate(now.getDate() + durationDays);
        expiresAt = now.toISOString();
      }

      const query = `
        INSERT INTO messages (content, target_role, duration_days, expires_at, created_by_admin_id)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(query, [content, targetRole, durationDays, expiresAt, adminId], function (err) {
        if (err) {
          db.close();
          return reject(err);
        }
        // Return the full message object
        db.get('SELECT * FROM messages WHERE id = ?', [this.lastID], (err, row) => {
          db.close();
          if (err) reject(err);
          else resolve(row);
        });
      });
    });
  }

  /**
   * Deletes a message by its ID.
   */
  static deleteMessage(messageId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      // ON DELETE CASCADE in the schema will handle deleting from message_reads
      db.run('DELETE FROM messages WHERE id = ?', [messageId], function (err) {
        db.close();
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Retrieves all messages for the admin dashboard, including read count.
   */
  static getAdminMessages() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const query = `
        SELECT
          m.*,
          a.username as admin_username,
          (SELECT COUNT(*) FROM message_reads WHERE message_id = m.id) as read_count
        FROM messages m
        JOIN admins a ON m.created_by_admin_id = a.id
        ORDER BY m.created_at DESC
      `;
      db.all(query, [], (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Retrieves relevant, non-expired messages for a given user, including read status.
   */
  static getUserMessages(userId, userRole) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const query = `
        SELECT
          m.*,
          CASE
            WHEN mr.read_at IS NOT NULL THEN 1
            ELSE 0
          END as is_read
        FROM messages m
        LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
        WHERE
          (m.target_role = 'all' OR m.target_role = ?)
          AND (m.expires_at IS NULL OR m.expires_at > CURRENT_TIMESTAMP)
        ORDER BY m.created_at DESC
      `;
      db.all(query, [userId, userRole], (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Gets the count of unread messages for a user.
   */
  static getUnreadCount(userId, userRole) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      // This query counts messages targeted to the user that are not in their 'message_reads' table
      const query = `
        SELECT COUNT(*) as unread_count
        FROM messages m
        WHERE
          (m.target_role = 'all' OR m.target_role = ?)
          AND (m.expires_at IS NULL OR m.expires_at > CURRENT_TIMESTAMP)
          AND NOT EXISTS (
            SELECT 1 FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = ?
          )
      `;
      db.get(query, [userRole, userId], (err, row) => {
        db.close();
        if (err) reject(err);
        else resolve(row ? row.unread_count : 0);
      });
    });
  }

  /**
   * Marks a message as read for a specific user.
   */
  static markAsRead(messageId, userId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      // INSERT OR IGNORE will do nothing if the record already exists, which is perfect.
      const query = 'INSERT OR IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)';
      db.run(query, [messageId, userId], function (err) {
        db.close();
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = MessageService;
