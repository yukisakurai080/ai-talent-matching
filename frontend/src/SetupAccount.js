import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SetupAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || !type) {
      setError('無効なリンクです');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify/${token}?type=${type}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'トークン検証に失敗しました');
      }

      if (data.redirectToLogin) {
        // アカウント設定済みの場合、ログイン画面にリダイレクト
        navigate(`/${type === 'company' ? 'login' : 'talent/login'}`, {
          state: { message: data.message, email: data.email }
        });
        return;
      }

      if (data.needsPasswordSetup) {
        setUserData(data.user);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || 'トークン検証中にエラーが発生しました');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (password.length < 8) {
      setError('パスワードは8文字以上である必要があります');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      const response = await fetch(`${API_URL}/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ token, password, type })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'パスワード設定に失敗しました');
      }

      // 成功したら、ダッシュボードにリダイレクト（ページ全体をリロード）
      if (type === 'company') {
        window.location.href = '/ZinAI/';
      } else {
        window.location.href = '/ZinAI/talent/jobs';
      }
    } catch (err) {
      setError(err.message || 'パスワード設定中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>確認中...</p>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          padding: '32px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <span style={{ color: '#dc2626', fontSize: '24px' }}>⚠</span>
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1f2937' }}>エラー</h2>
          <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            トップページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: '#2563eb',
          padding: '32px 24px',
          textAlign: 'center'
        }}>
          <h1 style={{
            color: '#ffffff',
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            ZinAI
          </h1>
          <p style={{
            color: '#e0e7ff',
            margin: 0,
            fontSize: '14px'
          }}>
            アカウント設定
          </p>
        </div>

        {/* メインコンテンツ */}
        <div style={{ padding: '32px' }}>
          {userData && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#1f2937', fontSize: '15px', margin: '0 0 4px 0' }}>
                {userData.name} 様
              </p>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {userData.email}
              </p>
            </div>
          )}

          <p style={{
            color: '#4b5563',
            fontSize: '14px',
            lineHeight: '1.6',
            margin: '0 0 24px 0'
          }}>
            アカウントのパスワードを設定してください。
          </p>

          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <p style={{ color: '#dc2626', margin: 0, fontSize: '14px' }}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px'
              }}>
                パスワード（8文字以上）
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px'
              }}>
                パスワード（確認）
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? '設定中...' : 'アカウント設定を完了する'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SetupAccount;
