const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Company = require('../models/Company');
const Talent = require('../models/Talent');
const Partner = require('../models/Partner');
const TokenUsage = require('../models/TokenUsage');
const InterviewTracking = require('../models/InterviewTracking');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Translation = require('../models/Translation');
const EmailProxy = require('../models/EmailProxy');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT認証ミドルウェア
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'admin' && decoded.role !== 'super-admin') {
      return res.status(403).json({ error: '管理者権限が必要です' });
    }
    req.adminId = decoded.adminId;
    req.adminRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: '無効なトークンです' });
  }
};

// 管理者ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // emailまたはusernameで検索
    const admin = await Admin.findOne({
      $or: [
        { email: email },
        { username: email } // emailフィールドにusernameが入力されることもある
      ]
    });

    if (!admin) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // 最終ログイン更新
    admin.lastLoginAt = new Date();
    await admin.save();

    // JWTトークン生成
    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'ログイン成功',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'ログイン中にエラーが発生しました' });
  }
});

// ダッシュボード統計取得
router.get('/dashboard-stats', authenticateAdmin, async (req, res) => {
  try {
    // 基本統計
    const companyCount = await Company.countDocuments();
    const activeCompanyCount = await Company.countDocuments({ status: 'active' });
    const talentCount = await Talent.countDocuments();
    const activeTalentCount = await Talent.countDocuments({ status: 'active' });
    const partnerCount = await Partner.countDocuments();
    const activePartnerCount = await Partner.countDocuments({ status: 'active' });

    // 面接進捗統計
    const interviewStats = await InterviewTracking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // AI使用統計（直近30日）
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const aiUsageStats = await TokenUsage.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$feature',
          totalTokens: { $sum: '$tokensUsed' },
          totalRequests: { $sum: 1 },
          totalCost: { $sum: '$estimatedCost' }
        }
      }
    ]);

    // パートナー別登録人材数
    const partnerStats = await Partner.find()
      .select('organizationName registeredTalentsCount country createdAt')
      .sort({ registeredTalentsCount: -1 })
      .limit(10);

    // 月別登録推移（直近6ヶ月）
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const talentTrend = await Talent.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const companyTrend = await Company.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // 業種別統計
    const talentByIndustry = await Talent.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const companyByIndustry = await Company.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      overview: {
        companies: {
          total: companyCount,
          active: activeCompanyCount
        },
        talents: {
          total: talentCount,
          active: activeTalentCount
        },
        partners: {
          total: partnerCount,
          active: activePartnerCount
        }
      },
      interviewStats,
      aiUsage: aiUsageStats,
      partnerStats,
      trends: {
        talents: talentTrend,
        companies: companyTrend
      },
      industries: {
        talents: talentByIndustry,
        companies: companyByIndustry
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: '統計データの取得中にエラーが発生しました' });
  }
});

// 最近のアクティビティ取得
router.get('/recent-activity', authenticateAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // 最近登録された企業
    const recentCompanies = await Company.find()
      .select('companyName industry createdAt status')
      .sort({ createdAt: -1 })
      .limit(limit);

    // 最近登録された人材
    const recentTalents = await Talent.find()
      .select('name industry desiredPosition createdAt status partnerCode')
      .sort({ createdAt: -1 })
      .limit(limit);

    // 最近の面接進捗更新
    const recentInterviews = await InterviewTracking.find()
      .select('companyName talentName status stage updatedAt')
      .sort({ updatedAt: -1 })
      .limit(limit);

    res.json({
      companies: recentCompanies,
      talents: recentTalents,
      interviews: recentInterviews
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ error: 'アクティビティの取得中にエラーが発生しました' });
  }
});

// AI利用状況詳細（企業別・要注意監視）
router.get('/ai-usage-detail', authenticateAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 企業別AI使用統計（セッションIDから推定）
    const conversationStats = await Conversation.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $project: {
          sessionId: 1,
          messageCount: { $size: '$messages' },
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $sort: { messageCount: -1 }
      },
      {
        $limit: 50
      }
    ]);

    // トークン使用量が多い上位企業
    const topTokenUsers = await TokenUsage.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$sessionId',
          totalTokens: { $sum: '$tokensUsed' },
          totalCost: { $sum: '$estimatedCost' },
          requestCount: { $sum: 1 },
          features: { $addToSet: '$feature' },
          lastUsed: { $max: '$createdAt' }
        }
      },
      {
        $sort: { totalTokens: -1 }
      },
      {
        $limit: 50
      }
    ]);

    // 要注意監視対象（1日100回以上、または累計トークン100万以上）
    const highFrequencyUsers = topTokenUsers.filter(user =>
      user.requestCount > 100 || user.totalTokens > 1000000
    );

    // 翻訳使用統計
    const translationStats = await Translation.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            targetLang: '$targetLang',
            feature: '$feature'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      conversationStats,
      topTokenUsers,
      highFrequencyUsers,
      translationStats,
      alerts: {
        highFrequency: highFrequencyUsers.length,
        totalSessions: conversationStats.length
      }
    });
  } catch (error) {
    console.error('AI usage detail error:', error);
    res.status(500).json({ error: 'AI利用状況の取得中にエラーが発生しました' });
  }
});

