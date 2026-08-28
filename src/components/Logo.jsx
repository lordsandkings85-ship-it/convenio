import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ theme = 'light', className = '' }) => {
  const isDark = theme === 'dark';
  
  // For light theme (header): use multiply to drop the white background of the JPEG.
  // For dark theme (footer): invert it, make it white, and use screen to drop the black background.
  const blendStyles = isDark ? {
    filter: 'grayscale(1) invert(1) brightness(100)',
    mixBlendMode: 'screen'
  } : {
    mixBlendMode: 'multiply'
  };

  return (
    <Link to="/" className={`brand-logo ${className}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
      <img 
        src="/logo.png" 
        alt="Convenio Mart Logo" 
        width="227"
        height="48"
        style={{ 
          height: '48px',
          width: 'auto',
          objectFit: 'contain',
          ...blendStyles
        }} 
      />
    </Link>
  );
};

export default Logo;
