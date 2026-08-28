import React, { useState, useEffect } from 'react';
import { Bell, Settings, LogOut, Clock, ChevronDown } from 'lucide-react';
import { getEnquiries, getDueTasks } from '../lib/api';
import { useIsMobile } from '../hooks/useWindowSize';

export default function TopNav({ onLogout, onSettings, onNotificationClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
        setNewLeads(leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        setDueTasks(tasks);
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

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
  };

  return (
    <header
      className="admin-topnav"
      style={{
        position: 'fixed', top: 0, right: 0, left: isMobile ? 0 : 240, height: '60px', zIndex: 35,
        background: '#ffffff', borderBottom: '1px solid #f1f5f9',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        transition: 'left 0.3s ease',
      }}
    >
      {/* Greeting */}
      <div style={{ fontSize: '18px', fontWeight: '800', color: '#0b1120', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
        {getGreeting()}, Admin 👋
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>

        {/* ── Bell notifications ── */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifications(v => !v); setShowUserMenu(false); }}
            style={{ position: 'relative', padding: '8px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Bell style={{ width: '20px', height: '20px' }} />
            {(newLeads.length > 0 || dueTasks.length > 0) && (
              <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: '#e01a22', border: '2px solid #fff', display: 'block' }} />
            )}
          </button>

          {showNotifications && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 65 }} onClick={() => setShowNotifications(false)} />
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '320px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 70, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0b1120' }}>Notifications</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {dueTasks.length > 0 && <span style={{ background: '#fff7ed', color: '#ea580c', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '50px' }}>{dueTasks.length} Tasks</span>}
                    {newLeads.length > 0 && <span style={{ background: 'rgba(224,26,34,0.08)', color: '#e01a22', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '50px' }}>{newLeads.length} New</span>}
                  </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {(newLeads.length === 0 && dueTasks.length === 0) ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>You're all caught up! 🎉</div>
                  ) : (
                    <div>
                      {dueTasks.map(task => (
                        <button key={task.id}
                          onClick={() => { if (onNotificationClick) onNotificationClick(task.enquiry_id); setShowNotifications(false); }}
                          style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '700', fontSize: '13px', color: '#0b1120' }}>{task.enquiries?.name || 'Unknown'}</span>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#ea580c', background: '#fff7ed', padding: '2px 8px', borderRadius: '50px', flexShrink: 0, marginLeft: '8px' }}>Due Now</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Follow-up task is pending</div>
                        </button>
                      ))}
                      {newLeads.map(lead => (
                        <button key={lead.id}
                          onClick={() => { if (onNotificationClick) onNotificationClick(lead.id); setShowNotifications(false); }}
                          style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '700', fontSize: '13px', color: '#0b1120' }}>{lead.name}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, marginLeft: '8px' }}>
                              <Clock style={{ width: '11px', height: '11px' }} /> {formatTime(lead.created_at)}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>New lead from {lead.source === 'CHAT' ? 'Chatbot' : 'Form'}</div>
                          {lead.email && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{lead.email}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ padding: '8px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <button onClick={() => setShowNotifications(false)} style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 16px' }}>Close</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Settings ── */}
        <button
          onClick={onSettings}
          style={{ padding: '8px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Settings style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', background: '#f1f5f9', margin: '0 4px' }} />

        {/* ── Admin avatar + click-toggle logout dropdown ── */}
        <div style={{ position: 'relative' }}>

          {/* Avatar trigger — click to toggle */}
          <button
            onClick={() => { setShowUserMenu(v => !v); setShowNotifications(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '5px 10px 5px 5px', borderRadius: '10px',
              background: showUserMenu ? '#f1f5f9' : 'transparent',
              border: 'none', cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!showUserMenu) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.background = showUserMenu ? '#f1f5f9' : 'transparent'; }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', boxShadow: '0 2px 6px rgba(59,130,246,0.3)', flexShrink: 0 }}>
              A
            </div>
            <span className="admin-name-label" style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Admin</span>
            <ChevronDown style={{ width: '14px', height: '14px', color: '#94a3b8', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
          </button>

          {/* Click-outside overlay */}
          {showUserMenu && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 48 }} onClick={() => setShowUserMenu(false)} />
          )}

          {/* Dropdown panel */}
          {showUserMenu && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '180px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)', padding: '6px', zIndex: 49 }}>
              {/* Info */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #f8fafc', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0b1120' }}>Admin</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Administrator</div>
              </div>
              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: '13px', fontWeight: '600', color: '#e01a22', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,26,34,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
