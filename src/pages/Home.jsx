import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AppShowcase from '../components/AppShowcase';
import { 
  MapPin, 
  Store, 
  Users, 
  Package, 
  Handshake,
  Smartphone,
  TrendingUp,
  Truck,
  Megaphone,
  Settings,
  GraduationCap,
  ShoppingBasket,
  Apple,
  Milk,
  Cookie,
  Coffee,
  SprayCan,
  ArrowRight
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Convenio Mart",
    "image": "http://localhost:5173/logo.png",
    "@id": "http://localhost:5173/#localbusiness",
    "url": "http://localhost:5173/",
    "telephone": "+91 8072557159",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "No. D5, 2nd Floor, Parsn Complex, Kodambakkam High Road, Nungambakkam",
      "addressLocality": "Chennai",
      "addressRegion": "Tamil Nadu",
      "postalCode": "600034",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 13.0617,
      "longitude": 80.2508
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        ],
        "opens": "09:00",
        "closes": "21:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": "10:00",
        "closes": "18:00"
      }
    ]
  };

  return (
    <div className="home">
      <SEO 
        title="Home" 
        description="Convenio Mart - Your Neighborhood with Convenio Store. A modern retail experience offering high-quality groceries and daily essentials directly to your community." 
        keywords="convenio mart, grocery store, supermarket, daily essentials, retail franchise"
        schema={homeSchema}
      />
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-content">
            <p className="hero-subtitle">Convenio Mart</p>
            <h1>Your Neighborhood<br />with Convenio Store</h1>
            <p>A modern retail experience offering a wide range of high-quality groceries, daily essentials, and household products directly to your community.</p>
            <div className="hero-actions">
              <Link to="/stores" className="btn-primary">
                <MapPin size={18} />
                Find a Store
              </Link>
              <Link to="/franchise" className="btn-secondary">
                <Store size={18} />
                Own a Franchise
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <img src="/hero-store.webp" alt="ConvenioMart store entrance displaying fresh groceries" className="hero-img" width="1536" height="1024" />
        </div>
      </section>

      {/* Stats Banner */}
      <section className="stats-banner" style={{ paddingTop: '2.5rem' }}>
        <div className="stats-vision-header">
          {/* <span className="stats-vision-label">What We Stand For</span> */}
          <h2 className="stats-vision-title">Our Vision</h2>
          <div className="stats-vision-divider"></div>
        </div>
        <div className="container stats-container" style={{ paddingTop: '1rem' }}>
          <div className="stat-item">
            <div className="stat-icon-wrapper"><Store size={24} color="var(--primary-color)" /></div>
            <div className="stat-text">
              <div className="stat-number">120+</div>
              <p>Stores</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrapper"><MapPin size={24} color="var(--primary-color)" /></div>
            <div className="stat-text">
              <div className="stat-number">35+</div>
              <p>Cities</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrapper"><Users size={24} color="var(--primary-color)" /></div>
            <div className="stat-text">
              <div className="stat-number">500K+</div>
              <p>Happy Customers</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrapper"><Package size={24} color="var(--primary-color)" /></div>
            <div className="stat-text">
              <div className="stat-number">10,000+</div>
              <p>Products</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrapper"><Handshake size={24} color="var(--primary-color)" /></div>
            <div className="stat-text">
              <div className="stat-number">100+</div>
              <p>Franchise Partners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why ConvenioMart */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title text-center">Why <span style={{ whiteSpace: 'nowrap' }}>Convenio<span>Mart</span>?</span></h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><Smartphone size={32} color="var(--primary-color)" /></div>
              <h3>Smart Store Experience</h3>
              <p>Modern stores built for today's customers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><TrendingUp size={32} color="var(--primary-color)" /></div>
              <h3>High Return on Investment</h3>
              <p>Attractive ROI & great business potential.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Truck size={32} color="var(--primary-color)" /></div>
              <h3>Strong Supply Chain</h3>
              <p>Efficient supply chain ensuring availability.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Megaphone size={32} color="var(--primary-color)" /></div>
              <h3>Marketing Support</h3>
              <p>End-to-end marketing & brand support.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Settings size={32} color="var(--primary-color)" /></div>
              <h3>Technology Driven</h3>
              <p>Advanced systems for better control.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><GraduationCap size={32} color="var(--primary-color)" /></div>
              <h3>Training & Support</h3>
              <p>Complete training & ongoing support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ChikPuk App Showcase */}
      <AppShowcase />

      {/* CTA Banner */}
      <section className="container">
        <div className="cta-banner" style={{ backgroundImage: "url('/franchise.webp')" }}>
          <div className="cta-overlay"></div>
          <div className="cta-content">
            <h2>Own a ConvenioMart Store</h2>
            <p>Be your own boss. Build a successful future with India's fastest growing retail network.</p>
            <Link to="/franchise" className="btn-primary">Enquire Now <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
