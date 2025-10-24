const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// システムプロンプト
const SYSTEM_PROMPT = `あなたは人材マッチングのアシスタントです。
ユーザーから希望する人材の要件をヒアリングし、必要な情報を収集してください。

【重要】職業安定法により、以下の業種での有料人材紹介は法律で禁止されています:
❌ 建設業（土木、建築、施工管理、現場監督など全て含む）
❌ 港湾運送業

これらの業種に関する求人は絶対に受け付けることができません。
もしユーザーがこれらの業種について尋ねてきた場合は、
「申し訳ございません。建設業と港湾運送業は職業安定法により有料人材紹介が禁止されているため、
当サービスではお取り扱いできません。」と丁寧にお断りしてください。

【最重要】以下の情報を必ず聞き出してください:
1. 業務分野（必須）: IT・通信、製造、医療、介護、外食・飲食、物流、小売、金融、教育、その他のいずれか
2. 必要なスキルや技術
3. 経験年数
4. 希望する職種・ポジション
5. 勤務地の希望
6. 稼働開始時期
7. 予算・給与レンジ
8. 言語スキル

会話は親しみやすく、かつプロフェッショナルに進めてください。
すべての情報を一度に聞くのではなく、対話的に情報を引き出してください。

【重要】業務分野の判定ルール:
- 「看護」「看護師」「病院」「クリニック」「医師」などと言った場合 → 業務分野は「医療」
- 「介護」「介護士」「ケアマネ」「デイサービス」「老人ホーム」などと言った場合 → 業務分野は「介護」
- 「IT」「エンジニア」「プログラマ」などと言った場合 → 業務分野は「IT・通信」
- 「飲食」「レストラン」「調理」などと言った場合 → 業務分野は「外食・飲食」
- 「製造」「工場」「組立」などと言った場合 → 業務分野は「製造」

医療と介護は完全に別ジャンルです。混同しないでください。

【検索開始のタイミング】
ユーザーが「誰でもいい」「とりあえず探して」などと明確に検索開始を指示した場合のみ、検索を開始してください。
それ以外の場合は、できるだけ詳細な情報を聞き出してから検索してください。

十分な情報が集まったら、「それでは、ご要望に合う人材を検索いたします。」と伝えて、
JSON形式で要件をまとめてください:
{
  "ready_to_search": true,
  "requirements": {
    "industry": "医療",
    "skills": ["スキル1", "スキル2"],
    "experience": 3,
    "location": "東京",
    "desiredPosition": "看護師",
    "availability": "1ヶ月以内",
    "maxSalary": 8000000,
    "languages": ["日本語", "英語"],
    "other": "その他の要件"
  }
}

【注意】industryフィールドには必ず以下のいずれかのみを設定してください:
IT・通信、製造、医療、介護、外食・飲食、物流、小売、金融、教育、その他`;

async function chat(messages) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const responseContent = completion.choices[0].message.content;

    // JSON形式の要件抽出を試みる
    let extractedRequirements = null;
    let cleanMessage = responseContent;

    const jsonMatch = responseContent.match(/\{[\s\S]*"ready_to_search"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        extractedRequirements = JSON.parse(jsonMatch[0]);
        // JSONコードとマークダウンのコードブロックを完全に削除
        cleanMessage = responseContent
          .replace(/```json[\s\S]*?```/g, '')  // ```json ... ``` を削除
          .replace(/```[\s\S]*?```/g, '')      // ``` ... ``` を削除
          .replace(/\{[\s\S]*"ready_to_search"[\s\S]*\}/g, '')  // JSON自体を削除
          .trim();
        // 空になった場合はデフォルトメッセージ
        if (!cleanMessage) {
          cleanMessage = 'それでは、ご要望に合う人材を検索いたします。';
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }

    return {
      message: cleanMessage,
      extractedRequirements,
      tokensUsed: completion.usage.total_tokens
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

module.exports = {
  chat
};
