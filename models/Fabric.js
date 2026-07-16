const mongoose = require('mongoose');

const fabricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Fabric name is required'],
    trim: true,
    maxlength: 200
  },
  slug: { type: String, unique: true },
  category: {
    type: String,
    required: true,
    enum: ['aso-oke', 'damask', 'silk', 'brocade', 'cotton', 'lace', 'linen', 'wool', 'synthetic']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  unit: {
    type: String,
    enum: ['yd', 'meter', 'panel', 'bundle'],
    default: 'yd'
  },
  description: { type: String, required: true },
  specifications: {
    width: String,
    composition: String,
    weight: String,
    care: String,
    origin: String
  },
  images: [{
    url: { type: String, required: true },
    alt: String,
    isMain: { type: Boolean, default: false }
  }],
  colors: [{
    name: String,
    hex: String
  }],
  patterns: [String],
  tags: [String],
  badge: {
    text: String,
    type: { type: String, enum: ['new', 'bestseller', 'premium', 'limited', 'exclusive'] }
  },
  inventory: {
    inStock: { type: Boolean, default: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: 'yds' },
    lowStockThreshold: { type: Number, default: 10 },
    restockDate: Date
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  supplier: {
    name: String,
    contact: String,
    location: String
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

fabricSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Fabric', fabricSchema);