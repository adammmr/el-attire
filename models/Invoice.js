const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'tailoring', 'fabric', 'pickup'],
    required: true
  },
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  subtotal: Number,
  tax: Number,
  shipping: Number,
  discount: Number,
  total: Number,
  amountPaid: { type: Number, default: 0 },
  balance: Number,
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },
  dueDate: Date,
  paymentTerms: String,
  notes: String,
  pickupDetails: {
    location: String,
    code: String,
    validUntil: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

invoiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.invoiceNumber) {
    this.invoiceNumber = 'INV-' + Date.now().toString(36).toUpperCase();
  }
  if (this.total) {
    this.balance = this.total - (this.amountPaid || 0);
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);