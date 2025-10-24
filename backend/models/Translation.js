const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  language: {
    type: String,
    required: true,
    enum: ['en', 'zh', 'vi', 'id', 'ko', 'es', 'ta', 'fr', 'hi', 'bn', 'pt'],
    index: true
  },
  translatedData: {
    companyName: String,
    industry: String,
    headquarters: String,
    businessDescription: String,
    positionTitle: String,
    employmentType: String,
    jobDescription: String,
    requiredSkills: String,
    preferredSkills: String,
    workLocation: String,
    workHours: String,
    holidays: String,
    benefits: String,
    selectionProcess: String
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 複合インデックス（高速検索）
translationSchema.index({ companyId: 1, language: 1 }, { unique: true });

// 更新時にupdatedAtを自動更新
translationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Translation', translationSchema);
