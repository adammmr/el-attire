const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'upload', 'login', 'logout', 'view', 'export', 'import', 'status_change']
  },
  model: {
    type: String,
    enum: ['product', 'order', 'fabric', 'user', 'page', 'settings', 'media', 'review', 'appointment', 'tailoring', 'invoice']
  },
  modelId: mongoose.Schema.Types.ObjectId,
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now }
});

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ model: 1, modelId: 1 });
activitySchema.index({ action: 1 });

module.exports = mongoose.model('Activity', activitySchema);