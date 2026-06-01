const express = require('express');
const router = express.Router();

const {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../Controllers/productCategory.controller');

// TODO: replace with your real admin auth middleware
function requireAdmin(req, res, next) {
  // if (!req.user || !req.user.isAdmin) return res.status(403).json({ ok: false, message: 'Forbidden' });
  return next();
}

// Read
router.get('/', listCategories);
router.get('/:id', getCategory);

// Create
router.post('/', requireAdmin, createCategory);

// Update
router.patch('/:id', requireAdmin, updateCategory);

// Delete
router.delete('/:id', requireAdmin, deleteCategory);

module.exports = router;