import React, { useState, useRef } from 'react';
import { Smartphone, ShoppingBag, ArrowRight } from 'lucide-react';
import './AppShowcase.css';

const AppShowcase = () => {
  const phoneRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!phoneRef.current) return;
    
    const phone = phoneRef.current;
    const rect = phone.getBoundingClientRect();
    
    // Calculate mouse position relative to the center of the phone
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Smoothly rotate based on mouse position
    const rotateX = (y / rect.height) * -20; // Max 20 deg
    const rotateY = (x / rect.width) * 20;  // Max 20 deg
    
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    // Reset to neutral position with a slight idle 3D tilt
    setRotate({ x: 5, y: -10 });
  };

  return (
    <section className="app-showcase-section">
      <div className="container app-showcase-container">
        <div className="app-showcase-content">
          <span className="badge">New Release</span>
          <h2 className="section-title">Shop Anytime, Anywhere with <span>ChikPuk</span></h2>
          <p className="app-description">
            Experience the future of neighborhood retail right from your smartphone. 
            Download the <strong>ChikPuk</strong> app to access exclusive deals, track your orders in real-time, 
            and get everything delivered to your door in minutes!
          </p>
          
          <ul className="app-features">
            <li><ShoppingBag size={20} className="feature-icon" /> Access 10,000+ products instantly</li>
            <li><Smartphone size={20} className="feature-icon" /> Lightning-fast checkout & payments</li>
          </ul>

          <div className="app-download-buttons">
         
            <a 
              href="https://play.google.com/store/apps/details?id=com.techcoracorp.chikpuk" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="store-btn google-btn"
              style={{ textDecoration: 'none' }}
            >
              <div className="btn-content">
                <span className="btn-subtext">GET IT ON</span>
                <span className="btn-text">Google Play</span>
              </div>
            </a>
            <a 
              href="https://apps.apple.com/in/app/chikpuk/id6737693091" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="store-btn apple-btn"
              style={{ textDecoration: 'none' }}
            >
              <div className="btn-content">
                <span className="btn-subtext">Download on the</span>
                <span className="btn-text">App Store</span>
              </div>
            </a>
          </div>
        </div>

        <div className="app-showcase-visual">
          <div 
            className="phone-container"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: '1000px' }}
          >
            <div 
              className="phone-module" 
              ref={phoneRef}
              style={{
                transform: `rotateX(${rotate.x || 5}deg) rotateY(${rotate.y || -10}deg)`
              }}
            >
              <div className="hardware-btn volume-up"></div>
              <div className="hardware-btn volume-down"></div>
              <div className="hardware-btn power"></div>
              <div className="phone-camera-hole"></div>
              <div 
                className="phone-glare" 
                style={{ 
                  background: `linear-gradient(${135 + (rotate.x * 2) + (rotate.y * 2)}deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 50%)` 
                }}
              ></div>
              <div className="phone-screen">
                <div className="mock-app-header">
                  <div className="mock-app-top">
                    <h3 className="mock-logo">ChikPuk</h3>
                    <div className="mock-profile"><div className="mock-avatar"></div></div>
                  </div>
                  <div className="mock-search-bar">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search for groceries..." disabled />
                  </div>
                </div>
                
                <div className="mock-banner">
                  <div className="banner-text">
                    <span>50% OFF</span>
                    <p>On your first order</p>
                  </div>
                  <div className="banner-btn">Shop Now</div>
                </div>

                <div className="mock-section-title">Categories</div>
                <div className="mock-categories">
                  <div className="mock-cat"><div className="cat-icon">🥬</div><span>Fresh</span></div>
                  <div className="mock-cat"><div className="cat-icon">🥛</div><span>Dairy</span></div>
                  <div className="mock-cat"><div className="cat-icon">🍪</div><span>Snacks</span></div>
                  <div className="mock-cat"><div className="cat-icon">🥤</div><span>Drinks</span></div>
                </div>

                <div className="mock-section-title">Popular Items</div>
                <div className="mock-product-grid">
                  <div className="mock-product">
                    <div className="prod-img">🍞</div>
                    <div className="prod-info">
                      <span className="prod-name">Whole Wheat Bread</span>
                      <div className="prod-bottom">
                        <span className="prod-price">₹45</span>
                        <div className="prod-add">+</div>
                      </div>
                    </div>
                  </div>
                  <div className="mock-product">
                    <div className="prod-img">🥚</div>
                    <div className="prod-info">
                      <span className="prod-name">Farm Eggs (6 pcs)</span>
                      <div className="prod-bottom">
                        <span className="prod-price">₹60</span>
                        <div className="prod-add">+</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mock-bottom-nav">
                  <div className="nav-item active">🏠</div>
                  <div className="nav-item">🛒</div>
                  <div className="nav-item">❤️</div>
                  <div className="nav-item">👤</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppShowcase;
