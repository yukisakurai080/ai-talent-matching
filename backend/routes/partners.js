const express = require('express');
const router = express.Router();
const Partner = require('../models/Partner');
const Talent = require('../models/Talent');
const QRCode = require('qrcode');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// JWT認証ミドルウェア
const authenticatePartner = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.partnerId = decoded.partnerId;
    next();
  } catch (error) {
    res.status(401).json({ error: '無効なトークンです' });
  }
};

// パートナー登録（管理者用）
router.post('/register', async (req, res) => {
  try {
    const {
      organizationName,
      organizationType,
      country,
      contactPerson,
      email,
      phone,
      password
    } = req.body;

    // パートナーコード生成
    const partnerCode = Partner.generatePartnerCode();

    const partner = new Partner({
      organizationName,
      organizationType,
      country,
      contactPerson,
      email,
      phone,
      password,
      partnerCode,
      status: 'active' // 管理者が登録するので即承認
    });

    await partner.save();

    res.status(201).json({
      message: 'パートナー登録が完了しました',
      partner: {
        id: partner._id,
        organizationName: partner.organizationName,
        partnerCode: partner.partnerCode,
        email: partner.email
      }
    });
  } catch (error) {
    console.error('Partner registration error:', error);

    if (error.code === 11000) {
      return res.status(400).json({ error: 'このメールアドレスは既に登録されています' });
    }

    res.status(500).json({ error: 'パートナー登録中にエラーが発生しました' });
  }
});

// パートナーログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const partner = await Partner.findOne({ email });

    if (!partner) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    if (partner.status !== 'active') {
      return res.status(403).json({ error: 'アカウントが無効です。管理者にお問い合わせください' });
    }

    const isMatch = await partner.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // 最終ログイン更新
    partner.lastLoginAt = new Date();
    await partner.save();

    // JWTトークン生成
    const token = jwt.sign(
      { partnerId: partner._id, partnerCode: partner.partnerCode },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'ログイン成功',
      token,
      partner: {
        id: partner._id,
        organizationName: partner.organizationName,
        partnerCode: partner.partnerCode,
        email: partner.email,
        organizationType: partner.organizationType
      }
    });
  } catch (error) {
    console.error('Partner login error:', error);
    res.status(500).json({ error: 'ログイン中にエラーが発生しました' });
  }
});

// パートナー情報取得
router.get('/me', authenticatePartner, async (req, res) => {
  try {
    const partner = await Partner.findById(req.partnerId).select('-password');

    if (!partner) {
      return res.status(404).json({ error: 'パートナーが見つかりません' });
    }

    res.json(partner);
  } catch (error) {
    console.error('Get partner error:', error);
    res.status(500).json({ error: 'パートナー情報の取得中にエラーが発生しました' });
  }
});

// パートナーが登録した人材一覧
router.get('/talents', authenticatePartner, async (req, res) => {
  try {
    const talents = await Talent.find({ partnerId: req.partnerId })
      .sort({ createdAt: -1 });

    res.json({
      count: talents.length,
      talents
    });
  } catch (error) {
    console.error('Get partner talents error:', error);
    res.status(500).json({ error: '人材一覧の取得中にエラーが発生しました' });
  }
});