// AIメッセージ内容取得
router.get('/conversations', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Conversation.countDocuments();

    res.json({
      conversations,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: '会話履歴の取得中にエラーが発生しました' });
  }
});

// 特定セッションの会話詳細
router.get('/conversations/:sessionId', authenticateAdmin, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ sessionId: req.params.sessionId })
      .populate('userId', 'email name userType status restrictedUntil restrictionReason');

    if (!conversation) {
      return res.status(404).json({ error: '会話が見つかりません' });
    }

    // 関連するトークン使用状況も取得
    const tokenUsage = await TokenUsage.find({ sessionId: req.params.sessionId });

    res.json({
      conversation,
      tokenUsage,
      user: conversation.userId || null
    });
  } catch (error) {
    console.error('Get conversation detail error:', error);
    res.status(500).json({ error: '会話詳細の取得中にエラーが発生しました' });
  }
});

// メッセージ監視 - 雇用関連・個人情報検出
router.get('/message-monitoring', authenticateAdmin, async (req, res) => {
  try {
    // 監視対象のキーワードパターン
    const employmentKeywords = [
      '採用', '内定', '入社', '雇用', '就職', '転職', '面接日程', '面接確定',
      '入社日', '初出勤', '契約書', '労働条件', '給与', '年収', '月給', '時給',
      '入社手続き', '雇用契約', 'オファー', 'offer'
    ];

    const personalInfoPatterns = [
      /\d{2,4}[-\/]\d{1,2}[-\/]\d{1,2}/, // 日付
      /\d{3}-\d{4}-\d{4}/, // 電話番号
      /\d{11}/, // 電話番号（ハイフンなし）
      /[\w\-._]+@[\w\-._]+\.[A-Za-z]+/, // メールアドレス
      /〒?\d{3}-?\d{4}/, // 郵便番号
      /[0-9０-９]{10,}/, // 長い数字列（口座番号など）
    ];

    // すべての会話を取得
    const conversations = await Conversation.find()
      .populate('userId', 'email name userType')
      .sort({ updatedAt: -1 });

    const flaggedMessages = [];

    conversations.forEach(conv => {
      if (!conv.messages) return;

      conv.messages.forEach((msg, msgIndex) => {
        if (msg.role !== 'user') return; // ユーザーメッセージのみチェック

        const content = msg.content;
        const flags = [];

        // 雇用関連キーワードチェック
        employmentKeywords.forEach(keyword => {
          if (content.includes(keyword)) {
            flags.push({
              type: 'employment',
              keyword,
              description: '雇用関連'
            });
          }
        });

        // 個人情報パターンチェック
        personalInfoPatterns.forEach((pattern, idx) => {
          const match = content.match(pattern);
          if (match) {
            const types = ['日付', '電話番号', '電話番号', 'メールアドレス', '郵便番号', '数字列'];
            flags.push({
              type: 'personal_info',
              matched: match[0],
              description: types[idx]
            });
          }
        });

        if (flags.length > 0) {
          flaggedMessages.push({
            conversationId: conv._id,
            sessionId: conv.sessionId,
            user: conv.userId || null,
            message: {
              content: msg.content,
              timestamp: msg.timestamp,
              index: msgIndex
            },
            flags,
            flagCount: flags.length,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt
          });
        }
      });
    });

    // フラグ数でソート（多い順）
    flaggedMessages.sort((a, b) => b.flagCount - a.flagCount);

    res.json({
      total: flaggedMessages.length,
      flaggedMessages: flaggedMessages.slice(0, 100), // 最大100件
      summary: {
        employmentFlags: flaggedMessages.filter(m =>
          m.flags.some(f => f.type === 'employment')
        ).length,
        personalInfoFlags: flaggedMessages.filter(m =>
          m.flags.some(f => f.type === 'personal_info')
        ).length
      }
    });
  } catch (error) {
    console.error('Message monitoring error:', error);
    res.status(500).json({ error: 'メッセージ監視中にエラーが発生しました' });
  }
});

