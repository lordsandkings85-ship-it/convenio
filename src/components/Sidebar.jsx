import React, { useState } from 'react';
import './Sidebar.css';
import { LayoutDashboard, Users, PieChart, MessageSquare, FileText, Database, Menu, X, ExternalLink } from 'lucide-react';
import { useIsMobile } from '../hooks/useWindowSize';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { id: 'leads',    label: 'Leads Pipeline', icon: Users },
      { id: 'reports',  label: 'Reports & Analytics', icon: PieChart },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'templates', label: 'Templates', icon: MessageSquare },
      { id: 'blog',      label: 'Blog Posts', icon: FileText },
    ],
  },
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

      {/* Nav items — grouped by section */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV_SECTIONS.map((section) => (
          <div className="admin-nav-group" key={section.label}>
            <div className="admin-nav-section">{section.label}</div>
            {section.items.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  className={`admin-nav-item${isActive ? ' is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="admin-nav-icon" />
                  <span style={{ flex: 1 }}>{label}</span>
                </button>
              );
            })}
          </div>
        ))}
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
        <aside className="admin-sidebar-panel">
          <SidebarContent />
        </aside>
      )}

      {/* MOBILE HAMBURGER BUTTON */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          className="admin-hamburger-btn"
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
          <aside className="admin-sidebar-drawer-panel">
            <button
              onClick={() => setMobileOpen(false)}
              className="admin-sidebar-drawer-close"
              aria-label="Close menu"
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
