const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    unique: true,
    enum: ['home', 'about', 'collection', 'fabrics', 'tailoring', 'lookbook', 'contact', 'faq', 'terms']
  },
  title: { type: String, required: true },
  metaDescription: { type: String, maxlength: 160 },
  heroSection: {
    enabled: { type: Boolean, default: true },
    headline: String,
    subheadline: String,
    backgroundImages: [String],
    ctaText: String,
    ctaLink: String,
    secondaryCtaText: String,
    secondaryCtaLink: String,
    overlayOpacity: { type: Number, default: 0.35 }
  },
  sections: [{
    id: String,
    type: {
      type: String,
      enum: ['hero', 'fullBleed', 'grid', 'carousel', 'video', 'testimonial', 'cta', 'contact', 'text', 'fabricTabs', 'modelShowcase', 'process', 'tiers', 'faq', 'timeline', 'stats']
    },
    title: String,
    subtitle: String,
    content: mongoose.Schema.Types.Mixed,
    images: [{
      url: String,
      alt: String,
      caption: String
    }],
    videos: [{
      url: String,
      thumbnail: String,
      title: String,
      autoplay: { type: Boolean, default: false }
    }],
    backgroundColor: String,
    textColor: String,
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true }
  }],
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  fabrics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fabric' }],
  seoTitle: String,
  seoKeywords: [String],
  isPublished: { type: Boolean, default: false },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

pageContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PageContent', pageContentSchema);