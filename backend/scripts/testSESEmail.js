require('dotenv').config();
const { sendRegistrationEmail } = require('../services/emailService');

const testEmail = async () => {
  try {
    console.log('Amazon SESメール送信テストを開始します...\n');
    console.log('送信先:', process.env.TEST_EMAIL || 'sakuraiyuki080@gmail.com');
    console.log('送信元:', process.env.EMAIL_USER);
    console.log('AWSリージョン:', process.env.AWS_REGION);
    console.log('');

    const result = await sendRegistrationEmail({
      email: process.env.TEST_EMAIL || 'sakuraiyuki080@gmail.com',
      name: 'テストユーザー',
      userType: 'company',
      loginUrl: 'https://office-tree.jp/ZinAI/auth/verify?token=test-token-123&type=company'
    });

    if (result.success) {
      console.log('✅ メール送信成功！');
      console.log('メッセージID:', result.messageId);
      console.log('\n📬 メールボックスを確認してください！');
      console.log('送信先:', process.env.TEST_EMAIL || 'sakuraiyuki080@gmail.com');
    } else {
      console.error('❌ メール送信失敗');
      console.error('エラー:', result.error);
    }
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    console.error('\nエラーの詳細:');
    console.error('メッセージ:', error.message);
    if (error.Code) {
      console.error('SESエラーコード:', error.Code);
    }
  }
};

testEmail();
