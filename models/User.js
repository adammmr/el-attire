const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^\+?[\d\s-]{7,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: 50
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say']
  },
  dateOfBirth: Date,
  role: {
    type: String,
    enum: ['customer', 'tailor', 'admin', 'superadmin'],
    default: 'customer'
  },
  addresses: [{
    label: { type: String, default: 'Default' },
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'Nigeria' },
    zip: String,
    isDefault: { type: Boolean, default: false }
  }],
  measurements: [{
    profileName: { type: String, default: 'Default' },
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
    ankle: Number,
    backWidth: Number,
    acrossShoulder: Number,
    backWaist: Number,
    seat: Number,
    centerBack: Number,
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  profileImage: { type: String, default: '/uploads/default-avatar.png' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);