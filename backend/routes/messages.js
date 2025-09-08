const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { verifyAdminToken } = require('./adminAuth'); // Assuming this is exported correctly
const MessageService = require('../services/messageService');

const router = express.Router();
const adminRouter = express.Router();

//================[ Admin Routes ]================//
// These will be mounted under /api/admin/messages

/**
 * POST /api/admin/messages - Create a new message
 */
adminRouter.post('/', async (req, res) => {
  try {
    const { title, content, targetRole, durationDays } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }
    const adminId = req.admin.id; // From verifyAdminToken middleware
    const message = await MessageService.createMessage({ title, content, targetRole, durationDays, adminId });
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create message' });
  }
});

/**
 * GET /api/admin/messages - Get all messages
 */
adminRouter.get('/', async (req, res) => {
  try {
    const messages = await MessageService.getAdminMessages();
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

/**
 * DELETE /api/admin/messages/:id - Delete a message
 */
adminRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await MessageService.deleteMessage(id);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
});


//================[ User Routes ]================//
// These will be mounted under /api/messages

/**
 * GET /api/messages - Get messages for the logged-in user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const messages = await MessageService.getUserMessages(userId, userRole);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

/**
 * GET /api/messages/unread-count - Get unread message count for the user
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const count = await MessageService.getUnreadCount(userId, userRole);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
});

/**
 * POST /api/messages/:id/read - Mark a message as read
 */
router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await MessageService.markAsRead(id, userId);
    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark message as read' });
  }
});


module.exports = { router, adminRouter };
