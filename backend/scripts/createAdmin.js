require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB接続成功');

    // 既存の管理者を確認
    const existingAdmin = await Admin.findOne({ email: 'admin@office-tree.jp' });

    if (existingAdmin) {
      console.log('既に管理者アカウントが存在します。');
      console.log('Username:', existingAdmin.username);
      console.log('Email:', existingAdmin.email);
      console.log('役割:', existingAdmin.role);
      console.log('\n既存のアカウントを削除して再作成しますか？(y/n)');
      process.exit(0);
    }

    // 新しい管理者を作成
    const admin = new Admin({
      username: 'admin',
      email: 'admin@office-tree.jp',
      password: 'ZinAI2025!Admin', // パスワードは自動的にハッシュ化される
      role: 'super-admin'
    });

    await admin.save();

    console.log('✅ 管理者アカウントを作成しました！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Username: admin');
    console.log('📧 Email: admin@office-tree.jp');
    console.log('🔑 Password: ZinAI2025!Admin');
    console.log('🎖️  役割: super-admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nログインURL: https://office-tree.jp/ZinAI/admin');
    console.log('\n⚠️  セキュリティのため、初回ログイン後にパスワードを変更してください。');

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続を切断しました');
  }
};

createAdmin();
