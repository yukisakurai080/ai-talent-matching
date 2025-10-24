const mongoose = require('mongoose');

const tokenUsageSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true
  },
  tokensUsed: {
    type: Number,
    required: true
  },
  model: {
    type: String,
    default: 'gpt-4o-mini'
  },
  requestType: {
    type: String,
    enum: ['ai-search', 'translation', 'other'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// 1日あたりのトークン使用量を取得
tokenUsageSchema.statics.getDailyUsage = async function(ipAddress) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await this.aggregate([
    {
      $match: {
        ipAddress: ipAddress,
        date: { $gte: startOfDay }
      }
    },
    {
      $group: {
        _id: '$requestType',
        totalTokens: { $sum: '$tokensUsed' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result;
};

// 古いレコードを削除（30日以上前）
tokenUsageSchema.statics.cleanOldRecords = async function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await this.deleteMany({ date: { $lt: thirtyDaysAgo } });
};

module.exports = mongoose.model('TokenUsage', tokenUsageSchema);
