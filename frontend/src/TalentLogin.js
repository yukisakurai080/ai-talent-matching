import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './TalentLogin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function TalentLogin() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // トークン検証処理
  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (token && type === 'talent') {
      verifyToken(token);
    }
  }, [searchParams]);

  const verifyToken = async (token) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/verify/${token}?type=talent`, {
        withCredentials: true
      });

      if (response.data.user) {
        setMessage('ログイン成功！ジョブリストにリダイレクトしています...');
        setTimeout(() => {
          navigate('/talent/jobs');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'トークンの検証に失敗しました');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/request-login`, {
        email,
        name: isNewUser ? name : undefined,
        userType: 'talent'
      });

      setMessage(response.data.message);

      // 開発環境の場合、マジックリンクを表示
      if (response.data.developmentUrl) {
        const confirmNavigate = window.confirm(
          '開発環境: マジックリンクが生成されました。\n\nコンソールにもURLが出力されています。\n\n今すぐログインしますか？'
        );

        if (confirmNavigate) {
          const token = new URL(response.data.developmentUrl).searchParams.get('token');
          verifyToken(token);
        }
      }

      setEmail('');
      setName('');
    } catch (err) {
      setError(err.response?.data?.error || 'ログインリクエストに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setEmail('test@talent.com');
    setName('テスト太郎');
    setIsNewUser(true);

    // 自動でフォーム送信
    setTimeout(() => {
      document.querySelector('form').requestSubmit();
    }, 100);
  };

  return (
    <div className="talent-login-container">
      <div className="talent-login-box">
        <h1>ジョブリスト ログイン</h1>
        <p className="login-description">
          メールアドレスまたはユーザーIDを入力してログインリンクを受け取ってください
        </p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">メールアドレスまたはユーザーID</label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="talent@example.com または ユーザーID"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isNewUser}
                onChange={(e) => setIsNewUser(e.target.checked)}
                disabled={loading}
              />
              新規登録
            </label>
          </div>

          {isNewUser && (
            <div className="form-group">
              <label htmlFor="name">お名前</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 太郎"
                required
                disabled={loading}
              />
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '送信中...' : isNewUser ? '登録してログインリンクを送信' : 'ログインリンクを送信'}
          </button>
        </form>

        {process.env.NODE_ENV !== 'production' && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#40414f', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#8e8ea0' }}>
              テスト用アカウント
            </p>
            <button
              onClick={handleTestLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#10a37f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              テストアカウントでログイン
            </button>
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#8e8ea0' }}>
              test@talent.com / テスト太郎
            </p>
          </div>
        )}

        <div className="login-footer">
          <p>初めての方は「新規登録」にチェックを入れてください</p>
        </div>
      </div>
    </div>
  );
}

export default TalentLogin;
