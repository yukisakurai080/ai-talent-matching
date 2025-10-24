const express = require('express');
const router = express.Router();
const openaiService = require('../services/openaiService');
const Conversation = require('../models/Conversation');
const { v4: uuidv4 } = require('uuid');
const { aiSearchLimiter } = require('../middleware/rateLimiter');
const { checkTokenLimit, recordTokenUsage } = require('../middleware/tokenTracker');

// チャットメッセージの送信
router.post('/message', aiSearchLimiter, checkTokenLimit('ai-search'), async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'メッセージが必要です' });
    }

    // セッションIDがない場合は新規作成
    const currentSessionId = sessionId || uuidv4();

    // 会話履歴を取得または作成
    let conversation = await Conversation.findOne({ sessionId: currentSessionId });

    if (!conversation) {
      conversation = new Conversation({
        sessionId: currentSessionId,
        messages: []
      });
    }

    // ユーザーメッセージを追加
    conversation.messages.push({
      role: 'user',
      content: message
    });

    // OpenAI APIで応答を生成
    const messages = conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const aiResponse = await openaiService.chat(messages);

    // AIの応答を追加
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse.message
    });

    // 要件が抽出された場合は保存
    if (aiResponse.extractedRequirements && aiResponse.extractedRequirements.ready_to_search) {
      conversation.extractedRequirements = aiResponse.extractedRequirements.requirements;
    }

    await conversation.save();

    // トークン使用量を記録
    if (aiResponse.tokensUsed) {
      const ipAddress = req.ip || req.connection.remoteAddress;
      await recordTokenUsage(ipAddress, '/api/chat/message', aiResponse.tokensUsed, 'ai-search');
    }

    res.json({
      sessionId: currentSessionId,
      message: aiResponse.message,
      extractedRequirements: aiResponse.extractedRequirements,
      tokensUsed: aiResponse.tokensUsed
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'チャット処理中にエラーが発生しました' });
  }
});

// 会話履歴の取得
router.get('/conversation/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      return res.status(404).json({ error: '会話が見つかりません' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: '会話履歴の取得中にエラーが発生しました' });
  }
});

module.exports = router;
