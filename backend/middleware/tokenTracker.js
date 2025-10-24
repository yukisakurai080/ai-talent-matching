const TokenUsage = require('../models/TokenUsage');

// 1日あたりのトークン制限
const DAILY_LIMITS = {
  'ai-search': 50000,      // AI検索: 1日50,000トークンまで（約10-15回の検索）
  'translation': 100000,   // 翻訳: 1日100,000トークンまで
  'total': 150000          // 合計: 1日150,000トークンまで
};

// トークン使用量をチェックするミドルウェア
const checkTokenLimit = (requestType) => {
  return async (req, res, next) => {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;

      // 今日の使用量を取得
      const dailyUsage = await TokenUsage.getDailyUsage(ipAddress);

      // 合計トークン数を計算
      let totalTokens = 0;
      let typeTokens = 0;

      dailyUsage.forEach(usage => {
        totalTokens += usage.totalTokens;
        if (usage._id === requestType) {
          typeTokens = usage.totalTokens;
        }
      });

      // 制限チェック
      if (totalTokens >= DAILY_LIMITS.total) {
        return res.status(429).json({
          error: '本日のトークン使用量の上限に達しました。明日再度お試しください。',
          usage: {
            used: totalTokens,
            limit: DAILY_LIMITS.total
          }
        });
      }

      if (DAILY_LIMITS[requestType] && typeTokens >= DAILY_LIMITS[requestType]) {
        return res.status(429).json({
          error: `本日の${requestType === 'ai-search' ? 'AI検索' : '翻訳'}の使用量上限に達しました。明日再度お試しください。`,
          usage: {
            used: typeTokens,
            limit: DAILY_LIMITS[requestType]
          }
        });
      }

      // 使用量情報をリクエストに付加
      req.tokenUsage = {
        ipAddress,
        requestType,
        dailyUsage: totalTokens,
        typeUsage: typeTokens
      };

      next();
    } catch (error) {
      console.error('Token limit check error:', error);
      next(); // エラーが発生してもリクエストは通す
    }
  };
};

// トークン使用量を記録する関数
const recordTokenUsage = async (ipAddress, endpoint, tokensUsed, requestType, model = 'gpt-4o-mini') => {
  try {
    await TokenUsage.create({
      ipAddress,
      endpoint,
      tokensUsed,
      model,
      requestType
    });
  } catch (error) {
    console.error('Error recording token usage:', error);
  }
};

// 使用量情報を取得
const getUsageStats = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const dailyUsage = await TokenUsage.getDailyUsage(ipAddress);

    let totalTokens = 0;
    const breakdown = {};

    dailyUsage.forEach(usage => {
      totalTokens += usage.totalTokens;
      breakdown[usage._id] = {
        tokens: usage.totalTokens,
        requests: usage.count,
        limit: DAILY_LIMITS[usage._id] || null
      };
    });

    res.json({
      totalTokens,
      totalLimit: DAILY_LIMITS.total,
      remaining: DAILY_LIMITS.total - totalTokens,
      breakdown,
      limits: DAILY_LIMITS
    });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ error: 'Failed to get usage stats' });
  }
};

module.exports = {
  checkTokenLimit,
  recordTokenUsage,
  getUsageStats,
  DAILY_LIMITS
};
