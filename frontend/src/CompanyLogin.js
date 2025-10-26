import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './CompanyLogin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function CompanyLogin() {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // トークン検証処理
  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (token && type === 'company') {
      verifyToken(token);
    }
  }, [searchParams]);

  const verifyToken = async (token) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/verify/${token}?type=company`, {
        withCredentials: true
      });

      if (response.data.user) {
        setMessage('ログイン成功！企業ポータルにリダイレクトしています...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'トークンの検証に失敗しました');
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post(`${API_URL}/companies/login`, {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem('companyToken', response.data.token);
        setMessage('ログイン成功！リダイレクトしています...');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/request-login`, {
        email,
        name,
        userType: 'company'
      });

      setMessage(response.data.message || '登録用のURLをメールアドレスに送信しました。メールをご確認ください。');

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
      setError(err.response?.data?.error || '登録リクエストに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setAuthMode('register');
    setEmail('test@company.com');
    setName('テスト企業');

    // 自動でフォーム送信
    setTimeout(() => {
      document.querySelector('form').requestSubmit();
    }, 100);
  };

  return (
    <div className="company-login-container">
      <div className="company-login-box">
        <h1>企業ポータル</h1>
        <p className="login-description">
          AI人材マッチングシステム
        </p>

        {/* タブ切り替え */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('login');
              setMessage('');
              setError('');
            }}
          >
            ログイン
          </button>
          <button
            className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('register');
              setMessage('');
              setError('');
            }}
          >
            新規登録
          </button>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* ログインフォーム */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">メールアドレスまたはユーザーID</label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="company@example.com または ユーザーID"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        )}

        {/* 新規登録フォーム */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="company@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">企業名</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="株式会社〇〇"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? '送信中...' : '登録用URLを送信'}
            </button>

            <p className="register-note">
              ご入力いただいたメールアドレスに、アカウント登録用のURLをお送りします。
            </p>
          </form>
        )}

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
              test@company.com / テスト企業
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompanyLogin;
