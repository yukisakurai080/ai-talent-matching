const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const LoginToken = require('../models/LoginToken');
const { sendRegistrationEmail } = require('../services/emailService');

// マジックリンクログイン要求
router.post('/request-login', async (req, res) => {
  try {
    const { email, userType, name } = req.body;

    if (!email || !userType) {
      return res.status(400).json({ error: 'メールアドレスとユーザータイプは必須です' });
    }

    if (!['company', 'talent'].includes(userType)) {
      return res.status(400).json({ error: '無効なユーザータイプです' });
    }

    // ユーザーを検索
    let user = await User.findOne({ email, userType });

    // 既存ユーザーがいる場合はエラーを返す
    if (user) {
      return res.status(400).json({
        error: 'このメールアドレスは既に登録されています。「ログイン」タブからログインしてください。'
      });
    }

    // 新規ユーザー作成
    if (!name) {
      return res.status(400).json({ error: '企業名は必須です' });
    }

    user = new User({
      email,
      name,
      userType
    });

    await user.save();

    // ログイントークン生成
    const token = crypto.randomBytes(32).toString('hex');

    const loginToken = new LoginToken({
      email,
      token,
      userType
    });

    await loginToken.save();

    // マジックリンク生成
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify?token=${token}&type=${userType}`;

    // 開発環境ではコンソールにログイン情報を出力
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
      console.log('==============================================');
      console.log('マジックリンク（開発環境）:');
      console.log(`名前: ${name}`);
      console.log(`メール: ${email}`);
      console.log(`タイプ: ${userType}`);
      console.log(`URL: ${loginUrl}`);
      console.log('==============================================');
      res.json({
        message: 'ログインリンクをコンソールに出力しました',
        developmentUrl: loginUrl
      });
    } else {
      // 本番環境ではメール送信
      const emailResult = await sendRegistrationEmail({
        email,
        name,
        userType,
        loginUrl
      });

      if (emailResult.success) {
        res.json({
          message: 'ログインリンクをメールで送信しました'
        });
      } else {
        throw new Error('メール送信に失敗しました: ' + emailResult.error);
      }
    }
  } catch (error) {
    console.error('Login request error:', error);
    res.status(500).json({ error: 'ログインリクエスト中にエラーが発生しました' });
  }
});

// トークン検証
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { type } = req.query;

    const loginToken = await LoginToken.findOne({
      token,
      userType: type,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!loginToken) {
      return res.status(400).json({ error: '無効または期限切れのトークンです' });
    }

    // ユーザー取得
    const user = await User.findOne({
      email: loginToken.email,
      userType: loginToken.userType
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // トークンとユーザー情報を返す（パスワード設定画面へ）
    res.json({
      message: 'トークン検証成功',
      needsPasswordSetup: true,
      token,
      user: {
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'トークン検証中にエラーが発生しました' });
  }
});

// パスワード設定（初回登録時）
router.post('/set-password', async (req, res) => {
  try {
    const { token, password, type } = req.body;

    if (!token || !password || !type) {
      return res.status(400).json({ error: 'トークン、パスワード、ユーザータイプは必須です' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'パスワードは8文字以上である必要があります' });
    }

    // トークン検証
    const loginToken = await LoginToken.findOne({
      token,
      userType: type,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!loginToken) {
      return res.status(400).json({ error: '無効または期限切れのトークンです' });
    }

    // ユーザー取得
    const user = await User.findOne({
      email: loginToken.email,
      userType: loginToken.userType
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // パスワードを設定
    user.password = password;
    await user.save();

    // トークンを使用済みにする
    loginToken.used = true;
    await loginToken.save();

    // 最終ログイン更新
    user.lastLoginAt = new Date();
    await user.save();

    // セッションにユーザー情報を保存
    req.session.userId = user._id;
    req.session.userType = user.userType;

    // セッションを明示的に保存してからレスポンスを送信
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'セッション保存中にエラーが発生しました' });
      }

      res.json({
        message: 'パスワード設定が完了しました',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          profilePicture: user.profilePicture
        }
      });
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'パスワード設定中にエラーが発生しました' });
  }
});

// パスワードログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({ error: 'メールアドレス、パスワード、ユーザータイプは必須です' });
    }

    // ユーザー取得（パスワードフィールドも取得）
    const user = await User.findOne({
      email,
      userType
    }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // パスワードが設定されていない場合
    if (!user.isPasswordSet) {
      return res.status(400).json({ error: 'アカウント設定が完了していません。メールからアカウント設定を完了してください。' });
    }

    // パスワード検証
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // 最終ログイン更新
    user.lastLoginAt = new Date();
    await user.save();

    // セッションにユーザー情報を保存
    req.session.userId = user._id;
    req.session.userType = user.userType;

    console.log('Login: Attempting to save session for user:', user.email, 'Session ID:', req.sessionID);

    // セッションを明示的に保存してからレスポンスを送信
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'セッション保存中にエラーが発生しました' });
      }

      console.log('Login: Session saved successfully. Session ID:', req.sessionID);
      console.log('Login: Session cookie:', req.session.cookie);
      console.log('Login: Response headers before send:', res.getHeaders());

      res.json({
        message: 'ログイン成功',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          profilePicture: user.profilePicture
        }
      });

      console.log('Login: Response headers after send:', res.getHeaders());
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'ログイン中にエラーが発生しました' });
  }
});

// ログアウト
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'ログアウト中にエラーが発生しました' });
    }
    res.json({ message: 'ログアウトしました' });
  });
});

// 現在のユーザー情報取得
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  User.findById(req.session.userId)
    .select('-googleId -lineId')
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: 'ユーザーが見つかりません' });
      }
      res.json({ user });
    })
    .catch(error => {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'ユーザー情報の取得中にエラーが発生しました' });
    });
});

module.exports = router;
