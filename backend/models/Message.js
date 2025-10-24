const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  talentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Talent'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  senderName: {
    type: String,
    required: true
  },
  senderEmail: {
    type: String,
    required: true
  },
  senderPhone: {
    type: String
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['company_to_talent', 'application'],
    default: 'company_to_talent'
  },
  status: {
    type: String,
    enum: ['sent', 'read', 'replied'],
    default: 'sent'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailMessageId: {
    type: String // メール送信時のメッセージID
  },
  isFromEmail: {
    type: Boolean,
    default: false // メール返信から作成されたメッセージかどうか
  },
  threadId: {
    type: String // スレッドID（関連メッセージをグループ化）
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
