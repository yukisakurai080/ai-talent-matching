// アプリケーション設定
const config = {
  // バックエンドAPIのベースURL
  // 環境変数から取得、なければローカル開発用のURLを使用
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',

  // Stripe公開キー
  stripePublicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY || '',

  // Google OAuth クライアントID
  googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',

  // 環境
  environment: process.env.REACT_APP_ENVIRONMENT || 'development',

  // バージョン
  version: process.env.REACT_APP_VERSION || '1.0.0',

  // APIエンドポイント
  endpoints: {
    auth: '/api/auth',
    chat: '/api/chat',
    talents: '/api/talents',
    messages: '/api/messages',
    companies: '/api/companies',
    interviewTracking: '/api/interview-tracking',
    partners: '/api/partners',
    admin: '/api/admin',
    payments: '/api/payments',
    health: '/api/health'
  }
};

export default config;
