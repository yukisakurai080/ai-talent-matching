const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['company', 'talent'],
    required: true
  },
  // Google OAuth
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  // LINE OAuth (将来の拡張用)
  lineId: {
    type: String,
    sparse: true,
    unique: true
  },
  profilePicture: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  // User restriction fields
  restrictedUntil: {
    type: Date,
    default: null
  },
  restrictionReason: {
    type: String,
    default: ''
  },
  restrictedBy: {
    type: String, // Admin email who applied the restriction
    default: ''
  },
  restrictionHistory: [{
    restrictedAt: { type: Date, default: Date.now },
    restrictedUntil: { type: Date },
    reason: { type: String },
    restrictedBy: { type: String },
    duration: { type: String } // '1day', '3days', '7days', '30days', '1year', 'permanent'
  }],
  lastLoginAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
