import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AppShowcase from '../components/AppShowcase';
import { Store, MapPin, Users, Package, User, Shield, Target, Lightbulb, Eye, TrendingUp, Award, CheckCircle, ArrowRight } from 'lucide-react';
import './About.css';

const About = () => {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "Convenio Mart",
      "url": "http://localhost:5173/",
      "logo": "http://localhost:5173/logo.png",
      "parentOrganization": {
        "@type": "Organization",
        "name": "LORDS AND KINGS AGRO PVT LTD"
      },
      "description": "ConvenioMart was founded with a simple mission — to make everyday shopping convenient, affordable and delightful.",
      "founder": {
        "@type": "Person",
        "name": "Board of Directors"
      }
    }
  };

  return (
    <div className="about-page">
      <SEO 
        title="About Us" 
        description="Learn about Convenio Mart's mission to make everyday shopping convenient, affordable and delightful across our growing network in India." 
        keywords="about convenio mart, our mission, grocery franchise, retail network"
        schema={aboutSchema}
      />


      {/* About Hero Section */}
      <section className="about-hero container">
        <div className="about-content">
          <h1>About Us</h1>
          <p>
            ConvenioMart was founded with a simple mission — to make everyday shopping convenient, affordable and delightful. 
            From a single store to a growing network across India, we are committed to serving every neighborhood with quality and trust.
          </p>
          <Link to="/contact" className="btn-dark">Know More</Link>
        </div>
        <div className="about-image">
          <img src="/hero-store.webp" alt="ConvenioMart Store" width="600" height="400" className="rounded-image" loading="lazy" />
        </div>
      </section>

      {/* Stats Banner */}
      <section className="container">
        <div className="stats-banner-dark">
          <div className="stats-container">
            <div className="stat-item-light">
              <div className="stat-icon-outline"><Store size={24} /></div>
              <div className="stat-text-light">
                <h3>120+</h3>
                <p>Stores</p>
              </div>
            </div>
            <div className="stat-item-light">
              <div className="stat-icon-outline"><MapPin size={24} /></div>
              <div className="stat-text-light">
                <h3>35+</h3>
                <p>Cities</p>
              </div>
            </div>
            <div className="stat-item-light">
              <div className="stat-icon-outline"><Users size={24} /></div>
              <div className="stat-text-light">
                <h3>500K+</h3>
                <p>Happy Customers</p>
              </div>
            </div>
            <div className="stat-item-light">
              <div className="stat-icon-outline"><Package size={24} /></div>
              <div className="stat-text-light">
                <h3>10,000+</h3>
                <p>Products</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title text-center">Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon"><User size={32} color="var(--primary-color)" /></div>
              <h4>Customer First</h4>
              <p>We put our customers at the heart of everything we do.</p>
            </div>
            <div className="value-card">
              <div className="value-icon"><Shield size={32} color="var(--primary-color)" /></div>
              <h4>Integrity</h4>
              <p>Honest, transparent and accountable in all our actions.</p>
            </div>
            <div className="value-card">
              <div className="value-icon"><Target size={32} color="var(--primary-color)" /></div>
              <h4>Quality</h4>
              <p>We ensure best quality products at standards.</p>
            </div>
            <div className="value-card">
              <div className="value-icon"><Lightbulb size={32} color="var(--primary-color)" /></div>
              <h4>Innovation</h4>
              <p>Continuously improving to serve you better every day.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Mission & Vision Section */}
      <section className="section mission-vision-section">
        <div className="container">
          <div className="mission-vision-grid">
            <div className="mv-card">
              <div className="mv-icon"><Target size={40} color="var(--primary-color)" /></div>
              <h3>Our Mission</h3>
              <p>To redefine neighborhood retail by delivering a curated selection of high-quality groceries, fresh produce, and daily essentials with unmatched convenience and affordability.</p>
            </div>
            <div className="mv-card">
              <div className="mv-icon"><Eye size={40} color="var(--primary-color)" /></div>
              <h3>Our Vision</h3>
              <p>To become India's most trusted and widespread retail network, empowering local communities and setting the gold standard for modern grocery shopping.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Road Map Section */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title text-center">Road Map</h2>
          <div className="timeline-container">
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <span className="timeline-date">2022</span>
                <h3>The Beginning</h3>
                <p>Started our first flagship store with a vision to organize neighborhood retail.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <span className="timeline-date">Today</span>
                <h3>Growing Presence</h3>
                <p>Currently operating 10+ stores with thousands of happy customers and growing rapidly.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <span className="timeline-date">Future</span>
                <h3>Nationwide Expansion</h3>
                <p>We plan to expand our network to 120+ stores, bringing convenience to every neighborhood.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2 className="section-title">Leadership</h2>
            <p style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
              ConvenioMart is a unit owned and operated by <strong>Lords and Kings Agro Pvt Ltd</strong>. Our leadership team brings decades of retail and supply chain expertise.
            </p>
          </div>
          <div className="leadership-grid">
            <div className="leader-card">
              <div className="leader-image-placeholder board-gradient">
                <span className="leader-monogram">BD</span>
              </div>
              <h4>Board of Directors</h4>
              <p>Lords and Kings Agro Pvt Ltd</p>
            </div>
            <div className="leader-card">
              <div className="leader-image-placeholder exec-gradient">
                <span className="leader-monogram">ET</span>
              </div>
              <h4>Executive Team</h4>
              <p>Retail Operations</p>
            </div>
            <div className="leader-card">
              <div className="leader-image-placeholder adv-gradient">
                <span className="leader-monogram">AB</span>
              </div>
              <h4>Advisory Board</h4>
              <p>Industry Experts</p>
            </div>
          </div>
        </div>
      </section> */}

      {/* ChikPuk App Showcase */}
      <AppShowcase />

      {/* Final CTA */}
      <section className="about-cta">
        <div className="container">
          <div className="about-cta-content">
            <h2>Join the ConvenioMart Family</h2>
            <p>Be part of our incredible growth story. Partner with us and start your own successful retail business today.</p>
            <Link to="/franchise" className="btn-primary">
              Become a Franchise <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
