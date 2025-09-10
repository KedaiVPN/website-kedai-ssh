const pool = require('../db/connection');

class MessageService {
  static async createMessage({ title, content, targetRole, durationDays, adminId }) {
    let expiresAt = null;
    if (durationDays) {
      const now = new Date();
      now.setDate(now.getDate() + parseInt(durationDays, 10));
      expiresAt = now;
    }

    const query = `
      INSERT INTO messages (title, content, target_role, duration_days, expires_at, created_by_admin_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [title, content, targetRole, durationDays, expiresAt, adminId]);

    const [rows] = await pool.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  static async deleteMessage(messageId) {
    // The ON DELETE CASCADE in the schema will handle deleting from message_reads
    const [result] = await pool.execute('DELETE FROM messages WHERE id = ?', [messageId]);
    return { changes: result.affectedRows };
  }

  static async getAdminMessages() {
    const query = `
      SELECT
        m.*,
        a.username as admin_username,
        (SELECT COUNT(*) FROM message_reads WHERE message_id = m.id) as read_count
      FROM messages m
      JOIN admins a ON m.created_by_admin_id = a.id
      ORDER BY m.created_at DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  static async getUserMessages(userId, userRole) {
    const query = `
      SELECT
        m.id, m.title, m.content, m.created_at, m.target_role,
        CASE WHEN mr.read_at IS NOT NULL THEN 1 ELSE 0 END as is_read
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
      WHERE
        (m.target_role = 'all' OR m.target_role = ?)
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
      ORDER BY m.created_at DESC
    `;
    const [rows] = await pool.execute(query, [userId, userRole]);
    return rows;
  }

  static async getUnreadCount(userId, userRole) {
    const query = `
      SELECT COUNT(*) as unread_count
      FROM messages m
      WHERE
        (m.target_role = 'all' OR m.target_role = ?)
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
        AND NOT EXISTS (
          SELECT 1 FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = ?
        )
    `;
    const [rows] = await pool.execute(query, [userRole, userId]);
    return rows[0] ? rows[0].unread_count : 0;
  }

  static async markAsRead(messageId, userId) {
    // Use MySQL's INSERT IGNORE syntax
    const query = 'INSERT IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)';
    const [result] = await pool.execute(query, [messageId, userId]);
    return { changes: result.affectedRows };
  }
}

module.exports = MessageService;
