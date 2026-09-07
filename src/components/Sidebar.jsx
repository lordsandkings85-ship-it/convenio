import React, { useState } from 'react';
import { LayoutDashboard, Users, PieChart, MessageSquare, FileText, Database, Menu, X, ExternalLink } from 'lucide-react';
import { useIsMobile } from '../hooks/useWindowSize';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads',     label: 'Leads Pipeline', icon: Users },
  { id: 'reports',   label: 'Reports & Analytics', icon: PieChart },
  { id: 'templates', label: 'Templates', icon: MessageSquare },
  { id: 'blog',      label: 'Blog Posts', icon: FileText },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile(1024);

  const handleNav = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
      {/* Logo header */}
      <div style={{ padding: '22px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'linear-gradient(135deg, #e01a22 0%, #b8151d 100%)', padding: '9px', borderRadius: '12px', flexShrink: 0, boxShadow: '0 4px 10px rgba(224,26,34,0.25)' }}>
          <Database style={{ width: '18px', height: '18px', color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontWeight: '900', fontSize: '14.5px', color: '#0b1120', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Convenio Admin</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live System</span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ padding: '0 10px 8px', fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Navigation
        </div>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '11px',
                padding: '11px 14px', width: '100%', borderRadius: '12px',
                background: isActive ? 'linear-gradient(90deg, rgba(224,26,34,0.1) 0%, rgba(224,26,34,0.03) 100%)' : 'transparent',
                boxShadow: isActive ? 'inset 3px 0 0 #e01a22' : 'inset 3px 0 0 transparent',
                color: isActive ? '#c1151c' : '#475569',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13.5px', cursor: 'pointer',
                border: 'none', textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
            >
              <Icon style={{ width: '18px', height: '18px', flexShrink: 0, color: isActive ? '#e01a22' : '#64748b', transform: isActive ? 'scale(1.08)' : 'scale(1)', transition: 'all 0.2s' }} />
              <span style={{ flex: 1 }}>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Branding & quick link card */}
      <div style={{ padding: '14px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', margin: '0 auto 10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Convenio Mart" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div style={{ fontWeight: '800', fontSize: '13px', color: '#0b1120', letterSpacing: '-0.01em' }}>Convenio Mart</div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Franchise Admin Panel</div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#e01a22', marginTop: '10px', textDecoration: 'none', padding: '4px 8px', borderRadius: '6px', background: 'rgba(224,26,34,0.06)' }}
          >
            <span>View Public Website</span>
            <ExternalLink style={{ width: '11px', height: '11px' }} />
          </a>
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', paddingBottom: '2px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>v2.4 &bull; © 2026 Convenio</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP FIXED SIDEBAR */}
      {!isMobile && (
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: '240px', zIndex: 40,
          background: '#ffffff',
          borderRight: '1px solid #f1f5f9',
          boxShadow: '1px 0 12px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <SidebarContent />
        </aside>
      )}

      {/* MOBILE HAMBURGER BUTTON */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed', top: '12px', left: '12px', zIndex: 50,
            background: '#ffffff', border: '1.5px solid #e2e8f0',
            borderRadius: '12px', padding: '9px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          aria-label="Open menu"
        >
          <Menu style={{ width: '20px', height: '20px', color: '#0b1120' }} />
        </button>
      )}

      {/* MOBILE OVERLAY & DRAWER */}
      {isMobile && mobileOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(11,17,32,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: '270px', zIndex: 70,
            background: '#ffffff',
            boxShadow: '8px 0 32px rgba(0,0,0,0.18)',
            transform: 'translateX(0)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', zIndex: 1 }}
            >
              <X style={{ width: '16px', height: '16px', color: '#64748b' }} />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}

