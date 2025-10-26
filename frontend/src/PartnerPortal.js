import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PartnerPortal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function PartnerPortal({ isDemo = false }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(isDemo ? 'demo-token' : (localStorage.getItem('partnerToken') || ''));
  const [partner, setPartner] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // 成約料設定
  const [placementFee, setPlacementFee] = useState(0);
  const [guaranteePeriods, setGuaranteePeriods] = useState([
    { months: 1, refundRate: 100, description: '1ヶ月以内の退職は全額返金' },
    { months: 3, refundRate: 50, description: '3ヶ月以内の退職は50%返金' },
    { months: 6, refundRate: 0, description: '6ヶ月以降は返金なし' }
  ]);

  // ログイン/新規登録の切り替え
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // ログインフォーム
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // 新規登録フォーム
  const [registerForm, setRegisterForm] = useState({
    email: ''
  });
  const [registerMessage, setRegisterMessage] = useState('');

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

  // 個別成約料設定
  const [individualFees, setIndividualFees] = useState({});
  const [selectedTalentForFee, setSelectedTalentForFee] = useState('');

  // メッセージデータ
  const [messages, setMessages] = useState([]);

  // メッセージモーダル
  const [showCompanyListModal, setShowCompanyListModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedTalentId, setSelectedTalentId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [messageDetails, setMessageDetails] = useState({}); // 人材ID → 企業ID → メッセージ配列

  useEffect(() => {
    // デモモードの場合はダミーデータを設定
    if (isDemo) {
      setPartner({
        _id: 'demo-partner',
        name: 'デモ人材紹介会社',
        email: 'demo@partner.com',
        placementFee: 50000,
        organizationType: 'sending_organization',
        registeredTalentsCount: 2,
        guaranteePeriods: [
          { months: 1, refundRate: 100, description: '1ヶ月以内の退職は全額返金' },
          { months: 3, refundRate: 50, description: '3ヶ月以内の退職は50%返金' },
          { months: 6, refundRate: 0, description: '6ヶ月以降は返金なし' }
        ]
      });
      setPlacementFee(50000);
      setTalents([
        {
          _id: 'demo-talent-1',
          name: '田中 一郎',
          nationality: '日本',
          skills: ['React', 'Node.js'],
          experience: '3年',
          status: 'active',
          registeredAt: new Date().toISOString()
        },
        {
          _id: 'demo-talent-2',
          name: 'リー・ウェイ',
          nationality: '中国',
          skills: ['Python', 'Django'],
          experience: '5年',
          status: 'active',
          registeredAt: new Date().toISOString()
        }
      ]);
      setAnalytics({
        summary: {
          totalRecommendations: 128,
          talentsWithRecommendations: 35,
          totalTalents: 45,
          totalViews: 89,
          talentsWithViews: 28,
          totalMessages: 42,
          talentsWithMessages: 18,
          totalInterviews: 15,
          talentsWithInterviews: 12
        },
        conversionRates: {
          recommendationRate: 77.8,
          viewRate: 62.2,
          messageRate: 40.0,
          interviewRate: 26.7
        },
        funnelRates: {
          viewFromRecommendationRate: 80.0,
          messageFromViewRate: 64.3,
          interviewFromMessageRate: 66.7
        },
        talentDetails: [
          { id: '1', name: '田中 一郎', industry: 'IT', aiRecommendations: 8, profileViews: 5, messagesReceived: 3, interviewRequests: 2, engagementScore: 85 },
          { id: '2', name: 'リー・ウェイ', industry: 'IT', aiRecommendations: 6, profileViews: 4, messagesReceived: 2, interviewRequests: 1, engagementScore: 78 },
          { id: '3', name: '佐藤 花子', industry: '製造', aiRecommendations: 5, profileViews: 3, messagesReceived: 2, interviewRequests: 1, engagementScore: 72 },
          { id: '4', name: 'ジョン・スミス', industry: 'IT', aiRecommendations: 7, profileViews: 6, messagesReceived: 4, interviewRequests: 3, engagementScore: 92 },
          { id: '5', name: '鈴木 太郎', industry: '建設', aiRecommendations: 4, profileViews: 2, messagesReceived: 1, interviewRequests: 0, engagementScore: 65 }
        ]
      });

      // メッセージデモデータ
      setMessages([
        {
          _id: 'msg1',
          talentId: 'demo-talent-1',
          talentName: '田中 一郎',
          companyName: 'ABC株式会社',
          lastMessage: '面接日程についてご相談させていただけますでしょうか。',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          unread: true
        },
        {
          _id: 'msg2',
          talentId: 'demo-talent-2',
          talentName: 'リー・ウェイ',
          companyName: 'XYZ商事',
          lastMessage: 'ご紹介ありがとうございます。詳細を確認させていただきました。',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          unread: false
        }
      ]);

      // 詳細メッセージやり取りデモデータ（人材ID → 企業ID → メッセージ配列）
      setMessageDetails({
        'demo-talent-1': {
          'company-abc': {
            companyName: 'ABC株式会社',
            messages: [
              {
                _id: 'msg1-1',
                sender: 'ABC株式会社',
                senderType: 'company',
                message: '田中様のプロフィールを拝見しました。弊社の開発職にご興味はございますか？',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
              },
              {
                _id: 'msg1-2',
                sender: '田中 一郎',
                senderType: 'talent',
                message: 'はい、ぜひ詳細をお伺いしたいです。',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
              },
              {
                _id: 'msg1-3',
                sender: 'ABC株式会社',
                senderType: 'company',
                message: 'ありがとうございます。来週の火曜日14時から面接のお時間をいただけますでしょうか？',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
              },
              {
                _id: 'msg1-4',
                sender: '田中 一郎',
                senderType: 'talent',
                message: '面接日程についてご相談させていただけますでしょうか。',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              }
            ],
            lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            unreadCount: 1
          },
          'company-def': {
            companyName: 'DEF技研',
            messages: [
              {
                _id: 'msg1-5',
                sender: 'DEF技研',
                senderType: 'company',
                message: '田中様、当社のエンジニアポジションにご興味はありませんか？',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
              },
              {
                _id: 'msg1-6',
                sender: '田中 一郎',
                senderType: 'talent',
                message: '興味があります。詳細を教えていただけますか？',
                timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
              }
            ],
            lastMessageTime: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
            unreadCount: 0
          }
        },
        'demo-talent-2': {
          'company-xyz': {
            companyName: 'XYZ商事',
            messages: [
              {
                _id: 'msg2-1',
                sender: 'XYZ商事',
                senderType: 'company',
                message: 'リー様のご経歴を拝見しました。営業職のポジションをご紹介させていただきたいと思います。',
                timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
              },
              {
                _id: 'msg2-2',
                sender: 'リー・ウェイ',
                senderType: 'talent',
                message: 'ご紹介ありがとうございます。詳細を確認させていただきました。',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
              }
            ],
            lastMessageTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            unreadCount: 0
          }
        }
      });

      // 個別成約料デモデータ
      setIndividualFees({
        'demo-talent-1': 60000
      });

      setIsLoggedIn(true);
      return;
    }

    if (token) {
      fetchPartnerInfo();
      fetchTalents();
      fetchAnalytics();
      fetchMessages();
    }
  }, [token, isDemo]);

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
      if (response.data.individualFees) {
        setIndividualFees(response.data.individualFees);
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

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/partners/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Messages fetch error:', error);
    }
  };

  const fetchMessageDetails = async (talentId) => {
    try {
      const response = await axios.get(`${API_URL}/partners/messages/${talentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessageDetails(prev => ({
        ...prev,
        [talentId]: response.data.companies || {}
      }));
    } catch (error) {
      console.error('Message details fetch error:', error);
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

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/partners/register`, registerForm);
      setRegisterMessage('登録用のURLをメールアドレスに送信しました。メールをご確認ください。');
      setRegisterForm({ email: '' });
    } catch (error) {
      console.error('Register error:', error);
      setRegisterMessage(error.response?.data?.error || '登録に失敗しました');
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
      console.log('保存データ:', { placementFee, guaranteePeriods, individualFees });
      const response = await axios.put(`${API_URL}/partners/fee-settings`, {
        placementFee,
        guaranteePeriods,
        individualFees
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('保存レスポンス:', response.data);
      alert('成約料・保証規定を保存しました');
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

    // デモモードの場合はダミーQRコードを生成
    if (isDemo) {
      const demoQRCodes = [];
      const talentDemoUrl = 'https://office-tree.jp/ZinAI/talent/demo';
      for (let i = 0; i < qrForm.count; i++) {
        demoQRCodes.push({
          studentName: qrForm.studentName || `デモ学生 ${generatedQRCodes.length + i + 1}`,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(talentDemoUrl)}`,
          partnerCode: 'DEMO-QR-' + Math.random().toString(36).substring(7).toUpperCase(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      setGeneratedQRCodes([...generatedQRCodes, ...demoQRCodes]);
      alert(`QRコードを${demoQRCodes.length}個生成しました（デモモード）`);
      setQrForm({ studentName: '', count: 1 });
      return;
    }

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

          {/* タブ切り替え */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setRegisterMessage('');
              }}
            >
              ログイン
            </button>
            <button
              className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('register');
                setRegisterMessage('');
              }}
            >
              新規登録
            </button>
          </div>

          {/* ログインフォーム */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="partner-login-form">
              <div className="form-group">
                <label>メールアドレスまたはユーザーID</label>
                <input
                  type="text"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  placeholder="email@example.com または ユーザーID"
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
          )}

          {/* 新規登録フォーム */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="partner-login-form">
              <div className="form-group">
                <label>メールアドレス</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                  placeholder="example@company.com"
                />
              </div>

              <button type="submit" className="partner-login-button">
                登録用URLを送信
              </button>

              {registerMessage && (
                <div className={`register-message ${registerMessage.includes('送信しました') ? 'success' : 'error'}`}>
                  {registerMessage}
                </div>
              )}

              <p className="register-note">
                ご入力いただいたメールアドレスに、アカウント登録用のURLをお送りします。
              </p>
            </form>
          )}
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
          className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          メッセージチェック
          {messages.filter(m => m.unread).length > 0 && (
            <span className="tab-badge">{messages.filter(m => m.unread).length}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'fee-settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('fee-settings')}
        >
          成約料・保証規定
        </button>
      </div>

      <div className="partner-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
            <h2>統計情報</h2>
            <div className="stats-cards">
              <div className="stat-card" style={{ background: 'white' }}>
                <h3>機関種別</h3>
                <p className="stat-text">
                  {partner?.organizationType === 'language_school' && '日本語学校'}
                  {partner?.organizationType === 'training_center' && '研修センター'}
                  {partner?.organizationType === 'recruitment_agency' && '人材紹介会社'}
                  {partner?.organizationType === 'sending_organization' && '送り出し機関'}
                  {partner?.organizationType === 'other' && 'その他'}
                </p>
              </div>
              <div className="stat-card" style={{ background: 'white' }}>
                <h3>登録人材数</h3>
                <p className="stat-number" style={{ color: '#10b981' }}>{partner?.registeredTalentsCount || 0}</p>
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
                <label className="partner-form-label">学生名（任意）</label>
                <input
                  type="text"
                  value={qrForm.studentName}
                  onChange={(e) => setQrForm({ ...qrForm, studentName: e.target.value })}
                  placeholder="山田太郎"
                />
              </div>

              <div className="form-group">
                <label className="partner-form-label">生成数</label>
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
                  <div key={talent._id} className="partner-talent-card" onClick={() => setSelectedTalent(talent)}>
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

        {/* 成約料・保証規定タブ */}
        {activeTab === 'fee-settings' && (
          <div className="fee-settings-tab">
            <h2>成約料・保証規定</h2>

            {/* 一律成約料設定 */}
            <div className="fee-settings-section">
              <h3>一律成約料設定</h3>
              <div className="form-group">
                <label className="partner-form-label">成約料（円）</label>
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

            {/* 個別成約料設定 */}
            <div className="fee-settings-section">
              <h3>個別成約料設定</h3>
              <p className="section-description">
                特定の人材に対して個別の成約料を設定できます。個別設定は全体設定より優先して適用されます。
              </p>

              {/* 人材追加UI */}
              <div className="add-individual-fee">
                <select
                  value={selectedTalentForFee}
                  onChange={(e) => setSelectedTalentForFee(e.target.value)}
                  className="talent-select"
                >
                  <option value="">人材を選択...</option>
                  {talents
                    .filter(t => !individualFees[t._id])
                    .map((talent) => (
                      <option key={talent._id} value={talent._id}>
                        {talent.name}
                      </option>
                    ))}
                </select>
                <button
                  className="add-talent-btn"
                  disabled={!selectedTalentForFee}
                  onClick={() => {
                    if (selectedTalentForFee) {
                      setIndividualFees({
                        ...individualFees,
                        [selectedTalentForFee]: placementFee
                      });
                      setSelectedTalentForFee('');
                    }
                  }}
                >
                  + 追加
                </button>
              </div>

              {/* 設定済み個別成約料リスト */}
              {Object.keys(individualFees).length > 0 ? (
                <div className="individual-fee-list">
                  {Object.entries(individualFees).map(([talentId, fee]) => {
                    const talent = talents.find(t => t._id === talentId);
                    if (!talent) return null;

                    const appliedFee = fee || placementFee;
                    const partnerReceives = Math.floor(appliedFee * 0.85);

                    return (
                      <div key={talentId} className="individual-fee-item">
                        <div className="talent-info-brief">
                          <span className="talent-name">{talent.name}</span>
                        </div>
                        <div className="fee-input-group">
                          <input
                            type="number"
                            className="form-input small"
                            placeholder={`基本: ¥${placementFee.toLocaleString()}`}
                            value={fee || ''}
                            onChange={(e) => setIndividualFees({
                              ...individualFees,
                              [talentId]: e.target.value ? Number(e.target.value) : placementFee
                            })}
                          />
                        </div>
                        <div className="applied-fee-info">
                          <div className="fee-row">
                            <span className="fee-label">適用額:</span>
                            <span className="fee-value">¥{appliedFee.toLocaleString()}</span>
                          </div>
                          <div className="fee-row partner-receive">
                            <span className="fee-label">パートナー受取額:</span>
                            <span className="fee-value">¥{partnerReceives.toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          className="remove-individual-fee"
                          onClick={() => {
                            const newFees = { ...individualFees };
                            delete newFees[talentId];
                            setIndividualFees(newFees);
                          }}
                        >
                          削除
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-individual-fees">
                  <p>個別成約料が設定されている人材はありません</p>
                </div>
              )}
            </div>

            {/* 保証に関する規定 */}
            <div className="fee-settings-section">
              <h3>保証に関する規定</h3>
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
                      <label className="partner-form-label">期間（ヶ月）</label>
                      <input
                        type="number"
                        value={period.months}
                        onChange={(e) => updateGuaranteePeriod(index, 'months', Number(e.target.value))}
                        className="form-input small"
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label className="partner-form-label">返金率（%）</label>
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
                      <label className="partner-form-label">説明</label>
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

        {/* メッセージチェックタブ */}
        {activeTab === 'messages' && (
          <div className="partner-messages-tab">
            <div className="partner-messages-header">
              <h2>メッセージ</h2>
            </div>

            {messages.length === 0 ? (
              <div className="partner-no-messages">
                <p>メッセージはありません</p>
              </div>
            ) : (
              <div className="partner-messages-list">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`partner-message-item ${message.unread ? 'unread' : ''}`}
                    onClick={() => {
                      setSelectedTalentId(message.talentId);
                      if (!isDemo && !messageDetails[message.talentId]) {
                        fetchMessageDetails(message.talentId);
                      }
                      setShowCompanyListModal(true);
                    }}
                  >
                    <div className="partner-message-left">
                      <div className="partner-message-avatar">
                        {message.talentName.substring(0, 2)}
                      </div>
                    </div>
                    <div className="partner-message-body">
                      <div className="partner-message-top">
                        <div className="partner-message-info">
                          <span className="partner-message-talent-name">{message.talentName}</span>
                          <span className="partner-message-company-name">{message.companyName}</span>
                        </div>
                        <span className="partner-message-time">
                          {new Date(message.timestamp).toLocaleString('ja-JP', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="partner-message-text">{message.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 企業リストモーダル */}
      {showCompanyListModal && selectedTalentId && (
        <div className="partner-message-modal-overlay" onClick={() => setShowCompanyListModal(false)}>
          <div className="partner-message-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="partner-message-modal-header">
              <h3>
                {messages.find(m => m.talentId === selectedTalentId)?.talentName} - やり取りしている企業
              </h3>
              <button
                className="partner-message-modal-close"
                onClick={() => setShowCompanyListModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="partner-message-modal-body">
              {messageDetails[selectedTalentId] && Object.keys(messageDetails[selectedTalentId]).length > 0 ? (
                <div className="partner-company-list">
                  {Object.entries(messageDetails[selectedTalentId]).map(([companyId, companyData]) => (
                    <div
                      key={companyId}
                      className="partner-company-item"
                      onClick={() => {
                        setSelectedCompanyId(companyId);
                        setShowCompanyListModal(false);
                        setShowMessageModal(true);
                      }}
                    >
                      <div className="partner-company-info">
                        <div className="partner-company-name">{companyData.companyName}</div>
                        <div className="partner-company-meta">
                          <span className="partner-message-count-badge">
                            {companyData.messages.length}件のメッセージ
                          </span>
                          {companyData.unreadCount > 0 && (
                            <span className="partner-unread-badge">{companyData.unreadCount}件未読</span>
                          )}
                        </div>
                      </div>
                      <div className="partner-company-last-time">
                        {new Date(companyData.lastMessageTime).toLocaleString('ja-JP', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="partner-no-message-thread">
                  <p>企業とのやり取りがありません</p>
                </div>
              )}
            </div>

            <div className="partner-message-modal-footer">
              <button
                className="partner-message-modal-close-btn"
                onClick={() => setShowCompanyListModal(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メッセージ詳細モーダル */}
      {showMessageModal && selectedTalentId && selectedCompanyId && (
        <div className="partner-message-modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="partner-message-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="partner-message-modal-header">
              <div className="partner-message-header-left">
                <button
                  className="partner-message-back-btn"
                  onClick={() => {
                    setShowMessageModal(false);
                    setSelectedCompanyId(null);
                    setShowCompanyListModal(true);
                  }}
                >
                  ← 戻る
                </button>
                <h3>
                  {messages.find(m => m.talentId === selectedTalentId)?.talentName} × {messageDetails[selectedTalentId]?.[selectedCompanyId]?.companyName}
                </h3>
              </div>
              <button
                className="partner-message-modal-close"
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedCompanyId(null);
                  setSelectedTalentId(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="partner-message-modal-body">
              {messageDetails[selectedTalentId]?.[selectedCompanyId]?.messages &&
               messageDetails[selectedTalentId][selectedCompanyId].messages.length > 0 ? (
                <div className="partner-message-thread">
                  {messageDetails[selectedTalentId][selectedCompanyId].messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`partner-message-bubble ${msg.senderType === 'talent' ? 'talent' : 'company'}`}
                    >
                      <div className="partner-message-bubble-header">
                        <span className="partner-message-bubble-sender">{msg.sender}</span>
                        <span className="partner-message-bubble-time">
                          {new Date(msg.timestamp).toLocaleString('ja-JP', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="partner-message-bubble-text">
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="partner-no-message-thread">
                  <p>メッセージがありません</p>
                </div>
              )}
            </div>

            <div className="partner-message-modal-footer">
              <button
                className="partner-message-modal-close-btn"
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedCompanyId(null);
                  setSelectedTalentId(null);
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerPortal;
