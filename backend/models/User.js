const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  password: {
    type: String,
    select: false  // デフォルトではクエリ結果に含めない
  },
  isPasswordSet: {
    type: Boolean,
    default: false
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

userSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();

  // パスワードが変更された場合のみハッシュ化
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      this.isPasswordSet = true;
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// パスワード比較メソッド
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
