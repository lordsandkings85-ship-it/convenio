import React, { useState } from 'react';
import { LayoutDashboard, Users, PieChart, MessageSquare, Database, Menu, X } from 'lucide-react';
import { useIsMobile } from '../hooks/useWindowSize';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads',     label: 'Leads',     icon: Users },
  { id: 'reports',   label: 'Reports',   icon: PieChart },
  { id: 'templates', label: 'Templates', icon: MessageSquare },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile(1024);

  const handleNav = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'linear-gradient(135deg, #e01a22 0%, #b8151d 100%)', padding: '8px', borderRadius: '10px', flexShrink: 0, boxShadow: '0 4px 8px rgba(224,26,34,0.2)' }}>
          <Database style={{ width: '18px', height: '18px', color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '14px', color: '#0b1120', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Admin Dashboard</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Manage your leads</div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', width: '100%', borderRadius: '10px',
                background: isActive ? 'linear-gradient(90deg, rgba(224,26,34,0.1) 0%, rgba(224,26,34,0.03) 100%)' : 'transparent',
                boxShadow: isActive ? 'inset 3px 0 0 #e01a22' : 'inset 3px 0 0 transparent',
                color: isActive ? '#c1151c' : '#64748b',
                fontWeight: '700', fontSize: '13.5px', cursor: 'pointer',
                border: 'none', textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
            >
              <Icon style={{ width: '18px', height: '18px', flexShrink: 0, transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Branding card */}
      <div style={{ padding: '12px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', margin: '0 auto 10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>
            <img src="/Mart%20logo.jpg" alt="Convenio Mart" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ fontWeight: '800', fontSize: '13px', color: '#0b1120', letterSpacing: '-0.01em' }}>Convenio Mart</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '3px', lineHeight: 1.4 }}>Mini-Supermarket Franchise</div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '12px', paddingBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: '500' }}>© 2026 Convenio Mart</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP FIXED SIDEBAR - only render on desktop */}
      {!isMobile && (
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: '240px', zIndex: 40,
          background: '#ffffff',
          borderRight: '1px solid #f1f5f9',
          boxShadow: '1px 0 8px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <SidebarContent />
        </aside>
      )}

      {/* MOBILE HAMBURGER BUTTON - only render on mobile */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed', top: '12px', left: '12px', zIndex: 50,
            background: '#ffffff', border: '1px solid #e2e8f0',
            borderRadius: '10px', padding: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
          }}
          aria-label="Open menu"
        >
          <Menu style={{ width: '20px', height: '20px', color: '#0b1120' }} />
        </button>
      )}

      {/* MOBILE OVERLAY & DRAWER - only on mobile */}
      {isMobile && mobileOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(11,17,32,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: '260px', zIndex: 70,
            background: '#ffffff',
            boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
            transform: 'translateX(0)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ position: 'absolute', top: '12px', right: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', zIndex: 1 }}
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
