const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: String,
  mimeType: String,
  size: Number,
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  alt: String,
  caption: String,
  folder: {
    type: String,
    default: 'general'
  },
  tags: [String],
  dimensions: {
    width: Number,
    height: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isUsed: { type: Boolean, default: false },
  usedIn: [{
    model: String,
    id: mongoose.Schema.Types.ObjectId
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Media', mediaSchema);