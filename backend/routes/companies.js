const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { translateCompanies } = require('../services/translationService');
const { preTranslateCompany } = require('../services/preTranslationService');
const { translationLimiter, registrationLimiter } = require('../middleware/rateLimiter');
const { checkTokenLimit, recordTokenUsage } = require('../middleware/tokenTracker');

// 企業一覧取得（求職者用）
router.get('/', translationLimiter, checkTokenLimit('translation'), async (req, res) => {
  try {
    const { industry, location, employmentType, lang } = req.query;
    const query = { status: 'active' };

    if (industry) {
      query.industry = industry;
    }
    if (location) {
      query.workLocation = { $regex: location, $options: 'i' };
    }
    if (employmentType) {
      query.employmentType = employmentType;
    }

    let companies = await Company.find(query).sort({ createdAt: -1 });

    // 翻訳が必要な場合（並列処理 + キャッシュ）
    let totalTokensUsed = 0;
    if (lang && lang !== 'ja') {
      const companiesObj = companies.map(c => c.toObject());
      companies = await translateCompanies(companiesObj, lang);

      // トークン使用量を計算
      companies.forEach(c => {
        if (c._tokensUsed) {
          totalTokensUsed += c._tokensUsed;
          delete c._tokensUsed; // レスポンスから削除
        }
      });

      // トークン使用量を記録
      if (totalTokensUsed > 0) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        await recordTokenUsage(ipAddress, '/api/companies', totalTokensUsed, 'translation');
      }
    }

    res.json({ companies, tokensUsed: totalTokensUsed });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: '企業情報の取得中にエラーが発生しました' });
  }
});

// 企業詳細取得
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: '企業が見つかりません' });
    }
    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: '企業情報の取得中にエラーが発生しました' });
  }
});

// 企業登録
router.post('/register', registrationLimiter, async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();

    // バックグラウンドで全言語に事前翻訳（非同期）
    // レスポンスをブロックしないように await しない
    preTranslateCompany(company.toObject()).catch(err => {
      console.error('Pre-translation error:', err);
    });

    res.status(201).json({
      success: true,
      message: '企業情報を登録しました。多言語対応の準備を開始しています。',
      company
    });
  } catch (error) {
    console.error('Company registration error:', error);
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

module.exports = router;
