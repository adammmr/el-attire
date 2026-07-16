const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  profileName: {
    type: String,
    required: [true, 'Profile name is required'],
    trim: true,
    maxlength: 100,
    default: 'Default Profile'
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  bestFor: {
    styles: [{
      type: String,
      enum: ['kaftan', 'agbada', 'senator', 'casual', 'formal', 'wedding', 'corporate', 'traditional', 'modern', 'slim_fit', 'regular_fit', 'relaxed_fit']
    }],
    occasions: [{
      type: String,
      enum: ['wedding', 'corporate', 'casual', 'religious', 'party', 'formal', 'everyday', 'ceremony', 'festival']
    }],
    notes: {
      type: String,
      maxlength: 500,
      trim: true
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  bodyType: {
    type: String,
    enum: ['slim', 'athletic', 'average', 'broad', 'heavy', 'tall', 'petite', 'plus_size', 'custom'],
    default: 'average'
  },
  height: {
    value: { type: Number, min: 0 },
    unit: { type: String, enum: ['inches', 'cm', 'ft'], default: 'inches' }
  },
  weight: {
    value: { type: Number, min: 0 },
    unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
  },

  // Upper Body Measurements
  upperBody: {
    neck: {
      value: { type: Number, min: 0, default: 15.5 },
      notes: String
    },
    shoulder: {
      value: { type: Number, min: 0, default: 18.0 },
      notes: String
    },
    chest: {
      value: { type: Number, min: 0, default: 42.0 },
      notes: String
    },
    upperChest: {
      value: { type: Number, min: 0 },
      notes: String
    },
    underBust: {
      value: { type: Number, min: 0 },
      notes: String
    },
    sleeve: {
      value: { type: Number, min: 0, default: 25.0 },
      notes: String
    },
    shortSleeve: {
      value: { type: Number, min: 0 },
      notes: String
    },
    threeQuarterSleeve: {
      value: { type: Number, min: 0 },
      notes: String
    },
    bicep: {
      value: { type: Number, min: 0, default: 14.0 },
      notes: String
    },
    forearm: {
      value: { type: Number, min: 0 },
      notes: String
    },
    wrist: {
      value: { type: Number, min: 0 },
      notes: String
    },
    armhole: {
      value: { type: Number, min: 0 },
      notes: String
    },
    shoulderToWrist: {
      value: { type: Number, min: 0 },
      notes: String
    },
    shoulderToElbow: {
      value: { type: Number, min: 0 },
      notes: String
    }
  },

  // Mid Body Measurements
  midBody: {
    waist: {
      value: { type: Number, min: 0, default: 34.0 },
      notes: String
    },
    naturalWaist: {
      value: { type: Number, min: 0 },
      notes: String
    },
    lowerWaist: {
      value: { type: Number, min: 0 },
      notes: String
    },
    hips: {
      value: { type: Number, min: 0, default: 40.0 },
      notes: String
    },
    highHip: {
      value: { type: Number, min: 0 },
      notes: String
    },
    seat: {
      value: { type: Number, min: 0 },
      notes: String
    },
    backLength: {
      value: { type: Number, min: 0, default: 28.0 },
      notes: String
    },
    frontLength: {
      value: { type: Number, min: 0 },
      notes: String
    },
    shoulderToWaist: {
      value: { type: Number, min: 0 },
      notes: String
    },
    waistToHip: {
      value: { type: Number, min: 0 },
      notes: String
    },
    agbadaWidth: {
      value: { type: Number, min: 0, default: 58.0 },
      notes: String
    },
    agbadaLength: {
      value: { type: Number, min: 0 },
      notes: String
    },
    backWidth: {
      value: { type: Number, min: 0, default: 20.0 },
      notes: String
    },
    acrossShoulder: {
      value: { type: Number, min: 0 },
      notes: String
    },
    acrossBack: {
      value: { type: Number, min: 0 },
      notes: String
    },
    centerBack: {
      value: { type: Number, min: 0 },
      notes: String
    },
    chestWidth: {
      value: { type: Number, min: 0 },
      notes: String
    },
    bustPoint: {
      value: { type: Number, min: 0 },
      notes: String
    }
  },

  // Lower Body Measurements
  lowerBody: {
    inseam: {
      value: { type: Number, min: 0, default: 32.0 },
      notes: String
    },
    outseam: {
      value: { type: Number, min: 0, default: 42.0 },
      notes: String
    },
    thigh: {
      value: { type: Number, min: 0, default: 24.0 },
      notes: String
    },
    midThigh: {
      value: { type: Number, min: 0 },
      notes: String
    },
    knee: {
      value: { type: Number, min: 0, default: 16.0 },
      notes: String
    },
    belowKnee: {
      value: { type: Number, min: 0 },
      notes: String
    },
    calf: {
      value: { type: Number, min: 0 },
      notes: String
    },
    ankle: {
      value: { type: Number, min: 0, default: 10.0 },
      notes: String
    },
    crotchLength: {
      value: { type: Number, min: 0 },
      notes: String
    },
    crotchDepth: {
      value: { type: Number, min: 0 },
      notes: String
    },
    hipToKnee: {
      value: { type: Number, min: 0 },
      notes: String
    },
    kneeToAnkle: {
      value: { type: Number, min: 0 },
      notes: String
    },
    trouserLength: {
      value: { type: Number, min: 0 },
      notes: String
    }
  },

  // Additional Measurements
  additional: {
    collar: {
      value: { type: Number, min: 0 },
      notes: String
    },
    hatSize: {
      value: { type: Number, min: 0 },
      notes: String
    },
    shoeSize: {
      value: { type: Number, min: 0 },
      notes: String
    },
    wristCircumference: {
      value: { type: Number, min: 0 },
      notes: String
    },
    headCircumference: {
      value: { type: Number, min: 0 },
      notes: String
    }
  },

  // Fitting Preferences
  fittingPreferences: {
    shoulderFit: {
      type: String,
      enum: ['natural', 'extended', 'padded', 'roped'],
      default: 'natural'
    },
    chestFit: {
      type: String,
      enum: ['slim', 'regular', 'relaxed', 'oversized'],
      default: 'regular'
    },
    waistFit: {
      type: String,
      enum: ['fitted', 'regular', 'relaxed'],
      default: 'regular'
    },
    sleevePreference: {
      type: String,
      enum: ['full', 'three_quarter', 'short', 'none'],
      default: 'full'
    },
    trouserFit: {
      type: String,
      enum: ['slim', 'straight', 'relaxed', 'wide'],
      default: 'straight'
    },
    trouserBreak: {
      type: String,
      enum: ['no_break', 'quarter_break', 'half_break', 'full_break'],
      default: 'half_break'
    },
    agbadaPreference: {
      type: String,
      enum: ['classic', 'modern', 'minimal', 'elaborate'],
      default: 'classic'
    },
    embroideryPreference: {
      type: String,
      enum: ['none', 'minimal', 'moderate', 'heavy', 'full'],
      default: 'moderate'
    },
    notes: {
      type: String,
      maxlength: 1000,
      trim: true
    }
  },

  // Posture Details
  posture: {
    shoulders: {
      type: String,
      enum: ['straight', 'sloping', 'square', 'forward', 'uneven', 'normal'],
      default: 'normal'
    },
    back: {
      type: String,
      enum: ['straight', 'sway', 'rounded', 'normal'],
      default: 'normal'
    },
    stomach: {
      type: String,
      enum: ['flat', 'average', 'prominent'],
      default: 'average'
    },
    hips: {
      type: String,
      enum: ['narrow', 'average', 'wide'],
      default: 'average'
    },
    armPosture: {
      type: String,
      enum: ['straight', 'forward', 'backward', 'normal'],
      default: 'normal'
    },
    notes: {
      type: String,
      maxlength: 500,
      trim: true
    }
  },

  // Measurement history for tracking changes
  history: [{
    date: { type: Date, default: Date.now },
    changes: mongoose.Schema.Types.Mixed,
    measuredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    method: {
      type: String,
      enum: ['self', 'in_studio', 'virtual', 'home_visit', 'tailor_measured'],
      default: 'self'
    },
    notes: String
  }],

  // Who measured and when
  measuredBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    method: {
      type: String,
      enum: ['self', 'in_studio', 'virtual', 'home_visit', 'tailor_measured'],
      default: 'self'
    },
    location: String,
    date: Date
  },

  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,

  // Measurement unit system
  unitSystem: {
    type: String,
    enum: ['imperial', 'metric'],
    default: 'imperial'
  },

  // Tags for organizing measurements
  tags: [{
    type: String,
    trim: true
  }],

  // General notes about this measurement profile
  generalNotes: {
    type: String,
    maxlength: 2000,
    trim: true
  },

  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'imported', 'converted', 'ai_generated'],
      default: 'manual'
    },
    accuracy: {
      type: String,
      enum: ['estimated', 'measured', 'professional'],
      default: 'measured'
    },
    lastWornSize: String,
    preferredBrandSize: String
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
measurementSchema.index({ user: 1, isDefault: -1 });
measurementSchema.index({ user: 1, profileName: 1 });
measurementSchema.index({ user: 1, isActive: 1 });
measurementSchema.index({ 'bestFor.styles': 1 });
measurementSchema.index({ createdAt: -1 });

