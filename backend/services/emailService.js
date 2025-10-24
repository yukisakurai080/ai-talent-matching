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

module.exports = {
  sendApplicationNotification,
  sendReplyToApplicant
};
