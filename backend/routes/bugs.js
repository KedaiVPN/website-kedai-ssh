const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const BugService = require('../services/bugService');

const router = express.Router();
const adminRouter = express.Router();

//================[ Admin Routes - Full CRUD ]================//

// GET /api/admin/bugs - Get all bugs
adminRouter.get('/', async (req, res) => {
  try {
    const bugs = await BugService.getAllBugs();
    res.json({ success: true, bugs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bugs' });
  }
});

// POST /api/admin/bugs - Create a new bug
adminRouter.post('/', async (req, res) => {
  try {
    const { label, value, is_wildcard, is_salto } = req.body;
    if (!label || !value) {
      return res.status(400).json({ success: false, message: 'Label and value are required.' });
    }
    const bug = await BugService.createBug({ label, value, is_wildcard: !!is_wildcard, is_salto: !!is_salto });
    res.status(201).json({ success: true, bug });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create bug' });
  }
});

// PUT /api/admin/bugs/:id - Update a bug
adminRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { label, value, is_wildcard, is_salto } = req.body;
    if (!label || !value) {
      return res.status(400).json({ success: false, message: 'Label and value are required.' });
    }
    const bug = await BugService.updateBug(id, { label, value, is_wildcard: !!is_wildcard, is_salto: !!is_salto });
    res.json({ success: true, bug });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update bug' });
  }
});

// DELETE /api/admin/bugs/:id - Delete a bug
adminRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await BugService.deleteBug(id);
    res.json({ success: true, message: 'Bug deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete bug' });
  }
});


//================[ User Route - Read-only ]================//

// GET /api/bugs - Get all bugs for the injector page
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bugs = await BugService.getAllBugs();
    res.json({ success: true, bugs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bugs' });
  }
});


module.exports = { router, adminRouter };
