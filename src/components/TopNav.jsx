import React, { useState, useEffect } from 'react';
import { Bell, Settings, LogOut, Clock, ChevronDown, CheckCircle2, User, AlertTriangle, Sparkles } from 'lucide-react';
import { getEnquiries, getDueTasks } from '../lib/api';
import { useIsMobile } from '../hooks/useWindowSize';

export default function TopNav({ onLogout, onSettings, onNotificationClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifTab, setNotifTab] = useState('ALL'); // ALL, TASKS, LEADS
  const [newLeads, setNewLeads] = useState([]);
  const [dueTasks, setDueTasks] = useState([]);
  const isMobile = useIsMobile(1024);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [leads, tasks] = await Promise.all([
          getEnquiries('NEW'),
          getDueTasks()
        ]);
        setNewLeads(Array.isArray(leads) ? [...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []);
        setDueTasks(Array.isArray(tasks) ? tasks : []);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const totalNotifs = newLeads.length + dueTasks.length;

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
  };

  return (
    <header
      className="admin-topnav"
      style={{
        position: 'fixed', top: 0, right: 0, left: isMobile ? 0 : 240, height: '64px', zIndex: 35,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px 0 60px' : '0 28px',
        transition: 'left 0.3s ease',
      }}
    >
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '900', color: '#0b1120', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{getGreeting()}, Admin</span>
          <span style={{ fontSize: '18px' }}>👋</span>
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

        {/* ── Bell notifications ── */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifications(v => !v); setShowUserMenu(false); }}
            style={{
              position: 'relative', width: '38px', height: '38px', borderRadius: '12px',
              background: showNotifications ? '#f1f5f9' : '#f8fafc',
              border: '1px solid #e2e8f0', cursor: 'pointer', color: '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            onMouseLeave={e => { if (!showNotifications) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
            aria-label="Notifications"
          >
            <Bell style={{ width: '18px', height: '18px', color: totalNotifs > 0 ? '#e01a22' : '#64748b' }} />
            {totalNotifs > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                minWidth: '18px', height: '18px', padding: '0 4px',
                borderRadius: '9px', background: '#e01a22', color: '#ffffff',
                fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(224,26,34,0.4)', border: '2px solid #ffffff'
              }}>
                {totalNotifs}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 65 }} onClick={() => setShowNotifications(false)} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: isMobile ? '300px' : '360px',
                background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.16)', zIndex: 70, overflow: 'hidden'
              }} className="anim-scale-in">
                
                {/* Header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '800', fontSize: '14.5px', color: '#0b1120' }}>Activity Center</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {dueTasks.length > 0 && <span style={{ background: '#fff7ed', color: '#ea580c', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '50px', border: '1px solid #ffedd5' }}>{dueTasks.length} Tasks</span>}
                    {newLeads.length > 0 && <span style={{ background: 'rgba(224,26,34,0.08)', color: '#e01a22', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '50px', border: '1px solid rgba(224,26,34,0.15)' }}>{newLeads.length} New</span>}
                  </div>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#ffffff', padding: '4px' }}>
                  {[
                    { id: 'ALL', label: `All (${totalNotifs})` },
                    { id: 'TASKS', label: `Due Tasks (${dueTasks.length})` },
                    { id: 'LEADS', label: `New Leads (${newLeads.length})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setNotifTab(tab.id)}
                      style={{
                        flex: 1, padding: '7px 8px', fontSize: '11.5px', fontWeight: '700', borderRadius: '8px', border: 'none',
                        background: notifTab === tab.id ? '#f1f5f9' : 'transparent',
                        color: notifTab === tab.id ? '#0b1120' : '#64748b', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Notification List */}
                <div style={{ maxHeight: '320px', overflowY: 'auto' }} className="admin-scroll">
                  {totalNotifs === 0 ? (
                    <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <CheckCircle2 style={{ width: '20px', height: '20px' }} />
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0b1120' }}>All Caught Up!</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>No pending tasks or unread leads right now.</div>
                    </div>
                  ) : (
                    <div>
                      {(notifTab === 'ALL' || notifTab === 'TASKS') && dueTasks.map(task => (
                        <button key={task.id}
                          onClick={() => { if (onNotificationClick) onNotificationClick(task.enquiry_id); setShowNotifications(false); }}
                          style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #f8fafc', borderLeft: '3px solid #f97316', cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontWeight: '800', fontSize: '13px', color: '#0b1120' }}>{task.enquiries?.name || 'Applicant'}</span>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#ea580c', background: '#ffedd5', padding: '2px 8px', borderRadius: '50px', flexShrink: 0, marginLeft: '8px' }}>Due Now</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Scheduled follow-up call is pending</div>
                        </button>
                      ))}

                      {(notifTab === 'ALL' || notifTab === 'LEADS') && newLeads.map(lead => (
                        <button key={lead.id}
                          onClick={() => { if (onNotificationClick) onNotificationClick(lead.id); setShowNotifications(false); }}
                          style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #f8fafc', borderLeft: '3px solid #3b82f6', cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontWeight: '800', fontSize: '13px', color: '#0b1120' }}>{lead.name}</span>
                            <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, marginLeft: '8px' }}>
                              <Clock style={{ width: '11px', height: '11px' }} /> {formatTime(lead.created_at)}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569' }}>New franchise inquiry via {lead.source === 'CHAT' ? '🤖 Chatbot' : '📝 Form'}</div>
                          {lead.email && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{lead.email}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', textAlign: 'center' }}>
                  <button onClick={() => setShowNotifications(false)} style={{ fontSize: '12px', fontWeight: '700', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 16px' }}>Close</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Settings ── */}
        <button
          onClick={onSettings}
          style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            cursor: 'pointer', color: '#475569',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          title="Bot Settings"
        >
          <Settings style={{ width: '18px', height: '18px' }} />
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }} />

        {/* ── Admin avatar + click-toggle logout dropdown ── */}
        <div style={{ position: 'relative' }}>

          {/* Avatar trigger */}
          <button
            onClick={() => { setShowUserMenu(v => !v); setShowNotifications(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 10px 4px 4px', borderRadius: '12px',
              background: showUserMenu ? '#f1f5f9' : '#f8fafc',
              border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { if (!showUserMenu) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
            onMouseLeave={e => { if (!showUserMenu) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
          >
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #e01a22 0%, #0b1120 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', boxShadow: '0 2px 6px rgba(224,26,34,0.3)', flexShrink: 0 }}>
              A
            </div>
            <span className="admin-name-label" style={{ fontSize: '13px', fontWeight: '800', color: '#0b1120' }}>Admin</span>
            <ChevronDown style={{ width: '14px', height: '14px', color: '#94a3b8', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
          </button>

          {/* Click-outside overlay */}
          {showUserMenu && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 48 }} onClick={() => setShowUserMenu(false)} />
          )}

          {/* Dropdown panel */}
          {showUserMenu && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '200px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.14)', padding: '6px', zIndex: 49 }} className="anim-scale-in">
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0b1120' }}>Convenio Admin</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>superuser@convenio.in</div>
              </div>
              <button
                onClick={handleLogout}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: '#e01a22', background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,26,34,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

