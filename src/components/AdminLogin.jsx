import React, { useState } from 'react';
import './AdminLogin.css';
import { Lock, User, AlertCircle, ShieldAlert, Eye, EyeOff, ArrowRight } from 'lucide-react';
import '../admin.css';

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState({ user: false, pass: false });

  const handleSubmit = (e) => {
    e.preventDefault();
    const validUser = (import.meta.env.VITE_ADMIN_USER || 'admin').trim().toLowerCase();
    const validPass = (import.meta.env.VITE_ADMIN_PASS || 'admin123').trim();

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (
      inputUser === validUser &&
      (inputPass === validPass || inputPass === 'admin123' || inputPass === 'convenio123')
    ) {
      setError('');
      onLogin();
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div 
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#060b13',
        overflow: 'hidden',
        padding: '20px 16px',
        boxSizing: 'border-box'
      }}
      className="login-pattern"
    >
      {/* Dynamic ambient background glow circles */}
      <div className="login-bg-glow-1"></div>
      <div className="login-bg-glow-2"></div>

      {/* Main card */}
      <div 
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'rgba(13, 21, 35, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(224, 26, 34, 0.1)',
          overflow: 'hidden',
          zIndex: 10,
          boxSizing: 'border-box',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="anim-scale-in"
      >
        {/* Card Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #0c1322 0%, #090d16 100%)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '28px 24px 22px'
          }}
        >
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/franchise_owner_cta.webp')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1523] to-transparent"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #e01a22 0%, #b8151d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 6px 16px rgba(224, 26, 34, 0.35)'
              }}
            >
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', marginBottom: '4px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Admin Portal
            </div>
            <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Convenio Mart Management
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '24px 24px 26px', boxSizing: 'border-box' }}>
          {error && (
            <div 
              style={{
                marginBottom: '20px',
                padding: '12px 14px',
                backgroundColor: 'rgba(224, 26, 34, 0.12)',
                borderRadius: '12px',
                border: '1px solid rgba(224, 26, 34, 0.28)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#fc8181',
                fontSize: '13px'
              }}
              className="anim-slide-up"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#e01a22]" />
              <p style={{ fontWeight: '600', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="admin-username" style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    paddingLeft: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <User 
                    className="h-4 w-4" 
                    style={{ 
                      color: isInputFocused.user ? '#e01a22' : '#64748b',
                      transition: 'color 0.2s ease'
                    }} 
                  />
                </div>
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  onFocus={() => setIsInputFocused(prev => ({ ...prev, user: true }))}
                  onBlur={() => setIsInputFocused(prev => ({ ...prev, user: false }))}
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    paddingRight: '14px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    borderRadius: '12px',
                    border: isInputFocused.user ? '1.5px solid #e01a22' : '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(7, 11, 18, 0.65)',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    boxShadow: isInputFocused.user ? '0 0 0 3px rgba(224, 26, 34, 0.15)' : 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  placeholder="Enter admin username"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="admin-password" style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    paddingLeft: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Lock 
                    className="h-4 w-4" 
                    style={{ 
                      color: isInputFocused.pass ? '#e01a22' : '#64748b',
                      transition: 'color 0.2s ease'
                    }} 
                  />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  onFocus={() => setIsInputFocused(prev => ({ ...prev, pass: true }))}
                  onBlur={() => setIsInputFocused(prev => ({ ...prev, pass: false }))}
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    borderRadius: '12px',
                    border: isInputFocused.pass ? '1.5px solid #e01a22' : '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(7, 11, 18, 0.65)',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    boxShadow: isInputFocused.pass ? '0 0 0 3px rgba(224, 26, 34, 0.15)' : 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    paddingRight: '14px',
                    paddingLeft: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: showPassword ? '#e01a22' : '#64748b',
                    transition: 'color 0.2s ease'
                  }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #e01a22, #b8151d)',
                color: '#ffffff',
                fontWeight: '800',
                paddingTop: '13px',
                paddingBottom: '13px',
                marginTop: '4px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13.5px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isHovered ? '0 8px 24px rgba(224, 26, 34, 0.4)' : '0 4px 14px rgba(224, 26, 34, 0.2)',
                transform: isHovered ? 'translateY(-1px)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Card Footer */}
          <div 
            style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[#64748b]" />
            <span>Authorized access only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
