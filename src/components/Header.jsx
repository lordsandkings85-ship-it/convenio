import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from './Logo';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="header">
      <div className="container header-container">
        <Logo theme="light" />

        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className={`nav-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
          <nav className="nav">
            <Link to="/about" className={`nav-link ${isActive('/about')}`} onClick={closeMenu}>About Us</Link>
            <Link to="/stores" className={`nav-link ${isActive('/stores')}`} onClick={closeMenu}>Our Stores</Link>
            <Link to="/careers" className={`nav-link ${isActive('/careers')}`} onClick={closeMenu}>Careers</Link>
            <Link to="/contact" className={`nav-link ${isActive('/contact')}`} onClick={closeMenu}>Contact Us</Link>
          </nav>

          <Link to="/franchise" className="btn-primary" onClick={closeMenu}>
            Enquire Franchise
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
