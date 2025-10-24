const { translateCompany } = require('./translationService');

// サポートする全言語
const SUPPORTED_LANGUAGES = ['en', 'zh', 'vi', 'id', 'ko', 'es', 'ta', 'fr', 'hi', 'bn', 'pt'];

/**
 * 新規企業登録時に全言語に事前翻訳
 * @param {Object} company - 企業データ
 */
const preTranslateCompany = async (company) => {
  console.log(`Starting pre-translation for ${company.companyName}...`);

  const translationPromises = SUPPORTED_LANGUAGES.map(async (lang) => {
    try {
      await translateCompany(company, lang);
      console.log(`✓ Pre-translated ${company.companyName} to ${lang}`);
    } catch (error) {
      console.error(`✗ Failed to pre-translate ${company.companyName} to ${lang}:`, error.message);
    }
  });

  await Promise.all(translationPromises);

  console.log(`Completed pre-translation for ${company.companyName}`);
};

/**
 * 既存の全企業を事前翻訳（管理用）
 * @param {Array} companies - 企業データの配列
 */
const preTranslateAllCompanies = async (companies) => {
  console.log(`Starting pre-translation for ${companies.length} companies...`);

  let completed = 0;
  let failed = 0;

  for (const company of companies) {
    try {
      await preTranslateCompany(company);
      completed++;
    } catch (error) {
      console.error(`Failed to pre-translate company ${company._id}:`, error);
      failed++;
    }
  }

  console.log(`Pre-translation completed: ${completed} succeeded, ${failed} failed`);

  return { completed, failed };
};

module.exports = {
  preTranslateCompany,
  preTranslateAllCompanies
};
