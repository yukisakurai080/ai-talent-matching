const Talent = require('../models/Talent');

async function searchTalents(requirements) {
  try {
    const query = { status: 'active' };

    // 【最重要】業務分野は必須マッチング - 一致しない場合は絶対に表示しない
    if (!requirements.industry) {
      // 業務分野が指定されていない場合は空の結果を返す
      return [];
    }

    query.industry = requirements.industry;

    // 以下は厳格なマッチング基準

    const talents = await Talent.find(query)
      .populate('partnerId')
      .sort({ updatedAt: -1 })
      .limit(50);

    // マッチングスコアを計算
    const talentsWithScore = talents.map(talent => {
      let score = 0;
      let hasRequiredMatch = false;

      // 【最重要】業務分野の完全一致（必須） - これがないと0点
      if (requirements.industry && talent.industry === requirements.industry) {
        score += 100; // 業務分野一致は最高点
        hasRequiredMatch = true;
      } else {
        // 業務分野が一致しない場合は即座に除外
        return null;
      }

      // スキルマッチ（厳格化：最低1つは一致必須）
      let hasSkillMatch = false;
      if (requirements.skills && requirements.skills.length > 0) {
        const matchedSkills = talent.skills.filter(skill =>
          requirements.skills.some(reqSkill => {
            const skillLower = skill.toLowerCase();
            const reqSkillLower = reqSkill.toLowerCase();
            // 部分一致も許容
            return skillLower.includes(reqSkillLower) || reqSkillLower.includes(skillLower);
          })
        );

        if (matchedSkills.length > 0) {
          hasSkillMatch = true;
          score += matchedSkills.length * 20; // スキルマッチの配点を上げる

          // 完全一致の場合はさらにボーナス
          const exactMatches = talent.skills.filter(skill =>
            requirements.skills.some(reqSkill =>
              skill.toLowerCase() === reqSkill.toLowerCase()
            )
          );
          score += exactMatches.length * 10;
        }
      } else {
        // スキル指定がない場合は全てマッチとみなす
        hasSkillMatch = true;
      }

      // 職種マッチ（重要度を上げる）
      let hasPositionMatch = false;
      if (requirements.desiredPosition && talent.desiredPosition) {
        const positionLower = talent.desiredPosition.toLowerCase();
        const reqPositionLower = requirements.desiredPosition.toLowerCase();

        if (positionLower.includes(reqPositionLower) || reqPositionLower.includes(positionLower)) {
          hasPositionMatch = true;
          score += 30; // 職種マッチの配点を大幅に上げる
        }
      } else {
        // 職種指定がない場合は全てマッチとみなす
        hasPositionMatch = true;
      }

      // スキルまたは職種のいずれかが一致していない場合は除外
      if (!hasSkillMatch && !hasPositionMatch) {
        return null;
      }

      // 経験年数マッチ（要求以上なら加点）
      if (requirements.experience !== undefined && requirements.experience !== null) {
        if (talent.experience >= requirements.experience) {
          score += 15;
          // 経験年数が要求より大幅に上回る場合は追加ボーナス
          const experienceDiff = talent.experience - requirements.experience;
          score += Math.min(experienceDiff * 2, 10);
        } else {
          // 経験年数が不足している場合は減点
          score -= 10;
        }
      }

      // 勤務地マッチ（部分一致OK）
      if (requirements.location && talent.location) {
        if (talent.location.includes(requirements.location)) {
          score += 15;
        } else if (requirements.location.includes(talent.location)) {
          score += 8;
        }
      }

      // 稼働開始時期マッチ
      if (requirements.availability && talent.availability) {
        // 「即日」「1ヶ月以内」などの柔軟なマッチング
        const availabilityMap = {
          '即日': 1,
          '1ヶ月以内': 2,
          '2-3ヶ月': 3,
          '応相談': 4
        };

        const reqLevel = availabilityMap[requirements.availability] || 4;
        const talentLevel = availabilityMap[talent.availability] || 4;

        if (talentLevel <= reqLevel) {
          score += 10;
        }
      }

      // 言語マッチ
      if (requirements.languages && talent.languages) {
        const matchedLangs = talent.languages.filter(lang =>
          requirements.languages.includes(lang.language)
        );
        score += matchedLangs.length * 8;
      }

      // 給与レンジマッチは参考程度に（減点なし）
      if (requirements.maxSalary && talent.desiredSalary) {
        if (talent.desiredSalary <= requirements.maxSalary) {
          score += 5;
        }
      }

      const talentObj = talent.toObject();
      // 個人情報を除外（企業向け）
      delete talentObj.email;
      delete talentObj.phone;

      // パートナー情報を追加
      if (talent.partnerId) {
        talentObj.partnerInfo = {
          organizationName: talent.partnerId.organizationName,
          placementFee: talent.partnerId.placementFee || 0,
          guaranteePeriods: talent.partnerId.guaranteePeriods || []
        };
      }

      return {
        ...talentObj,
        matchScore: score
      };
    }).filter(t => t !== null); // nullを除外

    // スコア順にソート（高い順）
    talentsWithScore.sort((a, b) => b.matchScore - a.matchScore);

    // 最低スコア基準を厳格化：業務分野一致(100点) + スキルor職種(最低20点) = 120点以上
    const minScore = 120;
    const filteredTalents = talentsWithScore.filter(t => t.matchScore >= minScore);

    return filteredTalents.slice(0, 20); // 上位20件まで
  } catch (error) {
    console.error('Talent search error:', error);
    throw error;
  }
}

module.exports = {
  searchTalents
};
