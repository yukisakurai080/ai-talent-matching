const rateLimit = require('express-rate-limit');

// 基本的なレート制限: 1時間に30リクエストまで
const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 30,
  message: {
    error: 'リクエストが多すぎます。1時間後に再度お試しください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI検索用の厳しい制限: 1時間に50リクエストまで
const aiSearchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 50,
  message: {
    error: 'AI検索のリクエストが多すぎます。1時間に50回までご利用いただけます。'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 翻訳APIの制限: 1時間に20リクエストまで
const translationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 20,
  message: {
    error: '翻訳リクエストが多すぎます。1時間に20回までご利用いただけます。'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 人材登録・企業登録の制限: 1日に5回まで
const registrationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24時間
  max: 5,
  message: {
    error: '登録リクエストが多すぎます。1日に5回までご利用いただけます。'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  aiSearchLimiter,
  translationLimiter,
  registrationLimiter
};
