require('dotenv').config();
const mongoose = require('mongoose');
const Talent = require('./models/Talent');

// サンプル人材データ
const sampleTalents = [
  {
    name: '山田太郎',
    age: 28,
    gender: '男性',
    email: 'yamada@example.com',
    phone: '090-1234-5678',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
    experience: 5,
    education: '東京大学工学部卒業',
    desiredPosition: 'フルスタックエンジニア',
    industry: 'IT・通信',
    desiredSalary: 8000000,
    location: '東京',
    availability: '1ヶ月以内',
    profileDescription: 'フルスタック開発の経験が5年あります。React, Node.jsを使用したWebアプリケーション開発が得意です。',
    certifications: ['AWS認定ソリューションアーキテクト'],
    languages: [
      { language: '日本語', level: 'ネイティブ' },
      { language: '英語', level: 'ビジネスレベル' }
    ],
    status: 'active'
  },
  {
    name: '佐藤花子',
    age: 25,
    gender: '女性',
    email: 'sato@example.com',
    phone: '080-9876-5432',
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'Machine Learning'],
    experience: 3,
    education: '早稲田大学理工学部卒業',
    desiredPosition: 'バックエンドエンジニア',
    industry: 'IT・通信',
    desiredSalary: 6500000,
    location: '東京',
    availability: '即日',
    profileDescription: 'Pythonを使用したバックエンド開発とデータ分析が得意です。機械学習の知識もあります。',
    certifications: ['Python3エンジニア認定データ分析試験'],
    languages: [
      { language: '日本語', level: 'ネイティブ' },
      { language: '英語', level: '中級' }
    ],
    status: 'active'
  },
  {
    name: '鈴木一郎',
    age: 32,
    gender: '男性',
    email: 'suzuki@example.com',
    phone: '090-1111-2222',
    skills: ['CAD', '建築設計', '施工管理', '安全管理'],
    experience: 10,
    education: '日本大学理工学部建築学科卒業',
    desiredPosition: '建築現場監督',
    industry: '建設',
    desiredSalary: 6000000,
    location: '東京',
    availability: '即日',
    profileDescription: '建設現場での施工管理経験が10年あります。大規模プロジェクトの現場監督として多数の実績があります。',
    certifications: ['一級建築士', '施工管理技士'],
    languages: [
      { language: '日本語', level: 'ネイティブ' }
    ],
    status: 'active'
  },
  {
    name: '田中美咲',
    age: 30,
    gender: '女性',
    email: 'tanaka@example.com',
    phone: '080-3333-4444',
    skills: ['介護福祉', '看護補助', 'コミュニケーション', '記録作成'],
    experience: 8,
    education: '介護福祉士専門学校卒業',
    desiredPosition: '介護福祉士',
    industry: '介護',
    desiredSalary: 4500000,
    location: '東京',
    availability: '1ヶ月以内',
    profileDescription: '介護施設での実務経験が8年あります。高齢者の方々に寄り添った丁寧なケアを心がけています。',
    certifications: ['介護福祉士', 'ケアマネージャー'],
    languages: [
      { language: '日本語', level: 'ネイティブ' },
      { language: 'タガログ語', level: 'ネイティブ' }
    ],
    status: 'active'
  },
  {
    name: '高橋健太',
    age: 26,
    gender: '男性',
    email: 'takahashi@example.com',
    phone: '090-5555-6666',
    skills: ['接客', '調理', 'ホールサービス', '在庫管理'],
    experience: 4,
    education: '調理師専門学校卒業',
    desiredPosition: '飲食店スタッフ',
    industry: '外食・飲食',
    desiredSalary: 3500000,
    location: '大阪',
    availability: '即日',
    profileDescription: '飲食店での接客・調理経験が4年あります。笑顔でのおもてなしを大切にしています。',
    certifications: ['調理師免許', '食品衛生責任者'],
    languages: [
      { language: '日本語', level: 'ネイティブ' },
      { language: '英語', level: '初級' }
    ],
    status: 'active'
  },
  {
    name: '中村優子',
    age: 29,
    gender: '女性',
    email: 'nakamura@example.com',
    phone: '080-7777-8888',
    skills: ['溶接', '組立', '品質管理', 'フォークリフト'],
    experience: 6,
    education: '工業高校卒業',
    desiredPosition: '製造オペレーター',
    industry: '製造',
    desiredSalary: 4200000,
    location: '愛知',
    availability: '即日',
    profileDescription: '製造現場での組立・検査業務の経験が6年あります。正確な作業と品質管理を得意としています。',
    certifications: ['フォークリフト運転技能講習修了', 'QC検定3級'],
    languages: [
      { language: '日本語', level: 'ネイティブ' },
      { language: 'ベトナム語', level: 'ネイティブ' }
    ],
    status: 'active'
  },
  {
    name: '伊藤誠',
    age: 35,
    gender: '男性',
    email: 'ito@example.com',
    phone: '090-9999-0000',
    skills: ['重機操作', '土木作業', '測量', '安全管理'],
    experience: 12,
    education: '工業高校卒業',
    desiredPosition: '土木作業員',
    industry: '建設',
    desiredSalary: 5500000,
    location: '神奈川',
    availability: '1ヶ月以内',
    profileDescription: '土木工事現場での作業経験が12年あります。重機操作と安全管理に精通しています。',
    certifications: ['車両系建設機械運転技能講習修了', '玉掛け技能講習修了'],
    languages: [
      { language: '日本語', level: 'ネイティブ' }
    ],
    status: 'active'
  },
  {
    name: '渡辺麻衣',
    age: 27,
    gender: '女性',
    email: 'watanabe@example.com',
    phone: '080-1212-3434',
    skills: ['看護業務', '患者ケア', '医療記録', 'コミュニケーション'],
    experience: 5,
    education: '看護専門学校卒業',
    desiredPosition: '看護師',
    industry: '医療',
    desiredSalary: 5000000,
    location: '東京',
    availability: '2-3ヶ月',
    profileDescription: '総合病院での看護経験が5年あります。患者様とそのご家族に寄り添った看護を心がけています。',
    certifications: ['正看護師'],
    languages: [
      { language: '日本語', level: 'ネイティブ' },
      { language: '英語', level: '中級' }
    ],
    status: 'active'
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB接続成功');

    await Talent.deleteMany({});
    console.log('既存データを削除しました');

    await Talent.insertMany(sampleTalents);
    console.log(`${sampleTalents.length}件の人材データを登録しました`);

    process.exit(0);
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

seedDatabase();