// Pre-save middleware
measurementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // If this is set as default, unset other defaults for this user
  if (this.isDefault && this.isModified('isDefault')) {
    this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    ).exec();
  }
  next();
});

// Virtual for full name
measurementSchema.virtual('fullName').get(function() {
  return `${this.profileName} (${this.bestFor?.styles?.join(', ') || 'General'})`;
});

// Method to compare two measurements
measurementSchema.methods.compareWith = function(otherMeasurement) {
  const differences = {};
  const sections = ['upperBody', 'midBody', 'lowerBody', 'additional'];
  
  sections.forEach(section => {
    if (this[section] && otherMeasurement[section]) {
      Object.keys(this[section].toObject()).forEach(key => {
        const current = this[section][key]?.value;
        const other = otherMeasurement[section][key]?.value;
        if (current && other && current !== other) {
          differences[`${section}.${key}`] = {
            current,
            other,
            difference: +(current - other).toFixed(2),
            percentage: +((current - other) / other * 100).toFixed(1)
          };
        }
      });
    }
  });
  
  return differences;
};

// Method to get all measurements as a flat object
measurementSchema.methods.toFlatObject = function() {
  const flat = {};
  const sections = ['upperBody', 'midBody', 'lowerBody', 'additional'];
  
  sections.forEach(section => {
    if (this[section]) {
      Object.keys(this[section].toObject()).forEach(key => {
        const measurement = this[section][key];
        if (measurement && measurement.value) {
          flat[`${section}.${key}`] = measurement.value;
        }
      });
    }
  });
  
  return flat;
};