// パートナーの分析データ取得
router.get('/analytics', authenticatePartner, async (req, res) => {
  try {
    const talents = await Talent.find({ partnerId: req.partnerId });

    // 全体の統計
    const totalTalents = talents.length;
    const totalRecommendations = talents.reduce((sum, t) => sum + (t.analytics?.aiRecommendations || 0), 0);
    const totalViews = talents.reduce((sum, t) => sum + (t.analytics?.profileViews || 0), 0);
    const totalMessages = talents.reduce((sum, t) => sum + (t.analytics?.messagesReceived || 0), 0);
    const totalInterviews = talents.reduce((sum, t) => sum + (t.analytics?.interviewRequests || 0), 0);

    // 各段階への到達人数
    const talentsWithRecommendations = talents.filter(t => (t.analytics?.aiRecommendations || 0) > 0).length;
    const talentsWithViews = talents.filter(t => (t.analytics?.profileViews || 0) > 0).length;
    const talentsWithMessages = talents.filter(t => (t.analytics?.messagesReceived || 0) > 0).length;
    const talentsWithInterviews = talents.filter(t => (t.analytics?.interviewRequests || 0) > 0).length;

    // コンバージョン率計算（各段階への到達率）
    const recommendationRate = totalTalents > 0 ? (talentsWithRecommendations / totalTalents * 100).toFixed(1) : 0;
    const viewRate = totalTalents > 0 ? (talentsWithViews / totalTalents * 100).toFixed(1) : 0;
    const messageRate = totalTalents > 0 ? (talentsWithMessages / totalTalents * 100).toFixed(1) : 0;
    const interviewRate = totalTalents > 0 ? (talentsWithInterviews / totalTalents * 100).toFixed(1) : 0;

    // ファネル分析（推薦→閲覧→メッセージ→面接の遷移率）
    const viewFromRecommendationRate = talentsWithRecommendations > 0 ? (talentsWithViews / talentsWithRecommendations * 100).toFixed(1) : 0;
    const messageFromViewRate = talentsWithViews > 0 ? (talentsWithMessages / talentsWithViews * 100).toFixed(1) : 0;
    const interviewFromMessageRate = talentsWithMessages > 0 ? (talentsWithInterviews / talentsWithMessages * 100).toFixed(1) : 0;

    // 人材ごとの詳細データ（エンゲージメント順）
    const talentDetails = talents
      .map(t => ({
        id: t._id,
        name: t.name,
        industry: t.industry,
        aiRecommendations: t.analytics?.aiRecommendations || 0,
        profileViews: t.analytics?.profileViews || 0,
        messagesReceived: t.analytics?.messagesReceived || 0,
        interviewRequests: t.analytics?.interviewRequests || 0,
        lastViewedAt: t.analytics?.lastViewedAt,
        lastMessagedAt: t.analytics?.lastMessagedAt,
        lastInterviewRequestAt: t.analytics?.lastInterviewRequestAt,
        engagementScore: (t.analytics?.aiRecommendations || 0) * 1 +
                         (t.analytics?.profileViews || 0) * 3 +
                         (t.analytics?.messagesReceived || 0) * 5 +
                         (t.analytics?.interviewRequests || 0) * 10
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore);

    res.json({
      summary: {
        totalTalents,
        totalRecommendations,
        totalViews,
        totalMessages,
        totalInterviews,
        talentsWithRecommendations,
        talentsWithViews,
        talentsWithMessages,
        talentsWithInterviews
      },
      conversionRates: {
        recommendationRate: parseFloat(recommendationRate),
        viewRate: parseFloat(viewRate),
        messageRate: parseFloat(messageRate),
        interviewRate: parseFloat(interviewRate)
      },
      funnelRates: {
        viewFromRecommendationRate: parseFloat(viewFromRecommendationRate),
        messageFromViewRate: parseFloat(messageFromViewRate),
        interviewFromMessageRate: parseFloat(interviewFromMessageRate)
      },
      talentDetails
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: '分析データの取得中にエラーが発生しました' });
  }
});

// CSVデータから一括登録
router.post('/bulk-register', authenticatePartner, async (req, res) => {
  try {
    const { talents } = req.body;

    if (!Array.isArray(talents) || talents.length === 0) {
      return res.status(400).json({ error: '人材データが必要です' });
    }

    const partner = await Partner.findById(req.partnerId);

    const results = {
      success: [],
      errors: []
    };

    for (let i = 0; i < talents.length; i++) {
      try {
        const talentData = {
          ...talents[i],
          partnerId: req.partnerId,
          partnerCode: partner.partnerCode,
          status: 'active'
        };

        const talent = new Talent(talentData);
        await talent.save();

        results.success.push({
          index: i,
          name: talent.name,
          id: talent._id
        });

        // パートナーの登録人数を更新
        partner.registeredTalentsCount += 1;
      } catch (error) {
        let errorMessage = error.message;

        // エラーメッセージを分かりやすく変換
        if (error.code === 11000) {
          // 重複エラー
          if (error.message.includes('email')) {
            errorMessage = 'このメールアドレスは既に登録されています';
          } else {
            errorMessage = '重複するデータが既に登録されています';
          }
        } else if (error.name === 'ValidationError') {
          // バリデーションエラー
          const fieldErrors = [];
          for (const field in error.errors) {
            const err = error.errors[field];
            if (err.kind === 'required') {
              fieldErrors.push(`${field}は必須項目です`);
            } else if (err.kind === 'enum') {
              fieldErrors.push(`${field}の値が不正です`);
            } else {
              fieldErrors.push(err.message);
            }
          }
          errorMessage = fieldErrors.join(', ');
        }

        results.errors.push({
          index: i,
          name: talents[i].name || '不明',
          error: errorMessage
        });
      }
    }

    await partner.save();

    res.json({
      message: '一括登録が完了しました',
      total: talents.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      results
    });
  } catch (error) {
    console.error('Bulk register error:', error);
    res.status(500).json({ error: '一括登録中にエラーが発生しました' });
  }
});

// QRコード生成（個別登録用）
router.post('/generate-qr', authenticatePartner, async (req, res) => {
  try {
    const { studentName, count = 1 } = req.body;

    const partner = await Partner.findById(req.partnerId);
    const qrCodes = [];

    for (let i = 0; i < count; i++) {
      // 登録用トークン生成（30日間有効）
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // 登録URL
      const registrationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?token=${token}&partner=${partner.partnerCode}`;

      // QRコード画像生成
      const qrCodeDataUrl = await QRCode.toDataURL(registrationUrl, {
        width: 300,
        margin: 2
      });

      qrCodes.push({
        token,
        url: registrationUrl,
        qrCode: qrCodeDataUrl,
        studentName: count === 1 ? studentName : `${studentName || '学生'} ${i + 1}`,
        expiresAt,
        partnerCode: partner.partnerCode
      });
    }

    res.json({
      message: 'QRコードを生成しました',
      qrCodes
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ error: 'QRコード生成中にエラーが発生しました' });
  }
});

// QRコードでの登録検証
router.get('/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { partner: partnerCode } = req.query;

    const partner = await Partner.findOne({ partnerCode, status: 'active' });

    if (!partner) {
      return res.status(404).json({ error: '無効なパートナーコードです' });
    }

    res.json({
      valid: true,
      partner: {
        organizationName: partner.organizationName,
        partnerCode: partner.partnerCode
      },
      token
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'トークン検証中にエラーが発生しました' });
  }
});

// 成約料・保証期間設定の更新
router.put('/fee-settings', authenticatePartner, async (req, res) => {
  try {
    const { placementFee, guaranteePeriods } = req.body;
    const partnerId = req.partnerId;

    console.log('Fee settings update request:', { partnerId, placementFee, guaranteePeriods });

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      console.log('Partner not found:', partnerId);
      return res.status(404).json({ error: 'パートナーが見つかりません' });
    }

    console.log('Partner before update:', {
      placementFee: partner.placementFee,
      guaranteePeriods: partner.guaranteePeriods
    });

    // 成約料と保証期間を更新
    partner.placementFee = placementFee || 0;
    partner.guaranteePeriods = guaranteePeriods || [];

    await partner.save();

    console.log('Partner after update:', {
      placementFee: partner.placementFee,
      guaranteePeriods: partner.guaranteePeriods
    });

    res.json({
      message: '成約料・保証期間設定を更新しました',
      placementFee: partner.placementFee,
      guaranteePeriods: partner.guaranteePeriods,
      systemFeeRate: partner.systemFeeRate,
      partnerReceives: Math.floor(partner.placementFee * (100 - partner.systemFeeRate) / 100)
    });
  } catch (error) {
    console.error('Update fee settings error:', error);
    res.status(500).json({ error: '設定更新中にエラーが発生しました' });
  }
});

module.exports = router;
