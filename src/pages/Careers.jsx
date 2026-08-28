import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Briefcase, Heart, TrendingUp, Users, CheckCircle, ArrowRight, MapPin } from 'lucide-react';
import './Careers.css';

const Careers = () => {
  const careersSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "JobPosting",
        "title": "Store Supervisor",
        "description": "As a Store Supervisor, you will be the backbone of our daily operations. You will lead a team of dedicated staff, ensuring that our high standards of customer service, store hygiene, and inventory management are consistently met.",
        "datePosted": "2026-06-16",
        "validThrough": "2026-12-31",
        "employmentType": "FULL_TIME",
        "hiringOrganization": {
          "@type": "Organization",
          "name": "Convenio Mart",
          "sameAs": "http://localhost:5173/"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Chennai",
            "addressRegion": "Tamil Nadu",
            "addressCountry": "IN"
          }
        }
      },
      {
        "@type": "JobPosting",
        "title": "Store Keeper",
        "description": "The Store Keeper is crucial for maintaining our supply chain integrity. You will be responsible for receiving goods, managing the stockroom efficiently, and ensuring the sales floor is always properly stocked.",
        "datePosted": "2026-06-16",
        "validThrough": "2026-12-31",
        "employmentType": "FULL_TIME",
        "hiringOrganization": {
          "@type": "Organization",
          "name": "Convenio Mart",
          "sameAs": "http://localhost:5173/"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Chennai",
            "addressRegion": "Tamil Nadu",
            "addressCountry": "IN"
          }
        }
      }
    ]
  };

  return (
    <div className="careers-page">
      <SEO 
        title="Careers | Join Our Team" 
        description="Explore exciting career opportunities at Convenio Mart. We are currently hiring for Store Supervisor and Store Keeper roles across our retail network." 
        keywords="convenio mart careers, retail jobs, store supervisor, store keeper, retail careers india"
        schema={careersSchema}
      />
      


      {/* Careers Hero Section */}
      <section className="careers-hero container">
        <div className="careers-hero-content">
          <h1>Join Our Growing Family</h1>
          <p>
            At ConvenioMart, we believe that our people are our greatest asset. 
            We are always looking for passionate, dedicated individuals to help us redefine neighborhood retail.
          </p>
          <a href="#open-positions" className="btn-dark">View Open Positions</a>
        </div>
        <div className="careers-hero-image">
          <img src="/hero-store.webp" alt="ConvenioMart Team" width="600" height="400" className="rounded-image" loading="lazy" />
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="open-positions" className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2 className="section-title">Open Positions</h2>
            <p style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
              We are actively hiring for the following roles across our rapidly expanding network.
            </p>
          </div>

          <div className="jobs-container">
            {/* Store Supervisor Job */}
            <div className="job-card">
              <div className="job-header">
                <div>
                  <h3 className="job-title">Store Supervisor</h3>
                  <div className="job-meta">
                    <span><MapPin size={16} /> Multiple Locations</span>
                    <span>Full-Time</span>
                  </div>
                </div>
                <a href="mailto:conveniomart@lordsandkingsagro.com?subject=Application for Store Supervisor" className="btn-primary apply-btn">
                  Apply Now <ArrowRight size={18} />
                </a>
              </div>
              <div className="job-body">
                <div className="job-section">
                  <h4><Briefcase size={18} /> Role Description</h4>
                  <p>As a Store Supervisor, you will be the backbone of our daily operations. You will lead a team of dedicated staff, ensuring that our high standards of customer service, store hygiene, and inventory management are consistently met.</p>
                </div>
                <div className="job-section">
                  <h4><CheckCircle size={18} /> Key Responsibilities</h4>
                  <ul className="job-list">
                    <li>Oversee daily store operations and staff scheduling.</li>
                    <li>Ensure excellent customer service and handle any escalations.</li>
                    <li>Monitor inventory levels and coordinate with the supply chain team.</li>
                    <li>Maintain visual merchandising and store cleanliness standards.</li>
                    <li>Train and mentor junior staff members.</li>
                  </ul>
                </div>
                <div className="job-section">
                  <h4><CheckCircle size={18} /> Requirements</h4>
                  <ul className="job-list">
                    <li>0-5+ years of experience in retail management or supervision.</li>
                    <li>Strong leadership and communication skills.</li>
                    <li>Ability to handle fast-paced environments and resolve issues quickly.</li>
                    <li>Basic proficiency in retail POS and inventory software.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Store Keeper Job */}
            <div className="job-card">
              <div className="job-header">
                <div>
                  <h3 className="job-title">Store Keeper</h3>
                  <div className="job-meta">
                    <span><MapPin size={16} /> Multiple Locations</span>
                    <span>Full-Time</span>
                  </div>
                </div>
                <a href="mailto:conveniomart@lordsandkingsagro.com?subject=Application for Store Keeper" className="btn-primary apply-btn">
                  Apply Now <ArrowRight size={18} />
                </a>
              </div>
              <div className="job-body">
                <div className="job-section">
                  <h4><Briefcase size={18} /> Role Description</h4>
                  <p>The Store Keeper is crucial for maintaining our supply chain integrity. You will be responsible for receiving goods, managing the stockroom efficiently, and ensuring the sales floor is always properly stocked.</p>
                </div>
                <div className="job-section">
                  <h4><CheckCircle size={18} /> Key Responsibilities</h4>
                  <ul className="job-list">
                    <li>Receive, inspect, and record incoming stock deliveries.</li>
                    <li>Organize and maintain a clean, safe, and efficient stockroom.</li>
                    <li>Update inventory records and report discrepancies immediately.</li>
                    <li>Assist the floor staff with restocking shelves promptly.</li>
                    <li>Ensure compliance with proper storage guidelines (especially for perishables).</li>
                  </ul>
                </div>
                <div className="job-section">
                  <h4><CheckCircle size={18} /> Requirements</h4>
                  <ul className="job-list">
                    <li>High school diploma or equivalent.</li>
                    <li>Strong attention to detail and organizational skills.</li>
                    <li>Physical stamina to lift and move heavy boxes.</li>
                    <li>Previous experience in warehousing or stock management is a plus.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us Section */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title text-center">Why Work With Us?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon"><TrendingUp size={32} color="var(--primary-color)" /></div>
              <h4>Career Growth</h4>
              <p>We provide extensive training programs and prioritize promoting from within.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><Heart size={32} color="var(--primary-color)" /></div>
              <h4>Great Environment</h4>
              <p>Experience a collaborative, supportive, and inclusive workplace culture.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><Users size={32} color="var(--primary-color)" /></div>
              <h4>Impactful Work</h4>
              <p>Help empower local communities by ensuring access to daily essentials.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><Briefcase size={32} color="var(--primary-color)" /></div>
              <h4>Competitive Benefits</h4>
              <p>Enjoy attractive compensation, performance bonuses, and employee discounts.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;
