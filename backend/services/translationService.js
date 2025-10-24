const OpenAI = require('openai');
const Translation = require('../models/Translation');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// メモリキャッシュ（高速アクセス用）
const memoryCache = new Map();

const translateCompany = async (company, targetLanguage) => {
  const languageMap = {
    en: 'English',
    zh: 'Chinese (Simplified)',
    vi: 'Vietnamese',
    id: 'Indonesian',
    ko: 'Korean',
    es: 'Spanish',
    ta: 'Tamil',
    fr: 'French',
    hi: 'Hindi',
    bn: 'Bengali',
    pt: 'Portuguese'
  };

  if (!languageMap[targetLanguage]) {
    return company;
  }

  const cacheKey = `${company._id}_${targetLanguage}`;

  // 1. メモリキャッシュチェック（最速）
  if (memoryCache.has(cacheKey)) {
    console.log(`Memory cache hit for ${company.companyName} (${targetLanguage})`);
    return memoryCache.get(cacheKey);
  }

  // 2. データベースキャッシュチェック
  try {
    const dbTranslation = await Translation.findOne({
      companyId: company._id,
      language: targetLanguage
    });

    if (dbTranslation) {
      console.log(`DB cache hit for ${company.companyName} (${targetLanguage}) - saved ${dbTranslation.tokensUsed} tokens`);

      const result = {
        ...company,
        ...dbTranslation.translatedData,
        _id: company._id,
        salaryMin: company.salaryMin,
        salaryMax: company.salaryMax,
        email: company.email,
        phone: company.phone,
        website: company.website,
        status: company.status,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        _tokensUsed: 0 // キャッシュヒットなのでトークン消費なし
      };

      // メモリキャッシュにも保存
      memoryCache.set(cacheKey, result);

      return result;
    }
  } catch (dbError) {
    console.error('DB cache error:', dbError);
    // DB エラーでも翻訳は続行
  }

  const prompt = `Translate the following job posting information to ${languageMap[targetLanguage]}. Return ONLY a JSON object with the same structure, no additional text:

{
  "companyName": "${company.companyName}",
  "industry": "${company.industry}",
  "headquarters": "${company.headquarters}",
  "businessDescription": "${company.businessDescription}",
  "positionTitle": "${company.positionTitle}",
  "employmentType": "${company.employmentType}",
  "jobDescription": "${company.jobDescription}",
  "requiredSkills": "${company.requiredSkills}",
  "preferredSkills": "${company.preferredSkills || ''}",
  "workLocation": "${company.workLocation}",
  "workHours": "${company.workHours}",
  "holidays": "${company.holidays}",
  "benefits": "${company.benefits || ''}",
  "selectionProcess": "${company.selectionProcess || ''}"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate job postings accurately while maintaining professional tone. Return only valid JSON, no markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    });

    const translatedText = completion.choices[0].message.content.trim();
    const translated = JSON.parse(translatedText);

    const tokensUsed = completion.usage.total_tokens;

    const result = {
      ...company,
      ...translated,
      _id: company._id,
      salaryMin: company.salaryMin,
      salaryMax: company.salaryMax,
      email: company.email,
      phone: company.phone,
      website: company.website,
      status: company.status,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      _tokensUsed: tokensUsed
    };

    // データベースに永続保存
    try {
      await Translation.findOneAndUpdate(
        {
          companyId: company._id,
          language: targetLanguage
        },
        {
          translatedData: translated,
          tokensUsed: tokensUsed
        },
        {
          upsert: true,
          new: true
        }
      );
      console.log(`Saved translation to DB for ${company.companyName} (${targetLanguage}) - ${tokensUsed} tokens`);
    } catch (dbError) {
      console.error('Error saving translation to DB:', dbError);
    }

    // メモリキャッシュにも保存
    memoryCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Translation error:', error);
    return company;
  }
};

const translateCompanies = async (companies, targetLanguage) => {
  if (!targetLanguage || targetLanguage === 'ja') {
    return companies;
  }

  console.log(`Translating ${companies.length} companies to ${targetLanguage}...`);

  // すべての企業を並列で翻訳
  const translations = await Promise.all(
    companies.map(company => translateCompany(company, targetLanguage))
  );

  return translations;
};

module.exports = { translateCompany, translateCompanies };
