const express = require('express');
const router = express.Router();
const Talent = require('../models/Talent');
const matchingService = require('../services/matchingService');
const { registrationLimiter, generalLimiter } = require('../middleware/rateLimiter');

// 人材検索
router.post('/search', async (req, res) => {
  try {
    const { requirements } = req.body;

    if (!requirements) {
      return res.status(400).json({ error: '検索条件が必要です' });
    }

    const talents = await matchingService.searchTalents(requirements);

    res.json({
      count: talents.length,
      talents
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: '検索中にエラーが発生しました' });
  }
});

// 人材詳細取得
router.get('/:id', async (req, res) => {
  try {
    const talent = await Talent.findById(req.params.id).populate('partnerId');

    if (!talent) {
      return res.status(404).json({ error: '人材が見つかりません' });
    }

    // 個人情報を除外（企業向け）
    const talentData = talent.toObject();
    delete talentData.email;
    delete talentData.phone;

    // パートナー情報を追加
    if (talent.partnerId) {
      talentData.partnerInfo = {
        organizationName: talent.partnerId.organizationName,
        placementFee: talent.partnerId.placementFee || 0,
        guaranteePeriods: talent.partnerId.guaranteePeriods || []
      };
    }

    res.json(talentData);
  } catch (error) {
    console.error('Get talent error:', error);
    res.status(500).json({ error: '人材情報の取得中にエラーが発生しました' });
  }
});

// 全人材取得（管理用）
router.get('/', async (req, res) => {
  try {
    const talents = await Talent.find().sort({ updatedAt: -1 });
    res.json(talents);
  } catch (error) {
    console.error('Get all talents error:', error);
    res.status(500).json({ error: '人材一覧の取得中にエラーが発生しました' });
  }
});

// 人材登録（管理用）
router.post('/', async (req, res) => {
  try {
    const talent = new Talent(req.body);
    await talent.save();
    res.status(201).json(talent);
  } catch (error) {
    console.error('Create talent error:', error);
    res.status(500).json({ error: '人材登録中にエラーが発生しました' });
  }
});

// 求職者による人材登録
router.post('/register', registrationLimiter, async (req, res) => {
  try {
    const talentData = {
      ...req.body,
      status: req.body.status || 'active'
    };

    const talent = new Talent(talentData);
    await talent.save();

    // パートナー経由の登録の場合、パートナーの登録人数を更新
    if (talentData.partnerCode) {
      const Partner = require('../models/Partner');
      await Partner.findOneAndUpdate(
        { partnerCode: talentData.partnerCode },
        { $inc: { registeredTalentsCount: 1 } }
      );
    }

    res.status(201).json({
      success: true,
      message: '登録が完了しました',
      talent: {
        id: talent._id,
        name: talent.name,
        email: talent.email
      }
    });
  } catch (error) {
    console.error('Talent registration error:', error);

    // バリデーションエラーの処理
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({
        success: false,
        error: '入力内容に不備があります',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: '登録中にエラーが発生しました'
    });
  }
});

// 人材削除（パートナー認証が必要）
router.delete('/:id', async (req, res) => {
  try {
    const talent = await Talent.findById(req.params.id);

    if (!talent) {
      return res.status(404).json({ error: '人材が見つかりません' });
    }

    // パートナー情報を取得して登録人材数を減らす
    if (talent.partnerId) {
      const Partner = require('../models/Partner');
      const partner = await Partner.findById(talent.partnerId);
      if (partner && partner.registeredTalentsCount > 0) {
        partner.registeredTalentsCount -= 1;
        await partner.save();
      }
    }

    await Talent.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '人材情報を削除しました'
    });
  } catch (error) {
    console.error('Delete talent error:', error);
    res.status(500).json({ error: '削除中にエラーが発生しました' });
  }
});

module.exports = router;
