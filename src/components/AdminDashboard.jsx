import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings, X } from 'lucide-react';
import FranchiseDashboard from './FranchiseDashboard';
import LeadsPage from './LeadsPage';
import ReportsPage from './ReportsPage';
import TemplatesPage from './TemplatesPage';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import { useIsMobile } from '../hooks/useWindowSize';
import '../admin.css';
import '../admin-overrides.css';

export default function AdminDashboard({ onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const isMobile = useIsMobile(1024);

  const setActiveTab = (tab) => {
    if (tab === activeTab) return;
    setSearchParams({ tab });
  };

  const [highlightedLeadId, setHighlightedLeadId] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [collectBudget, setCollectBudget] = useState(() => {
    return localStorage.getItem('collect_budget_setting') === 'true';
  });

  useEffect(() => {
    if (showSettingsModal) {
      window.history.pushState({ modalOpen: 'settings' }, '');
      const handlePopState = () => setShowSettingsModal(false);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [showSettingsModal]);

  const handleToggleBudgetSetting = (val) => {
    setCollectBudget(val);
    localStorage.setItem('collect_budget_setting', String(val));
  };

  const handleNotificationClick = (leadId) => {
    setActiveTab('leads');
    setHighlightedLeadId(leadId);
    setTimeout(() => setHighlightedLeadId(null), 2000);
  };

return (
    <div className="admin-layout" style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex' }}>

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content area — offset by sidebar width on desktop */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: '100vh',
        /* Desktop: push right of fixed sidebar */
        marginLeft: isMobile ? 0 : 240,
        transition: 'margin-left 0.3s ease',
      }} className="admin-main-content">

        {/* Sticky top nav */}
        <TopNav
          onLogout={onLogout}
          onSettings={() => setShowSettingsModal(true)}
          onNotificationClick={handleNotificationClick}
        />

        {/* Page content — padded below fixed topnav */}
        <main style={{ flex: 1, padding: '24px', paddingTop: '84px', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: isMobile ? '80px' : '24px', minWidth: 0, overflowX: 'hidden' }}>
          {activeTab === 'dashboard'  && <FranchiseDashboard />}
          {activeTab === 'leads'      && <LeadsPage highlightedLeadId={highlightedLeadId} />}
          {activeTab === 'reports'    && <ReportsPage />}
          {activeTab === 'templates'  && <TemplatesPage />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,17,32,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', maxWidth: '440px', width: '100%', padding: '28px', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)', position: 'relative' }}>
            <button
              onClick={() => setShowSettingsModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
            >
              <X style={{ width: '18px', height: '18px', color: '#64748b' }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(224,26,34,0.1)', borderRadius: '12px' }}>
                <Settings style={{ width: '22px', height: '22px', color: '#e01a22' }} />
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#0b1120' }}>Chatbot Settings</div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Configure AI lead collection flow</div>
              </div>
            </div>

            <div style={{ padding: '16px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0b1120', marginBottom: '4px' }}>Collect Budget Details</div>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                    {collectBudget
                      ? 'Enabled: AI Bot will ask users for budget after name and location.'
                      : 'Disabled: AI Bot will only ask for Name, Location, and Phone Number.'}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleBudgetSetting(!collectBudget)}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', padding: '2px',
                    background: collectBudget ? '#e01a22' : '#e2e8f0',
                    display: 'flex', alignItems: 'center',
                    justifyContent: collectBudget ? 'flex-end' : 'flex-start',
                    border: 'none', cursor: 'pointer', flexShrink: 0,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #0b1120, #1a2542)', color: '#fff', fontWeight: '700', fontSize: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(11,17,32,0.2)' }}
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
