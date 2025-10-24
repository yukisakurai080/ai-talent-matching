const mongoose = require('mongoose');

const talentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['男性', '女性', 'その他'],
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  skills: [{
    type: String
  }],
  experience: {
    type: Number, // 年数
    required: true
  },
  education: {
    type: String
  },
  desiredPosition: {
    type: String
  },
  industry: {
    type: String,
    required: true,
    enum: [
      'IT',
      '営業(サービス業)',
      '介護',
      'ビルクリーニング',
      '工業製品製造業',
      '建設',
      '造船・舶用工業',
      '自動車整備',
      '自動車運送業',
      '鉄道',
      '航空',
      '宿泊',
      '農業',
      '林業',
      '木材産業',
      '漁業',
      '飲食料品製造業',
      '外食業',
      '医療',
      '看護',
      '福祉',
      '教育',
      '保育',
      '金融',
      '保険',
      '不動産',
      '物流',
      '倉庫',
      '小売',
      '卸売',
      '広告・マーケティング',
      'コンサルティング',
      '人材サービス',
      '警備',
      '清掃',
      'エンターテイメント',
      '美容・理容',
      'その他'
    ]
  },
  desiredSalary: {
    type: Number
  },
  location: {
    type: String
  },
  availability: {
    type: String,
    enum: ['即日', '1ヶ月以内', '2-3ヶ月', '応相談']
  },
  profileDescription: {
    type: String
  },
  certifications: [{
    type: String
  }],
  languages: [{
    language: String,
    level: String
  }],
  // 日本語能力
  jlpt: {
    type: String,
    enum: ['N1', 'N2', 'N3', 'N4', 'N5', '未取得', '']
  },
  cefr: {
    type: String,
    enum: ['C2', 'C1', 'B2', 'B1', 'A2', 'A1', '未取得', '']
  },
  // 特定技能試験
  skillTest: {
    type: String,
    enum: [
      '介護技能評価試験',
      'ビルクリーニング技能測定試験',
      '工業製品製造業技能測定試験',
      '建設分野特定技能評価試験',
      '造船・舶用工業分野特定技能評価試験',
      '自動車整備分野特定技能評価試験',
      '自動車運送業技能測定試験',
      '鉄道分野特定技能評価試験',
      '航空分野特定技能評価試験',
      '宿泊業技能測定試験',
      '農業技能測定試験',
      '林業技能測定試験',
      '木材産業技能測定試験',
      '漁業技能測定試験',
      '飲食料品製造業技能測定試験',
      '外食業技能測定試験',
      '未取得',
      ''
    ]
  },
  portfolioUrl: {
    type: String
  },
  resumeUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'matched'],
    default: 'active'
  },
  // パートナー情報
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner'
  },
  partnerCode: {
    type: String
  },
  // 分析データ（エンゲージメント指標）
  analytics: {
    aiRecommendations: { type: Number, default: 0 }, // AIにて推薦された回数
    profileViews: { type: Number, default: 0 }, // 詳細確認された回数
    messagesReceived: { type: Number, default: 0 }, // メッセージ送られた回数
    interviewRequests: { type: Number, default: 0 }, // 面接リクエスト数
    lastViewedAt: { type: Date }, // 最後に閲覧された日時
    lastMessagedAt: { type: Date }, // 最後にメッセージを受け取った日時
    lastInterviewRequestAt: { type: Date } // 最後に面接リクエストがあった日時
  },
  // QRコード登録用トークン
  registrationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  registrationTokenExpires: {
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

talentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Talent', talentSchema);
