require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const { preTranslateAllCompanies } = require('../services/preTranslationService');

async function batchTranslate() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB connected');

    // 全企業を取得
    const companies = await Company.find({ status: 'active' });
    console.log(`Found ${companies.length} active companies`);

    if (companies.length === 0) {
      console.log('No companies to translate');
      process.exit(0);
    }

    // 一括翻訳実行
    const result = await preTranslateAllCompanies(companies.map(c => c.toObject()));

    console.log('\n=== Translation Summary ===');
    console.log(`Total companies: ${companies.length}`);
    console.log(`Successfully translated: ${result.completed}`);
    console.log(`Failed: ${result.failed}`);
    console.log('==========================\n');

    process.exit(0);
  } catch (error) {
    console.error('Batch translation error:', error);
    process.exit(1);
  }
}

batchTranslate();
