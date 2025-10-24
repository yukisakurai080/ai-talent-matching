const express = require('express');
const router = express.Router();
const EmailProxy = require('../models/EmailProxy');
const Message = require('../models/Message');
const { sendReplyToApplicant, sendApplicationNotification } = require('../services/emailService');

/**
 * Inbound Email Webhook
 * SendGrid Inbound Parse または Mailgun Routes から呼ばれる
 */
router.post('/inbound', express.json(), express.urlencoded({ extended: true }), async (req, res) => {
  try {
    console.log('Received inbound email:', req.body);

    // メールデータを取得（SendGridの形式）
    const {
      to,          // proxy-abc123@yourdomain.com
      from,        // sender@example.com
      subject,
      text,        // プレーンテキスト
      html         // HTML
    } = req.body;

    // toアドレスからproxy ID抽出
    const proxyEmail = to;
    const proxyMatch = proxyEmail.match(/proxy-([a-f0-9]+)@/);

    if (!proxyMatch) {
      console.error('Invalid proxy email format:', proxyEmail);
      return res.status(400).json({ error: 'Invalid proxy email' });
    }

    const proxyId = proxyMatch[1];

    // プロキシ情報を取得
    const proxy = await EmailProxy.findOne({ proxyId, isActive: true });

    if (!proxy) {
      console.error('Proxy not found or inactive:', proxyId);
      return res.status(404).json({ error: 'Proxy not found' });
    }

    // メール本文を取得（HTML優先、なければテキスト）
    const emailContent = text || html || '';

    // メッセージをデータベースに保存
    const newMessage = new Message({
      companyId: proxy.companyId,
      senderName: proxy.fromName,
      senderEmail: proxy.fromEmail,
      subject: subject || 'Re: 応募について',
      content: emailContent,
      messageType: proxy.proxyType === 'company_to_applicant' ? 'company_to_talent' : 'application',
      isFromEmail: true,
      threadId: proxy.threadId,
      emailSent: false // 受信メールなので送信済みではない
    });

    await newMessage.save();

    console.log('Message saved from email:', newMessage._id);

    // 相手側に転送
    if (proxy.proxyType === 'applicant_to_company') {
      // 求職者→企業: 企業にメール転送
      // 企業用の返信プロキシを取得
      const companyReplyProxy = await EmailProxy.findOne({
        threadId: proxy.threadId,
        proxyType: 'company_to_applicant',
        isActive: true
      });

      if (companyReplyProxy) {
        await sendApplicationNotification({
          companyEmail: proxy.toEmail,
          companyName: proxy.toName,
          applicantName: proxy.fromName,
          applicantEmail: proxy.fromEmail,
          applicantPhone: '',
          positionTitle: subject || '応募について',
          messageContent: emailContent,
          messageId: newMessage._id,
          companyId: proxy.companyId,
          threadId: proxy.threadId,
          proxyEmail: companyReplyProxy.proxyEmail
        });
      }
    } else {
      // 企業→求職者: 求職者にメール転送
      // 求職者用の返信プロキシを取得
      const applicantReplyProxy = await EmailProxy.findOne({
        threadId: proxy.threadId,
        proxyType: 'applicant_to_company',
        isActive: true
      });

      if (applicantReplyProxy) {
        await sendReplyToApplicant({
          applicantEmail: proxy.toEmail,
          applicantName: proxy.toName,
          companyName: proxy.fromName,
          replyContent: emailContent,
          originalSubject: subject || '応募について',
          proxyEmail: applicantReplyProxy.proxyEmail
        });
      }
    }

    res.status(200).json({ success: true, message: 'Email processed' });
  } catch (error) {
    console.error('Inbound email processing error:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
});

module.exports = router;
