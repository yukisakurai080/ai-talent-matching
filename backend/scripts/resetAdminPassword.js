require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const resetPassword = async () => {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB接続成功\n');

    // 管理者を検索
    const admin = await Admin.findOne({ username: 'admin' });

    if (!admin) {
      console.log('管理者アカウントが見つかりません。');
      return;
    }

    // 新しいパスワードを設定
    admin.password = 'ZinAI2025!Admin';
    await admin.save();

    console.log('✅ パスワードをリセットしました！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Username: admin');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 新しいPassword: ZinAI2025!Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nログインURL: https://office-tree.jp/ZinAI/admin');
    console.log('\n⚠️  セキュリティのため、ログイン後にパスワードを変更してください。');

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続を切断しました');
  }
};

resetPassword();
