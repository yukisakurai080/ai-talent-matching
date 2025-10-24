import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './JobListApp.css';
import translations from './jobListTranslations';

const API_URL = 'http://localhost:5000/api';

function JobListApp() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [filters, setFilters] = useState({
    industry: '',
    location: '',
    employmentType: ''
  });
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    resumeText: '',
    coverLetter: ''
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [language, setLanguage] = useState('ja');
  const [isTranslating, setIsTranslating] = useState(false);

  const t = translations[language];

  // 認証チェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          withCredentials: true
        });

        if (response.data.user && response.data.user.userType === 'talent') {
          setUser(response.data.user);
          setAuthLoading(false);
        } else {
          navigate('/talent/login');
        }
      } catch (error) {
        navigate('/talent/login');
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    fetchCompanies();
  }, [filters, language, user]);

  const fetchCompanies = async () => {
    try {
      setIsTranslating(language !== 'ja');
      const params = new URLSearchParams();
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.location) params.append('location', filters.location);
      if (filters.employmentType) params.append('employmentType', filters.employmentType);
      if (language !== 'ja') params.append('lang', language);

      const response = await axios.get(`${API_URL}/companies?${params}`);
      setCompanies(response.data.companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplicationFormChange = (e) => {
    const { name, value } = e.target;
    setApplicationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApply = (company) => {
    setSelectedCompany(company);
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: 'loading', message: t.submitting });

    try {
      // 企業のメッセージボックスに応募メッセージを送信
      await axios.post(`${API_URL}/messages`, {
        companyId: selectedCompany._id,
        senderName: applicationForm.applicantName,
        senderEmail: applicationForm.applicantEmail,
        senderPhone: applicationForm.applicantPhone,
        subject: `【応募】${selectedCompany.positionTitle}への応募`,
        content: `${applicationForm.coverLetter}\n\n【職務経歴】\n${applicationForm.resumeText}`,
        messageType: 'application'
      });

      setSubmitStatus({ type: 'success', message: t.submitSuccess });

      setTimeout(() => {
        setShowApplicationModal(false);
        setApplicationForm({
          applicantName: '',
          applicantEmail: '',
          applicantPhone: '',
          resumeText: '',
          coverLetter: ''
        });
        setSubmitStatus(null);
        setSelectedCompany(null);
      }, 2000);
    } catch (error) {
      console.error('Application error:', error);
      setSubmitStatus({ type: 'error', message: t.submitError });
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      navigate('/talent/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/talent/login');
    }
  };

  if (authLoading) {
    return (
      <div className="job-list-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#ececf1', fontSize: '18px' }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="job-list-page">
      {/* ヘッダー */}
      <header className="job-header">
        <div className="job-header-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div className="language-selector">
              <button className={language === 'ja' ? 'active' : ''} onClick={() => setLanguage('ja')}>日本語</button>
              <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>English</button>
              <button className={language === 'zh' ? 'active' : ''} onClick={() => setLanguage('zh')}>中文</button>
              <button className={language === 'vi' ? 'active' : ''} onClick={() => setLanguage('vi')}>Tiếng Việt</button>
              <button className={language === 'id' ? 'active' : ''} onClick={() => setLanguage('id')}>Indonesia</button>
              <button className={language === 'ko' ? 'active' : ''} onClick={() => setLanguage('ko')}>한국어</button>
              <button className={language === 'es' ? 'active' : ''} onClick={() => setLanguage('es')}>Español</button>
              <button className={language === 'ta' ? 'active' : ''} onClick={() => setLanguage('ta')}>தமிழ்</button>
              <button className={language === 'fr' ? 'active' : ''} onClick={() => setLanguage('fr')}>Français</button>
              <button className={language === 'hi' ? 'active' : ''} onClick={() => setLanguage('hi')}>हिन्दी</button>
              <button className={language === 'bn' ? 'active' : ''} onClick={() => setLanguage('bn')}>বাংলা</button>
              <button className={language === 'pt' ? 'active' : ''} onClick={() => setLanguage('pt')}>Português</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#8e8ea0', fontSize: '14px' }}>{user?.name}</span>
              <button
                onClick={handleLogout}
                style={{
                  background: '#8e4545',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                ログアウト
              </button>
            </div>
          </div>
          <h1>{t.pageTitle}</h1>
          <p>{t.pageSubtitle}</p>
        </div>
      </header>

      {/* 検索フィルター */}
      <div className="job-filters">
        <div className="filter-container">
          <div className="filter-group">
            <label>{t.filterIndustry}</label>
            <select name="industry" value={filters.industry} onChange={handleFilterChange}>
              <option value="">{t.filterAll}</option>
              <option value="IT・通信">{t.industryIT}</option>
              <option value="製造">{t.industryManufacturing}</option>
              <option value="医療">{t.industryMedical}</option>
              <option value="介護">{t.industryCare}</option>
              <option value="外食・飲食">{t.industryFood}</option>
              <option value="物流">{t.industryLogistics}</option>
              <option value="小売">{t.industryRetail}</option>
              <option value="金融">{t.industryFinance}</option>
              <option value="教育">{t.industryEducation}</option>
              <option value="その他">{t.industryOther}</option>
            </select>
          </div>

          <div className="filter-group">
            <label>{t.filterLocation}</label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder={t.filterLocationPlaceholder}
            />
          </div>

          <div className="filter-group">
            <label>{t.filterEmploymentType}</label>
            <select name="employmentType" value={filters.employmentType} onChange={handleFilterChange}>
              <option value="">{t.filterAll}</option>
              <option value="正社員">{t.fullTime}</option>
              <option value="契約社員">{t.contract}</option>
              <option value="派遣社員">{t.dispatch}</option>
              <option value="パート・アルバイト">{t.partTime}</option>
              <option value="業務委託">{t.freelance}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 求人一覧 */}
      <div className="job-list-container">
        {!isTranslating && (
          <div className="job-list-header">
            <h2>{companies.length}{t.jobsCount}</h2>
          </div>
        )}

        {isTranslating && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p className="loading-text">翻訳中...</p>
          </div>
        )}

        <div className="job-list" style={{ opacity: isTranslating ? 0.3 : 1 }}>
          {companies.map((company) => (
            <div key={company._id} className="job-card">
              <div className="job-card-header">
                <div>
                  <h3 className="job-title">{company.positionTitle}</h3>
                  <p className="company-name">{company.companyName}</p>
                </div>
                <span className="job-industry-badge">{company.industry}</span>
              </div>

              <div className="job-card-body">
                <div className="job-info-row">
                  <span className="job-info-label">{t.employmentType}</span>
                  <span className="job-info-value">{company.employmentType}</span>
                </div>
                <div className="job-info-row">
                  <span className="job-info-label">{t.location}</span>
                  <span className="job-info-value">{company.workLocation}</span>
                </div>
                <div className="job-info-row">
                  <span className="job-info-label">{t.salary}</span>
                  <span className="job-info-value">
                    {company.salaryMin.toLocaleString()} {t.yen} 〜 {company.salaryMax.toLocaleString()} {t.yen}
                  </span>
                </div>
                <div className="job-info-row">
                  <span className="job-info-label">{t.workHours}</span>
                  <span className="job-info-value">{company.workHours}</span>
                </div>
              </div>

              <div className="job-card-description">
                <p>{company.jobDescription.substring(0, 150)}...</p>
              </div>

              <div className="job-card-footer">
                <button
                  className="job-detail-btn"
                  onClick={() => setSelectedCompany(company)}
                >
                  {t.viewDetails}
                </button>
                <button
                  className="job-apply-btn"
                  onClick={() => handleApply(company)}
                >
                  {t.apply}
                </button>
              </div>
            </div>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="no-jobs">
            <p>{t.noJobs}</p>
          </div>
        )}
      </div>

      {/* 企業詳細モーダル */}
      {selectedCompany && !showApplicationModal && (
        <div className="job-modal" onClick={() => setSelectedCompany(null)}>
          <div className="job-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="job-modal-header">
              <h2>{selectedCompany.positionTitle}</h2>
              <button className="close-btn" onClick={() => setSelectedCompany(null)}>×</button>
            </div>

            <div className="job-modal-body">
              <section className="job-section">
                <h3>{t.companyInfo}</h3>
                <p><strong>{t.companyName}:</strong> {selectedCompany.companyName}</p>
                <p><strong>{t.industry}:</strong> {selectedCompany.industry}</p>
                <p><strong>{t.headquarters}:</strong> {selectedCompany.headquarters}</p>
                {selectedCompany.website && (
                  <p><strong>{t.website}:</strong> <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">{selectedCompany.website}</a></p>
                )}
                <p><strong>{t.businessDescription}:</strong> {selectedCompany.businessDescription}</p>
              </section>

              <section className="job-section">
                <h3>{t.jobRequirements}</h3>
                <p><strong>{t.position}:</strong> {selectedCompany.positionTitle}</p>
                <p><strong>{t.employmentType}:</strong> {selectedCompany.employmentType}</p>
                <p><strong>{t.jobDescription}:</strong><br/>{selectedCompany.jobDescription}</p>
                <p><strong>{t.requiredSkills}:</strong><br/>{selectedCompany.requiredSkills}</p>
                {selectedCompany.preferredSkills && (
                  <p><strong>{t.preferredSkills}:</strong><br/>{selectedCompany.preferredSkills}</p>
                )}
              </section>

              <section className="job-section">
                <h3>{t.workConditions}</h3>
                <p><strong>{t.location}:</strong> {selectedCompany.workLocation}</p>
                <p><strong>{t.workHours}:</strong> {selectedCompany.workHours}</p>
                <p><strong>{t.expectedSalary}:</strong> {selectedCompany.salaryMin.toLocaleString()} {t.yen} 〜 {selectedCompany.salaryMax.toLocaleString()} {t.yen}</p>
                <p><strong>{t.holidays}:</strong><br/>{selectedCompany.holidays}</p>
                {selectedCompany.benefits && (
                  <p><strong>{t.benefits}:</strong><br/>{selectedCompany.benefits}</p>
                )}
              </section>

              {selectedCompany.selectionProcess && (
                <section className="job-section">
                  <h3>{t.selectionProcess}</h3>
                  <p>{selectedCompany.selectionProcess}</p>
                </section>
              )}

              <div className="job-modal-actions">
                <button className="modal-apply-btn" onClick={() => handleApply(selectedCompany)}>
                  {t.applyForJob}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 応募フォームモーダル */}
      {showApplicationModal && (
        <div className="job-modal" onClick={() => setShowApplicationModal(false)}>
          <div className="job-modal-content application-modal" onClick={(e) => e.stopPropagation()}>
            <div className="job-modal-header">
              <h2>{t.applicationForm}</h2>
              <button className="close-btn" onClick={() => setShowApplicationModal(false)}>×</button>
            </div>

            <div className="job-modal-body">
              <div className="application-job-info">
                <p><strong>{selectedCompany.companyName}</strong></p>
                <p>{selectedCompany.positionTitle}</p>
              </div>

              <form onSubmit={handleSubmitApplication} className="application-form">
                <div className="form-group">
                  <label>{t.applicantName} {t.required}</label>
                  <input
                    type="text"
                    name="applicantName"
                    value={applicationForm.applicantName}
                    onChange={handleApplicationFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t.applicantEmail} {t.required}</label>
                  <input
                    type="email"
                    name="applicantEmail"
                    value={applicationForm.applicantEmail}
                    onChange={handleApplicationFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t.applicantPhone} {t.required}</label>
                  <input
                    type="tel"
                    name="applicantPhone"
                    value={applicationForm.applicantPhone}
                    onChange={handleApplicationFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t.resumeText} {t.required}</label>
                  <textarea
                    name="resumeText"
                    value={applicationForm.resumeText}
                    onChange={handleApplicationFormChange}
                    required
                    rows="6"
                    placeholder={t.resumePlaceholder}
                  />
                </div>

                <div className="form-group">
                  <label>{t.coverLetter} {t.required}</label>
                  <textarea
                    name="coverLetter"
                    value={applicationForm.coverLetter}
                    onChange={handleApplicationFormChange}
                    required
                    rows="6"
                    placeholder={t.coverLetterPlaceholder}
                  />
                </div>

                {submitStatus && (
                  <div className={`submit-status ${submitStatus.type}`}>
                    {submitStatus.message}
                  </div>
                )}

                <button type="submit" className="submit-application-btn" disabled={submitStatus?.type === 'loading'}>
                  {submitStatus?.type === 'loading' ? t.submitting : t.submit}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobListApp;
