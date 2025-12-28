const pool = require('../db/connection');

async function createMessage({ title, content, targetRole, durationDays, adminId, messageType, targetPages }) {
  let expiresAt = null;
  if (durationDays) {
    const now = new Date();
    now.setDate(now.getDate() + durationDays);
    expiresAt = now;
  }

  // Ensure targetPages is a JSON string for banner types, otherwise null
  const targetPagesJson = messageType === 'banner' && targetPages ? JSON.stringify(targetPages) : null;

  const query = `
    INSERT INTO messages (title, content, target_role, duration_days, expires_at, created_by_admin_id, message_type, target_pages)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(query, [
    title,
    content,
    targetRole,
    durationDays,
    expiresAt,
    adminId,
    messageType,
    targetPagesJson
  ]);
  const [rows] = await pool.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function deleteMessage(messageId) {
  const [result] = await pool.query('DELETE FROM messages WHERE id = ?', [messageId]);
  return { changes: result.affectedRows };
}

async function getAdminMessages() {
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

async function getUserMessages(userId, userRole, page = null) {
  let query;
  let params;

  if (page) {
    query = `
      SELECT m.*
      FROM messages m
      WHERE
        m.message_type = 'banner'
        AND (m.target_role = 'all' OR m.target_role = ?)
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
        AND JSON_CONTAINS(m.target_pages, ?)
      ORDER BY m.created_at DESC
    `;
    params = [userRole, JSON.stringify(page)];
  } else {
    query = `
      SELECT
        m.*,
        CASE
          WHEN mr.read_at IS NOT NULL THEN 1
          ELSE 0
        END as is_read
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
      WHERE
        m.message_type = 'announcement'
        AND (m.target_role = 'all' OR m.target_role = ?)
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
      ORDER BY m.created_at DESC
    `;
    params = [userId, userRole];
  }

  const [rows] = await pool.query(query, params);
  return rows;
}

async function getUnreadCount(userId, userRole) {
  const query = `
    SELECT COUNT(*) as unread_count
    FROM messages m
    WHERE
      m.message_type = 'announcement'
      AND (m.target_role = 'all' OR m.target_role = ?)
      AND (m.expires_at IS NULL OR m.expires_at > NOW())
      AND NOT EXISTS (
        SELECT 1 FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = ?
      )
  `;
  const [rows] = await pool.query(query, [userRole, userId]);
  return rows[0] ? rows[0].unread_count : 0;
}

async function markAsRead(messageId, userId) {
  const query = 'INSERT IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)';
  const [result] = await pool.query(query, [messageId, userId]);
  return { changes: result.affectedRows };
}

module.exports = {
  createMessage,
  deleteMessage,
  getAdminMessages,
  getUserMessages,
  getUnreadCount,
  markAsRead
};
