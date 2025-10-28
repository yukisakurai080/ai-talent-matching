import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './CompanyLogin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function CompanyLogin() {
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'magic-link'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // ログイン済みのメッセージを表示
    if (location.state?.message) {
      setMessage(location.state.message);
      if (location.state.email) {
        setEmail(location.state.email);
      }
    }
  }, [location]);

  // トークン検証処理（後方互換性のため残す）
  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (token && type === 'company') {
      navigate(`/auth/verify?token=${token}&type=${type}`);
    }
  }, [searchParams, navigate]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        userType: 'company'
      }, {
        withCredentials: true
      });

      setMessage('ログイン成功！企業ポータルにリダイレクトしています...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkRequest = async (e) => {
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

      setEmail('');
      setName('');
    } catch (err) {
      setError(err.response?.data?.error || '登録リクエストに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-login-container">
      <div className="company-login-box">
        <h1>企業ポータル ログイン</h1>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* ログインモード切り替え */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #565869'
        }}>
          <button
            type="button"
            onClick={() => setLoginMode('password')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              borderBottom: loginMode === 'password' ? '2px solid #10a37f' : 'none',
              color: loginMode === 'password' ? '#10a37f' : '#8e8ea0',
              fontWeight: loginMode === 'password' ? '600' : '400',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('magic-link')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              borderBottom: loginMode === 'magic-link' ? '2px solid #10a37f' : 'none',
              color: loginMode === 'magic-link' ? '#10a37f' : '#8e8ea0',
              fontWeight: loginMode === 'magic-link' ? '600' : '400',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            新規登録
          </button>
        </div>

        {loginMode === 'password' ? (
          // パスワードログインフォーム
          <form onSubmit={handlePasswordLogin}>
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
              <label htmlFor="password">パスワード</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        ) : (
          // 新規登録フォーム
          <form onSubmit={handleMagicLinkRequest}>
            <p className="login-description">
              メールアドレスと企業名を入力して登録用リンクを受け取ってください
            </p>

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
              {loading ? '送信中...' : '登録用リンクを送信'}
            </button>
          </form>
        )}

        <div className="login-footer">
          {loginMode === 'password' ? (
            <p style={{ textAlign: 'center', color: '#8e8ea0', fontSize: '14px' }}>
              初めての方は「新規登録」タブから登録してください
            </p>
          ) : (
            <p style={{ textAlign: 'center', color: '#8e8ea0', fontSize: '14px' }}>
              登録用リンクをメールで送信します。メールをご確認ください。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanyLogin;
