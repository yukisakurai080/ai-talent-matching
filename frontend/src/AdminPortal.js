import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPortal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [adminInfo, setAdminInfo] = useState(null);

  // ログインフォーム
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // ダッシュボードデータ
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [aiUsageDetail, setAiUsageDetail] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [conversations, setConversations] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, ai-usage, conversations, system, users, monitoring
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState(null);
  const [userFilter, setUserFilter] = useState({ userType: '', status: '' });
  const [monitoringData, setMonitoringData] = useState(null);

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await axios.post(`${API_URL}/admin/login`, {
        email,
        password
      });

      const { token: newToken, admin } = response.data;
      setToken(newToken);
      setAdminInfo(admin);
      localStorage.setItem('adminToken', newToken);
      setIsLoggedIn(true);

      fetchDashboardData(newToken);
    } catch (error) {
      setLoginError(error.response?.data?.error || 'ログインに失敗しました');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setAdminInfo(null);
    setIsLoggedIn(false);
    localStorage.removeItem('adminToken');
  };

  const fetchUsers = async (page = 1) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);
      if (userFilter.userType) params.append('userType', userFilter.userType);
      if (userFilter.status) params.append('status', userFilter.status);

      const response = await axios.get(`${API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/admin/users/${userId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('ステータス更新に失敗しました');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('本当にこのユーザーを削除しますか？')) return;

    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.error || 'ユーザー削除に失敗しました');
    }
  };

  const handleRestrictUser = async (userId, duration) => {
    const reason = prompt('制限理由を入力してください:');
    if (reason === null) return; // キャンセル

    try {
      await axios.post(`${API_URL}/admin/users/${userId}/restrict`,
        { duration, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('ユーザーを制限しました');
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'ai-usage') {
        fetchDashboardData();
      } else if (activeTab === 'conversations') {
        fetchConversations();
      }
    } catch (error) {
      console.error('Error restricting user:', error);
      alert(error.response?.data?.error || 'ユーザー制限に失敗しました');
    }
  };

  const handleUnrestrictUser = async (userId) => {
    if (!window.confirm('このユーザーの制限を解除しますか？')) return;

    try {
      await axios.post(`${API_URL}/admin/users/${userId}/unrestrict`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('ユーザー制限を解除しました');
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'ai-usage') {
        fetchDashboardData();
      } else if (activeTab === 'conversations') {
        fetchConversations();
      }
    } catch (error) {
      console.error('Error unrestricting user:', error);
      alert(error.response?.data?.error || 'ユーザー制限解除に失敗しました');
    }
  };

  const fetchDashboardData = async (authToken) => {
    const tokenToUse = authToken || token;
    if (!tokenToUse) return;

    setLoading(true);
    try {
      const [statsResponse, activityResponse, aiUsageResponse, systemStatsResponse] = await Promise.all([
        axios.get(`${API_URL}/admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${tokenToUse}` }
        }),
        axios.get(`${API_URL}/admin/recent-activity?limit=10`, {
          headers: { Authorization: `Bearer ${tokenToUse}` }
        }),
        axios.get(`${API_URL}/admin/ai-usage-detail`, {
          headers: { Authorization: `Bearer ${tokenToUse}` }
        }),
        axios.get(`${API_URL}/admin/system-stats`, {
          headers: { Authorization: `Bearer ${tokenToUse}` }
        })
      ]);

      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data);
      setAiUsageDetail(aiUsageResponse.data);
      setSystemStats(systemStatsResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/admin/conversations?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchConversationDetail = async (sessionId) => {
    try {
      const response = await axios.get(`${API_URL}/admin/conversations/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedConversation(response.data);
    } catch (error) {
      console.error('Error fetching conversation detail:', error);
    }
  };

  const fetchMonitoringData = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/message-monitoring`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMonitoringData(response.data);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    }
  };

  // ログイン画面
  if (!isLoggedIn) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-container">
          <div className="admin-login-header">
            <h1>管理者ログイン</h1>
            <p>マスター管理サイト</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            {loginError && (
              <div className="login-error">{loginError}</div>
            )}

            <div className="form-group">
              <label>メールアドレスまたはユーザーID</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com または ユーザーID"
              />
            </div>

            <div className="form-group">
              <label>パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="login-btn">
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ダッシュボード画面
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* ヘッダー */}
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>マスター管理サイト</h1>
          <div className="admin-header-actions">
            <span className="admin-user">{adminInfo?.username || 'Admin'}</span>
            <button onClick={handleLogout} className="logout-btn">ログアウト</button>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          概要
        </button>
        <button
          className={`admin-tab ${activeTab === 'ai-usage' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-usage')}
        >
          AI利用監視
        </button>
        <button
          className={`admin-tab ${activeTab === 'conversations' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('conversations');
            if (!conversations) fetchConversations();
          }}
        >
          会話履歴
        </button>
        <button
          className={`admin-tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          システム統計
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('users');
            if (!users) fetchUsers();
          }}
        >
          ユーザー管理
        </button>
        <button
          className={`admin-tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('monitoring');
            fetchMonitoringData();
          }}
        >
          メッセージ監視
        </button>
      </div>

      {/* メインコンテンツ */}
      <div className="admin-main">
        {/* 概要タブ */}
        {activeTab === 'overview' && (
          <>
            {/* 統計カード */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <h3>企業登録</h3>
                </div>
                <div className="stat-number">{stats?.overview?.companies?.total || 0}</div>
                <div className="stat-label">
                  <span className="stat-active">アクティブ: {stats?.overview?.companies?.active || 0}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>求職者登録</h3>
                </div>
                <div className="stat-number">{stats?.overview?.talents?.total || 0}</div>
                <div className="stat-label">
                  <span className="stat-active">アクティブ: {stats?.overview?.talents?.active || 0}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>パートナー</h3>
                </div>
                <div className="stat-number">{stats?.overview?.partners?.total || 0}</div>
                <div className="stat-label">
                  <span className="stat-active">アクティブ: {stats?.overview?.partners?.active || 0}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>AI利用状況</h3>
                </div>
                <div className="stat-number">
                  {stats?.aiUsage?.reduce((sum, item) => sum + item.totalRequests, 0) || 0}
                </div>
                <div className="stat-label">直近30日のリクエスト数</div>
              </div>
            </div>

            {/* AI使用統計 */}
            {stats?.aiUsage && stats.aiUsage.length > 0 && (
              <div className="dashboard-section">
                <h2>AI使用統計（直近30日）</h2>
                <div className="ai-usage-table">
                  <table>
                    <thead>
                      <tr>
                        <th>機能</th>
                        <th>リクエスト数</th>
                        <th>トークン数</th>
                        <th>推定コスト</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.aiUsage.map((usage, index) => (
                        <tr key={index}>
                          <td>{usage._id}</td>
                          <td>{usage.totalRequests.toLocaleString()}</td>
                          <td>{usage.totalTokens.toLocaleString()}</td>
                          <td>¥{usage.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* パートナー統計 */}
            {stats?.partnerStats && stats.partnerStats.length > 0 && (
              <div className="dashboard-section">
                <h2>パートナー別登録人材数（上位10件）</h2>
                <div className="partner-stats-table">
                  <table>
                    <thead>
                      <tr>
                        <th>組織名</th>
                        <th>国</th>
                        <th>登録人材数</th>
                        <th>登録日</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.partnerStats.map((partner, index) => (
                        <tr key={index}>
                          <td>{partner.organizationName}</td>
                          <td>{partner.country}</td>
                          <td className="highlight-number">{partner.registeredTalentsCount}</td>
                          <td>{new Date(partner.createdAt).toLocaleDateString('ja-JP')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 最近のアクティビティ */}
            {recentActivity && (
              <div className="dashboard-section">
                <h2>最近のアクティビティ</h2>
                <div className="activity-tabs">
                  <div className="activity-section">
                    <h3>最近登録された企業</h3>
                    <div className="activity-list">
                      {recentActivity.companies?.length > 0 ? (
                        recentActivity.companies.map((company, index) => (
                          <div key={index} className="activity-item">
                            <div className="activity-info">
                              <div className="activity-name">{company.companyName}</div>
                              <div className="activity-meta">
                                {company.industry} | {company.status}
                              </div>
                            </div>
                            <div className="activity-date">
                              {new Date(company.createdAt).toLocaleString('ja-JP')}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-data">データがありません</p>
                      )}
                    </div>
                  </div>

                  <div className="activity-section">
                    <h3>最近登録された求職者</h3>
                    <div className="activity-list">
                      {recentActivity.talents?.length > 0 ? (
                        recentActivity.talents.map((talent, index) => (
                          <div key={index} className="activity-item">
                            <div className="activity-info">
                              <div className="activity-name">{talent.name}</div>
                              <div className="activity-meta">
                                {talent.industry} | {talent.desiredPosition}
                                {talent.partnerCode && ` | パートナー経由`}
                              </div>
                            </div>
                            <div className="activity-date">
                              {new Date(talent.createdAt).toLocaleString('ja-JP')}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-data">データがありません</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* AI利用監視タブ */}
        {activeTab === 'ai-usage' && aiUsageDetail && (
          <>
            {/* アラート */}
            {aiUsageDetail.alerts && aiUsageDetail.alerts.highFrequency > 0 && (
              <div className="alert-warning">
                <h3>要注意監視対象</h3>
                <p>{aiUsageDetail.alerts.highFrequency}件の高頻度利用セッションを検出しました</p>
              </div>
            )}

            {/* 高頻度利用者 */}
            <div className="dashboard-section">
              <h2>高頻度利用者（要注意監視対象）</h2>
              <p style={{ fontSize: '13px', color: '#8e8ea0', marginBottom: '10px' }}>
                ※ セッションIDをクリックすると会話履歴を確認できます。ユーザー制限は「会話履歴」タブまたは「ユーザー管理」タブから実施してください。
              </p>
              <div className="high-frequency-table">
                <table>
                  <thead>
                    <tr>
                      <th>セッションID</th>
                      <th>リクエスト数</th>
                      <th>トークン数</th>
                      <th>推定コスト</th>
                      <th>最終利用</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsageDetail.highFrequencyUsers?.length > 0 ? (
                      aiUsageDetail.highFrequencyUsers.map((user, index) => (
                        <tr key={index} className="warning-row">
                          <td>
                            <button
                              onClick={() => {
                                setActiveTab('conversations');
                                fetchConversationDetail(user._id);
                              }}
                              style={{
                                background: 'transparent',
                                color: '#10a37f',
                                border: 'none',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                padding: '0',
                                fontSize: '12px'
                              }}
                            >
                              {user._id}
                            </button>
                          </td>
                          <td className="highlight-number">{user.requestCount.toLocaleString()}</td>
                          <td>{user.totalTokens.toLocaleString()}</td>
                          <td>¥{user.totalCost.toFixed(2)}</td>
                          <td>{new Date(user.lastUsed).toLocaleString('ja-JP')}</td>
                          <td>
                            <button
                              onClick={() => {
                                setActiveTab('conversations');
                                fetchConversationDetail(user._id);
                              }}
                              style={{
                                background: '#10a37f',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              詳細確認
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="no-data">要注意対象はありません</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* トークン使用量上位 */}
            <div className="dashboard-section">
              <h2>トークン使用量上位（上位50件）</h2>
              <div className="token-usage-table">
                <table>
                  <thead>
                    <tr>
                      <th>セッションID</th>
                      <th>リクエスト数</th>
                      <th>トークン数</th>
                      <th>推定コスト</th>
                      <th>最終利用</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsageDetail.topTokenUsers?.map((user, index) => (
                      <tr key={index}>
                        <td>{user._id}</td>
                        <td>{user.requestCount.toLocaleString()}</td>
                        <td>{user.totalTokens.toLocaleString()}</td>
                        <td>¥{user.totalCost.toFixed(2)}</td>
                        <td>{new Date(user.lastUsed).toLocaleString('ja-JP')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 翻訳統計 */}
            {aiUsageDetail.translationStats?.length > 0 && (
              <div className="dashboard-section">
                <h2>翻訳使用統計</h2>
                <div className="translation-stats-table">
                  <table>
                    <thead>
                      <tr>
                        <th>対象言語</th>
                        <th>機能</th>
                        <th>使用回数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiUsageDetail.translationStats.map((stat, index) => (
                        <tr key={index}>
                          <td>{stat._id.targetLang || '不明'}</td>
                          <td>{stat._id.feature || '不明'}</td>
                          <td>{stat.count.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* 会話履歴タブ */}
        {activeTab === 'conversations' && (
          <div className="dashboard-section">
            <h2>AI会話履歴</h2>
            {selectedConversation ? (
              <div className="conversation-detail">
                <button onClick={() => setSelectedConversation(null)} className="back-btn">
                  ← 一覧に戻る
                </button>
                <div className="conversation-header">
                  <h3>セッションID: {selectedConversation.conversation.sessionId}</h3>
                  <p>作成日: {new Date(selectedConversation.conversation.createdAt).toLocaleString('ja-JP')}</p>

                  {/* ユーザー情報と制限ボタン */}
                  {selectedConversation.user && (
                    <div style={{
                      marginTop: '15px',
                      padding: '15px',
                      background: '#40414f',
                      borderRadius: '8px',
                      border: '1px solid #565869'
                    }}>
                      <h4 style={{ marginBottom: '10px', color: '#ececf1' }}>ユーザー情報</h4>
                      <div style={{ fontSize: '13px', color: '#8e8ea0', marginBottom: '10px' }}>
                        <div>メール: {selectedConversation.user.email}</div>
                        <div>名前: {selectedConversation.user.name}</div>
                        <div>タイプ: {selectedConversation.user.userType === 'company' ? '企業' : '人材'}</div>
                        <div>ステータス:
                          <span style={{
                            color: selectedConversation.user.status === 'active' ? '#10a37f' :
                                   selectedConversation.user.status === 'suspended' ? '#f87171' : '#8e8ea0',
                            marginLeft: '5px'
                          }}>
                            {selectedConversation.user.status === 'active' ? 'アクティブ' :
                             selectedConversation.user.status === 'suspended' ? '停止中' : '非アクティブ'}
                          </span>
                        </div>
                        {selectedConversation.user.restrictedUntil &&
                         new Date(selectedConversation.user.restrictedUntil) > new Date() && (
                          <div style={{ color: '#f87171', marginTop: '5px' }}>
                            制限中: {new Date(selectedConversation.user.restrictedUntil).toLocaleDateString('ja-JP')}まで
                            {selectedConversation.user.restrictionReason && (
                              <div style={{ fontSize: '11px', marginTop: '3px' }}>
                                理由: {selectedConversation.user.restrictionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleRestrictUser(selectedConversation.user._id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          style={{
                            background: '#d97706',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          <option value="">このユーザーを制限</option>
                          <option value="1day">1日制限</option>
                          <option value="3days">3日制限</option>
                          <option value="7days">7日制限</option>
                          <option value="30days">30日制限</option>
                          <option value="1year">1年制限</option>
                          <option value="permanent">停止処分</option>
                        </select>

                        {selectedConversation.user.restrictedUntil &&
                         new Date(selectedConversation.user.restrictedUntil) > new Date() && (
                          <button
                            onClick={() => handleUnrestrictUser(selectedConversation.user._id)}
                            style={{
                              background: '#10a37f',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            制限解除
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="messages-list">
                  {selectedConversation.conversation.messages.map((msg, index) => (
                    <div key={index} className={`message-item ${msg.role}`}>
                      <div className="message-role">{msg.role === 'user' ? 'ユーザー' : 'AI'}</div>
                      <div className="message-content">{msg.content}</div>
                      <div className="message-time">{new Date(msg.timestamp).toLocaleString('ja-JP')}</div>
                    </div>
                  ))}
                </div>
                {selectedConversation.tokenUsage?.length > 0 && (
                  <div className="token-usage-detail">
                    <h4>トークン使用詳細</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>機能</th>
                          <th>トークン数</th>
                          <th>コスト</th>
                          <th>日時</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedConversation.tokenUsage.map((usage, index) => (
                          <tr key={index}>
                            <td>{usage.feature}</td>
                            <td>{usage.tokensUsed.toLocaleString()}</td>
                            <td>¥{usage.estimatedCost.toFixed(2)}</td>
                            <td>{new Date(usage.createdAt).toLocaleString('ja-JP')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="conversations-list">
                  {conversations?.conversations?.map((conv, index) => (
                    <div
                      key={index}
                      className="conversation-item"
                      onClick={() => fetchConversationDetail(conv.sessionId)}
                    >
                      <div className="conversation-info">
                        <div className="conversation-id">セッション: {conv.sessionId}</div>
                        <div className="conversation-meta">
                          メッセージ数: {conv.messages?.length || 0} |
                          最終更新: {new Date(conv.updatedAt).toLocaleString('ja-JP')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {conversations?.pagination && (
                  <div className="pagination">
                    <button
                      disabled={conversations.pagination.page === 1}
                      onClick={() => fetchConversations(conversations.pagination.page - 1)}
                    >
                      前へ
                    </button>
                    <span>
                      {conversations.pagination.page} / {conversations.pagination.pages}
                    </span>
                    <button
                      disabled={conversations.pagination.page >= conversations.pagination.pages}
                      onClick={() => fetchConversations(conversations.pagination.page + 1)}
                    >
                      次へ
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* システム統計タブ */}
        {activeTab === 'system' && systemStats && (
          <>
            {/* 今日の統計 */}
            <div className="dashboard-section">
              <h2>今日のアクティビティ</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>新規企業登録</h3>
                  <div className="stat-number">{systemStats.todayStats?.newCompanies || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>新規求職者登録</h3>
                  <div className="stat-number">{systemStats.todayStats?.newTalents || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>新規会話</h3>
                  <div className="stat-number">{systemStats.todayStats?.newConversations || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>メール送信数</h3>
                  <div className="stat-number">{systemStats.todayStats?.emailsSent || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>翻訳実行数</h3>
                  <div className="stat-number">{systemStats.todayStats?.translations || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>面接設定</h3>
                  <div className="stat-number">{systemStats.todayStats?.newInterviews || 0}</div>
                </div>
              </div>
            </div>

            {/* データベース統計 */}
            <div className="dashboard-section">
              <h2>データベース統計</h2>
              <div className="database-stats">
                <div className="db-stat-item">
                  <span className="db-stat-label">企業データ</span>
                  <span className="db-stat-value">{systemStats.collections?.companies?.toLocaleString() || 0} 件</span>
                </div>
                <div className="db-stat-item">
                  <span className="db-stat-label">人材データ</span>
                  <span className="db-stat-value">{systemStats.collections?.talents?.toLocaleString() || 0} 件</span>
                </div>
                <div className="db-stat-item">
                  <span className="db-stat-label">パートナーデータ</span>
                  <span className="db-stat-value">{systemStats.collections?.partners?.toLocaleString() || 0} 件</span>
                </div>
                <div className="db-stat-item">
                  <span className="db-stat-label">会話履歴</span>
                  <span className="db-stat-value">{systemStats.collections?.conversations?.toLocaleString() || 0} 件</span>
                </div>
                <div className="db-stat-item">
                  <span className="db-stat-label">メッセージ</span>
                  <span className="db-stat-value">{systemStats.collections?.messages?.toLocaleString() || 0} 件</span>
                </div>
                <div className="db-stat-item">
                  <span className="db-stat-label">面接トラッキング</span>
                  <span className="db-stat-value">{systemStats.collections?.interviews?.toLocaleString() || 0} 件</span>
                </div>
                <div className="db-stat-item">
                  <span className="db-stat-label">翻訳履歴</span>
                  <span className="db-stat-value">{systemStats.collections?.translations?.toLocaleString() || 0} 件</span>
                </div>
                <div className="db-stat-item">
                  <span className="db-stat-label">メールプロキシ</span>
                  <span className="db-stat-value">{systemStats.collections?.emailProxies?.toLocaleString() || 0} 件</span>
                </div>
                <div className="db-stat-item">
                  <span className="db-stat-label">トークン使用記録</span>
                  <span className="db-stat-value">{systemStats.collections?.tokenUsage?.toLocaleString() || 0} 件</span>
                </div>
              </div>
            </div>

            {/* 週間統計 */}
            <div className="dashboard-section">
              <h2>週間統計（過去7日間）</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>新規企業</h3>
                  <div className="stat-number">{systemStats.weekStats?.companies || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>新規求職者</h3>
                  <div className="stat-number">{systemStats.weekStats?.talents || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>新規会話</h3>
                  <div className="stat-number">{systemStats.weekStats?.conversations || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>新規面接</h3>
                  <div className="stat-number">{systemStats.weekStats?.interviews || 0}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ユーザー管理タブ */}
        {activeTab === 'users' && (
          <>
            <div className="dashboard-section">
              <h2>ユーザー管理</h2>

              {/* フィルター */}
              <div className="filter-bar" style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                <select
                  value={userFilter.userType}
                  onChange={(e) => {
                    setUserFilter({ ...userFilter, userType: e.target.value });
                    fetchUsers();
                  }}
                  style={{
                    background: '#40414f',
                    color: '#ececf1',
                    border: '1px solid #565869',
                    padding: '8px 12px',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">全ユーザー</option>
                  <option value="company">企業</option>
                  <option value="talent">人材</option>
                </select>

                <select
                  value={userFilter.status}
                  onChange={(e) => {
                    setUserFilter({ ...userFilter, status: e.target.value });
                    fetchUsers();
                  }}
                  style={{
                    background: '#40414f',
                    color: '#ececf1',
                    border: '1px solid #565869',
                    padding: '8px 12px',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">全ステータス</option>
                  <option value="active">アクティブ</option>
                  <option value="inactive">非アクティブ</option>
                  <option value="suspended">停止中</option>
                </select>
              </div>

              {/* ユーザー一覧テーブル */}
              {users && (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>メールアドレス</th>
                        <th>名前</th>
                        <th>ユーザータイプ</th>
                        <th>ステータス</th>
                        <th>制限状態</th>
                        <th>登録日</th>
                        <th>最終ログイン</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.users && users.users.map(user => (
                        <tr key={user._id}>
                          <td>{user.email}</td>
                          <td>{user.name}</td>
                          <td>
                            <span className={`badge ${user.userType === 'company' ? 'badge-blue' : 'badge-green'}`}>
                              {user.userType === 'company' ? '企業' : '人材'}
                            </span>
                          </td>
                          <td>
                            <select
                              value={user.status}
                              onChange={(e) => handleUserStatusChange(user._id, e.target.value)}
                              style={{
                                background: '#40414f',
                                color: user.status === 'active' ? '#10a37f' : user.status === 'suspended' ? '#f87171' : '#8e8ea0',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="active">アクティブ</option>
                              <option value="inactive">非アクティブ</option>
                              <option value="suspended">停止中</option>
                            </select>
                          </td>
                          <td>
                            {user.restrictedUntil && new Date(user.restrictedUntil) > new Date() ? (
                              <div style={{ fontSize: '12px' }}>
                                <div style={{ color: '#f87171', fontWeight: 'bold' }}>制限中</div>
                                <div style={{ color: '#8e8ea0' }}>
                                  {new Date(user.restrictedUntil).toLocaleDateString('ja-JP')}まで
                                </div>
                                {user.restrictionReason && (
                                  <div style={{ color: '#8e8ea0', fontSize: '11px', marginTop: '4px' }}>
                                    理由: {user.restrictionReason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#10a37f', fontSize: '12px' }}>制限なし</span>
                            )}
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString('ja-JP')}</td>
                          <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP') : '-'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {/* 制限ボタンのドロップダウン */}
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleRestrictUser(user._id, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                style={{
                                  background: '#d97706',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                              >
                                <option value="">利用制限</option>
                                <option value="1day">1日制限</option>
                                <option value="3days">3日制限</option>
                                <option value="7days">7日制限</option>
                                <option value="30days">30日制限</option>
                                <option value="1year">1年制限</option>
                                <option value="permanent">停止処分</option>
                              </select>

                              {/* 制限解除ボタン（制限中の場合のみ表示） */}
                              {user.restrictedUntil && new Date(user.restrictedUntil) > new Date() && (
                                <button
                                  onClick={() => handleUnrestrictUser(user._id)}
                                  style={{
                                    background: '#10a37f',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '6px 10px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px'
                                  }}
                                >
                                  解除
                                </button>
                              )}

                              {/* 削除ボタン */}
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                style={{
                                  background: '#8e4545',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* ページネーション */}
                  {users.pagination && users.pagination.pages > 1 && (
                    <div className="pagination" style={{ marginTop: '20px', textAlign: 'center' }}>
                      {Array.from({ length: users.pagination.pages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => fetchUsers(page)}
                          className={page === users.pagination.page ? 'active' : ''}
                          style={{
                            background: page === users.pagination.page ? '#10a37f' : '#40414f',
                            color: '#ececf1',
                            border: 'none',
                            padding: '8px 12px',
                            margin: '0 4px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '15px', color: '#8e8ea0', fontSize: '14px' }}>
                    全{users.pagination?.total || 0}件のユーザー
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* メッセージ監視タブ */}
        {activeTab === 'monitoring' && monitoringData && (
          <>
            {/* サマリー */}
            <div className="dashboard-section">
              <h2>メッセージ監視</h2>
              <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
                <div style={{ padding: '15px', background: '#40414f', borderRadius: '8px', flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#8e8ea0' }}>検出メッセージ総数</div>
                  <div style={{ fontSize: '24px', color: '#ececf1', marginTop: '5px' }}>{monitoringData.total}</div>
                </div>
                <div style={{ padding: '15px', background: '#40414f', borderRadius: '8px', flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#8e8ea0' }}>雇用関連</div>
                  <div style={{ fontSize: '24px', color: '#f87171', marginTop: '5px' }}>{monitoringData.summary.employmentFlags}</div>
                </div>
                <div style={{ padding: '15px', background: '#40414f', borderRadius: '8px', flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#8e8ea0' }}>個人情報</div>
                  <div style={{ fontSize: '24px', color: '#fbbf24', marginTop: '5px' }}>{monitoringData.summary.personalInfoFlags}</div>
                </div>
              </div>
            </div>

            {/* フラグ付きメッセージ一覧 */}
            <div className="dashboard-section">
              <h2>検出されたメッセージ（上位100件）</h2>
              <div style={{ background: '#2d2e3a', borderRadius: '8px', padding: '20px' }}>
                {monitoringData.flaggedMessages && monitoringData.flaggedMessages.length > 0 ? (
                  monitoringData.flaggedMessages.map((item, index) => (
                    <div key={index} style={{
                      background: '#40414f',
                      borderRadius: '8px',
                      padding: '15px',
                      marginBottom: '15px',
                      border: '2px solid #f87171'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <strong style={{ color: '#ececf1' }}>
                            {item.user ? `${item.user.name} (${item.user.email})` : 'ユーザー不明'}
                          </strong>
                          <div style={{ fontSize: '12px', color: '#8e8ea0', marginTop: '3px' }}>
                            セッションID: {item.sessionId}
                          </div>
                          <div style={{ fontSize: '12px', color: '#8e8ea0' }}>
                            {new Date(item.message.timestamp).toLocaleString('ja-JP')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          {item.user && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleRestrictUser(item.user._id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              style={{
                                background: '#d97706',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              <option value="">制限</option>
                              <option value="1day">1日</option>
                              <option value="3days">3日</option>
                              <option value="7days">7日</option>
                              <option value="30days">30日</option>
                              <option value="1year">1年</option>
                              <option value="permanent">停止</option>
                            </select>
                          )}
                          <button
                            onClick={() => {
                              setActiveTab('conversations');
                              fetchConversationDetail(item.sessionId);
                            }}
                            style={{
                              background: '#10a37f',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            詳細確認
                          </button>
                        </div>
                      </div>

                      <div style={{
                        background: '#2d2e3a',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '10px',
                        color: '#ececf1',
                        fontSize: '14px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {item.message.content}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {item.flags.map((flag, flagIndex) => (
                          <span key={flagIndex} style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            background: flag.type === 'employment' ? '#8e4545' : '#d97706',
                            color: '#fff'
                          }}>
                            {flag.type === 'employment' ? `🚨 ${flag.keyword}` : `⚠️ ${flag.description}: ${flag.matched}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#8e8ea0' }}>
                    検出されたメッセージはありません
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPortal;
