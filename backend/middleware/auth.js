const User = require('../models/User');

// 認証チェックミドルウェア
const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  // ユーザーの制限状態をチェック
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'ユーザーが見つかりません' });
    }

    // 制限期間をチェック
    if (user.restrictedUntil && new Date(user.restrictedUntil) > new Date()) {
      return res.status(403).json({
        error: 'アカウントが制限されています',
        restrictedUntil: user.restrictedUntil,
        reason: user.restrictionReason
      });
    }

    // 制限期間が過ぎている場合は自動的に解除
    if (user.restrictedUntil && new Date(user.restrictedUntil) <= new Date()) {
      user.restrictedUntil = null;
      user.restrictionReason = '';
      user.restrictedBy = '';
      user.status = 'active';
      await user.save();
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: '認証チェック中にエラーが発生しました' });
  }
};

// 企業ユーザー専用ミドルウェア
const requireCompany = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  if (req.session.userType !== 'company') {
    return res.status(403).json({ error: '企業ユーザーのみアクセス可能です' });
  }
  next();
};

// 人材ユーザー専用ミドルウェア
const requireTalent = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  if (req.session.userType !== 'talent') {
    return res.status(403).json({ error: '人材ユーザーのみアクセス可能です' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireCompany,
  requireTalent
};
