import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentCancel.css';

function PaymentCancel() {
  const navigate = useNavigate();

  const handleBackToCompanyApp = () => {
    navigate('/company-app');
  };

  return (
    <div className="payment-cancel-container">
      <div className="payment-cancel-content">
        <div className="cancel-icon">⚠️</div>
        <h1>お支払いがキャンセルされました</h1>
        <p className="cancel-message">
          決済処理がキャンセルされました。再度お試しいただくか、お問い合わせください。
        </p>

        <div className="cancel-info">
          <h3>キャンセルされた理由</h3>
          <ul>
            <li>ブラウザの戻るボタンをクリックした</li>
            <li>決済画面でキャンセルボタンを押した</li>
            <li>タイムアウトが発生した</li>
          </ul>
        </div>

        <div className="next-actions">
          <h3>次のアクション</h3>
          <p>もう一度決済を試みるか、企業ページに戻ってください。</p>
        </div>

        <button className="back-button" onClick={handleBackToCompanyApp}>
          企業ページに戻る
        </button>
      </div>
    </div>
  );
}

export default PaymentCancel;
