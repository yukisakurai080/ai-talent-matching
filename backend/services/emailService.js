const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const EmailProxy = require('../models/EmailProxy');

// Amazon SES クライアント設定
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * SESでメールを送信するヘルパー関数
 */
const sendEmailViaSES = async ({ from, to, replyTo, subject, htmlBody }) => {
  const params = {
    Source: from,
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8'
        }
      }
    }
  };

  if (replyTo) {
    params.ReplyToAddresses = [replyTo];
  }

  const command = new SendEmailCommand(params);
  const response = await sesClient.send(command);
  return response;
};

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
    const htmlBody = `
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
    `;

    const response = await sendEmailViaSES({
      from: `AI人材マッチング <${process.env.EMAIL_USER}>`,
      to: companyEmail,
      replyTo: proxyEmail,
      subject: `【新規応募】${positionTitle}に応募がありました`,
      htmlBody
    });

    console.log('Application notification sent:', response.MessageId);
    return { success: true, messageId: response.MessageId };
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
    const htmlBody = `
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
    `;

    const response = await sendEmailViaSES({
      from: `AI人材マッチング - ${companyName} <${process.env.EMAIL_USER}>`,
      to: applicantEmail,
      replyTo: proxyEmail,
      subject: `Re: ${originalSubject}`,
      htmlBody
    });

    console.log('Reply email sent:', response.MessageId);
    return { success: true, messageId: response.MessageId };
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
    const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- ヘッダー -->
          <div style="background: #2563eb; padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
              ZinAI
            </h1>
            <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px; font-weight: 400;">
              人材マッチングプラットフォーム
            </p>
          </div>

          <!-- メインコンテンツ -->
          <div style="padding: 40px 32px;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
              ${name} 様
            </h2>

            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0; font-size: 15px;">
              ${isCompany ? '企業ポータル' : 'ジョブリスト'}へのご登録ありがとうございます。<br>
              下記のボタンをクリックして、アカウント設定を完了してください。
            </p>

            <!-- 登録ボタン -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}"
                 style="display: inline-block; background: #2563eb; color: #ffffff;
                        padding: 14px 32px; text-decoration: none; border-radius: 6px;
                        font-size: 15px; font-weight: 500;">
                アカウント設定を完了する
              </a>
            </div>

            <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
              このリンクは15分間有効です。<br>
              心当たりがない場合は、このメールを破棄してください。
            </p>

            <!-- リンクが機能しない場合 -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0;">
                ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください：<br>
                <a href="${loginUrl}" style="color: #2563eb; word-break: break-all; font-size: 12px;">${loginUrl}</a>
              </p>
            </div>
          </div>

          <!-- フッター -->
          <div style="background: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} ZinAI. All rights reserved.
            </p>
          </div>
        </div>
      `;

    const response = await sendEmailViaSES({
      from: `ZinAI人材マッチング <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isCompany ? '【ZinAI】企業ポータル 登録用ログインリンク' : '【ZinAI】ジョブリスト 登録用ログインリンク',
      htmlBody
    });

    console.log('Registration email sent:', response.MessageId);
    return { success: true, messageId: response.MessageId };
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
