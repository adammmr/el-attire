const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  fabric: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fabric'
  },
  tailoring: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tailoring'
  },
  type: {
    type: String,
    enum: ['product', 'fabric', 'tailoring', 'general'],
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true,
    maxlength: 2000
  },
  images: [{
    url: String,
    caption: String
  }],
  isApproved: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  adminResponse: {
    body: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  },
  helpfulCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

reviewSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  if (this.product && this.rating) {
    const Review = this.constructor;
    const stats = await Review.aggregate([
      { $match: { product: this.product, isApproved: true } },
      { $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    if (stats.length > 0) {
      await mongoose.model('Product').findByIdAndUpdate(this.product, {
        'ratings.average': Math.round(stats[0].average * 10) / 10,
        'ratings.count': stats[0].count
      });
    }
  }
  next();
});

module.exports = mongoose.model('Review', reviewSchema);