require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const showAdmin = async () => {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB接続成功\n');

    // すべての管理者を取得
    const admins = await Admin.find({}).select('-password');

    if (admins.length === 0) {
      console.log('管理者アカウントが見つかりません。');
    } else {
      console.log(`管理者アカウント一覧 (${admins.length}件):`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      admins.forEach((admin, index) => {
        console.log(`【${index + 1}】`);
        console.log(`👤 Username: ${admin.username}`);
        console.log(`📧 Email: ${admin.email}`);
        console.log(`🎖️  役割: ${admin.role}`);
        console.log(`📅 作成日: ${admin.createdAt}`);
        if (admin.lastLoginAt) {
          console.log(`🔓 最終ログイン: ${admin.lastLoginAt}`);
        }
        console.log('');
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n💡 これらのアカウントでログインできます');
      console.log('ログインURL: https://office-tree.jp/ZinAI/admin');
      console.log('\n⚠️  パスワードが不明な場合は、リセットスクリプトを実行してください。');
    }

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続を切断しました');
  }
};

showAdmin();
