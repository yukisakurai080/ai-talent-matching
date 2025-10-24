const mongoose = require('mongoose');
const crypto = require('crypto');

const emailProxySchema = new mongoose.Schema({
  proxyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  proxyEmail: {
    type: String,
    required: true,
    unique: true
  },
  // 誰から誰へのプロキシか
  fromEmail: {
    type: String,
    required: true
  },
  fromName: {
    type: String,
    required: true
  },
  toEmail: {
    type: String,
    required: true
  },
  toName: {
    type: String,
    required: true
  },
  // 関連するメッセージID
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  // スレッドID（会話を追跡）
  threadId: {
    type: String,
    required: true,
    index: true
  },
  // プロキシの種類
  proxyType: {
    type: String,
    enum: ['applicant_to_company', 'company_to_applicant'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 90*24*60*60*1000) // 90日後に期限切れ
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// プロキシIDを生成
emailProxySchema.statics.generateProxyId = function() {
  return crypto.randomBytes(16).toString('hex');
};

// プロキシメールアドレスを生成
emailProxySchema.statics.generateProxyEmail = function(proxyId) {
  const domain = process.env.EMAIL_PROXY_DOMAIN || 'yourdomain.com';
  return `proxy-${proxyId}@${domain}`;
};

// プロキシペアを作成（双方向）
emailProxySchema.statics.createProxyPair = async function({
  applicantEmail,
  applicantName,
  companyEmail,
  companyName,
  messageId,
  companyId,
  threadId
}) {
  // 求職者→企業用のプロキシ
  const applicantToCompanyId = this.generateProxyId();
  const applicantToCompanyProxy = new this({
    proxyId: applicantToCompanyId,
    proxyEmail: this.generateProxyEmail(applicantToCompanyId),
    fromEmail: applicantEmail,
    fromName: applicantName,
    toEmail: companyEmail,
    toName: companyName,
    messageId,
    companyId,
    threadId,
    proxyType: 'applicant_to_company'
  });

  // 企業→求職者用のプロキシ
  const companyToApplicantId = this.generateProxyId();
  const companyToApplicantProxy = new this({
    proxyId: companyToApplicantId,
    proxyEmail: this.generateProxyEmail(companyToApplicantId),
    fromEmail: companyEmail,
    fromName: companyName,
    toEmail: applicantEmail,
    toName: applicantName,
    messageId,
    companyId,
    threadId,
    proxyType: 'company_to_applicant'
  });

  await applicantToCompanyProxy.save();
  await companyToApplicantProxy.save();

  return {
    applicantToCompany: applicantToCompanyProxy,
    companyToApplicant: companyToApplicantProxy
  };
};

module.exports = mongoose.model('EmailProxy', emailProxySchema);
