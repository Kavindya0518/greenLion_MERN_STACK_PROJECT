
const mongoose = require('mongoose');

const ProductCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
      validate: {
        validator: (v) => /^[A-Za-z][A-Za-z0-9\s&]*$/.test(v),
        message:
          'Category must start with a letter; after that only letters, numbers, spaces and & are allowed',
      },
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
  },
  { timestamps: true }
);

// Case-insensitive unique index for name
ProductCategorySchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

ProductCategorySchema.pre('validate', function preValidate(next) {
  if (this.name) {
    const norm = this.name.trim().replace(/\s+/g, ' ');
    this.name = norm;
    this.slug = norm.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', ProductCategorySchema);