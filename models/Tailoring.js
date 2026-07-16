const mongoose = require('mongoose');

const tailoringSchema = new mongoose.Schema({
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
  service: {
    type: String,
    enum: ['essential', 'premium', 'concierge'],
    required: true
  },
  garmentType: {
    type: String,
    enum: ['kaftan', 'agbada', 'senator', 'multiple', 'other'],
    required: true
  },
  measurements: {
    profileId: { type: mongoose.Schema.Types.ObjectId },
    neck: Number,
    shoulder: Number,
    chest: Number,
    waist: Number,
    hips: Number,
    sleeve: Number,
    bicep: Number,
    backLength: Number,
    agbadaWidth: Number,
    inseam: Number,
    outseam: Number,
    thigh: Number,
    knee: Number,
    ankle: Number
  },
  fabric: {
    selected: { type: mongoose.Schema.Types.ObjectId, ref: 'Fabric' },
    quantity: Number,
    unit: String
  },
  designDetails: {
    style: String,
    embroidery: String,
    beading: String,
    lining: String,
    buttons: String,
    specialRequests: String
  },
  occasion: {
    type: String,
    enum: ['wedding', 'corporate', 'casual', 'religious', 'other']
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stages: [{
    name: {
      type: String,
      enum: ['measurement', 'fabric_prep', 'cutting', 'stitching', 'embroidery', 'fitting', 'finishing', 'quality_check', 'delivery']
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending'
    },
    startedAt: Date,
    completedAt: Date,
    notes: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  assignedTailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fittings: [{
    date: Date,
    time: String,
    location: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed', 'cancelled'],
      default: 'scheduled'
    },
    notes: String
  }],
  pricing: {
    serviceFee: Number,
    fabricCost: Number,
    additionalCharges: Number,
    total: Number,
    deposit: Number,
    balance: Number
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'deposit_paid', 'fully_paid', 'refunded'],
    default: 'unpaid'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'fitting', 'completed', 'delivered', 'cancelled'],
    default: 'pending'
  },
  timeline: [{
    event: String,
    date: { type: Date, default: Date.now },
    note: String
  }],
  estCompletionDate: Date,
  actualCompletionDate: Date,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

tailoringSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.orderNumber) {
    this.orderNumber = 'TAIL-' + Date.now().toString(36).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Tailoring', tailoringSchema);