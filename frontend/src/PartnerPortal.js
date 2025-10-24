import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PartnerPortal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function PartnerPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('partnerToken') || '');
  const [partner, setPartner] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // 成約料設定
  const [placementFee, setPlacementFee] = useState(0);
  const [guaranteePeriods, setGuaranteePeriods] = useState([
    { months: 1, refundRate: 100, description: '1ヶ月以内の退職は全額返金' },
    { months: 3, refundRate: 50, description: '3ヶ月以内の退職は50%返金' },
    { months: 6, refundRate: 0, description: '6ヶ月以降は返金なし' }
  ]);

  // ログインフォーム
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // 登録済み人材リスト
  const [talents, setTalents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTalent, setSelectedTalent] = useState(null);

  // CSV一括登録
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);

  // QRコード生成
  const [qrForm, setQrForm] = useState({
    studentName: '',
    count: 1
  });
  const [generatedQRCodes, setGeneratedQRCodes] = useState([]);

  // 分析データ
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (token) {
      fetchPartnerInfo();
      fetchTalents();
      fetchAnalytics();
    }
  }, [token]);

  const fetchPartnerInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/partners/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPartner(response.data);
      setPlacementFee(response.data.placementFee || 0);
      if (response.data.guaranteePeriods && response.data.guaranteePeriods.length > 0) {
        setGuaranteePeriods(response.data.guaranteePeriods);
      }
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Partner info fetch error:', error);
      handleLogout();
    }
  };

  const fetchTalents = async () => {
    try {
      const response = await axios.get(`${API_URL}/partners/talents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTalents(response.data.talents);
    } catch (error) {
      console.error('Talents fetch error:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/partners/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/partners/login`, loginForm);
      const newToken = response.data.token;
      setToken(newToken);
      localStorage.setItem('partnerToken', newToken);
      setPartner(response.data.partner);
      setIsLoggedIn(true);
      alert('ログインしました');
    } catch (error) {
      console.error('Login error:', error);
      alert(error.response?.data?.error || 'ログインに失敗しました');
    }
  };

  const handleLogout = () => {
    setToken('');
    setIsLoggedIn(false);
    setPartner(null);
    localStorage.removeItem('partnerToken');
  };

  const handleSaveFeeSettings = async () => {
    try {
      console.log('保存データ:', { placementFee, guaranteePeriods });
      const response = await axios.put(`${API_URL}/partners/fee-settings`, {
        placementFee,
        guaranteePeriods
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('保存レスポンス:', response.data);
      alert('成約料・保証期間設定を保存しました');
      await fetchPartnerInfo();
    } catch (error) {
      console.error('Save fee settings error:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.error || '保存に失敗しました');
    }
  };

  const addGuaranteePeriod = () => {
    setGuaranteePeriods([...guaranteePeriods, { months: 1, refundRate: 0, description: '' }]);
  };

  const removeGuaranteePeriod = (index) => {
    setGuaranteePeriods(guaranteePeriods.filter((_, i) => i !== index));
  };

  const updateGuaranteePeriod = (index, field, value) => {
    const updated = [...guaranteePeriods];
    updated[index][field] = value;
    setGuaranteePeriods(updated);
  };

  // CSVテンプレートダウンロード
  const downloadCSVTemplate = () => {
    const headers = [
      '名前',
      '年齢',
      '性別',
      'メール',
      '電話',
      '経験年数',
      '最終学歴',
      '業種',
      'スキル',
      '資格',
      '言語スキル',
      '希望職種',
      '希望する勤務地',
      '稼働可能時期',
      '希望年収',
      'JLPT',
      'CEFR',
      '特定技能試験',
      '自己PR'
    ];

    const sampleData = [
      [
        '山田太郎',
        '25',
        '男性',
        'yamada.taro.sample@example.com',
        '090-1234-5678',
        '3',
        '大学卒業',
        'IT',
        'JavaScript|React|Node.js|Python',
        '運転免許証|TOEIC800点|基本情報技術者',
        '日本語(ネイティブ)|英語(ビジネスレベル)',
        'Webエンジニア',
        '東京都',
        '即日',
        '5000000',
        'N1',
        'C1',
        '',
        'フルスタック開発の経験があります。チームでの開発が得意です。'
      ],
      [
        '鈴木花子',
        '28',
        '女性',
        'suzuki.hanako.sample@example.com',
        '090-9876-5432',
        '5',
        '専門学校卒業',
        '介護',
        '介護福祉|レクリエーション|緊急対応',
        '介護福祉士|普通自動車免許|介護職員初任者研修',
        '日本語(ネイティブ)',
        '介護士',
        '大阪府',
        '1ヶ月以内',
        '4000000',
        'N1',
        'C2',
        '介護技能評価試験',
        '高齢者との関わりが好きで、明るい性格です。'
      ],
      [
        'グエン・ティ・フォン',
        '23',
        '女性',
        'nguyen.phuong.sample@example.com',
        '080-1111-2222',
        '2',
        '短大卒業',
        '外食業',
        '調理|接客|ベトナム料理|衛生管理',
        '調理師免許|食品衛生責任者',
        'ベトナム語(ネイティブ)|日本語(日常会話)|英語(日常会話)',
        '調理スタッフ',
        '福岡県',
        '2-3ヶ月',
        '3500000',
        'N4',
        'A2',
        '外食業技能測定試験',
        'ベトナム料理と日本料理の経験があります。'
      ],
      [
        'キム・ミンジュン',
        '27',
        '男性',
        'kim.minjun.sample@example.com',
        '090-5555-6666',
        '4',
        '大学卒業',
        '営業(サービス業)',
        '営業|マーケティング|Excel|PowerPoint',
        'TOEIC900点|運転免許証|営業士2級',
        '韓国語(ネイティブ)|英語(ビジネスレベル)|日本語(ビジネスレベル)|フランス語(日常会話)',
        '営業企画',
        '東京都',
        '応相談',
        '4500000',
        'N2',
        'B2',
        '',
        '多言語対応の営業経験があり、国際的な環境で働くことが得意です。'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'talent_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSVファイル読み込み
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target.result;

      // UTF-8 BOMを除去
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }

      // CSVパーサー（ダブルクォート対応）
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            // ダブルクォートはスキップ（フィールドの区切りとして扱う）
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            // カンマで区切る（クォート外の場合のみ）
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      };

      const lines = text.split('\n').filter(line => line.trim());
      const headers = parseCSVLine(lines[0]).map(h => h.trim());

      const data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = parseCSVLine(line);
          const obj = {};

          headers.forEach((header, index) => {
            let value = (values[index] || '').trim();

            // フィールドマッピング
            if (header === '名前') obj.name = value;
            if (header === '年齢') obj.age = parseInt(value) || 0;
            if (header === '性別') obj.gender = value;
            if (header === 'メール') obj.email = value;
            if (header === '電話') obj.phone = value;
            if (header === '経験年数') obj.experience = parseInt(value) || 0;
            if (header === '最終学歴') obj.education = value;
            if (header === '業種') obj.industry = value;
            if (header === 'スキル') obj.skills = value ? value.split('|').filter(s => s.trim()) : [];
            if (header === '資格') obj.certifications = value ? value.split('|').filter(s => s.trim()) : [];
            if (header === '言語スキル') {
              if (value) {
                obj.languages = value.split('|').map(lang => {
                  const match = lang.match(/^(.+?)\((.+?)\)$/);
                  if (match) {
                    return { language: match[1].trim(), level: match[2].trim() };
                  }
                  return { language: lang.trim(), level: '' };
                });
              } else {
                obj.languages = [];
              }
            }
            if (header === '希望職種') obj.desiredPosition = value;
            if (header === '希望する勤務地') obj.location = value;
            if (header === '稼働可能時期') obj.availability = value;
            if (header === '希望年収') obj.desiredSalary = parseInt(value) || 0;
            if (header === 'JLPT') obj.jlpt = value;
            if (header === 'CEFR') obj.cefr = value;
            if (header === '特定技能試験') obj.skillTest = value;
            if (header === '自己PR') obj.profileDescription = value;
          });

          return obj;
        });

      console.log('パースされたCSVデータ:', data);
      console.log('最初のデータサンプル:', data[0]);
      if (data[0]) {
        console.log('industry値:', data[0].industry);
        console.log('industry文字コード:', data[0].industry ? Array.from(data[0].industry).map(c => c.charCodeAt(0)) : 'なし');
      }
      setCsvData(data);
    };

    reader.readAsText(file, 'UTF-8');
  };

  // 一括登録実行
  const handleBulkRegister = async () => {
    if (csvData.length === 0) {
      alert('CSVデータがありません');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/partners/bulk-register`,
        { talents: csvData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUploadResult(response.data);
      alert(`登録完了: 成功 ${response.data.successCount}件 / エラー ${response.data.errorCount}件`);
      fetchTalents();
      setCsvData([]);
      setCsvFile(null);
    } catch (error) {
      console.error('Bulk register error:', error);
      alert('一括登録に失敗しました');
    }
  };

  // QRコード生成
  const handleGenerateQR = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/partners/generate-qr`,
        qrForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 既存のQRコードに新規生成分を追加
      setGeneratedQRCodes([...generatedQRCodes, ...response.data.qrCodes]);
      alert(`QRコードを${response.data.qrCodes.length}個生成しました`);
    } catch (error) {
      console.error('QR generate error:', error);
      alert('QRコード生成に失敗しました');
    }
  };

  // QRコード削除
  const handleDeleteQR = (qrCodeToDelete) => {
    if (window.confirm('このQRコードを削除しますか？')) {
      setGeneratedQRCodes(generatedQRCodes.filter(qr => qr.qrCode !== qrCodeToDelete));
    }
  };

  // QRコード印刷
  const handlePrintQR = () => {
    window.print();
  };

  // 人材削除
  const handleDeleteTalent = async (talentId, talentName) => {
    if (!window.confirm(`${talentName}さんの情報を削除しますか？`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/talents/${talentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('人材情報を削除しました');
      setSelectedTalent(null);
      fetchTalents();
      fetchPartnerInfo();
    } catch (error) {
      console.error('Delete talent error:', error);
      alert('削除に失敗しました');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="partner-login-container">
        <div className="partner-login-box">
          <h1>パートナーポータル</h1>
          <p className="login-subtitle">日本語学校・送り出し機関専用</p>

          <form onSubmit={handleLogin} className="partner-login-form">
            <div className="form-group">
              <label>メールアドレス</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>パスワード</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="partner-login-button">
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="partner-portal">
      <div className="partner-header">
        <div className="partner-header-left">
          <h1>パートナーポータル</h1>
          <p className="partner-org-name">{partner?.organizationName}</p>
        </div>
        <button onClick={handleLogout} className="partner-logout-btn">
          ログアウト
        </button>
      </div>

      <div className="partner-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          ダッシュボード
        </button>
        <button
          className={`tab-button ${activeTab === 'csv' ? 'active' : ''}`}
          onClick={() => setActiveTab('csv')}
        >
          CSV一括登録
        </button>
        <button
          className={`tab-button ${activeTab === 'qr' ? 'active' : ''}`}
          onClick={() => setActiveTab('qr')}
        >
          QRコード生成
        </button>
        <button
          className={`tab-button ${activeTab === 'talents' ? 'active' : ''}`}
          onClick={() => setActiveTab('talents')}
        >
          登録済み人材
        </button>
        <button
          className={`tab-button ${activeTab === 'fee-settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('fee-settings')}
        >
          成約料・保証期間設定
        </button>
      </div>

      <div className="partner-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
            <h2>統計情報</h2>
            <div className="stats-cards">
              <div className="stat-card" style={{ background: 'white' }}>
                <h3>登録人材数</h3>
                <p className="stat-number" style={{ color: '#10b981' }}>{partner?.registeredTalentsCount || 0}</p>
              </div>
              <div className="stat-card" style={{ background: 'white' }}>
                <h3>パートナーコード</h3>
                <p className="stat-code">{partner?.partnerCode}</p>
              </div>
              <div className="stat-card" style={{ background: 'white' }}>
                <h3>機関種別</h3>
                <p className="stat-text">
                  {partner?.organizationType === 'language_school' && '日本語学校'}
                  {partner?.organizationType === 'training_center' && '研修センター'}
                  {partner?.organizationType === 'recruitment_agency' && '送り出し機関'}
                  {partner?.organizationType === 'other' && 'その他'}
                </p>
              </div>
              <div className="stat-card" style={{ background: 'white' }}>
                <h3>成約料</h3>
                <p className="stat-number" style={{ color: '#10b981' }}>¥{(partner?.placementFee || 0).toLocaleString()}</p>
              </div>
              <div className="stat-card" style={{ background: 'white' }}>
                <h3>パートナー受取額</h3>
                <p className="stat-number" style={{ color: '#10b981' }}>
                  ¥{Math.floor((partner?.placementFee || 0) * 0.85).toLocaleString()}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  (システム手数料15%控除後)
                </p>
              </div>
              <div className="stat-card" style={{ background: 'white' }}>
                <h3>保証期間設定</h3>
                <p className="stat-text" style={{ color: '#10b981' }}>
                  {partner?.guaranteePeriods?.length || 0}件
                </p>
              </div>
            </div>

            {/* エンゲージメント分析 */}
            {analytics && (
              <div className="analytics-section">
                <h2>エンゲージメント分析</h2>

                {/* 全体統計 */}
                <div className="analytics-overview">
                  <div className="analytics-card">
                    <h3>AI推薦数</h3>
                    <p className="analytics-number">{analytics.summary.totalRecommendations}</p>
                    <p className="analytics-description">
                      {analytics.summary.talentsWithRecommendations}人/{analytics.summary.totalTalents}人
                      ({analytics.conversionRates.recommendationRate}%)
                    </p>
                  </div>
                  <div className="analytics-card">
                    <h3>プロフィール閲覧数</h3>
                    <p className="analytics-number">{analytics.summary.totalViews}</p>
                    <p className="analytics-description">
                      {analytics.summary.talentsWithViews}人/{analytics.summary.totalTalents}人
                      ({analytics.conversionRates.viewRate}%)
                    </p>
                  </div>
                  <div className="analytics-card">
                    <h3>メッセージ受信数</h3>
                    <p className="analytics-number">{analytics.summary.totalMessages}</p>
                    <p className="analytics-description">
                      {analytics.summary.talentsWithMessages}人/{analytics.summary.totalTalents}人
                      ({analytics.conversionRates.messageRate}%)
                    </p>
                  </div>
                  <div className="analytics-card">
                    <h3>面接リクエスト数</h3>
                    <p className="analytics-number">{analytics.summary.totalInterviews}</p>
                    <p className="analytics-description">
                      {analytics.summary.talentsWithInterviews}人/{analytics.summary.totalTalents}人
                      ({analytics.conversionRates.interviewRate}%)
                    </p>
                  </div>
                </div>

                {/* ファネル分析 */}
                <div className="funnel-analysis">
                  <h3>コンバージョンファネル</h3>
                  <div className="funnel-chart">
                    <div className="funnel-stage">
                      <div className="funnel-bar" style={{ width: '100%', background: '#3b82f6' }}>
                        <span>AI推薦 ({analytics.summary.talentsWithRecommendations}人)</span>
                      </div>
                    </div>
                    <div className="funnel-arrow">↓ {analytics.funnelRates.viewFromRecommendationRate}%</div>
                    <div className="funnel-stage">
                      <div className="funnel-bar" style={{
                        width: `${analytics.summary.talentsWithRecommendations > 0 ? (analytics.summary.talentsWithViews / analytics.summary.talentsWithRecommendations * 100) : 0}%`,
                        background: '#10b981'
                      }}>
                        <span>閲覧 ({analytics.summary.talentsWithViews}人)</span>
                      </div>
                    </div>
                    <div className="funnel-arrow">↓ {analytics.funnelRates.messageFromViewRate}%</div>
                    <div className="funnel-stage">
                      <div className="funnel-bar" style={{
                        width: `${analytics.summary.talentsWithRecommendations > 0 ? (analytics.summary.talentsWithMessages / analytics.summary.talentsWithRecommendations * 100) : 0}%`,
                        background: '#f59e0b'
                      }}>
                        <span>メッセージ ({analytics.summary.talentsWithMessages}人)</span>
                      </div>
                    </div>
                    <div className="funnel-arrow">↓ {analytics.funnelRates.interviewFromMessageRate}%</div>
                    <div className="funnel-stage">
                      <div className="funnel-bar" style={{
                        width: `${analytics.summary.talentsWithRecommendations > 0 ? (analytics.summary.talentsWithInterviews / analytics.summary.talentsWithRecommendations * 100) : 0}%`,
                        background: '#ef4444'
                      }}>
                        <span>面接 ({analytics.summary.talentsWithInterviews}人)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 人材別エンゲージメント */}
                <div className="talent-engagement">
                  <h3>人材別エンゲージメント（上位10名）</h3>
                  <div className="engagement-table">
                    <table>
                      <thead>
                        <tr>
                          <th>名前</th>
                          <th>業種</th>
                          <th>AI推薦</th>
                          <th>閲覧</th>
                          <th>メッセージ</th>
                          <th>面接</th>
                          <th>スコア</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.talentDetails.slice(0, 10).map((talent, index) => (
                          <tr key={talent.id}>
                            <td>{talent.name}</td>
                            <td>{talent.industry}</td>
                            <td>{talent.aiRecommendations}</td>
                            <td>{talent.profileViews}</td>
                            <td>{talent.messagesReceived}</td>
                            <td>{talent.interviewRequests}</td>
                            <td><strong>{talent.engagementScore}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="quick-actions">
              <h3>クイックアクション</h3>
              <button onClick={() => setActiveTab('csv')} className="action-btn">
                CSV一括登録
              </button>
              <button onClick={() => setActiveTab('qr')} className="action-btn">
                QRコード生成
              </button>
            </div>
          </div>
        )}

        {activeTab === 'csv' && (
          <div className="csv-tab">
            <h2>CSV一括登録</h2>

            <div className="csv-template-section">
              <h3>CSVテンプレート</h3>
              <p>以下のサンプルデータ付きCSVテンプレートをダウンロードして、ご利用ください：</p>
              <button onClick={downloadCSVTemplate} className="download-template-btn">
                テンプレートをダウンロード
              </button>
              <div className="template-example">
                <code>
                  名前,年齢,性別,メール,電話,経験年数,最終学歴,業種,スキル,資格,言語スキル,希望職種,希望する勤務地,稼働可能時期,希望年収,JLPT,CEFR,特定技能試験,自己PR
                </code>
              </div>

              <div className="csv-instructions">
                <div className="csv-instruction-section">
                  <h4>複数項目の入力方法</h4>
                  <div className="csv-examples">
                    <div className="csv-example-item">
                      <span className="csv-example-label">スキル</span>
                      <span className="csv-example-value">JavaScript|React|Node.js|Python</span>
                    </div>
                    <div className="csv-example-item">
                      <span className="csv-example-label">資格</span>
                      <span className="csv-example-value">運転免許証|TOEIC800点|基本情報技術者</span>
                    </div>
                    <div className="csv-example-item">
                      <span className="csv-example-label">言語スキル</span>
                      <span className="csv-example-value">韓国語(ネイティブ)|英語(ビジネスレベル)|日本語(ビジネスレベル)</span>
                    </div>
                  </div>
                </div>

                <div className="csv-instruction-section">
                  <h4>選択肢</h4>
                  <div className="csv-options-grid">
                    <div className="csv-option-item">
                      <span className="csv-option-label">性別:</span>
                      <span className="csv-option-value">男性 / 女性 / その他</span>
                    </div>
                    <div className="csv-option-item">
                      <span className="csv-option-label">JLPT:</span>
                      <span className="csv-option-value">N1 / N2 / N3 / N4 / N5 / 未取得</span>
                    </div>
                    <div className="csv-option-item">
                      <span className="csv-option-label">CEFR:</span>
                      <span className="csv-option-value">C2 / C1 / B2 / B1 / A2 / A1 / 未取得</span>
                    </div>
                    <div className="csv-option-item">
                      <span className="csv-option-label">稼働可能時期:</span>
                      <span className="csv-option-value">即日 / 1ヶ月以内 / 2-3ヶ月 / 応相談</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="csv-upload-section">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="csv-upload-label">
                CSVファイルを選択
              </label>
              {csvFile && <p className="file-selected">選択: {csvFile.name}</p>}
            </div>

            {csvData.length > 0 && (
              <div className="csv-preview">
                <h3>プレビュー ({csvData.length}件)</h3>
                <div className="csv-table-container">
                  <table className="csv-table">
                    <thead>
                      <tr>
                        <th>名前</th>
                        <th>年齢</th>
                        <th>メール</th>
                        <th>業種</th>
                        <th>経験年数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.name}</td>
                          <td>{row.age}</td>
                          <td>{row.email}</td>
                          <td>{row.industry}</td>
                          <td>{row.experience}年</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 5 && (
                    <p className="more-rows">...他 {csvData.length - 5}件</p>
                  )}
                </div>

                <button onClick={handleBulkRegister} className="bulk-register-btn">
                  {csvData.length}件を一括登録
                </button>
              </div>
            )}

            {uploadResult && (
              <div className="upload-result">
                <h3>登録結果</h3>
                <p>成功: {uploadResult.successCount}件</p>
                <p>エラー: {uploadResult.errorCount}件</p>

                {uploadResult.results.errors.length > 0 && (
                  <div className="error-details">
                    <h4>エラー詳細</h4>
                    {uploadResult.results.errors.map((err, idx) => (
                      <p key={idx}>
                        {err.name}: {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="qr-tab">
            <h2>QRコード生成</h2>

            <form onSubmit={handleGenerateQR} className="qr-form">
              <div className="form-group">
                <label>学生名（任意）</label>
                <input
                  type="text"
                  value={qrForm.studentName}
                  onChange={(e) => setQrForm({ ...qrForm, studentName: e.target.value })}
                  placeholder="山田太郎"
                />
              </div>

              <div className="form-group">
                <label>生成数</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={qrForm.count}
                  onChange={(e) => setQrForm({ ...qrForm, count: parseInt(e.target.value) })}
                />
              </div>

              <button type="submit" className="generate-qr-btn">
                QRコード生成
              </button>
            </form>

            {generatedQRCodes.length > 0 && (
              <div className="qr-codes-section">
                <div className="qr-codes-header">
                  <h3>生成されたQRコード ({generatedQRCodes.length}個)</h3>
                  <button onClick={handlePrintQR} className="print-qr-btn">
                    印刷
                  </button>
                </div>

                <div className="qr-codes-grid">
                  {generatedQRCodes.map((qr, idx) => (
                    <div key={idx} className="qr-code-card">
                      <h4>{qr.studentName}</h4>
                      <img src={qr.qrCode} alt={`QR Code ${idx + 1}`} />
                      <p className="qr-expire">有効期限: {new Date(qr.expiresAt).toLocaleDateString('ja-JP')}</p>
                      <p className="qr-code-text">{qr.partnerCode}</p>
                      <button
                        onClick={() => handleDeleteQR(qr.qrCode)}
                        className="delete-qr-btn"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'talents' && (
          <div className="talents-tab">
            <h2>登録済み人材 ({talents.length}名)</h2>

            <div className="talents-search-section">
              <input
                type="text"
                placeholder="名前、業種、希望職種で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="talents-list">
              {talents
                .filter(talent => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    talent.name?.toLowerCase().includes(query) ||
                    talent.industry?.toLowerCase().includes(query) ||
                    talent.desiredPosition?.toLowerCase().includes(query)
                  );
                })
                .map((talent) => (
                  <div key={talent._id} className="talent-card" onClick={() => setSelectedTalent(talent)}>
                    <h3>{talent.name}</h3>
                    <div className="talent-info">
                      <p><strong>年齢:</strong> {talent.age}歳</p>
                      <p><strong>業種:</strong> {talent.industry}</p>
                      <p><strong>経験:</strong> {talent.experience}年</p>
                      <p><strong>希望職種:</strong> {talent.desiredPosition || '未設定'}</p>
                      <p><strong>登録日:</strong> {new Date(talent.createdAt).toLocaleDateString('ja-JP')}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {selectedTalent && (
          <div className="talent-detail-modal" onClick={() => setSelectedTalent(null)}>
            <div className="talent-detail-content" onClick={(e) => e.stopPropagation()}>
              <div className="talent-detail-header">
                <h2>{selectedTalent.name}</h2>
                <button className="talent-detail-close-btn" onClick={() => setSelectedTalent(null)}>
                  ×
                </button>
              </div>

              <div className="talent-detail-body">
                <div className="talent-detail-section">
                  <h3>基本情報</h3>
                  <div className="talent-detail-grid">
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">名前</span>
                      <span className="talent-detail-value">{selectedTalent.name}</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">年齢</span>
                      <span className="talent-detail-value">{selectedTalent.age}歳</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">性別</span>
                      <span className="talent-detail-value">{selectedTalent.gender || '未設定'}</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">メール</span>
                      <span className="talent-detail-value">{selectedTalent.email}</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">電話</span>
                      <span className="talent-detail-value">{selectedTalent.phone || '未設定'}</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">最終学歴</span>
                      <span className="talent-detail-value">{selectedTalent.education || '未設定'}</span>
                    </div>
                  </div>
                </div>

                <div className="talent-detail-section">
                  <h3>職務情報</h3>
                  <div className="talent-detail-grid">
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">業種</span>
                      <span className="talent-detail-value">{selectedTalent.industry}</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">経験年数</span>
                      <span className="talent-detail-value">{selectedTalent.experience}年</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">希望職種</span>
                      <span className="talent-detail-value">{selectedTalent.desiredPosition || '未設定'}</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">希望する勤務地</span>
                      <span className="talent-detail-value">{selectedTalent.location || '未設定'}</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">稼働可能時期</span>
                      <span className="talent-detail-value">{selectedTalent.availability || '未設定'}</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">希望年収</span>
                      <span className="talent-detail-value">{selectedTalent.desiredSalary ? `${selectedTalent.desiredSalary.toLocaleString()}円` : '未設定'}</span>
                    </div>
                  </div>
                </div>

                <div className="talent-detail-section">
                  <h3>スキル・資格</h3>
                  <div className="talent-detail-grid">
                    <div className="talent-detail-item talent-detail-full">
                      <span className="talent-detail-label">スキル</span>
                      <span className="talent-detail-value">
                        {selectedTalent.skills?.length > 0 ? selectedTalent.skills.join(', ') : '未設定'}
                      </span>
                    </div>
                    <div className="talent-detail-item talent-detail-full">
                      <span className="talent-detail-label">資格</span>
                      <span className="talent-detail-value">
                        {selectedTalent.certifications?.length > 0 ? selectedTalent.certifications.join(', ') : '未設定'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="talent-detail-section">
                  <h3>言語能力</h3>
                  <div className="talent-detail-grid">
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">JLPT</span>
                      <span className="talent-detail-value">{selectedTalent.jlpt || '未取得'}</span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">CEFR</span>
                      <span className="talent-detail-value">{selectedTalent.cefr || '未取得'}</span>
                    </div>
                    <div className="talent-detail-item talent-detail-full">
                      <span className="talent-detail-label">特定技能試験</span>
                      <span className="talent-detail-value">{selectedTalent.skillTest || '未取得'}</span>
                    </div>
                    <div className="talent-detail-item talent-detail-full">
                      <span className="talent-detail-label">言語スキル</span>
                      <span className="talent-detail-value">
                        {selectedTalent.languages?.length > 0
                          ? selectedTalent.languages.map(l => `${l.language} (${l.level})`).join(', ')
                          : '未設定'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTalent.profileDescription && (
                  <div className="talent-detail-section">
                    <h3>自己PR</h3>
                    <p className="talent-detail-value">{selectedTalent.profileDescription}</p>
                  </div>
                )}

                <div className="talent-detail-section">
                  <h3>登録情報</h3>
                  <div className="talent-detail-grid">
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">登録日</span>
                      <span className="talent-detail-value">
                        {new Date(selectedTalent.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <div className="talent-detail-item">
                      <span className="talent-detail-label">更新日</span>
                      <span className="talent-detail-value">
                        {new Date(selectedTalent.updatedAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="talent-detail-actions">
                  <button
                    onClick={() => handleDeleteTalent(selectedTalent._id, selectedTalent.name)}
                    className="delete-talent-btn"
                  >
                    この人材を削除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 成約料・保証期間設定タブ */}
        {activeTab === 'fee-settings' && (
          <div className="fee-settings-tab">
            <h2>成約料・保証期間設定</h2>

            {/* 成約料設定 */}
            <div className="fee-settings-section">
              <h3>成約料設定</h3>
              <div className="form-group">
                <label>成約料（円）</label>
                <input
                  type="number"
                  value={placementFee}
                  onChange={(e) => setPlacementFee(Number(e.target.value))}
                  className="form-input"
                  placeholder="例: 300000"
                />
              </div>

              {/* 料金計算表示 */}
              <div className="fee-calculation">
                <div className="calculation-row">
                  <span>成約料:</span>
                  <span className="amount">¥{placementFee.toLocaleString()}</span>
                </div>
                <div className="calculation-row">
                  <span>システム手数料 (15%):</span>
                  <span className="amount negative">-¥{Math.floor(placementFee * 0.15).toLocaleString()}</span>
                </div>
                <div className="calculation-row total">
                  <span>パートナー受取額:</span>
                  <span className="amount">¥{Math.floor(placementFee * 0.85).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 保証期間設定 */}
            <div className="fee-settings-section">
              <h3>保証期間設定</h3>
              <p className="section-description">
                退職時の返金ルールを設定します。採用後の早期退職に対する返金率を定義できます。
              </p>

              {guaranteePeriods.map((period, index) => (
                <div key={index} className="guarantee-period-item">
                  <div className="guarantee-period-header">
                    <h4>保証期間 {index + 1}</h4>
                    <button
                      onClick={() => removeGuaranteePeriod(index)}
                      className="remove-button"
                      disabled={guaranteePeriods.length === 1}
                    >
                      削除
                    </button>
                  </div>

                  <div className="guarantee-period-inputs">
                    <div className="form-group">
                      <label>期間（ヶ月）</label>
                      <input
                        type="number"
                        value={period.months}
                        onChange={(e) => updateGuaranteePeriod(index, 'months', Number(e.target.value))}
                        className="form-input small"
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>返金率（%）</label>
                      <input
                        type="number"
                        value={period.refundRate}
                        onChange={(e) => updateGuaranteePeriod(index, 'refundRate', Number(e.target.value))}
                        className="form-input small"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className="form-group" style={{ flex: 2 }}>
                      <label>説明</label>
                      <input
                        type="text"
                        value={period.description}
                        onChange={(e) => updateGuaranteePeriod(index, 'description', e.target.value)}
                        className="form-input"
                        placeholder="例: 1ヶ月以内の退職は全額返金"
                      />
                    </div>
                  </div>

                  <div className="guarantee-preview">
                    {period.months}ヶ月以内に退職:
                    <span className="refund-amount"> ¥{Math.floor(placementFee * period.refundRate / 100).toLocaleString()} ({period.refundRate}%) 返金</span>
                  </div>
                </div>
              ))}

              <button onClick={addGuaranteePeriod} className="add-button">
                + 保証期間を追加
              </button>
            </div>

            {/* 保存ボタン */}
            <div className="fee-settings-actions">
              <button onClick={handleSaveFeeSettings} className="save-button">
                設定を保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PartnerPortal;
