import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './PaymentSuccess.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('セッションIDが見つかりません');
      setLoading(false);
      return;
    }

    // Stripeセッション情報を取得
    const fetchSession = async () => {
      try {
        const response = await axios.get(`${API_URL}/payments/session/${sessionId}`);
        setSession(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('決済情報の取得に失敗しました');
        setLoading(false);
      }
    };

    fetchSession();
  }, [searchParams]);

  const handleBackToCompanyApp = () => {
    navigate('/company-app');
  };

  if (loading) {
    return (
      <div className="payment-success-container">
        <div className="payment-success-content">
          <div className="loading-spinner"></div>
          <p>決済情報を確認中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success-container">
        <div className="payment-success-content">
          <div className="error-icon">❌</div>
          <h1>エラー</h1>
          <p>{error}</p>
          <button className="back-button" onClick={handleBackToCompanyApp}>
            企業ページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="payment-success-content">
        <div className="success-icon">✅</div>
        <h1>お支払いが完了しました</h1>
        <p className="success-message">
          採用手続きが正常に完了しました。ありがとうございました。
        </p>

        {session && session.metadata && (
          <div className="payment-details">
            <h2>決済内容</h2>
            <div className="detail-item">
              <span className="detail-label">採用者:</span>
              <span className="detail-value">{session.metadata.applicantName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">支払金額:</span>
              <span className="detail-value">
                ¥{(session.amount_total / 100).toLocaleString()}（税込）
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">決済ID:</span>
              <span className="detail-value">{session.id}</span>
            </div>
          </div>
        )}

        <div className="next-steps">
          <h3>次のステップ</h3>
          <ul>
            <li>確認メールをご確認ください</li>
            <li>採用者との連絡を開始してください</li>
            <li>必要な書類の準備を進めてください</li>
          </ul>
        </div>

        <button className="back-button" onClick={handleBackToCompanyApp}>
          企業ページに戻る
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
