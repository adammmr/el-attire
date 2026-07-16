const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200
  },
  slug: { type: String, unique: true },
  category: {
    type: String,
    required: true,
    enum: ['kaftan', 'agbada', 'senator', 'accessories']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  description: { type: String, required: true },
  shortDescription: { type: String, maxlength: 300 },
  images: [{
    url: { type: String, required: true },
    alt: String,
    isMain: { type: Boolean, default: false }
  }],
  videos: [{
    url: String,
    thumbnail: String,
    title: String
  }],
  sizes: [{
    label: String,
    isAvailable: { type: Boolean, default: true }
  }],
  colors: [{
    name: String,
    hex: String
  }],
  tags: [String],
  badge: {
    text: String,
    type: { type: String, enum: ['new', 'bestseller', 'limited', 'exclusive', 'sale'] }
  },
  fabric: {
    name: String,
    composition: String,
    care: String,
    weight: String,
    width: String
  },
  styling: {
    occasion: [String],
    styleNotes: String
  },
  inventory: {
    inStock: { type: Boolean, default: true },
    quantity: { type: Number, default: 1 },
    lowStockThreshold: { type: Number, default: 5 }
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);