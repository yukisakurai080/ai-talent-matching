const nodemailer = require('nodemailer');
const EmailProxy = require('../models/EmailProxy');

// メール送信設定（Gmailを使用する場合の例）
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // 例: your-email@gmail.com
    pass: process.env.EMAIL_PASSWORD // Gmailアプリパスワード
  }
});

/**
 * 企業に応募通知メールを送信（プロキシシステム）
 * @param {Object} params - メール送信パラメータ
 */
const sendApplicationNotification = async ({
  companyEmail,
  companyName,
  applicantName,
  applicantEmail,
  applicantPhone,
  positionTitle,
  messageContent,
  messageId,
  companyId,
  threadId,
  proxyEmail // 企業が返信する際のプロキシアドレス
}) => {
  try {
    const mailOptions = {
      from: `"AI人材マッチング" <${process.env.EMAIL_USER}>`,
      to: companyEmail,
      replyTo: proxyEmail, // プロキシアドレスに返信
      subject: `【新規応募】${positionTitle}に応募がありました`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">新規応募のお知らせ</h2>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">応募者情報</h3>
            <p><strong>お名前:</strong> ${applicantName}</p>
            <p><strong>電話番号:</strong> ${applicantPhone}</p>
            <p><strong>応募ポジション:</strong> ${positionTitle}</p>
          </div>

          <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">メッセージ内容</h3>
            <p style="white-space: pre-wrap;">${messageContent}</p>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">
              <strong>💡 返信方法:</strong><br>
              このメールに直接返信すると、応募者に届きます。<br>
              応募者のメールアドレスは非公開で、安全にやり取りできます。<br>
              また、メッセージボックスでもやり取りを確認できます。
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/"
               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              メッセージボックスで確認
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            このメールはAI人材マッチングシステムから自動送信されています。
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Application notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 求職者にメール返信を送信（プロキシシステム）
 * @param {Object} params - メール送信パラメータ
 */
const sendReplyToApplicant = async ({
  applicantEmail,
  applicantName,
  companyName,
  replyContent,
  originalSubject,
  proxyEmail // 求職者が返信する際のプロキシアドレス
}) => {
  try {
    const mailOptions = {
      from: `"AI人材マッチング - ${companyName}" <${process.env.EMAIL_USER}>`,
      to: applicantEmail,
      replyTo: proxyEmail, // プロキシアドレスに返信
      subject: `Re: ${originalSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h3 style="color: #10b981;">${companyName}からのメッセージ</h3>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Dear ${applicantName}様、</p>
            <p style="white-space: pre-wrap;">${replyContent}</p>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">
              <strong>💡 返信方法:</strong><br>
              このメールに直接返信すると、企業に届きます。<br>
              企業のメールアドレスは非公開で、安全にやり取りできます。
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            このメールはAI人材マッチングシステムから自動送信されています。
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reply email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Reply email sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 新規登録時のマジックリンクメールを送信
 * @param {Object} params - メール送信パラメータ
 */
const sendRegistrationEmail = async ({
  email,
  name,
  userType,
  loginUrl
}) => {
  try {
    const isCompany = userType === 'company';
    const mailOptions = {
      from: `"ZinAI人材マッチング" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isCompany ? '【ZinAI】企業ポータル 登録用ログインリンク' : '【ZinAI】ジョブリスト 登録用ログインリンク',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- ヘッダー -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
              🎉 ZinAI人材マッチング
            </h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">
              ${isCompany ? '企業ポータル' : 'ジョブリスト'}へようこそ！
            </p>
          </div>

          <!-- メインコンテンツ -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">
              ${name}様
            </h2>

            <p style="color: #555555; line-height: 1.8; margin: 0 0 25px 0; font-size: 16px;">
              この度は<strong>ZinAI人材マッチングシステム</strong>にご登録いただき、誠にありがとうございます。
            </p>

            <p style="color: #555555; line-height: 1.8; margin: 0 0 30px 0; font-size: 16px;">
              下記のボタンをクリックして、アカウントの登録を完了してください。<br>
              <span style="color: #999999; font-size: 14px;">※このリンクは15分間有効です</span>
            </p>

            <!-- ログインボタン -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${loginUrl}"
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 16px 45px; text-decoration: none; border-radius: 50px;
                        font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                        transition: all 0.3s ease;">
                ${isCompany ? '🏢 企業ポータルにログイン' : '💼 ジョブリストにログイン'}
              </a>
            </div>

            <!-- 情報ボックス -->
            <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px;">
                💡 ${isCompany ? '企業ポータルでできること' : 'ジョブリストでできること'}
              </h3>
              <ul style="color: #555555; line-height: 1.8; margin: 0; padding-left: 20px;">
                ${isCompany ? `
                  <li>求人情報の投稿・管理</li>
                  <li>応募者の確認とメッセージのやり取り</li>
                  <li>AI による最適な人材マッチング</li>
                  <li>面接進捗の管理</li>
                ` : `
                  <li>最新の求人情報の閲覧</li>
                  <li>企業への応募とメッセージ送信</li>
                  <li>AIによる求人のレコメンド</li>
                  <li>応募状況の確認</li>
                `}
              </ul>
            </div>

            <!-- 注意事項 -->
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #ffc107;">
              <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
                <strong>⚠️ セキュリティに関する注意</strong><br>
                このメールに心当たりがない場合は、お手数ですが削除してください。<br>
                リンクを他の人と共有しないようご注意ください。
              </p>
            </div>

            <!-- リンクが機能しない場合 -->
            <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0;">
                ボタンが機能しない場合は、以下のURLをコピーしてブラウザに貼り付けてください：<br>
                <a href="${loginUrl}" style="color: #667eea; word-break: break-all;">${loginUrl}</a>
              </p>
            </div>
          </div>

          <!-- フッター -->
          <div style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #999999; font-size: 13px; margin: 0 0 10px 0;">
              このメールはZinAI人材マッチングシステムから自動送信されています。
            </p>
            <p style="color: #999999; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} ZinAI. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Registration email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendApplicationNotification,
  sendReplyToApplicant,
  sendRegistrationEmail
};
