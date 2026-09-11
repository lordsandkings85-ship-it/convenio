import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { useSearchParams } from 'react-router-dom';
import { Settings, X } from 'lucide-react';
import FranchiseDashboard from './FranchiseDashboard';
import LeadsPage from './LeadsPage';
import ReportsPage from './ReportsPage';
import TemplatesPage from './TemplatesPage';
import BlogPostsPage from './BlogPostsPage';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
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
    <div className="admin-layout" style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', width: '100%', overflowX: 'hidden' }}>

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content area — offset by sidebar width on desktop */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
          marginLeft: isMobile ? 0 : 240,
          transition: 'margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          width: isMobile ? '100%' : 'calc(100% - 240px)',
          maxWidth: '100vw'
        }} 
        className="admin-main-content"
      >

        {/* Sticky top nav */}
        <TopNav
          activeTab={activeTab}
          onLogout={onLogout}
          onSettings={() => setShowSettingsModal(true)}
          onNotificationClick={handleNotificationClick}
        />

        {/* Page content */}
        <main 
          style={{ 
            flex: 1, 
            padding: isMobile ? '16px 14px 48px' : '24px 28px 48px', 
            paddingTop: isMobile ? '76px' : '88px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isMobile ? '16px' : '24px', 
            minWidth: 0, 
            maxWidth: '100%',
            overflowX: 'hidden' 
          }}
        >
          {activeTab === 'dashboard'  && <FranchiseDashboard onNavigateTab={setActiveTab} />}
          {activeTab === 'leads'      && <LeadsPage highlightedLeadId={highlightedLeadId} onNavigateTab={setActiveTab} />}
          {activeTab === 'reports'    && <ReportsPage onNavigateTab={setActiveTab} />}
          {activeTab === 'templates'  && <TemplatesPage onNavigateTab={setActiveTab} />}
          {activeTab === 'blog'       && <BlogPostsPage onNavigateTab={setActiveTab} />}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div 
            className="admin-modal-card anim-scale-in" 
            style={{ maxWidth: '440px', padding: '24px' }} 
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSettingsModal(false)}
              className="admin-icon-btn"
              style={{ position: 'absolute', top: '16px', right: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}
              aria-label="Close"
            >
              <X style={{ width: '18px', height: '18px', color: '#64748b' }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(224,26,34,0.1)', borderRadius: '14px', color: '#e01a22' }}>
                <Settings style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#0b1120' }}>Chatbot Settings</div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Configure AI lead collection flow</div>
              </div>
            </div>

            <div style={{ padding: '16px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0b1120', marginBottom: '4px' }}>Collect Budget Details</div>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                    {collectBudget
                      ? 'Enabled: AI Bot will ask users for budget after name and location.'
                      : 'Disabled: AI Bot will only ask for Name, Location, and Phone Number.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleBudgetSetting(!collectBudget)}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', padding: '2px',
                    background: collectBudget ? '#e01a22' : '#e2e8f0',
                    display: 'flex', alignItems: 'center',
                    justifyContent: collectBudget ? 'flex-end' : 'flex-start',
                    border: 'none', cursor: 'pointer', flexShrink: 0,
                    transition: 'all 0.3s ease',
                  }}
                  aria-label="Toggle budget collection"
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="admin-btn-primary"
                style={{ width: '100%' }}
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
