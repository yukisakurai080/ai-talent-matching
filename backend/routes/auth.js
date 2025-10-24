const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const LoginToken = require('../models/LoginToken');
const nodemailer = require('nodemailer');

// メール送信設定（開発環境ではコンソール出力）
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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

    // ユーザーを検索または作成
    let user = await User.findOne({ email, userType });

    if (!user) {
      // 新規ユーザー作成
      if (!name) {
        return res.status(400).json({ error: '新規登録には名前が必要です' });
      }

      user = new User({
        email,
        name,
        userType
      });

      await user.save();
    }

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

    // メール送信
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@ai-talent-matching.com',
      to: email,
      subject: userType === 'company' ? '企業ポータル ログインリンク' : 'ジョブリスト ログインリンク',
      html: `
        <h2>${userType === 'company' ? '企業ポータル' : 'ジョブリスト'}へのログイン</h2>
        <p>以下のリンクをクリックしてログインしてください（15分間有効）：</p>
        <p><a href="${loginUrl}">${loginUrl}</a></p>
        <p>このメールに心当たりがない場合は、無視してください。</p>
      `
    };

    // 開発環境ではコンソールにログイン情報を出力
    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER) {
      console.log('==============================================');
      console.log('マジックリンク（開発環境）:');
      console.log(loginUrl);
      console.log('==============================================');
      res.json({
        message: 'ログインリンクをコンソールに出力しました',
        developmentUrl: loginUrl
      });
    } else {
      await transporter.sendMail(mailOptions);
      res.json({
        message: 'ログインリンクをメールで送信しました'
      });
    }
  } catch (error) {
    console.error('Login request error:', error);
    res.status(500).json({ error: 'ログインリクエスト中にエラーが発生しました' });
  }
});

// トークン検証とログイン
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

    // トークンを使用済みにする
    loginToken.used = true;
    await loginToken.save();

    // 最終ログイン更新
    user.lastLoginAt = new Date();
    await user.save();

    // セッションにユーザー情報を保存
    req.session.userId = user._id;
    req.session.userType = user.userType;

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
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'トークン検証中にエラーが発生しました' });
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
