const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const partnerSchema = new mongoose.Schema({
  // 基本情報
  organizationName: {
    type: String,
    required: true
  },
  organizationType: {
    type: String,
    enum: ['language_school', 'training_center', 'recruitment_agency', 'other'],
    required: true
  },
  country: {
    type: String,
    required: true
  },
  contactPerson: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },

  // 認証情報
  password: {
    type: String,
    required: true,
    minlength: 8
  },

  // パートナーコード（一意識別子）
  partnerCode: {
    type: String,
    unique: true,
    required: true
  },

  // ステータス
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending'
  },

  // 登録した人材の数
  registeredTalentsCount: {
    type: Number,
    default: 0
  },

  // 契約情報
  contractStartDate: {
    type: Date
  },
  contractEndDate: {
    type: Date
  },

  // 手数料率（成約時の報酬分配）
  commissionRate: {
    type: Number,
    default: 0 // パーセンテージ
  },

  // 成約料設定
  placementFee: {
    type: Number,
    default: 0 // 成約料（円）
  },

  // システム手数料（15%固定）
  systemFeeRate: {
    type: Number,
    default: 15 // パーセンテージ
  },

  // 保証期間設定
  guaranteePeriods: [{
    months: { type: Number, required: true }, // 保証期間（ヶ月）
    refundRate: { type: Number, required: true }, // 返金率（%）
    description: { type: String } // 説明
  }],

  // メモ・備考
  notes: {
    type: String
  },

  // 最終ログイン
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

// パスワードをハッシュ化
partnerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// パスワード検証メソッド
partnerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// パートナーコード生成
partnerSchema.statics.generatePartnerCode = function() {
  return 'PTR-' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// 更新日時の自動更新
partnerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Partner', partnerSchema);
