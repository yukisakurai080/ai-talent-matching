import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompanyApp from './CompanyApp';
import TalentApp from './TalentApp';
import JobListApp from './JobListApp';
import PartnerPortal from './PartnerPortal';
import AdminPortal from './AdminPortal';
import CompanyLogin from './CompanyLogin';
import TalentLogin from './TalentLogin';
import SetupAccount from './SetupAccount';
import PaymentSuccess from './PaymentSuccess';
import PaymentCancel from './PaymentCancel';
import './App.css';

function App() {
  return (
    <Router basename="/ZinAI">
      <Routes>
        <Route path="/demo" element={<CompanyApp isDemo={true} />} />
        <Route path="/login" element={<CompanyLogin />} />
        <Route path="/auth/verify" element={<SetupAccount />} />
        <Route path="/talent/login" element={<TalentLogin />} />
        <Route path="/" element={<CompanyApp />} />
        <Route path="/company-app" element={<CompanyApp />} />
        <Route path="/talent/demo" element={<TalentApp isDemo={true} />} />
        <Route path="/talent/register" element={<TalentApp />} />
        <Route path="/talent/jobs" element={<JobListApp />} />
        <Route path="/partner" element={<PartnerPortal />} />
        <Route path="/partner/demo" element={<PartnerPortal isDemo={true} />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />
      </Routes>
    </Router>
  );
}

export default App;
