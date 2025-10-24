require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');

const chatRoutes = require('./routes/chat');
const talentRoutes = require('./routes/talents');
const messageRoutes = require('./routes/messages');
const companyRoutes = require('./routes/companies');
const interviewTrackingRoutes = require('./routes/interviewTracking');
const emailWebhookRoutes = require('./routes/emailWebhook');
const partnerRoutes = require('./routes/partners');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const { getUsageStats } = require('./middleware/tokenTracker');

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェア
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// セッション設定
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // 24時間
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7日間
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// MongoDB接続
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB接続成功'))
.catch(err => console.error('MongoDB接続エラー:', err));

// Stripe Webhook用（raw bodyが必要なため先に定義）
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes);

// ルーティング
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/talents', talentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/interview-tracking', interviewTrackingRoutes);
app.use('/api/email-webhook', emailWebhookRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'サーバーは正常に動作しています' });
});

// 使用量統計
app.get('/api/usage-stats', getUsageStats);

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});
