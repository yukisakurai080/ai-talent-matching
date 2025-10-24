import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import './CompanyApp.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function CompanyApp({ isDemo = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [talents, setTalents] = useState([]);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [usageWarning, setUsageWarning] = useState(null); // 使用量警告
  const [messageForm, setMessageForm] = useState({
    senderName: '',
    senderEmail: '',
    subject: '',
    content: ''
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(3); // 未読メッセージ数
  const [showMessageBox, setShowMessageBox] = useState(false); // メッセージボックス表示
  const [selectedMessage, setSelectedMessage] = useState(null); // 選択されたメッセージ
  const [showTalentProfile, setShowTalentProfile] = useState(false); // プロフィール表示
  const [showCompanyForm, setShowCompanyForm] = useState(false); // 企業情報登録モーダル
  const [showInterviewModal, setShowInterviewModal] = useState(false); // 面接設定モーダル
  const [interviewType, setInterviewType] = useState(''); // online or in-person
  const [interviewData, setInterviewData] = useState({
    onlinePlatform: '',
    meetingUrl: '',
    location: '',
    accessInfo: '',
    dateCandidates: ['', '', '']
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false); // 利用規約同意
  const [interviewTrackings, setInterviewTrackings] = useState([]); // 面接トラッキング
  const [showHiringReportModal, setShowHiringReportModal] = useState(false); // 採用報告モーダル
  const [selectedTracking, setSelectedTracking] = useState(null); // 選択されたトラッキング
  const [hiringReportForm, setHiringReportForm] = useState({
    startDate: '',
    salary: '',
    notes: ''
  });
  const [chatHistory, setChatHistory] = useState([]); // チャット履歴
  const [currentChatId, setCurrentChatId] = useState(null); // 現在のチャットID
  const [chatToDelete, setChatToDelete] = useState(null); // 削除確認用
  const [showVisaSupportModal, setShowVisaSupportModal] = useState(false); // 在留資格サポートモーダル
  const [selectedApplicant, setSelectedApplicant] = useState(null); // 選択された応募者
  const [visaSupportOption, setVisaSupportOption] = useState(''); // full-support or self
  const [showPaymentModal, setShowPaymentModal] = useState(false); // 決済モーダル
  const [paymentData, setPaymentData] = useState({
    placementFee: 0,
    visaSupportFee: 0,
    registeredSupportOrgFee: 0,
    totalAmount: 0
  });
  const [registeredSupportOption, setRegisteredSupportOption] = useState(''); // delegate or self
  const [showSelfSupportWarning, setShowSelfSupportWarning] = useState(false); // 自社支援警告モーダル
  const [showSelfSupportRequirements, setShowSelfSupportRequirements] = useState(false); // 自社支援要件確認モーダル
  const [selfSupportRequirements, setSelfSupportRequirements] = useState({
    companyRequirements: Array(6).fill(false),
    supervisorRequirements: Array(4).fill(false),
    staffRequirements: Array(3).fill(false),
    supportActivities: Array(11).fill(false)
  });
  const [loading, setLoading] = useState(false); // 決済処理中のローディング状態
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    established: '',
    capital: '',
    representativeName: '',
    headquarters: '',
    businessDescription: '',
    website: '',
    email: '',
    phone: '',
    positionTitle: '',
    jobDescription: '',
    requiredSkills: '',
    preferredSkills: '',
    employmentType: '',
    salaryMin: '',
    salaryMax: '',
    workLocation: '',
    workHours: '',
    holidays: '',
    benefits: '',
    selectionProcess: ''
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 認証チェック
  useEffect(() => {
    // デモモードの場合は認証をスキップ
    if (isDemo) {
      setUser({
        _id: 'demo-user',
        email: 'demo@company.com',
        name: 'デモ企業',
        userType: 'company',
        isDemo: true
      });
      setAuthLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          withCredentials: true
        });

        if (response.data.user && response.data.user.userType === 'company') {
          setUser(response.data.user);
          setAuthLoading(false);
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate, isDemo]);

  useEffect(() => {
    if (!user) return;

    // 初回ロード時にウェルカムメッセージを設定し、新しいチャットを作成
    const initialMessages = [{
      role: 'assistant',
      content: 'AI人材マッチングへようこそ\n\nどのような人材をお探しですか？',
      isWelcome: true
    }];
    setMessages(initialMessages);

    // 新しいチャットを作成
    const newChatId = Date.now();
    setCurrentChatId(newChatId);
    setChatHistory([{
      id: newChatId,
      title: '新しいチャット',
      timestamp: new Date(),
      messages: initialMessages
    }]);
  }, [user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat/message`, {
        sessionId,
        message: inputMessage
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      setSessionId(response.data.sessionId);

      // チャット履歴を更新
      updateChatHistory(finalMessages);

      if (response.data.extractedRequirements && response.data.extractedRequirements.ready_to_search) {
        await searchTalents(response.data.extractedRequirements.requirements);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      let errorContent = '申し訳ございません。エラーが発生しました。もう一度お試しください。';

      // レート制限エラー
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        if (errorData.usage) {
          errorContent = `使用量の上限に達しました。\n使用量: ${errorData.usage.used.toLocaleString()} / ${errorData.usage.limit.toLocaleString()}\n\n${errorData.error}`;
          setUsageWarning(errorData.error);
        } else {
          errorContent = errorData.error || 'リクエストが多すぎます。しばらくしてから再度お試しください。';
          setUsageWarning(errorContent);
        }
      }

      const errorMessage = {
        role: 'assistant',
        content: errorContent
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChatHistory = (currentMessages) => {
    setChatHistory(prev => {
      const updated = prev.map(chat => {
        if (chat.id === currentChatId) {
          // タイトルを最初のユーザーメッセージから生成
          const firstUserMessage = currentMessages.find(msg => msg.role === 'user');
          const title = firstUserMessage
            ? firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '')
            : '新しいチャット';

          return {
            ...chat,
            title,
            messages: currentMessages,
            timestamp: new Date()
          };
        }
        return chat;
      });
      return updated;
    });
  };

  const handleNewChat = () => {
    const initialMessages = [{
      role: 'assistant',
      content: 'AI人材マッチングへようこそ\n\nどのような人材をお探しですか？',
      isWelcome: true
    }];

    const newChatId = Date.now();
    setCurrentChatId(newChatId);
    setMessages(initialMessages);
    setSessionId(null);
    setTalents([]);

    setChatHistory(prev => [{
      id: newChatId,
      title: '新しいチャット',
      timestamp: new Date(),
      messages: initialMessages
    }, ...prev]);
  };

  const handleSelectChat = (chat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setTalents([]);
  };

  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation(); // 親要素のクリックイベントを防ぐ
    setChatToDelete(chatId); // 削除確認ダイアログを表示
  };

  const confirmDeleteChat = () => {
    if (!chatToDelete) return;

    setChatHistory(prev => {
      const filtered = prev.filter(chat => chat.id !== chatToDelete);

      // 削除したチャットが現在のチャットだった場合
      if (chatToDelete === currentChatId) {
        if (filtered.length > 0) {
          // 最新のチャットに切り替え
          setCurrentChatId(filtered[0].id);
          setMessages(filtered[0].messages);
          setTalents([]);
        } else {
          // チャットが全て削除された場合は新しいチャットを作成
          handleNewChat();
        }
      }

      return filtered;
    });

    setChatToDelete(null); // ダイアログを閉じる
  };

  const cancelDeleteChat = () => {
    setChatToDelete(null); // ダイアログを閉じる
  };

  const searchTalents = async (requirements) => {
    try {
      const response = await axios.post(`${API_URL}/talents/search`, {
        requirements
      });

      console.log('Search response:', response.data);
      if (response.data.talents.length > 0) {
        console.log('First talent:', response.data.talents[0]);
        console.log('Partner info:', response.data.talents[0]?.partnerInfo);
      }

      setTalents(response.data.talents);

      if (response.data.talents.length > 0) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `${response.data.talents.length}名の候補者が見つかりました。右側に表示していますのでご確認ください。`
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '申し訳ございません。条件に合う人材が見つかりませんでした。条件を変更してもう一度お試しください。'
        }]);
      }
    } catch (error) {
      console.error('Error searching talents:', error);
    }
  };

  const handleTalentClick = (talent) => {
    console.log('Selected talent:', talent);
    console.log('Partner info:', talent.partnerInfo);
    setSelectedTalent(talent);
    setMessageForm({
      senderName: '',
      senderEmail: '',
      subject: `${talent.name}様へのお問い合わせ`,
      content: ''
    });
    setSubmitStatus(null);
  };

  const handleMessageFormChange = (e) => {
    const { name, value } = e.target;
    setMessageForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendMessageToTalent = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/messages`, {
        talentId: selectedTalent._id,
        ...messageForm
      });

      setSubmitStatus({ type: 'success', message: 'メッセージを送信しました!' });
      setMessageForm({
        senderName: '',
        senderEmail: '',
        subject: '',
        content: ''
      });

      setTimeout(() => {
        setSelectedTalent(null);
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error sending message to talent:', error);
      setSubmitStatus({ type: 'error', message: 'メッセージの送信に失敗しました。' });
    }
  };

  const handleSendInterviewSchedule = async () => {
    if (!agreeToTerms) {
      alert('利用規約に同意してください');
      return;
    }

    try {
      // 面接案内メッセージを作成
      let interviewMessage = '';

      if (interviewType === 'online') {
        interviewMessage = `【面接のご案内】\n\n面接方法: オンライン面接\nプラットフォーム: ${interviewData.onlinePlatform}\nミーティングURL: ${interviewData.meetingUrl}\n\n面接日時候補:\n`;
        interviewData.dateCandidates.filter(d => d).forEach((date, i) => {
          const formattedDate = new Date(date).toLocaleString('ja-JP');
          interviewMessage += `${i + 1}. ${formattedDate}\n`;
        });
      } else {
        interviewMessage = `【面接のご案内】\n\n面接方法: 対面面接\n場所: ${interviewData.location}\n\n面接日時候補:\n`;
        interviewData.dateCandidates.filter(d => d).forEach((date, i) => {
          const formattedDate = new Date(date).toLocaleString('ja-JP');
          interviewMessage += `${i + 1}. ${formattedDate}\n`;
        });
        if (interviewData.accessInfo) {
          interviewMessage += `\nアクセス情報:\n${interviewData.accessInfo}`;
        }
      }

      // トラッキングレコードを作成
      await axios.post(`${API_URL}/interview-tracking`, {
        companyId: selectedMessage.companyId || 'sample-company-id',
        applicantName: selectedMessage.sender,
        applicantEmail: selectedMessage.email,
        positionTitle: selectedMessage.subject || '応募ポジション',
        interviewType: interviewType,
        platform: interviewType === 'online' ? interviewData.onlinePlatform : 'in-person',
        scheduledDates: interviewData.dateCandidates.filter(d => d)
      });

      // メッセージボックスに追加（実際にはバックエンドに送信）
      alert(`面接案内を送信しました\n\n${interviewMessage}`);

      // トラッキングリストを更新
      fetchInterviewTrackings();

      // モーダルを閉じてリセット
      setShowInterviewModal(false);
      setInterviewType('');
      setInterviewData({
        onlinePlatform: '',
        meetingUrl: '',
        location: '',
        accessInfo: '',
        dateCandidates: ['', '', '']
      });
      setAgreeToTerms(false);
    } catch (error) {
      console.error('Error sending interview schedule:', error);
      alert('面接案内の送信に失敗しました');
    }
  };

  const fetchInterviewTrackings = async () => {
    try {
      const response = await axios.get(`${API_URL}/interview-tracking/company/sample-company-id`);
      setInterviewTrackings(response.data.trackings || []);
    } catch (error) {
      console.error('Error fetching interview trackings:', error);
    }
  };

  const handleReportHiring = async (tracking) => {
    setSelectedTracking(tracking);
    setShowHiringReportModal(true);
  };

  const handleSubmitHiringReport = async (isHired) => {
    try {
      if (isHired) {
        await axios.post(`${API_URL}/interview-tracking/${selectedTracking._id}/report-hiring`, hiringReportForm);
        alert('採用報告を送信しました');
      } else {
        await axios.post(`${API_URL}/interview-tracking/${selectedTracking._id}/report-not-hired`);
        alert('不採用報告を送信しました');
      }

      // トラッキングリストを更新
      fetchInterviewTrackings();

      // モーダルを閉じてリセット
      setShowHiringReportModal(false);
      setSelectedTracking(null);
      setHiringReportForm({
        startDate: '',
        salary: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting hiring report:', error);
      alert('報告の送信に失敗しました');
    }
  };

  // 就労制限のない在留資格リスト
  const workUnrestrictedVisaTypes = [
    '永住者',
    '日本人の配偶者等',
    '永住者の配偶者等',
    '定住者'
  ];

  // 採用するボタンのハンドラー
  const handleHireApplicant = () => {
    if (!selectedMessage) return;

    // 応募者情報を設定
    setSelectedApplicant({
      name: selectedMessage.sender,
      email: selectedMessage.email,
      phone: selectedMessage.phone,
      profile: selectedMessage.profile,
      nationality: selectedMessage.profile?.nationality || '日本',
      visaType: selectedMessage.profile?.visaType
    });

    const nationality = selectedMessage.profile?.nationality;
    const visaType = selectedMessage.profile?.visaType;

    // 日本人の場合は直接決済へ
    if (nationality === '日本') {
      proceedToPayment(0);
      return;
    }

    // 外国人で就労制限のない在留資格を持つ場合は直接決済へ
    if (visaType && workUnrestrictedVisaTypes.includes(visaType)) {
      proceedToPayment(0);
      return;
    }

    // その他の外国人労働者は在留資格サポートモーダルを表示
    setShowVisaSupportModal(true);
  };

  // 在留資格サポート選択後の処理
  const handleVisaSupportSelection = () => {
    if (!visaSupportOption) {
      alert('在留資格手続きの方法を選択してください');
      return;
    }

    // 特定技能1号の場合、登録支援機関の選択も必要
    if (selectedApplicant?.visaType === '特定技能1号' && !registeredSupportOption) {
      alert('登録支援機関への委託について選択してください');
      return;
    }

    // 特定技能1号で自社支援を選択した場合、要件確認モーダルを表示
    if (selectedApplicant?.visaType === '特定技能1号' && registeredSupportOption === 'self') {
      setShowVisaSupportModal(false);
      setShowSelfSupportRequirements(true);
      return;
    }

    const visaSupportFee = visaSupportOption === 'full-support' ? 50000 : 0;
    const registeredSupportOrgFee = registeredSupportOption === 'delegate' ? 100000 : 0; // 初期費用

    setShowVisaSupportModal(false);
    proceedToPayment(visaSupportFee, registeredSupportOrgFee);
  };

  // 決済画面へ進む
  const proceedToPayment = (visaSupportFee, registeredSupportOrgFee = 0) => {
    // 成約料を計算（例: システム利用料15,000円 or パートナー成約料）
    const placementFee = selectedMessage.profile?.partnerInfo?.placementFee || 15000;
    const totalAmount = placementFee + visaSupportFee + registeredSupportOrgFee;

    setPaymentData({
      placementFee,
      visaSupportFee,
      registeredSupportOrgFee,
      totalAmount
    });

    setShowPaymentModal(true);
  };

  // Stripe Checkout決済処理
  const handlePaymentComplete = async () => {
    try {
      setLoading(true);

      // バックエンドにStripe Checkoutセッションを作成するリクエストを送信
      const response = await axios.post(`${API_URL}/payments/create-checkout-session`, {
        applicantId: selectedApplicant?.email,
        applicantName: selectedApplicant?.name,
        placementFee: paymentData.placementFee,
        visaSupportFee: paymentData.visaSupportFee,
        registeredSupportOrgFee: paymentData.registeredSupportOrgFee,
        totalAmount: paymentData.totalAmount,
        visaSupportOption: visaSupportOption,
        registeredSupportOption: registeredSupportOption,
        companyEmail: user?.email,
        companyName: companyForm.companyName || user?.email
      });

      // Stripe CheckoutのURLにリダイレクト
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Checkout URLが取得できませんでした');
      }

    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('決済ページの作成に失敗しました。もう一度お試しください。');
      setLoading(false);
    }
  };

  // サンプルメッセージデータ
  const sampleMessages = [
    {
      id: 1,
      sender: '山田太郎',
      time: '2時間前',
      subject: '面接日程のご相談',
      preview: '1月16日（火）10:00-12:00でお願いできますでしょうか...',
      email: 'yamada@example.com',
      phone: '090-1234-5678',
      unread: true,
      profile: {
        name: '山田太郎',
        age: 28,
        gender: '男性',
        location: '東京',
        nationality: '日本',
        experience: 5,
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
        education: '東京大学工学部卒業',
        desiredPosition: 'フルスタックエンジニア',
        desiredSalary: 8000000,
        availability: '1ヶ月以内',
        certifications: ['AWS認定ソリューションアーキテクト'],
        languages: [
          { language: '日本語', level: 'ネイティブ' },
          { language: '英語', level: 'ビジネスレベル' }
        ],
        profileDescription: 'フルスタック開発の経験が5年あります。React, Node.jsを使用したWebアプリケーション開発が得意です。'
      },
      conversation: [
        {
          sender: 'company',
          message: 'こんにちは、山田太郎様。\n\n先日はご応募いただきありがとうございます。書類選考の結果、ぜひ面接にお越しいただきたいと思います。',
          time: '1月10日 14:30'
        },
        {
          sender: 'talent',
          message: 'ご連絡ありがとうございます。面接のご案内をいただき大変嬉しく思います。ぜひよろしくお願いいたします。',
          time: '1月10日 15:15'
        },
        {
          sender: 'company',
          message: '以下の日程でご都合のよろしい日時はございますでしょうか。\n\n• 1月15日（月）14:00-16:00\n• 1月16日（火）10:00-12:00\n• 1月17日（水）15:00-17:00\n\nまた、オンライン面接と対面面接のどちらがご希望ですか。',
          time: '1月10日 15:20'
        },
        {
          sender: 'talent',
          message: '1月16日（火）10:00-12:00でお願いできますでしょうか。オンライン面接を希望いたします。',
          time: '2時間前'
        }
      ]
    },
    {
      id: 2,
      sender: 'リン・チェン',
      time: '5時間前',
      subject: '応募書類について',
      preview: 'ベトナムからの応募です。在留資格の相談も可能でしょうか...',
      email: 'chen@example.com',
      phone: '080-9876-5432',
      unread: true,
      profile: {
        name: 'リン・チェン',
        age: 25,
        gender: '女性',
        location: 'ベトナム・ハノイ',
        nationality: 'ベトナム',
        visaType: '留学', // 在留資格（技術・人文知識・国際業務への変更が必要）
        experience: 3,
        skills: ['Java', 'Spring Boot', 'MySQL', 'React'],
        education: 'ハノイ工科大学 コンピューターサイエンス学部卒業',
        desiredPosition: 'バックエンドエンジニア',
        desiredSalary: 5000000,
        availability: '3ヶ月以内',
        certifications: ['Java SE 11 認定資格'],
        languages: [
          { language: 'ベトナム語', level: 'ネイティブ' },
          { language: '日本語', level: 'N2' },
          { language: '英語', level: '日常会話レベル' }
        ],
        profileDescription: 'ベトナムで3年間のソフトウェア開発経験があります。日本で働くことを希望しており、技術・人文知識・国際業務の在留資格取得を目指しています。',
        partnerInfo: {
          placementFee: 300000,
          organizationName: 'グローバル人材紹介株式会社',
          guaranteePeriods: [
            { months: 3, refundRate: 100 },
            { months: 6, refundRate: 50 }
          ]
        }
      },
      conversation: [
        {
          sender: 'talent',
          message: 'お世話になっております。\n\nベトナムから応募させていただきました。日本での就労を希望しており、技術・人文知識・国際業務の在留資格取得についても相談させていただきたいです。',
          time: '1月11日 10:00'
        },
        {
          sender: 'company',
          message: 'ご応募ありがとうございます。\n\n在留資格の手続きについてもサポート可能です。まずは面接を実施させていただき、採用が決まりましたら在留資格の手続きについて詳しくご案内いたします。',
          time: '5時間前'
        }
      ]
    },
    {
      id: 3,
      sender: '田中美咲',
      time: '1日前',
      subject: 'Re: 求人のお問い合わせ',
      preview: '勤務時間は基本的に固定ですが...',
      email: 'tanaka@example.com',
      phone: '080-3333-4444',
      unread: true,
      profile: {
        name: '田中美咲',
        age: 30,
        gender: '女性',
        location: '東京',
        nationality: '中国',
        visaType: '永住者', // 就労制限なし
        experience: 7,
        skills: ['プロジェクトマネジメント', 'Scrum', 'Agile', 'Python', 'データ分析'],
        education: '北京大学経済学部卒業、東京大学大学院修了',
        desiredPosition: 'プロジェクトマネージャー',
        desiredSalary: 7000000,
        availability: '即日可能',
        certifications: ['PMP', 'Scrum Master認定'],
        languages: [
          { language: '中国語', level: 'ネイティブ' },
          { language: '日本語', level: 'ネイティブ' },
          { language: '英語', level: 'ビジネスレベル' }
        ],
        profileDescription: '永住者として日本に10年以上在住。大手IT企業でプロジェクトマネージャーとして7年の経験があります。'
      },
      conversation: [
        {
          sender: 'talent',
          message: 'ご返信ありがとうございます。勤務条件について詳しくお聞きしたく存じます。\n\n1. 勤務時間は固定でしょうか、それともシフト制でしょうか\n2. リモートワークの頻度について教えてください\n3. 試用期間中の待遇について',
          time: '1月9日 16:00'
        },
        {
          sender: 'company',
          message: 'ご質問ありがとうございます。\n\n1. 勤務時間は基本的に固定で9:00-18:00です\n2. リモートワークは週2-3日可能です\n3. 試用期間は3ヶ月で、待遇は本採用時と同等です\n\nその他ご不明な点があればお気軽にお問い合わせください。',
          time: '1日前'
        }
      ]
    },
    {
      id: 4,
      sender: 'グエン・ヴァン・タン',
      time: '2日前',
      subject: '特定技能1号での応募について',
      preview: '飲食業の特定技能1号での就労を希望しています...',
      email: 'tan@example.com',
      phone: '090-2222-3333',
      unread: false,
      profile: {
        name: 'グエン・ヴァン・タン',
        age: 27,
        gender: '男性',
        location: 'ベトナム・ホーチミン',
        nationality: 'ベトナム',
        visaType: '特定技能1号', // 特定技能1号
        specificSkillCategory: '飲食料品製造業',
        experience: 4,
        skills: ['調理', '食品加工', '品質管理', '衛生管理'],
        education: 'ホーチミン工業短期大学卒業',
        desiredPosition: '食品製造スタッフ',
        desiredSalary: 3500000,
        availability: '2ヶ月以内',
        certifications: ['食品衛生責任者', '特定技能評価試験合格'],
        languages: [
          { language: 'ベトナム語', level: 'ネイティブ' },
          { language: '日本語', level: 'N3' }
        ],
        profileDescription: 'ベトナムで4年間食品製造の経験があります。特定技能1号の在留資格で日本での就労を希望しています。'
      },
      conversation: [
        {
          sender: 'talent',
          message: 'お世話になっております。\n\n特定技能1号の在留資格で飲食料品製造業での就労を希望しております。ベトナムで4年間の食品製造経験があり、特定技能評価試験にも合格しております。',
          time: '1月8日 10:00'
        },
        {
          sender: 'company',
          message: 'ご応募ありがとうございます。特定技能1号での採用を前向きに検討させていただきます。登録支援機関のサポートについてもご案内できますので、まずは面接の日程を調整させていただけますでしょうか。',
          time: '2日前'
        }
      ]
    },
    {
      id: 5,
      sender: '鈴木一郎',
      time: '3日前',
      subject: '履歴書送付のお礼',
      preview: '履歴書拝見いたしました...',
      email: 'suzuki@example.com',
      phone: '090-1111-2222',
      unread: false,
      conversation: [
        {
          sender: 'talent',
          message: '先日は面談の機会をいただき誠にありがとうございました。\n\n御社の事業内容や職場の雰囲気について詳しくお話を伺うことができ、大変参考になりました。',
          time: '1月8日 14:00'
        },
        {
          sender: 'company',
          message: '履歴書拝見いたしました。豊富なご経験をお持ちで大変素晴らしいと思います。\n\n次のステップとして、実技試験のご案内をさせていただきます。詳細は追ってメールにてお送りいたします。',
          time: '2日前'
        }
      ]
    },
    {
      id: 5,
      sender: '高橋健太',
      time: '3日前',
      subject: '求人のお問い合わせ',
      preview: 'ぜひ一度お話をお伺いしたいと思います...',
      email: 'takahashi@example.com',
      phone: '090-5555-6666',
      unread: false,
      conversation: [
        {
          sender: 'talent',
          message: '御社の求人に興味があります。\n\n現在、飲食業界で4年ほど経験を積んでおり、次のステップとして御社でのキャリアを検討しております。',
          time: '1月7日 11:00'
        },
        {
          sender: 'company',
          message: 'お問い合わせありがとうございます。\n\nぜひ一度お話をお伺いしたいと思います。来週中でご都合のよろしい日時はございますでしょうか。',
          time: '3日前'
        }
      ]
    }
  ];

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
  };

  const handleBackToList = () => {
    setSelectedMessage(null);
  };

  const handleCompanyFormChange = (e) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCompanyFormSubmit = (e) => {
    e.preventDefault();
    console.log('Company form submitted:', companyForm);
    // TODO: APIに送信
    setShowCompanyForm(false);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  if (authLoading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#ececf1', fontSize: '18px' }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* サイドバー */}
      <div className="sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <span>+</span>
            新しいチャット
          </button>
          <button className="new-chat-btn" onClick={() => setShowCompanyForm(true)}>
            <span>+</span>
            企業情報登録
          </button>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-title">チャット履歴</div>
          <div className="chat-history-list">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`chat-history-item ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat)}
              >
                <div className="chat-history-title">{chat.title}</div>
                <button
                  className="chat-delete-btn"
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  title="削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="sidebar-footer">
          <button className="sidebar-menu-btn" onClick={() => {
            setShowMessageBox(true);
            fetchInterviewTrackings();
          }}>
            メッセージボックス
            {unreadMessages > 0 && (
              <span className="message-badge">{unreadMessages}</span>
            )}
          </button>
        </div>
      </div>

      {/* メインエリア */}
      <div className="main-area">
        {/* ヘッダー部分 */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '12px', color: '#8e8ea0' }}>{user?.name}</span>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: '#8e8ea0',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
              textDecoration: 'underline'
            }}
          >
            ログアウト
          </button>
        </div>

        <div className="chat-container">
          {/* 使用量警告バナー */}
          {usageWarning && (
            <div className="usage-warning-banner">
              <div className="usage-warning-content">
                <span className="warning-icon">⚠️</span>
                <span>{usageWarning}</span>
                <button className="warning-close-btn" onClick={() => setUsageWarning(null)}>×</button>
              </div>
            </div>
          )}

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role} ${msg.isWelcome ? 'welcome' : ''}`}>
                <div className="message-content">
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content loading-indicator">
                  入力中...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="メッセージを入力してください..."
                  className="chat-input"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={isLoading || !inputMessage.trim()}
                >
                  ↑
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 検索結果パネル */}
      <div className={`results-panel ${talents.length === 0 ? 'hidden' : ''}`}>
        <div className="results-header">
          マッチング結果 ({talents.length})
        </div>

        {talents.length > 0 && (
          <div className="results-notice">
            ※ AIにてご条件と一致度が高い順から表示していますが、必ずしもご希望の内容に完全一致しているとは限りません。
          </div>
        )}

        <div className="results-content">
          {talents.length === 0 ? (
            <div className="no-results">
              検索結果がここに表示されます
            </div>
          ) : (
            <div className="talent-list">
              {talents.map((talent) => (
                <div
                  key={talent._id}
                  className="talent-card"
                  onClick={() => handleTalentClick(talent)}
                >
                  <div className="talent-header">
                    <div className="talent-name">{talent.name}</div>
                    <div className="match-score company-fee-badge">
                      {talent.partnerInfo?.placementFee
                        ? `成約料: ¥${Math.floor(talent.partnerInfo.placementFee / 10000)}万`
                        : 'システム利用料: ¥1.5万'}
                    </div>
                  </div>

                  <div className="talent-info">
                    {talent.location} • {talent.experience}年 • {talent.availability}
                  </div>

                  <div className="talent-skills">
                    {talent.skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                    {talent.skills.length > 3 && (
                      <span className="skill-tag">
                        +{talent.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* チャット削除確認ダイアログ */}
      {chatToDelete && (
        <div className="delete-confirm-modal" onClick={cancelDeleteChat}>
          <div className="delete-confirm-content" onClick={(e) => e.stopPropagation()}>
            <h3>チャットを削除しますか？</h3>
            <p>この操作は取り消せません。</p>
            <div className="delete-confirm-actions">
              <button className="cancel-delete-btn" onClick={cancelDeleteChat}>
                キャンセル
              </button>
              <button className="confirm-delete-btn" onClick={confirmDeleteChat}>
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* プロフィール確認モーダル */}
      {showTalentProfile && selectedMessage && selectedMessage.profile && (
        <div className="talent-profile-modal" onClick={() => setShowTalentProfile(false)}>
          <div className="talent-profile-content" onClick={(e) => e.stopPropagation()}>
            <div className="talent-profile-header">
              <h2>プロフィール詳細</h2>
              <button className="close-button" onClick={() => setShowTalentProfile(false)}>
                ×
              </button>
            </div>

            <div className="talent-profile-body">
              <div className="profile-section">
                <div className="profile-main-info">
                  <h3 className="profile-name">{selectedMessage.profile.name}</h3>
                  <div className="profile-meta">
                    {selectedMessage.profile.age}歳 • {selectedMessage.profile.gender} • {selectedMessage.profile.location}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="profile-section-title">基本情報</h4>
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <span className="profile-label">経験年数</span>
                    <span className="profile-value">{selectedMessage.profile.experience}年</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-label">希望職種</span>
                    <span className="profile-value">{selectedMessage.profile.desiredPosition}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-label">希望年収</span>
                    <span className="profile-value">{selectedMessage.profile.desiredSalary?.toLocaleString()}円</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-label">稼働開始時期</span>
                    <span className="profile-value">{selectedMessage.profile.availability}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="profile-section-title">学歴</h4>
                <p className="profile-text">{selectedMessage.profile.education}</p>
              </div>

              <div className="profile-section">
                <h4 className="profile-section-title">スキル</h4>
                <div className="profile-skills">
                  {selectedMessage.profile.skills.map((skill, idx) => (
                    <span key={idx} className="profile-skill-tag">{skill}</span>
                  ))}
                </div>
              </div>

              {selectedMessage.profile.certifications && selectedMessage.profile.certifications.length > 0 && (
                <div className="profile-section">
                  <h4 className="profile-section-title">資格</h4>
                  <ul className="profile-list">
                    {selectedMessage.profile.certifications.map((cert, idx) => (
                      <li key={idx}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedMessage.profile.languages && selectedMessage.profile.languages.length > 0 && (
                <div className="profile-section">
                  <h4 className="profile-section-title">言語スキル</h4>
                  <div className="profile-languages">
                    {selectedMessage.profile.languages.map((lang, idx) => (
                      <div key={idx} className="profile-language-item">
                        <span className="language-name">{lang.language}</span>
                        <span className="language-level">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMessage.profile.profileDescription && (
                <div className="profile-section">
                  <h4 className="profile-section-title">自己PR</h4>
                  <p className="profile-text">{selectedMessage.profile.profileDescription}</p>
                </div>
              )}

              <div className="profile-section">
                <h4 className="profile-section-title">連絡先</h4>
                <div className="profile-contact-info">
                  <div className="profile-contact-item">
                    <span className="contact-label">連絡方法:</span>
                    <span className="contact-value">メッセージボックス経由でやり取りできます</span>
                  </div>
                  <div className="profile-info-notice">
                    <p>※ セキュリティのため、求職者の個人情報は保護されています。</p>
                    <p>※ メッセージを送信すると、企業様のメールアドレスに通知が届きます。</p>
                    <p>※ メールに直接返信することで、求職者とやり取りできます。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 企業情報登録モーダル */}
      {showCompanyForm && (
        <div className="company-form-modal" onClick={() => setShowCompanyForm(false)}>
          <div className="company-form-content" onClick={(e) => e.stopPropagation()}>
            <div className="company-form-header">
              <h2>企業情報・求人登録</h2>
              <button className="close-button" onClick={() => setShowCompanyForm(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCompanyFormSubmit} className="company-form-body">
              <div className="form-section">
                <h3 className="form-section-title">企業基本情報</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>企業名 *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={companyForm.companyName}
                      onChange={handleCompanyFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>業種 *</label>
                    <select
                      name="industry"
                      value={companyForm.industry}
                      onChange={handleCompanyFormChange}
                      required
                    >
                      <option value="">選択してください</option>
                      <option value="IT・通信">IT・通信</option>
                      <option value="製造">製造</option>
                      <option value="医療">医療</option>
                      <option value="介護">介護</option>
                      <option value="外食・飲食">外食・飲食</option>
                      <option value="物流">物流</option>
                      <option value="小売">小売</option>
                      <option value="金融">金融</option>
                      <option value="教育">教育</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>従業員数</label>
                    <select
                      name="companySize"
                      value={companyForm.companySize}
                      onChange={handleCompanyFormChange}
                    >
                      <option value="">選択してください</option>
                      <option value="1-10名">1-10名</option>
                      <option value="11-50名">11-50名</option>
                      <option value="51-100名">51-100名</option>
                      <option value="101-300名">101-300名</option>
                      <option value="301-1000名">301-1000名</option>
                      <option value="1001名以上">1001名以上</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>設立年</label>
                    <input
                      type="text"
                      name="established"
                      value={companyForm.established}
                      onChange={handleCompanyFormChange}
                      placeholder="例: 2010年"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>資本金</label>
                    <input
                      type="text"
                      name="capital"
                      value={companyForm.capital}
                      onChange={handleCompanyFormChange}
                      placeholder="例: 1000万円"
                    />
                  </div>
                  <div className="form-group">
                    <label>代表者名</label>
                    <input
                      type="text"
                      name="representativeName"
                      value={companyForm.representativeName}
                      onChange={handleCompanyFormChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>本社所在地 *</label>
                  <input
                    type="text"
                    name="headquarters"
                    value={companyForm.headquarters}
                    onChange={handleCompanyFormChange}
                    required
                    placeholder="例: 東京都渋谷区..."
                  />
                </div>

                <div className="form-group">
                  <label>事業内容 *</label>
                  <textarea
                    name="businessDescription"
                    value={companyForm.businessDescription}
                    onChange={handleCompanyFormChange}
                    required
                    rows="4"
                    placeholder="会社の事業内容を詳しく記載してください"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Webサイト</label>
                    <input
                      type="url"
                      name="website"
                      value={companyForm.website}
                      onChange={handleCompanyFormChange}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="form-group">
                    <label>メールアドレス *</label>
                    <input
                      type="email"
                      name="email"
                      value={companyForm.email}
                      onChange={handleCompanyFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>電話番号 *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={companyForm.phone}
                    onChange={handleCompanyFormChange}
                    required
                    placeholder="例: 03-1234-5678"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">募集職種情報</h3>

                <div className="form-group">
                  <label>職種名 *</label>
                  <input
                    type="text"
                    name="positionTitle"
                    value={companyForm.positionTitle}
                    onChange={handleCompanyFormChange}
                    required
                    placeholder="例: Webエンジニア、看護師、建築現場監督など"
                  />
                </div>

                <div className="form-group">
                  <label>仕事内容 *</label>
                  <textarea
                    name="jobDescription"
                    value={companyForm.jobDescription}
                    onChange={handleCompanyFormChange}
                    required
                    rows="5"
                    placeholder="具体的な業務内容を記載してください"
                  />
                </div>

                <div className="form-group">
                  <label>必須スキル・経験 *</label>
                  <textarea
                    name="requiredSkills"
                    value={companyForm.requiredSkills}
                    onChange={handleCompanyFormChange}
                    required
                    rows="3"
                    placeholder="例: React/Node.js 3年以上の経験、看護師免許、普通自動車免許など"
                  />
                </div>

                <div className="form-group">
                  <label>歓迎スキル・経験</label>
                  <textarea
                    name="preferredSkills"
                    value={companyForm.preferredSkills}
                    onChange={handleCompanyFormChange}
                    rows="3"
                    placeholder="あれば望ましいスキルや経験"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>雇用形態 *</label>
                    <select
                      name="employmentType"
                      value={companyForm.employmentType}
                      onChange={handleCompanyFormChange}
                      required
                    >
                      <option value="">選択してください</option>
                      <option value="正社員">正社員</option>
                      <option value="契約社員">契約社員</option>
                      <option value="派遣社員">派遣社員</option>
                      <option value="パート・アルバイト">パート・アルバイト</option>
                      <option value="業務委託">業務委託</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>勤務地 *</label>
                    <input
                      type="text"
                      name="workLocation"
                      value={companyForm.workLocation}
                      onChange={handleCompanyFormChange}
                      required
                      placeholder="例: 東京都渋谷区、リモート可など"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>想定年収（最低） *</label>
                    <input
                      type="number"
                      name="salaryMin"
                      value={companyForm.salaryMin}
                      onChange={handleCompanyFormChange}
                      required
                      placeholder="例: 4000000"
                    />
                  </div>
                  <div className="form-group">
                    <label>想定年収（最高） *</label>
                    <input
                      type="number"
                      name="salaryMax"
                      value={companyForm.salaryMax}
                      onChange={handleCompanyFormChange}
                      required
                      placeholder="例: 8000000"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>勤務時間 *</label>
                  <input
                    type="text"
                    name="workHours"
                    value={companyForm.workHours}
                    onChange={handleCompanyFormChange}
                    required
                    placeholder="例: 9:00-18:00（フレックスタイム制）"
                  />
                </div>

                <div className="form-group">
                  <label>休日・休暇 *</label>
                  <textarea
                    name="holidays"
                    value={companyForm.holidays}
                    onChange={handleCompanyFormChange}
                    required
                    rows="3"
                    placeholder="例: 完全週休2日制（土日祝）、年間休日120日、有給休暇、夏季休暇、年末年始休暇など"
                  />
                </div>

                <div className="form-group">
                  <label>福利厚生</label>
                  <textarea
                    name="benefits"
                    value={companyForm.benefits}
                    onChange={handleCompanyFormChange}
                    rows="4"
                    placeholder="例: 社会保険完備、交通費全額支給、リモートワーク可、書籍購入補助、資格取得支援など"
                  />
                </div>

                <div className="form-group">
                  <label>選考プロセス</label>
                  <textarea
                    name="selectionProcess"
                    value={companyForm.selectionProcess}
                    onChange={handleCompanyFormChange}
                    rows="3"
                    placeholder="例: 書類選考 → 1次面接 → 2次面接 → 最終面接 → 内定"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCompanyForm(false)}>
                  キャンセル
                </button>
                <button type="submit" className="submit-btn">
                  登録する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* メッセージボックスモーダル */}
      {showMessageBox && (
        <div className="message-box-modal" onClick={() => setShowMessageBox(false)}>
          <div className="message-box-content" onClick={(e) => e.stopPropagation()}>
            <div className="message-box-header">
              <h2>メッセージボックス</h2>
              <button className="close-button" onClick={() => setShowMessageBox(false)}>
                ×
              </button>
            </div>

            <div className="message-box-body">
              {!selectedMessage ? (
                // メッセージ一覧
                <>
                  {/* 面接トラッキングセクション */}
                  {interviewTrackings.length > 0 && (
                    <div className="tracking-section">
                      <h3 className="tracking-section-title">面接・選考状況</h3>
                      {interviewTrackings
                        .filter(t => t.status !== 'hired' && t.status !== 'not_hired')
                        .map((tracking) => (
                        <div key={tracking._id} className="tracking-item">
                          <div className="tracking-item-header">
                            <div className="tracking-applicant">{tracking.applicantName}</div>
                            <span className={`tracking-status ${tracking.status}`}>
                              {tracking.status === 'scheduled' ? '面接予定' : '面接実施済'}
                            </span>
                          </div>
                          <div className="tracking-position">{tracking.positionTitle}</div>
                          <div className="tracking-details">
                            {tracking.interviewType === 'online' ? 'オンライン面接' : '対面面接'} •
                            {tracking.platform === 'in-person' ? ' 対面' : ` ${tracking.platform}`}
                          </div>
                          <div className="tracking-actions">
                            <button
                              className="report-btn hired"
                              onClick={() => handleReportHiring(tracking)}
                            >
                              採用報告
                            </button>
                            <button
                              className="report-btn not-hired"
                              onClick={() => {
                                setSelectedTracking(tracking);
                                handleSubmitHiringReport(false);
                              }}
                            >
                              不採用報告
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* メッセージ一覧 */}
                  <div className="messages-section">
                    <h3 className="messages-section-title">受信メッセージ</h3>
                    {sampleMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`message-item ${message.unread ? 'unread' : ''}`}
                        onClick={() => handleMessageClick(message)}
                      >
                        <div className="message-item-header">
                          <div className="message-sender">{message.sender}</div>
                          <div className="message-time">{message.time}</div>
                        </div>
                        <div className="message-subject">{message.subject}</div>
                        <div className="message-preview">{message.preview}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // メッセージ詳細（会話形式）
                <div className="message-detail">
                  <div className="message-detail-header">
                    <button className="back-button" onClick={handleBackToList}>
                      ← 戻る
                    </button>
                    <div className="conversation-info">
                      <div className="conversation-sender">{selectedMessage.sender}</div>
                    </div>
                    <button className="profile-view-button" onClick={() => setShowTalentProfile(true)}>
                      プロフィール確認
                    </button>
                  </div>

                  <div className="conversation-messages">
                    {selectedMessage.conversation && selectedMessage.conversation.map((msg, index) => (
                      <div key={index} className={`conversation-message ${msg.sender}`}>
                        <div className="conversation-bubble">
                          <div className="conversation-text">{msg.message}</div>
                          <div className="conversation-time">{msg.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="conversation-actions">
                    <button className="hire-applicant-btn" onClick={handleHireApplicant}>
                      採用する
                    </button>
                    <button className="interview-setup-btn" onClick={() => setShowInterviewModal(true)}>
                      面接する
                    </button>
                  </div>

                  <div className="conversation-input-area">
                    <textarea
                      className="conversation-input"
                      placeholder="メッセージを入力..."
                      rows="3"
                    />
                    <button className="conversation-send-btn">送信</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 面接設定モーダル */}
      {showInterviewModal && (
        <div className="interview-modal" onClick={() => setShowInterviewModal(false)}>
          <div className="interview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="interview-modal-header">
              <h2>面接設定</h2>
              <button className="close-button" onClick={() => setShowInterviewModal(false)}>×</button>
            </div>

            <div className="interview-modal-body">
              {!interviewType ? (
                // ステップ1: 面接タイプ選択
                <div className="interview-type-selection">
                  <h3>面接方法を選択してください</h3>
                  <div className="interview-type-buttons">
                    <button
                      className="interview-type-btn online"
                      onClick={() => setInterviewType('online')}
                    >
                      <div className="interview-label">オンライン面接</div>
                      <div className="interview-desc">Zoom, Google Meet, Teamsなど</div>
                    </button>
                    <button
                      className="interview-type-btn in-person"
                      onClick={() => setInterviewType('in-person')}
                    >
                      <div className="interview-label">対面面接</div>
                      <div className="interview-desc">会社または指定場所で実施</div>
                    </button>
                  </div>
                </div>
              ) : interviewType === 'online' ? (
                // ステップ2-A: オンライン面接設定
                <div className="interview-online-setup">
                  <button className="back-btn" onClick={() => setInterviewType('')}>← 戻る</button>
                  <h3>オンライン面接設定</h3>

                  <div className="form-group">
                    <label>プラットフォーム</label>
                    <div className="platform-buttons">
                      <button
                        className={`platform-btn ${interviewData.onlinePlatform === 'zoom' ? 'active' : ''}`}
                        onClick={() => setInterviewData({...interviewData, onlinePlatform: 'zoom'})}
                      >
                        Zoom
                      </button>
                      <button
                        className={`platform-btn ${interviewData.onlinePlatform === 'google-meet' ? 'active' : ''}`}
                        onClick={() => setInterviewData({...interviewData, onlinePlatform: 'google-meet'})}
                      >
                        Google Meet
                      </button>
                      <button
                        className={`platform-btn ${interviewData.onlinePlatform === 'teams' ? 'active' : ''}`}
                        onClick={() => setInterviewData({...interviewData, onlinePlatform: 'teams'})}
                      >
                        Teams
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>ミーティングURL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={interviewData.meetingUrl}
                      onChange={(e) => setInterviewData({...interviewData, meetingUrl: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>面接日時候補（3つまで）</label>
                    {interviewData.dateCandidates.map((date, index) => (
                      <input
                        key={index}
                        type="datetime-local"
                        value={date}
                        onChange={(e) => {
                          const newDates = [...interviewData.dateCandidates];
                          newDates[index] = e.target.value;
                          setInterviewData({...interviewData, dateCandidates: newDates});
                        }}
                      />
                    ))}
                  </div>

                  <div className="terms-agreement">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                      />
                      <span>
                        利用規約に同意します。採用が決定した場合、2週間以内にシステム上で報告することに同意します。
                        未報告の場合、サービス利用が制限される可能性があります。
                      </span>
                    </label>
                  </div>

                  <button
                    className="send-interview-btn"
                    onClick={handleSendInterviewSchedule}
                    disabled={!agreeToTerms}
                  >
                    面接案内を送信
                  </button>
                </div>
              ) : (
                // ステップ2-B: 対面面接設定
                <div className="interview-inperson-setup">
                  <button className="back-btn" onClick={() => setInterviewType('')}>← 戻る</button>
                  <h3>対面面接設定</h3>

                  <div className="form-group">
                    <label>面接場所</label>
                    <input
                      type="text"
                      placeholder="例: 本社会議室、〇〇駅近くのカフェ"
                      value={interviewData.location}
                      onChange={(e) => setInterviewData({...interviewData, location: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>面接日時候補（3つまで）</label>
                    {interviewData.dateCandidates.map((date, index) => (
                      <input
                        key={index}
                        type="datetime-local"
                        value={date}
                        onChange={(e) => {
                          const newDates = [...interviewData.dateCandidates];
                          newDates[index] = e.target.value;
                          setInterviewData({...interviewData, dateCandidates: newDates});
                        }}
                      />
                    ))}
                  </div>

                  <div className="form-group">
                    <label>アクセス情報（任意）</label>
                    <textarea
                      rows="3"
                      placeholder="最寄り駅、駐車場情報など"
                      value={interviewData.accessInfo}
                      onChange={(e) => setInterviewData({...interviewData, accessInfo: e.target.value})}
                    />
                  </div>

                  <div className="terms-agreement">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                      />
                      <span>
                        利用規約に同意します。採用が決定した場合、2週間以内にシステム上で報告することに同意します。
                        未報告の場合、サービス利用が制限される可能性があります。
                      </span>
                    </label>
                  </div>

                  <button
                    className="send-interview-btn"
                    onClick={handleSendInterviewSchedule}
                    disabled={!agreeToTerms}
                  >
                    面接案内を送信
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 人材詳細モーダル（マッチング結果から） */}
      {selectedTalent && (
        <div className="talent-profile-modal" onClick={() => setSelectedTalent(null)}>
          <div className="talent-profile-content" onClick={(e) => e.stopPropagation()}>
            <div className="talent-profile-header">
              <h2>プロフィール詳細</h2>
              <button className="close-button" onClick={() => setSelectedTalent(null)}>
                ×
              </button>
            </div>

            <div className="talent-profile-body">
              <div className="profile-section company-fee-highlight-section">
                <div className="company-fee-highlight">
                  {selectedTalent.partnerInfo?.placementFee ? (
                    <>
                      <div className="company-fee-highlight-item">
                        <div className="company-fee-highlight-label">紹介元</div>
                        <div className="company-fee-highlight-value">
                          {selectedTalent.partnerInfo.organizationName}
                        </div>
                      </div>
                      <div className="company-fee-highlight-item">
                        <div className="company-fee-highlight-label">成約料</div>
                        <div className="company-fee-highlight-value company-fee-highlight-price">
                          ¥{selectedTalent.partnerInfo.placementFee.toLocaleString()}
                        </div>
                      </div>
                      <div className="company-fee-highlight-item company-guarantee-summary">
                        <div className="company-fee-highlight-label">保証期間</div>
                        {selectedTalent.partnerInfo.guaranteePeriods && selectedTalent.partnerInfo.guaranteePeriods.length > 0 ? (
                          <div className="company-guarantee-summary-list">
                            {selectedTalent.partnerInfo.guaranteePeriods.map((period, idx) => (
                              <div key={idx} className="company-guarantee-summary-item">
                                {period.months}ヶ月以内: {period.refundRate}%返金
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="company-fee-highlight-value">保証期間なし</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="company-fee-highlight-item">
                        <div className="company-fee-highlight-label">応募方法</div>
                        <div className="company-fee-highlight-value">直接応募</div>
                      </div>
                      <div className="company-fee-highlight-item">
                        <div className="company-fee-highlight-label">成約料</div>
                        <div className="company-fee-highlight-value company-fee-highlight-price">
                          ¥15,000
                        </div>
                      </div>
                      <div className="company-fee-highlight-item">
                        <div className="company-fee-highlight-label">退職返金保証</div>
                        <div className="company-fee-highlight-value">保証期間なし</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="profile-section">
                <div className="profile-main-info">
                  <h3 className="profile-name">{selectedTalent.name}</h3>
                  <div className="profile-meta">
                    {selectedTalent.age}歳 • {selectedTalent.gender} • {selectedTalent.location}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="profile-section-title">基本情報</h4>
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <span className="profile-label">経験年数</span>
                    <span className="profile-value">{selectedTalent.experience}年</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-label">希望職種</span>
                    <span className="profile-value">{selectedTalent.desiredPosition}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-label">希望年収</span>
                    <span className="profile-value">{selectedTalent.desiredSalary?.toLocaleString()}円</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-label">稼働開始時期</span>
                    <span className="profile-value">{selectedTalent.availability}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="profile-section-title">学歴</h4>
                <p className="profile-text">{selectedTalent.education}</p>
              </div>

              <div className="profile-section">
                <h4 className="profile-section-title">スキル</h4>
                <div className="profile-skills">
                  {selectedTalent.skills.map((skill, idx) => (
                    <span key={idx} className="profile-skill-tag">{skill}</span>
                  ))}
                </div>
              </div>

              {selectedTalent.certifications && selectedTalent.certifications.length > 0 && (
                <div className="profile-section">
                  <h4 className="profile-section-title">資格</h4>
                  <ul className="profile-list">
                    {selectedTalent.certifications.map((cert, idx) => (
                      <li key={idx}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedTalent.languages && selectedTalent.languages.length > 0 && (
                <div className="profile-section">
                  <h4 className="profile-section-title">言語スキル</h4>
                  <div className="profile-languages">
                    {selectedTalent.languages.map((lang, idx) => (
                      <div key={idx} className="profile-language-item">
                        <span className="language-name">{lang.language}</span>
                        <span className="language-level">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTalent.profileDescription && (
                <div className="profile-section">
                  <h4 className="profile-section-title">自己PR</h4>
                  <p className="profile-text">{selectedTalent.profileDescription}</p>
                </div>
              )}

              <div className="profile-section">
                <h4 className="profile-section-title">連絡先</h4>
                <div className="profile-contact-info">
                  <div className="profile-contact-item">
                    <span className="contact-label">連絡方法:</span>
                    <span className="contact-value">メッセージボックス経由でやり取りできます</span>
                  </div>
                  <div className="profile-info-notice">
                    <p>※ セキュリティのため、求職者の個人情報は保護されています。</p>
                    <p>※ メッセージを送信すると、企業様のメールアドレスに通知が届きます。</p>
                    <p>※ メールに直接返信することで、求職者とやり取りできます。</p>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4 className="profile-section-title">メッセージを送る</h4>
                {submitStatus && (
                  <div className={submitStatus.type}>
                    {submitStatus.message}
                  </div>
                )}
                <form onSubmit={handleSendMessageToTalent} className="profile-message-form">
                  <div className="talent-detail-content">
                    <div className="form-group">
                      <label>お名前 *</label>
                      <input
                        type="text"
                        name="senderName"
                        value={messageForm.senderName}
                        onChange={handleMessageFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>メールアドレス *</label>
                      <input
                        type="email"
                        name="senderEmail"
                        value={messageForm.senderEmail}
                        onChange={handleMessageFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>件名 *</label>
                      <input
                        type="text"
                        name="subject"
                        value={messageForm.subject}
                        onChange={handleMessageFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>メッセージ *</label>
                      <textarea
                        name="content"
                        value={messageForm.content}
                        onChange={handleMessageFormChange}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="profile-submit-button">
                    送信する
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 自社支援警告モーダル */}
      {showSelfSupportWarning && (
        <div className="self-support-warning-modal" onClick={() => setShowSelfSupportWarning(false)}>
          <div className="self-support-warning-content" onClick={(e) => e.stopPropagation()}>
            <div className="self-support-warning-header">
              <h2>自社支援に関する重要な注意事項</h2>
              <button className="close-button" onClick={() => setShowSelfSupportWarning(false)}>×</button>
            </div>

            <div className="self-support-warning-body">
              <div className="warning-section">
                <h3>自社支援を選択される前に必ずご確認ください</h3>

                <div className="warning-content-box">
                  <h4>1. 法律上の要件について</h4>
                  <p>
                    特定技能1号外国人を自社で支援する場合、入管法により定められた<strong>企業要件</strong>、
                    <strong>支援責任者の要件</strong>、<strong>支援担当者の要件</strong>、
                    および<strong>義務的支援の実施</strong>に関する全24項目の要件を満たす必要があります。
                  </p>
                </div>

                <div className="warning-content-box">
                  <h4>2. 入国管理局への書類提出について</h4>
                  <p>
                    自社支援を選択する場合、入国管理局に対して以下の書類を提出する必要があります：
                  </p>
                  <ul>
                    <li>支援責任者名および経歴</li>
                    <li>支援担当者名および経歴</li>
                    <li>1号特定技能外国人支援計画書</li>
                    <li>支援体制に関する説明書</li>
                    <li>支援の実施を確保するための措置に関する書類</li>
                    <li>その他関連書類</li>
                  </ul>
                </div>

                <div className="warning-content-box">
                  <h4>3. 継続的な義務について</h4>
                  <p>
                    採用後も、定期的な面談（3ヶ月に1回以上）、相談対応、各種サポート、
                    支援記録の作成・保管など、継続的な義務が発生します。
                    これらを適切に実施しない場合、行政処分の対象となる可能性があります。
                  </p>
                </div>

                <div className="warning-highlight-box">
                  <p>
                    <strong>書類の準備や提出手続き、継続的な支援の実施に不安がある場合、
                    または要件を満たすことが困難な場合は、登録支援機関への委託を強くおすすめします。</strong>
                  </p>
                </div>
              </div>

              <div className="self-support-warning-actions">
                <button
                  className="back-to-options-btn"
                  onClick={() => setShowSelfSupportWarning(false)}
                >
                  登録支援機関への委託を検討する
                </button>
                <button
                  className="proceed-to-requirements-btn"
                  onClick={() => {
                    setRegisteredSupportOption('self');
                    setShowSelfSupportWarning(false);
                  }}
                >
                  理解した上で自社支援を選択する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 在留資格サポート選択モーダル */}
      {showVisaSupportModal && selectedApplicant && (
        <div className="visa-support-modal" onClick={() => setShowVisaSupportModal(false)}>
          <div className="visa-support-content" onClick={(e) => e.stopPropagation()}>
            <div className="visa-support-header">
              <h2>在留資格手続きについて</h2>
              <button className="close-button" onClick={() => setShowVisaSupportModal(false)}>×</button>
            </div>

            <div className="visa-support-body">
              <div className="visa-notice">
                <div className="visa-notice-header">
                  <div className="visa-notice-icon">i</div>
                  <h3 className="visa-notice-title">在留資格の手続きについて</h3>
                </div>
                <p className="visa-notice-text">
                  {selectedApplicant.name}様（{selectedApplicant.nationality}）を採用する場合、就労可能な在留資格の取得または変更手続きが必要です。
                </p>
              </div>

              {selectedApplicant?.visaType === '特定技能1号' && (
                <>
                  <div className="specific-skill-notice">
                    <h3>特定技能1号について</h3>
                    <p>
                      特定技能1号の外国人を雇用する場合、登録支援機関に支援を委託するか、
                      自社で支援を行うかを選択する必要があります。
                    </p>
                  </div>

                  <div className="registered-support-options">
                    <h3>登録支援機関への委託</h3>
                    <div className="visa-option-card-container">
                      <div
                        className={`visa-option-card ${registeredSupportOption === 'delegate' ? 'selected' : ''}`}
                        onClick={() => setRegisteredSupportOption('delegate')}
                      >
                        <div className="visa-option-header">
                          <input
                            type="radio"
                            name="registeredSupport"
                            checked={registeredSupportOption === 'delegate'}
                            onChange={() => setRegisteredSupportOption('delegate')}
                          />
                          <h4>登録支援機関に委託する</h4>
                        </div>
                        <div className="visa-option-price">
                          ¥100,000 <span className="price-tax">(税別)</span>
                        </div>
                        <div className="monthly-fee-text">
                          月額 ¥10,000
                        </div>
                        <ul className="visa-option-features">
                          <li>✓ 事前ガイダンスの実施</li>
                          <li>✓ 出入国の際の送迎</li>
                          <li>✓ 住居確保・生活契約支援</li>
                          <li>✓ 生活オリエンテーション</li>
                          <li>✓ 公的手続きのサポート</li>
                          <li>✓ 日本語学習の機会提供</li>
                          <li>✓ 相談・苦情対応（母国語対応）</li>
                          <li>✓ 日本人との交流促進</li>
                          <li>✓ 転職支援</li>
                          <li>✓ 定期的な面談</li>
                          <li>✓ 行政機関への通報対応</li>
                          <li>※ 交通費が発生した場合は実費負担</li>
                        </ul>
                        <div className="visa-option-recommend">おすすめ</div>
                      </div>

                      <div
                        className={`visa-option-card ${registeredSupportOption === 'self' ? 'selected' : ''}`}
                        onClick={() => {
                          if (registeredSupportOption !== 'self') {
                            setShowSelfSupportWarning(true);
                          }
                        }}
                      >
                        <div className="visa-option-header">
                          <input
                            type="radio"
                            name="registeredSupport"
                            checked={registeredSupportOption === 'self'}
                            onChange={() => {}}
                          />
                          <h4>自社で支援する</h4>
                        </div>
                        <div className="visa-option-price">¥0</div>
                        <ul className="visa-option-features">
                          <li>・ 企業側の要件を満たす必要があります</li>
                          <li>・ 支援責任者の任命が必要</li>
                          <li>・ 支援担当者の任命が必要</li>
                          <li>・ 母国語対応可能な体制が必要</li>
                          <li>・ 全ての義務的支援の実施が必要</li>
                          <li>・ 支援記録の作成・保管が必要</li>
                        </ul>
                        <div className="self-support-recommendation">
                          <div className="self-support-recommendation-icon">💡</div>
                          <div className="self-support-recommendation-text">
                            <strong>こんな企業様におすすめ</strong><br />
                            既に特定技能外国人の受け入れ実績があり、<br />
                            支援体制が整っている企業様
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="visa-support-options">
                <h3>在留資格手続きの方法を選択してください</h3>

                <div className="visa-option-card-container">
                  <div
                    className={`visa-option-card ${visaSupportOption === 'full-support' ? 'selected' : ''}`}
                    onClick={() => setVisaSupportOption('full-support')}
                  >
                    <div className="visa-option-header">
                      <input
                        type="radio"
                        name="visaSupport"
                        checked={visaSupportOption === 'full-support'}
                        onChange={() => setVisaSupportOption('full-support')}
                      />
                      <h4>在留資格手続きフルサポート</h4>
                    </div>
                    <div className="visa-option-price">¥50,000 <span className="price-tax">(税別)</span></div>
                    <ul className="visa-option-features">
                      <li>✓ 必要書類の準備代行</li>
                      <li>✓ 入国管理局への申請代行</li>
                      <li>✓ 在留資格認定証明書の取得サポート</li>
                      <li>✓ 行政書士による専門サポート</li>
                      <li>✓ 手続き完了まで完全サポート</li>
                    </ul>
                    <div className="visa-option-recommend">おすすめ</div>
                  </div>

                  <div
                    className={`visa-option-card ${visaSupportOption === 'self' ? 'selected' : ''}`}
                    onClick={() => setVisaSupportOption('self')}
                  >
                    <div className="visa-option-header">
                      <input
                        type="radio"
                        name="visaSupport"
                        checked={visaSupportOption === 'self'}
                        onChange={() => setVisaSupportOption('self')}
                      />
                      <h4>自社で手続きする</h4>
                    </div>
                    <div className="visa-option-price">¥0</div>
                    <ul className="visa-option-features">
                      <li>・ 必要書類一覧の提供</li>
                      <li>・ 手続きガイドの提供</li>
                      <li>・ 自社で入国管理局に申請</li>
                      <li>・ 行政書士への相談は別途必要</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="visa-support-notice">
                <p><strong>ご注意:</strong></p>
                <ul>
                  <li>在留資格の取得には通常1〜3ヶ月程度かかります</li>
                  <li>申請が不許可となる場合もございます</li>
                  <li>フルサポートを選択された場合でも、企業様での書類準備が一部必要です</li>
                </ul>
              </div>

              <div className="visa-support-contact">
                <div className="contact-info-box">
                  <div className="contact-header">
                    <h4 className="contact-title">在留資格に関するご相談</h4>
                    <span className="contact-badge">相談料無料</span>
                  </div>
                  <div className="contact-company-name">行政書士法人Tree</div>
                  <div className="contact-details">
                    <div className="contact-item">
                      <div className="contact-label">電話</div>
                      <div className="contact-value">042-404-2927</div>
                    </div>
                    <div className="contact-item">
                      <div className="contact-label">メール</div>
                      <a href="mailto:info@office-tree.jp" className="contact-link">
                        info@office-tree.jp
                      </a>
                    </div>
                    <div className="contact-item">
                      <div className="contact-label">営業時間</div>
                      <div className="contact-value">9:00 - 17:00（日曜日を除く）</div>
                    </div>
                    <div className="contact-item">
                      <div className="contact-label">ウェブサイト</div>
                      <a href="https://office-tree.jp/" target="_blank" rel="noopener noreferrer" className="contact-link">
                        office-tree.jp
                      </a>
                    </div>
                  </div>
                  <div className="contact-note">
                    お電話またはメールの際に「AI人材マッチから」とお伝えください
                  </div>
                </div>
              </div>

              <div className="visa-support-actions">
                <button
                  className="visa-support-submit-btn"
                  onClick={handleVisaSupportSelection}
                  disabled={!visaSupportOption}
                >
                  次へ進む（決済画面）
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 自社支援要件確認モーダル */}
      {showSelfSupportRequirements && (
        <div className="self-support-modal" onClick={() => setShowSelfSupportRequirements(false)}>
          <div className="self-support-content" onClick={(e) => e.stopPropagation()}>
            <div className="self-support-header">
              <h2>自社支援の要件確認</h2>
              <button className="close-button" onClick={() => setShowSelfSupportRequirements(false)}>×</button>
            </div>

            <div className="self-support-body">
              <div className="self-support-notice">
                <p>
                  特定技能1号外国人を自社で支援する場合、以下の法律上の要件を全て満たす必要があります。
                  各項目について確認し、チェックを入れてください。
                </p>
              </div>

              {/* 企業側の要件 */}
              <div className="requirements-section">
                <h3 className="requirements-title">企業側の要件</h3>
                <div className="requirements-list">
                  {[
                    '過去2年以内に外国人労働者の雇用または管理をした実績があること',
                    '過去2年以内に外国人労働者の生活相談等をしたことのある社員の中から支援責任者や支援担当者を任命していること',
                    '外国人が十分理解できる言語（基本母国語対応）で支援を実施することができる体制を確保していること',
                    '支援状況に関する書類を作成し、雇用契約終了日から1年以上保管すること',
                    '支援責任者又は支援担当者が、支援計画の中立な立場で実施を行うことができ、かつ、欠格事由に該当しないこと',
                    '5年以内に支援計画に基づく支援を怠ったことがないこと'
                  ].map((req, index) => (
                    <label key={index} className="requirement-item">
                      <input
                        type="checkbox"
                        checked={selfSupportRequirements.companyRequirements[index]}
                        onChange={(e) => {
                          const newReqs = [...selfSupportRequirements.companyRequirements];
                          newReqs[index] = e.target.checked;
                          setSelfSupportRequirements({...selfSupportRequirements, companyRequirements: newReqs});
                        }}
                      />
                      <span>{req}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 支援責任者の要件 */}
              <div className="requirements-section">
                <h3 className="requirements-title">支援責任者の要件</h3>
                <div className="requirements-list">
                  {[
                    '企業にて役員または職員であること',
                    '過去2年以内に外国人労働者(中長期在留者)の雇用または管理、生活相談等を適切にしたことがある',
                    '登録拒否事由に該当してないこと',
                    '役員の配偶者、2親等内の親族、受け入れ企業の役員と密接な関係でないこと'
                  ].map((req, index) => (
                    <label key={index} className="requirement-item">
                      <input
                        type="checkbox"
                        checked={selfSupportRequirements.supervisorRequirements[index]}
                        onChange={(e) => {
                          const newReqs = [...selfSupportRequirements.supervisorRequirements];
                          newReqs[index] = e.target.checked;
                          setSelfSupportRequirements({...selfSupportRequirements, supervisorRequirements: newReqs});
                        }}
                      />
                      <span>{req}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 支援担当者の要件 */}
              <div className="requirements-section">
                <h3 className="requirements-title">支援担当者の要件</h3>
                <div className="requirements-list">
                  {[
                    '企業にて役員または職員であること',
                    '過去2年以内に外国人労働者(中長期在留者)の雇用または管理、生活相談等を適切にしたことがある',
                    '登録拒否事由に該当してないこと'
                  ].map((req, index) => (
                    <label key={index} className="requirement-item">
                      <input
                        type="checkbox"
                        checked={selfSupportRequirements.staffRequirements[index]}
                        onChange={(e) => {
                          const newReqs = [...selfSupportRequirements.staffRequirements];
                          newReqs[index] = e.target.checked;
                          setSelfSupportRequirements({...selfSupportRequirements, staffRequirements: newReqs});
                        }}
                      />
                      <span>{req}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 義務的支援の実施 */}
              <div className="requirements-section">
                <h3 className="requirements-title">義務的支援の実施</h3>
                <div className="requirements-list">
                  {[
                    '事前ガイダンスの実施',
                    '出入国の際の送迎',
                    '住居確保・生活に必要な契約支援',
                    '生活オリエンテーション',
                    '公的手続き等のサポート',
                    '日本語学習の機会の提供',
                    '相談・苦情への対応',
                    '日本人との交流促進',
                    '転職支援（雇用契約解除時）',
                    '定期的な面談の実施（3ヶ月に1回以上）',
                    '行政機関への通報'
                  ].map((req, index) => (
                    <label key={index} className="requirement-item">
                      <input
                        type="checkbox"
                        checked={selfSupportRequirements.supportActivities[index]}
                        onChange={(e) => {
                          const newReqs = [...selfSupportRequirements.supportActivities];
                          newReqs[index] = e.target.checked;
                          setSelfSupportRequirements({...selfSupportRequirements, supportActivities: newReqs});
                        }}
                      />
                      <span>{req}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="self-support-warning">
                <p><strong>重要な注意事項:</strong></p>
                <p>
                  これらの要件を満たしていない場合、特定技能外国人の受入れができません。
                  自社支援を選択される場合は、入国管理局に対して支援責任者名・支援担当者名・支援計画書などの書類を提出する必要があります。
                </p>
                <p>
                  書類の準備や提出手続きに不安がある場合、または要件を満たすことが困難な場合は、
                  登録支援機関への委託を強くおすすめします。
                </p>
              </div>

              <div className="self-support-actions">
                <button
                  className="back-to-visa-support-btn"
                  onClick={() => {
                    setShowSelfSupportRequirements(false);
                    setShowVisaSupportModal(true);
                  }}
                >
                  戻る
                </button>
                <button
                  className="confirm-self-support-btn"
                  onClick={() => {
                    const allChecked =
                      selfSupportRequirements.companyRequirements.every(r => r) &&
                      selfSupportRequirements.supervisorRequirements.every(r => r) &&
                      selfSupportRequirements.staffRequirements.every(r => r) &&
                      selfSupportRequirements.supportActivities.every(r => r);

                    if (!allChecked) {
                      alert('全ての要件にチェックを入れてください');
                      return;
                    }

                    const visaSupportFee = visaSupportOption === 'full-support' ? 50000 : 0;
                    setShowSelfSupportRequirements(false);
                    proceedToPayment(visaSupportFee, 0);
                  }}
                  disabled={
                    !selfSupportRequirements.companyRequirements.every(r => r) ||
                    !selfSupportRequirements.supervisorRequirements.every(r => r) ||
                    !selfSupportRequirements.staffRequirements.every(r => r) ||
                    !selfSupportRequirements.supportActivities.every(r => r)
                  }
                >
                  要件を満たしているので次へ進む
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 決済モーダル */}
      {showPaymentModal && selectedApplicant && (
        <div className="payment-modal" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-content" onClick={(e) => e.stopPropagation()}>
            <div className="payment-header">
              <h2>採用手続き・お支払い</h2>
              <button className="close-button" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>

            <div className="payment-body">
              <div className="payment-summary">
                <h3>採用内容の確認</h3>
                <div className="payment-summary-item">
                  <span className="payment-label">採用者:</span>
                  <span className="payment-value">{selectedApplicant.name}</span>
                </div>
                <div className="payment-summary-item">
                  <span className="payment-label">国籍:</span>
                  <span className="payment-value">{selectedApplicant.nationality}</span>
                </div>
              </div>

              <div className="payment-breakdown">
                <h3>料金明細</h3>
                <div className="payment-breakdown-item">
                  <span className="breakdown-label">成約料</span>
                  <span className="breakdown-value">¥{paymentData.placementFee.toLocaleString()}</span>
                </div>
                {paymentData.visaSupportFee > 0 && (
                  <div className="payment-breakdown-item">
                    <span className="breakdown-label">在留資格手続きフルサポート</span>
                    <span className="breakdown-value">¥{paymentData.visaSupportFee.toLocaleString()}</span>
                  </div>
                )}
                {paymentData.registeredSupportOrgFee > 0 && (
                  <div className="payment-breakdown-item">
                    <span className="breakdown-label">登録支援機関委託費用（初期費用）</span>
                    <span className="breakdown-value">¥{paymentData.registeredSupportOrgFee.toLocaleString()}</span>
                  </div>
                )}
                {paymentData.registeredSupportOrgFee > 0 && (
                  <div className="payment-breakdown-item">
                    <span className="breakdown-label" style={{ fontSize: '12px', color: '#6b7280' }}>
                      ※ 月額費用 ¥10,000（税別）は別途請求されます
                    </span>
                    <span className="breakdown-value"></span>
                  </div>
                )}
                {paymentData.registeredSupportOrgFee > 0 && (
                  <div className="payment-breakdown-item">
                    <span className="breakdown-label" style={{ fontSize: '12px', color: '#6b7280' }}>
                      ※ 交通費が発生した場合は実費負担
                    </span>
                    <span className="breakdown-value"></span>
                  </div>
                )}
                <div className="payment-breakdown-divider"></div>
                <div className="payment-breakdown-item payment-total">
                  <span className="breakdown-label">合計金額（税別）</span>
                  <span className="breakdown-value">¥{paymentData.totalAmount.toLocaleString()}</span>
                </div>
                <div className="payment-breakdown-item payment-total-tax">
                  <span className="breakdown-label">消費税（10%）</span>
                  <span className="breakdown-value">¥{Math.floor(paymentData.totalAmount * 0.1).toLocaleString()}</span>
                </div>
                <div className="payment-breakdown-item payment-total-final">
                  <span className="breakdown-label">お支払い総額（税込）</span>
                  <span className="breakdown-value">¥{Math.floor(paymentData.totalAmount * 1.1).toLocaleString()}</span>
                </div>
              </div>

              {selectedMessage?.profile?.partnerInfo && (
                <div className="payment-guarantee-info">
                  <h4>返金保証について</h4>
                  <p>紹介元: {selectedMessage.profile.partnerInfo.organizationName}</p>
                  {selectedMessage.profile.partnerInfo.guaranteePeriods &&
                   selectedMessage.profile.partnerInfo.guaranteePeriods.length > 0 && (
                    <ul>
                      {selectedMessage.profile.partnerInfo.guaranteePeriods.map((period, idx) => (
                        <li key={idx}>
                          入社後{period.months}ヶ月以内の退職: 成約料の{period.refundRate}%返金
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="payment-method-section">
                <h3>お支払い方法</h3>
                <div className="payment-method-options">
                  <div className="payment-method-card">
                    <input type="radio" name="paymentMethod" value="credit" defaultChecked />
                    <label>クレジットカード</label>
                  </div>
                  <div className="payment-method-card">
                    <input type="radio" name="paymentMethod" value="bank" />
                    <label>銀行振込</label>
                  </div>
                </div>
              </div>

              <div className="payment-terms">
                <label className="payment-terms-checkbox">
                  <input type="checkbox" required />
                  <span>
                    利用規約および返金保証規約に同意します。
                    採用確定後のキャンセルはできませんのでご注意ください。
                  </span>
                </label>
              </div>

              <div className="payment-actions">
                <button
                  className="payment-back-btn"
                  onClick={() => {
                    setShowPaymentModal(false);
                    if (selectedApplicant.nationality !== '日本') {
                      setShowVisaSupportModal(true);
                    }
                  }}
                >
                  戻る
                </button>
                <button
                  className="payment-submit-btn"
                  onClick={handlePaymentComplete}
                  disabled={loading}
                >
                  {loading ? '決済ページを準備中...' : 'Stripeで支払う'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 採用報告モーダル */}
      {showHiringReportModal && selectedTracking && (
        <div className="hiring-report-modal" onClick={() => setShowHiringReportModal(false)}>
          <div className="hiring-report-content" onClick={(e) => e.stopPropagation()}>
            <div className="hiring-report-header">
              <h2>採用報告</h2>
              <button className="close-button" onClick={() => setShowHiringReportModal(false)}>×</button>
            </div>

            <div className="hiring-report-body">
              <div className="hiring-report-info">
                <p><strong>応募者:</strong> {selectedTracking.applicantName}</p>
                <p><strong>ポジション:</strong> {selectedTracking.positionTitle}</p>
              </div>

              <form className="hiring-report-form">
                <div className="form-group">
                  <label>入社予定日</label>
                  <input
                    type="date"
                    value={hiringReportForm.startDate}
                    onChange={(e) => setHiringReportForm({...hiringReportForm, startDate: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>提示年収（円）</label>
                  <input
                    type="number"
                    placeholder="例: 5000000"
                    value={hiringReportForm.salary}
                    onChange={(e) => setHiringReportForm({...hiringReportForm, salary: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>備考（任意）</label>
                  <textarea
                    rows="3"
                    placeholder="その他特記事項があれば記入してください"
                    value={hiringReportForm.notes}
                    onChange={(e) => setHiringReportForm({...hiringReportForm, notes: e.target.value})}
                  />
                </div>

                <div className="hiring-report-actions">
                  <button
                    type="button"
                    className="submit-hiring-btn"
                    onClick={() => handleSubmitHiringReport(true)}
                  >
                    採用報告を送信
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyApp;
