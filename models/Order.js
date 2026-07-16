const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['fabric', 'product', 'tailoring', 'mixed'],
    required: true
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    fabric: { type: mongoose.Schema.Types.ObjectId, ref: 'Fabric' },
    name: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    size: String,
    color: String,
    unit: { type: String, enum: ['yd', 'piece', 'set', 'panel'] }
  }],
  tailoringDetails: {
    service: { type: String, enum: ['essential', 'premium', 'concierge'] },
    measurements: mongoose.Schema.Types.Mixed,
    progress: { type: Number, default: 0, min: 0, max: 100 },
    stages: [{
      name: String,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      notes: String
    }],
    assignedTailor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    estCompletionDate: Date
  },
  pricing: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'Nigeria' },
    zip: String
  },
  deliveryMethod: {
    type: String,
    enum: ['store_pickup', 'home_delivery', 'international'],
    default: 'store_pickup'
  },
  pickupDetails: {
    location: String,
    code: String,
    validUntil: Date
  },
  trackingNumber: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'in_progress', 'ready_pickup', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  payment: {
    method: { type: String, enum: ['card', 'transfer', 'mobile', 'cash', 'pay_on_delivery'] },
    status: { type: String, enum: ['pending', 'paid', 'partial', 'refunded'], default: 'pending' },
    reference: String,
    paidAt: Date,
    amountPaid: Number
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.orderNumber) {
    const prefix = this.type === 'tailoring' ? 'TAIL' : 'INV';
    this.orderNumber = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);