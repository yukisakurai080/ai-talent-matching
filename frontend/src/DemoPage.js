import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import './CompanyApp.css';

function DemoPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'デモモードへようこそ！このページでは認証なしでシステムを体験できます。\n\nAI人材マッチングシステムの機能をお試しください。'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState(null);

  // デモ用人材データ
  const demoTalents = [
    {
      _id: 'demo1',
      name: '山田 太郎',
      nationality: '日本',
      language: '日本語',
      skills: ['React', 'Node.js', 'MongoDB'],
      experience: '5年',
      education: '東京大学 工学部',
      desiredSalary: '600万円',
      status: 'active',
      aiScore: 85,
      matchedAt: new Date().toISOString()
    },
    {
      _id: 'demo2',
      name: 'John Smith',
      nationality: 'アメリカ',
      language: '英語',
      skills: ['Python', 'Machine Learning', 'AWS'],
      experience: '7年',
      education: 'MIT Computer Science',
      desiredSalary: '800万円',
      status: 'active',
      aiScore: 92,
      matchedAt: new Date().toISOString()
    },
    {
      _id: 'demo3',
      name: 'リー・ウェイ',
      nationality: '中国',
      language: '中国語',
      skills: ['Java', 'Spring Boot', 'Docker'],
      experience: '4年',
      education: '清華大学 情報工学部',
      desiredSalary: '550万円',
      status: 'active',
      aiScore: 78,
      matchedAt: new Date().toISOString()
    }
  ];

  const [talents, setTalents] = useState(demoTalents);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // ユーザーメッセージを追加
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // デモ用の自動応答
    setTimeout(() => {
      const demoResponse = generateDemoResponse(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: demoResponse }]);
      setIsLoading(false);
    }, 1000);
  };

  const generateDemoResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('react') || lowerMessage.includes('フロントエンド')) {
      return '山田 太郎さんは React の経験が豊富で、5年間のフロントエンド開発経験があります。東京大学工学部出身で、技術力は確かです。';
    }

    if (lowerMessage.includes('python') || lowerMessage.includes('機械学習') || lowerMessage.includes('ai')) {
      return 'John Smith さんは Python と機械学習の専門家です。MIT卒業で7年の経験があり、AWS を使ったインフラ構築も得意です。';
    }

    if (lowerMessage.includes('java') || lowerMessage.includes('バックエンド')) {
      return 'リー・ウェイさんは Java と Spring Boot を使ったバックエンド開発が得意です。Docker を使ったコンテナ化の経験もあります。';
    }

    if (lowerMessage.includes('おすすめ') || lowerMessage.includes('候補')) {
      return 'マッチング度が高い順にご紹介すると：\n\n1. John Smith（92点）- AI/ML開発\n2. 山田 太郎（85点）- フロントエンド開発\n3. リー・ウェイ（78点）- バックエンド開発\n\n詳細は右側の人材リストをご確認ください。';
    }

    return 'ご質問ありがとうございます。デモモードでは限定的な応答となりますが、実際のシステムではAIが御社の要件に最適な人材を提案いたします。\n\n右側の人材リストから詳細をご確認いただけます。';
  };

  const handleTalentClick = (talent) => {
    setSelectedTalent(talent);
  };

  const handleBackToAuth = () => {
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* ヘッダー */}
      <header className="app-header">
        <h1>AI人材マッチング - デモモード</h1>
        <div className="header-actions">
          <span className="demo-badge">🎭 デモモード</span>
          <button onClick={handleBackToAuth} className="logout-button">
            ログイン画面へ
          </button>
        </div>
      </header>

      <div className="main-content">
        {/* 左側: AIチャット */}
        <div className="chat-section">
          <div className="chat-header">
            <h2>AIアシスタント（デモ）</h2>
          </div>

          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="例: Reactの経験がある人材を探しています"
              disabled={isLoading}
              className="chat-input"
            />
            <button type="submit" disabled={isLoading || !inputMessage.trim()} className="send-button">
              送信
            </button>
          </form>
        </div>

        {/* 右側: マッチング人材リスト */}
        <div className="talents-section">
          <div className="talents-header">
            <h2>マッチング人材（デモデータ）</h2>
            <span className="talents-count">{talents.length}名</span>
          </div>

          <div className="talents-list">
            {talents.map((talent) => (
              <div
                key={talent._id}
                className={`talent-card ${selectedTalent?._id === talent._id ? 'selected' : ''}`}
                onClick={() => handleTalentClick(talent)}
              >
                <div className="talent-header">
                  <h3>{talent.name}</h3>
                  <span className="ai-score" title="AIマッチングスコア">
                    ⭐ {talent.aiScore}点
                  </span>
                </div>

                <div className="talent-info">
                  <p><strong>国籍:</strong> {talent.nationality}</p>
                  <p><strong>言語:</strong> {talent.language}</p>
                  <p><strong>経験:</strong> {talent.experience}</p>
                  <p><strong>学歴:</strong> {talent.education}</p>
                </div>

                <div className="talent-skills">
                  <strong>スキル:</strong>
                  <div className="skills-tags">
                    {talent.skills.map((skill, idx) => (
                      <span key={idx} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="talent-footer">
                  <span className="salary">💰 希望年収: {talent.desiredSalary}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 選択された人材の詳細モーダル */}
      {selectedTalent && (
        <div className="modal-overlay" onClick={() => setSelectedTalent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTalent.name} の詳細情報</h2>
              <button className="close-button" onClick={() => setSelectedTalent(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>基本情報</h3>
                <p><strong>国籍:</strong> {selectedTalent.nationality}</p>
                <p><strong>言語:</strong> {selectedTalent.language}</p>
                <p><strong>経験年数:</strong> {selectedTalent.experience}</p>
                <p><strong>学歴:</strong> {selectedTalent.education}</p>
                <p><strong>希望年収:</strong> {selectedTalent.desiredSalary}</p>
              </div>

              <div className="detail-section">
                <h3>スキルセット</h3>
                <div className="skills-tags">
                  {selectedTalent.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag large">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>AIマッチングスコア</h3>
                <div className="score-display">
                  <span className="score-number">{selectedTalent.aiScore}</span>
                  <span className="score-label">/ 100点</span>
                </div>
                <p className="score-description">
                  {selectedTalent.aiScore >= 90 && '非常に高いマッチング率です。即座に面接をお勧めします。'}
                  {selectedTalent.aiScore >= 80 && selectedTalent.aiScore < 90 && '高いマッチング率です。有力な候補者として検討をお勧めします。'}
                  {selectedTalent.aiScore < 80 && 'マッチング率は中程度です。追加のスキル確認をお勧めします。'}
                </p>
              </div>

              <div className="demo-notice">
                <p>💡 デモモードでは連絡機能は使用できません。</p>
                <p>実際のシステムでは、ここからメッセージ送信や面接日程調整が可能です。</p>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedTalent(null)} className="button secondary">
                閉じる
              </button>
              <button className="button primary" disabled>
                メッセージを送る（デモ）
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="demo-footer">
        <p>これはデモモードです。実際のシステムでは、リアルタイムでAIが最適な人材を提案し、メッセージのやり取りや面接設定が可能です。</p>
        <button onClick={handleBackToAuth} className="button primary">
          本番システムにログイン
        </button>
      </div>
    </div>
  );
}

export default DemoPage;