// システム全体統計
router.get('/system-stats', authenticateAdmin, async (req, res) => {
  try {
    // データベースサイズ推定
    const collections = {
      companies: await Company.estimatedDocumentCount(),
      talents: await Talent.estimatedDocumentCount(),
      partners: await Partner.estimatedDocumentCount(),
      conversations: await Conversation.estimatedDocumentCount(),
      messages: await Message.estimatedDocumentCount(),
      interviews: await InterviewTracking.estimatedDocumentCount(),
      translations: await Translation.estimatedDocumentCount(),
      emailProxies: await EmailProxy.estimatedDocumentCount(),
      tokenUsage: await TokenUsage.estimatedDocumentCount()
    };

    // 今日のアクティビティ
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = {
      newCompanies: await Company.countDocuments({ createdAt: { $gte: today } }),
      newTalents: await Talent.countDocuments({ createdAt: { $gte: today } }),
      newConversations: await Conversation.countDocuments({ createdAt: { $gte: today } }),
      newInterviews: await InterviewTracking.countDocuments({ createdAt: { $gte: today } }),
      emailsSent: await EmailProxy.countDocuments({ createdAt: { $gte: today } }),
      translations: await Translation.countDocuments({ createdAt: { $gte: today } })
    };

    // 週間統計
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekStats = {
      companies: await Company.countDocuments({ createdAt: { $gte: weekAgo } }),
      talents: await Talent.countDocuments({ createdAt: { $gte: weekAgo } }),
      conversations: await Conversation.countDocuments({ createdAt: { $gte: weekAgo } }),
      interviews: await InterviewTracking.countDocuments({ createdAt: { $gte: weekAgo } })
    };

    // メール統計
    const emailStats = await EmailProxy.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      collections,
      todayStats,
      weekStats,
      emailStats
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ error: 'システム統計の取得中にエラーが発生しました' });
  }
});

// 管理者アカウント作成（初回セットアップ用）
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password, secretKey } = req.body;

    // セキュリティ: 環境変数で設定した秘密鍵が必要（開発環境ではスキップ）
    const requiredSecretKey = process.env.ADMIN_SETUP_KEY || 'dev-secret-key';
    if (secretKey !== requiredSecretKey) {
      return res.status(403).json({ error: '無効なセットアップキーです' });
    }

    const admin = new Admin({
      username,
      email,
      password,
      role: 'super-admin'
    });

    await admin.save();

    res.status(201).json({
      message: '管理者アカウントを作成しました',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'このメールアドレスまたはユーザー名は既に使用されています' });
    }
    res.status(500).json({ error: '管理者アカウントの作成中にエラーが発生しました' });
  }
});

// ユーザー一覧取得
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userType = req.query.userType; // company or talent
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const filter = {};
    if (userType) filter.userType = userType;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .select('-googleId -lineId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'ユーザー一覧の取得中にエラーが発生しました' });
  }
});

// ユーザーステータス更新
router.patch('/users/:userId/status', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: '無効なステータスです' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status, updatedAt: new Date() },
      { new: true }
    ).select('-googleId -lineId');

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({
      message: 'ステータスを更新しました',
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'ステータス更新中にエラーが発生しました' });
  }
});

// ユーザー削除
router.delete('/users/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // super-admin権限チェック
    if (req.adminRole !== 'super-admin') {
      return res.status(403).json({ error: 'スーパー管理者のみユーザーを削除できます' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({
      message: 'ユーザーを削除しました',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'ユーザー削除中にエラーが発生しました' });
  }
});

// ユーザー制限適用
router.post('/users/:userId/restrict', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration, reason } = req.body;

    if (!['1day', '3days', '7days', '30days', '1year', 'permanent'].includes(duration)) {
      return res.status(400).json({ error: '無効な制限期間です' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // 制限期間を計算
    let restrictedUntil = null;
    if (duration === 'permanent') {
      // 永久停止: 100年後の日付
      restrictedUntil = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
      user.status = 'suspended';
    } else {
      const durationMap = {
        '1day': 1,
        '3days': 3,
        '7days': 7,
        '30days': 30,
        '1year': 365
      };
      const days = durationMap[duration];
      restrictedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      user.status = 'suspended';
    }

    // 管理者情報を取得
    const admin = await Admin.findById(req.adminId);
    const adminEmail = admin ? admin.email : 'unknown';

    // 制限情報を更新
    user.restrictedUntil = restrictedUntil;
    user.restrictionReason = reason || '管理者による制限';
    user.restrictedBy = adminEmail;

    // 履歴に追加
    user.restrictionHistory.push({
      restrictedAt: new Date(),
      restrictedUntil,
      reason: reason || '管理者による制限',
      restrictedBy: adminEmail,
      duration
    });

    await user.save();

    res.json({
      message: 'ユーザーを制限しました',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        status: user.status,
        restrictedUntil: user.restrictedUntil,
        restrictionReason: user.restrictionReason
      }
    });
  } catch (error) {
    console.error('Restrict user error:', error);
    res.status(500).json({ error: 'ユーザー制限中にエラーが発生しました' });
  }
});

// ユーザー制限解除
router.post('/users/:userId/unrestrict', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    user.restrictedUntil = null;
    user.restrictionReason = '';
    user.restrictedBy = '';
    user.status = 'active';

    await user.save();

    res.json({
      message: 'ユーザー制限を解除しました',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Unrestrict user error:', error);
    res.status(500).json({ error: 'ユーザー制限解除中にエラーが発生しました' });
  }
});

module.exports = router;