// Static method to find measurements suitable for a specific style
measurementSchema.statics.findForStyle = function(userId, style) {
  return this.find({
    user: userId,
    isActive: true,
    $or: [
      { 'bestFor.styles': style },
      { 'bestFor.styles': { $size: 0 } } // General purpose measurements
    ]
  }).sort({ isDefault: -1, updatedAt: -1 });
};

// Static method to get measurement statistics for a user
measurementSchema.statics.getUserStats = async function(userId) {
  const measurements = await this.find({ user: userId, isActive: true });
  
  if (measurements.length === 0) return null;
  
  const stats = {
    totalProfiles: measurements.length,
    defaultProfile: measurements.find(m => m.isDefault) || measurements[0],
    styles: [...new Set(measurements.flatMap(m => m.bestFor?.styles || []))],
    occasions: [...new Set(measurements.flatMap(m => m.bestFor?.occasions || []))],
    lastUpdated: measurements.reduce((latest, m) => 
      m.updatedAt > latest ? m.updatedAt : latest, new Date(0)
    ),
    measurementHistory: measurements.flatMap(m => m.history || [])
      .sort((a, b) => b.date - a.date)
      .slice(0, 10)
  };
  
  return stats;
};

// Ensure virtuals are included in JSON
measurementSchema.set('toJSON', { virtuals: true });
measurementSchema.set('toObject', { virtuals: true });

const Measurement = mongoose.model('Measurement', measurementSchema);

module.exports = Measurement;