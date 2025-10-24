const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Talent = require('../models/Talent');
const Company = require('../models/Company');
const EmailProxy = require('../models/EmailProxy');
const { sendApplicationNotification } = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

// メッセージ送信（応募メッセージ）
router.post('/', async (req, res) => {
  try {
    const { talentId, companyId, senderName, senderEmail, senderPhone, subject, content, messageType } = req.body;

    if (!talentId || !senderName || !senderEmail || !subject || !content) {
      return res.status(400).json({ error: '全ての項目を入力してください' });
    }

    // 人材の存在確認
    const talent = await Talent.findById(talentId);
    if (!talent) {
      return res.status(404).json({ error: '人材が見つかりません' });
    }

    // 企業の存在確認
    if (!companyId) {
      return res.status(400).json({ error: '企業IDが必要です' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: '企業が見つかりません' });
    }

    // スレッドIDを生成
    const threadId = uuidv4();

    // メッセージを保存
    const message = new Message({
      talentId,
      companyId,
      senderName,
      senderEmail,
      subject,
      content,
      messageType: messageType || 'application',
      threadId,
      emailSent: false
    });

    await message.save();

    // プロキシペアを作成
    const proxies = await EmailProxy.createProxyPair({
      applicantEmail: senderEmail,
      applicantName: senderName,
      companyEmail: company.email,
      companyName: company.companyName,
      messageId: message._id,
      companyId,
      threadId
    });

    // 企業にメール通知を送信
    const emailResult = await sendApplicationNotification({
      companyEmail: company.email,
      companyName: company.companyName,
      applicantName: senderName,
      applicantEmail: senderEmail,
      applicantPhone: senderPhone || '',
      positionTitle: company.positionTitle || subject,
      messageContent: content,
      messageId: message._id,
      companyId,
      threadId,
      proxyEmail: proxies.companyToApplicant.proxyEmail // 企業が返信する際のプロキシ
    });

    // メールが送信された場合、メッセージを更新
    if (emailResult.success) {
      message.emailSent = true;
      message.emailMessageId = emailResult.messageId;
      await message.save();
    }

    res.status(201).json({
      message: 'メッセージを送信しました',
      data: message,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'メッセージ送信中にエラーが発生しました' });
  }
});

// 人材宛のメッセージ一覧取得
router.get('/talent/:talentId', async (req, res) => {
  try {
    const { talentId } = req.params;
    const messages = await Message.find({ talentId })
      .sort({ createdAt: -1 })
      .populate('talentId', 'name email');

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'メッセージ取得中にエラーが発生しました' });
  }
});

module.exports = router;
