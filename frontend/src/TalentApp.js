import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import './TalentApp.css';
import translations from './translations';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function TalentApp() {
  const [searchParams] = useSearchParams();
  const [language, setLanguage] = useState('ja');
  const t = translations[language];

  // QRコードトークン
  const [registrationToken, setRegistrationToken] = useState(null);
  const [partnerInfo, setPartnerInfo] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    email: '',
    phone: '',
    skills: '',
    experience: '',
    education: '',
    desiredPosition: '',
    industry: '',
    desiredSalary: '',
    location: '',
    availability: '',
    profileDescription: '',
    certifications: '',
    languages: [{ language: '', level: '' }],
    jlpt: '',
    cefr: '',
    skillTest: ''
  });

  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLanguageChange = (index, field, value) => {
    const updatedLanguages = [...formData.languages];
    updatedLanguages[index][field] = value;
    setFormData(prev => ({
      ...prev,
      languages: updatedLanguages
    }));
  };

  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { language: '', level: '' }]
    }));
  };

  const removeLanguage = (index) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  // QRコードトークン検証
  useEffect(() => {
    const token = searchParams.get('token');
    const partner = searchParams.get('partner');

    if (token && partner) {
      axios.get(`${API_URL}/partners/verify-token/${token}?partner=${partner}`)
        .then(response => {
          setRegistrationToken(token);
          setPartnerInfo(response.data.partner);
        })
        .catch(error => {
          console.error('Token verification error:', error);
          alert('無効な登録リンクです');
        });
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: 'loading', message: t.submitting });

    try {
      const talentData = {
        ...formData,
        age: parseInt(formData.age),
        experience: parseInt(formData.experience),
        desiredSalary: parseInt(formData.desiredSalary),
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        certifications: formData.certifications.split(',').map(s => s.trim()).filter(s => s),
        languages: formData.languages.filter(l => l.language && l.level),
        status: 'active',
        // パートナー情報を追加
        ...(partnerInfo && {
          partnerCode: partnerInfo.partnerCode,
          registrationToken
        })
      };

      await axios.post(`${API_URL}/talents/register`, talentData);

      setSubmitStatus({ type: 'success', message: t.success });

      setTimeout(() => {
        setFormData({
          name: '',
          age: '',
          gender: '',
          email: '',
          phone: '',
          skills: '',
          experience: '',
          education: '',
          desiredPosition: '',
          industry: '',
          desiredSalary: '',
          location: '',
          availability: '',
          profileDescription: '',
          certifications: '',
          languages: [{ language: '', level: '' }],
          jlpt: '',
          cefr: '',
          skillTest: ''
        });
        setSubmitStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitStatus({ type: 'error', message: t.error });
    }
  };

  return (
    <div className="talent-registration-page">
      <div className="talent-registration-container">
        <div className="language-selector">
          <button onClick={() => setLanguage('ja')} className={language === 'ja' ? 'active' : ''}>日本語</button>
          <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>English</button>
          <button onClick={() => setLanguage('zh')} className={language === 'zh' ? 'active' : ''}>中文</button>
          <button onClick={() => setLanguage('vi')} className={language === 'vi' ? 'active' : ''}>Tiếng Việt</button>
          <button onClick={() => setLanguage('id')} className={language === 'id' ? 'active' : ''}>Indonesia</button>
          <button onClick={() => setLanguage('ko')} className={language === 'ko' ? 'active' : ''}>한국어</button>
          <button onClick={() => setLanguage('th')} className={language === 'th' ? 'active' : ''}>ไทย</button>
        </div>

        <div className="talent-registration-header">
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
          {partnerInfo && (
            <div className="partner-info-banner">
              <p>📋 {partnerInfo.organizationName} 経由の登録</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="talent-registration-form">
          {/* 基本情報 */}
          <div className="form-section">
            <h2 className="form-section-title">{t.basicInfo}</h2>

            <div className="form-row">
              <div className="form-group">
                <label>{t.name} {t.required}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder={t.namePlaceholder}
                />
              </div>
              <div className="form-group">
                <label>{t.age} {t.required}</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  placeholder={t.agePlaceholder}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.gender} {t.required}</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t.selectGender}</option>
                  <option value="男性">{t.male}</option>
                  <option value="女性">{t.female}</option>
                  <option value="その他">{t.other}</option>
                </select>
              </div>
              <div className="form-group">
                <label>希望する勤務地 {t.required}</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="東京都、大阪府など"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.email} {t.required}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder={t.emailPlaceholder}
                />
              </div>
              <div className="form-group">
                <label>{t.phone} {t.required}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder={t.phonePlaceholder}
                />
              </div>
            </div>
          </div>

          {/* 職務情報 */}
          <div className="form-section">
            <h2 className="form-section-title">{t.jobInfo}</h2>

            <div className="form-row">
              <div className="form-group">
                <label>{t.industry} {t.required}</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                >
                  <option value="">選択してください</option>
                  <optgroup label="特定技能分野">
                    <option value="介護">介護</option>
                    <option value="ビルクリーニング">ビルクリーニング</option>
                    <option value="工業製品製造業">工業製品製造業</option>
                    <option value="造船・舶用工業">造船・舶用工業</option>
                    <option value="自動車整備">自動車整備</option>
                    <option value="自動車運送業">自動車運送業</option>
                    <option value="鉄道">鉄道</option>
                    <option value="航空">航空</option>
                    <option value="宿泊">宿泊</option>
                    <option value="農業">農業</option>
                    <option value="林業">林業</option>
                    <option value="木材産業">木材産業</option>
                    <option value="漁業">漁業</option>
                    <option value="飲食料品製造業">飲食料品製造業</option>
                    <option value="外食業">外食業</option>
                  </optgroup>
                  <optgroup label="一般業種">
                    <option value="IT">IT</option>
                    <option value="営業(サービス業)">営業(サービス業)</option>
                    <option value="医療">医療</option>
                    <option value="看護">看護</option>
                    <option value="福祉">福祉</option>
                    <option value="教育">教育</option>
                    <option value="保育">保育</option>
                    <option value="金融">金融</option>
                    <option value="保険">保険</option>
                    <option value="不動産">不動産</option>
                    <option value="物流">物流</option>
                    <option value="倉庫">倉庫</option>
                    <option value="小売">小売</option>
                    <option value="卸売">卸売</option>
                    <option value="広告・マーケティング">広告・マーケティング</option>
                    <option value="コンサルティング">コンサルティング</option>
                    <option value="人材サービス">人材サービス</option>
                    <option value="警備">警備</option>
                    <option value="清掃">清掃</option>
                    <option value="エンターテイメント">エンターテイメント</option>
                    <option value="美容・理容">美容・理容</option>
                    <option value="その他">その他</option>
                  </optgroup>
                </select>
              </div>
              <div className="form-group">
                <label>希望職種</label>
                <input
                  type="text"
                  name="desiredPosition"
                  value={formData.desiredPosition}
                  onChange={handleChange}
                  placeholder="エンジニア、営業、介護士など"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.experience} {t.required}</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  placeholder={t.experiencePlaceholder}
                />
              </div>
              <div className="form-group">
                <label>{t.desiredSalary} {t.required}</label>
                <input
                  type="number"
                  name="desiredSalary"
                  value={formData.desiredSalary}
                  onChange={handleChange}
                  required
                  placeholder={t.salaryPlaceholder}
                />
              </div>
            </div>

            <div className="form-group">
              <label>最終学歴 {t.required}</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                required
                placeholder="大学卒業、専門学校卒業など"
              />
            </div>

            <div className="form-group">
              <label>スキル（カンマ区切り）</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="JavaScript, Python, Excelなど"
              />
            </div>

            <div className="form-group">
              <label>資格（カンマ区切り）</label>
              <input
                type="text"
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                placeholder="運転免許証、TOEIC800点、簿記2級など"
              />
            </div>

            <div className="form-group">
              <label>{t.availability} {t.required}</label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                required
              >
                <option value="">{t.selectAvailability}</option>
                <option value="即日">{t.immediate}</option>
                <option value="1ヶ月以内">{t.withinMonth}</option>
                <option value="2-3ヶ月">{t.twoToThreeMonths}</option>
                <option value="応相談">{t.negotiable}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.profileDescription} {t.required}</label>
              <textarea
                name="profileDescription"
                value={formData.profileDescription}
                onChange={handleChange}
                required
                rows="5"
                placeholder={t.profilePlaceholder}
              />
            </div>
          </div>

          {/* 言語スキル */}
          <div className="form-section">
            <h2 className="form-section-title">{t.languageSkills}</h2>

            {formData.languages.map((lang, index) => (
              <div key={index} className="language-input-group">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t.language}</label>
                    <input
                      type="text"
                      value={lang.language}
                      onChange={(e) => handleLanguageChange(index, 'language', e.target.value)}
                      placeholder={t.languagePlaceholder}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.level}</label>
                    <select
                      value={lang.level}
                      onChange={(e) => handleLanguageChange(index, 'level', e.target.value)}
                    >
                      <option value="">{t.selectLevel}</option>
                      <option value="ネイティブ">{t.native}</option>
                      <option value="ビジネスレベル">{t.business}</option>
                      <option value="日常会話レベル">{t.daily}</option>
                      <option value="初級">{t.beginner}</option>
                    </select>
                  </div>
                  {formData.languages.length > 1 && (
                    <button
                      type="button"
                      className="remove-language-btn"
                      onClick={() => removeLanguage(index)}
                    >
                      {t.remove}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="button" className="add-language-btn" onClick={addLanguage}>
              {t.addLanguage}
            </button>
          </div>

          {/* 日本語能力・資格 */}
          <div className="form-section">
            <h2 className="form-section-title">日本語能力・技能資格</h2>

            <div className="form-row">
              <div className="form-group">
                <label>日本語能力試験 (JLPT)</label>
                <select
                  name="jlpt"
                  value={formData.jlpt}
                  onChange={handleChange}
                >
                  <option value="">選択してください</option>
                  <option value="N1">N1</option>
                  <option value="N2">N2</option>
                  <option value="N3">N3</option>
                  <option value="N4">N4</option>
                  <option value="N5">N5</option>
                  <option value="未取得">未取得</option>
                </select>
              </div>

              <div className="form-group">
                <label>CEFR レベル</label>
                <select
                  name="cefr"
                  value={formData.cefr}
                  onChange={handleChange}
                >
                  <option value="">選択してください</option>
                  <option value="C2">C2 (熟達)</option>
                  <option value="C1">C1 (上級)</option>
                  <option value="B2">B2 (中上級)</option>
                  <option value="B1">B1 (中級)</option>
                  <option value="A2">A2 (初中級)</option>
                  <option value="A1">A1 (初級)</option>
                  <option value="未取得">未取得</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>特定技能試験</label>
              <select
                name="skillTest"
                value={formData.skillTest}
                onChange={handleChange}
              >
                <option value="">選択してください</option>
                <option value="介護技能評価試験">介護技能評価試験</option>
                <option value="ビルクリーニング技能測定試験">ビルクリーニング技能測定試験</option>
                <option value="工業製品製造業技能測定試験">工業製品製造業技能測定試験</option>
                <option value="造船・舶用工業分野特定技能評価試験">造船・舶用工業分野特定技能評価試験</option>
                <option value="自動車整備分野特定技能評価試験">自動車整備分野特定技能評価試験</option>
                <option value="自動車運送業技能測定試験">自動車運送業技能測定試験</option>
                <option value="鉄道分野特定技能評価試験">鉄道分野特定技能評価試験</option>
                <option value="航空分野特定技能評価試験">航空分野特定技能評価試験</option>
                <option value="宿泊業技能測定試験">宿泊業技能測定試験</option>
                <option value="農業技能測定試験">農業技能測定試験</option>
                <option value="林業技能測定試験">林業技能測定試験</option>
                <option value="木材産業技能測定試験">木材産業技能測定試験</option>
                <option value="漁業技能測定試験">漁業技能測定試験</option>
                <option value="飲食料品製造業技能測定試験">飲食料品製造業技能測定試験</option>
                <option value="外食業技能測定試験">外食業技能測定試験</option>
                <option value="未取得">未取得</option>
              </select>
            </div>
          </div>

          {/* 送信ボタン */}
          {submitStatus && (
            <div className={`submit-status ${submitStatus.type}`}>
              {submitStatus.message}
            </div>
          )}

          <button type="submit" className="talent-submit-btn" disabled={submitStatus?.type === 'loading'}>
            {submitStatus?.type === 'loading' ? t.submitting : t.submit}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TalentApp;
