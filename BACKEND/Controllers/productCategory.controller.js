
const Category = require('../Models/productCategory.model');
let Product;
try {
  Product = require('../Models/Product'); // adjust if needed
} catch (e) {
  // If Product model path differs or not present yet, this soft-fails; delete guard will no-op
  Product = null;
}

function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

function validateName(name) {
  const n = normalizeName(name);
  if (!n) return 'Name is required';
  if (n.length < 2 || n.length > 60) return 'Name must be 2-60 characters';
  if (!/^[A-Za-z]/.test(n)) return 'Name must start with a letter';
  if (!/^[A-Za-z][A-Za-z0-9\s&]*$/.test(n)) {
    return 'Only letters, numbers, spaces and & allowed after first letter';
  }
  return null;
}

// GET /product-categories
async function listCategories(req, res) {
  try {
    const items = await Category.find({})
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 });

    if (req.query.full === '1') {
      return res.json({
        ok: true,
        items: items.map((i) => ({ id: i._id, name: i.name, slug: i.slug })),
      });
    }

    return res.json({ ok: true, categories: items.map((i) => i.name) });
  } catch (err) {
    console.error('listCategories error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch categories' });
  }
}

// GET /product-categories/:id
async function getCategory(req, res) {
  try {
    const { id } = req.params;
    const item = await Category.findById(id);
    if (!item) return res.status(404).json({ ok: false, message: 'Category not found' });
    return res.json({ ok: true, category: { id: item._id, name: item.name, slug: item.slug } });
  } catch (err) {
    console.error('getCategory error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to fetch category' });
  }
}

// POST /product-categories
async function createCategory(req, res) {
  try {
    const { name } = req.body;
    const msg = validateName(name);
    if (msg) return res.status(400).json({ ok: false, message: msg });

    const normalized = normalizeName(name);
    const dup = await Category.findOne({ name: normalized })
      .collation({ locale: 'en', strength: 2 });
    if (dup) return res.status(400).json({ ok: false, message: 'Category already exists' });

    const created = await Category.create({ name: normalized });
    return res.status(201).json({ ok: true, category: { id: created._id, name: created.name } });
  } catch (err) {
    console.error('createCategory error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to create category' });
  }
}

// PATCH /product-categories/:id
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const msg = validateName(name);
    if (msg) return res.status(400).json({ ok: false, message: msg });

    const normalized = normalizeName(name);
    const dup = await Category.findOne({ name: normalized })
      .collation({ locale: 'en', strength: 2 });
    if (dup && String(dup._id) !== String(id)) {
      return res.status(400).json({ ok: false, message: 'Another category with this name exists' });
    }

    const updated = await Category.findById(id);
    if (!updated) return res.status(404).json({ ok: false, message: 'Category not found' });

    updated.name = normalized;
    await updated.save();
    return res.json({ ok: true, category: { id: updated._id, name: updated.name } });
  } catch (err) {
    console.error('updateCategory error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to update category' });
  }
}

// DELETE /product-categories/:id
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ ok: false, message: 'Category not found' });

    if (Product) {
      const usingCount = await Product.countDocuments({ category: cat.name });
      if (usingCount > 0) {
        return res.status(400).json({
          ok: false,
          message: `Cannot delete. ${usingCount} product(s) are using this category.`,
        });
      }
    }

    await Category.deleteOne({ _id: id });
    return res.json({ ok: true, message: 'Category deleted' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to delete category' });
  }
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};