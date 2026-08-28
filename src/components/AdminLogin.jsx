import React, { useState } from 'react';
import { Lock, User, AlertCircle, ShieldAlert } from 'lucide-react';

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState({ user: false, pass: false });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#060b13] overflow-hidden login-pattern">
      {/* Dynamic ambient background glow circles */}
      <div className="login-bg-glow-1"></div>
      <div className="login-bg-glow-2"></div>

      {/* Main card */}
      <div 
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'rgba(13, 21, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          margin: '16px',
          zIndex: 10,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="anim-scale-in"
      >
        {/* Card Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #0c1322 0%, #090d16 100%)',
            padding: '32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/franchise_owner_cta.webp')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1523] to-transparent"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #e01a22 0%, #b8151d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 8px 16px rgba(224, 26, 34, 0.25)'
              }}
            >
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', marginBottom: '6px', letterSpacing: '-0.025em' }}>Admin Portal</div>
            <p style={{ color: '#a0aec0', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Convenio Mart Management</p>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '32px' }}>
          {error && (
            <div 
              style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: 'rgba(224, 26, 34, 0.1)',
                borderRadius: '16px',
                border: '1px solid rgba(224, 26, 34, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#fc8181',
                fontSize: '14px'
              }}
              className="anim-slide-up"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-[#e01a22]" />
              <p style={{ fontWeight: '700' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    paddingLeft: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <User 
                    className="h-5 w-5" 
                    style={{ 
                      color: isInputFocused.user ? '#e01a22' : '#718096',
                      transition: 'color 0.2s ease'
                    }} 
                  />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setIsInputFocused(prev => ({ ...prev, user: true }))}
                  onBlur={() => setIsInputFocused(prev => ({ ...prev, user: false }))}
                  style={{
                    width: '100%',
                    paddingLeft: '48px',
                    paddingRight: '16px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    borderRadius: '12px',
                    border: isInputFocused.user ? '1.5px solid #e01a22' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(7, 11, 18, 0.6)',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '14px',
                    boxShadow: isInputFocused.user ? '0 0 0 3px rgba(224, 26, 34, 0.15)' : 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  placeholder="Enter admin username"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    paddingLeft: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Lock 
                    className="h-5 w-5" 
                    style={{ 
                      color: isInputFocused.pass ? '#e01a22' : '#718096',
                      transition: 'color 0.2s ease'
                    }} 
                  />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsInputFocused(prev => ({ ...prev, pass: true }))}
                  onBlur={() => setIsInputFocused(prev => ({ ...prev, pass: false }))}
                  style={{
                    width: '100%',
                    paddingLeft: '48px',
                    paddingRight: '16px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    borderRadius: '12px',
                    border: isInputFocused.pass ? '1.5px solid #e01a22' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(7, 11, 18, 0.6)',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '14px',
                    boxShadow: isInputFocused.pass ? '0 0 0 3px rgba(224, 26, 34, 0.15)' : 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  placeholder="Enter password"
                />
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
                paddingTop: '14px',
                paddingBottom: '14px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: isHovered ? '0 8px 24px rgba(224, 26, 34, 0.35)' : '0 4px 12px rgba(224, 26, 34, 0.15)',
                transform: isHovered ? 'translateY(-1px)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              Sign In
            </button>
          </form>

          {/* Card Footer */}
          <div 
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#4a5568',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <ShieldAlert className="h-4 w-4 text-[#4a5568]" />
            <span>Authorized access only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
