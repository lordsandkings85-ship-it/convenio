import React, { useState } from 'react';
import { Check, ClipboardList, PhoneCall, MapPin, Rocket, LayoutDashboard, Truck, Megaphone, Users, ChevronDown, ChevronUp, CheckCircle, Send } from 'lucide-react';
import SEO from '../components/SEO';
import AppShowcase from '../components/AppShowcase';
import { createEnquiry } from '../lib/api';
import './Franchise.css';

// Base URL for the Resend proxy. Same intent as VITE_API_BASE in ChatbotWidget:
// default same-origin /api, or an external API host for static deployments.
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

const faqs = [
  {
    question: "What is the minimum investment required?",
    answer: "The minimum investment typically ranges from 10L to 20L depending on the store size and location. This covers the franchise fee, store setup, initial inventory, and branding."
  },
  {
    question: "Do I need prior retail experience?",
    answer: "No prior retail experience is strictly necessary! We provide comprehensive training covering operations, inventory management, and customer service to ensure you are fully prepared."
  },
  {
    question: "How long does it take to set up a new store?",
    answer: "From the signing of the agreement to the grand opening, it usually takes between 30 to 45 days, provided the location is finalized and ready for fit-outs."
  },
  {
    question: "Will you help me find a location?",
    answer: "Absolutely. Our expert real estate team will assist you in analyzing foot traffic and demographics to help select a highly profitable location for your new store."
  }
];

const Franchise = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const franchiseSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const fullName = (data["Full Name"] || "").trim();
    const mobile = (data["Mobile Number"] || "").trim();
    const email = (data["Email Address"] || "").trim();
    const city = (data["City or Location"] || "").trim();
    const propertyStatus = data["Property Status"] || "";
    const carpetArea = data["Carpet Area (sq.ft)"] || "";
    const message = (data["Message"] || "").trim();

    // 1. Save the lead to Supabase so it shows up in the Franchise Admin Dashboard
    //    (property_status/carpet_area require the supabase_franchise_fields.sql migration)
    try {
      await createEnquiry({
        name: fullName,
        phone: mobile,
        email,
        location: city,
        property_status: propertyStatus,
        carpet_area: carpetArea,
        notes: message,
        status: 'NEW',
        source: 'FORM'
      });
    } catch (dbErr) {
      console.error('Database connection error:', dbErr);
    }

    // 2. Send an instant email notification via the Resend API
    try {
      await fetch(`${API_BASE}/resend/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Convenio Mart Leads <info@atyourdoor.life>',
          to: ['conveniomart@lordsandkingsagro.com'],
          subject: `New Franchise Lead: ${fullName} (${city})`,
          html: `
            <h3>New Franchise Enquiry</h3>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mobile:</strong> ${mobile}</p>
            <p><strong>City:</strong> ${city}</p>
            <p><strong>Property Status:</strong> ${propertyStatus || 'N/A'}</p>
            <p><strong>Carpet Area:</strong> ${carpetArea ? carpetArea + ' sq.ft' : 'N/A'}</p>
            <p><strong>Message:</strong> ${message || 'N/A'}</p>
            <p><strong>Source:</strong> Franchise Enquiry Form</p>
          `
        })
      });
    } catch (emailErr) {
      console.error('Resend email error:', emailErr);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="franchise-page">
      <SEO 
        title="Enquire Franchise" 
        description="Take the first step towards ownership. Start your own profitable grocery retail business with Convenio Mart's proven franchise model." 
        keywords="convenio mart franchise, retail franchise, grocery store business, franchise enquiry"
        schema={franchiseSchema}
      />
      <section className="franchise-hero">
        {/* Background is handled in CSS similar to the Home hero split */}
        <div className="franchise-hero-bg" style={{ backgroundImage: "url('/franchise_owner_cta.webp')" }}></div>
        <div className="franchise-hero-overlay"></div>
        
        <div className="container franchise-container">
          <div className="franchise-left">
            <h1>Take the First Step <br/> Towards Ownership</h1>
            <p className="franchise-subtitle">Fill the form and our team will <br/> get in touch with you.</p>
            
            <ul className="franchise-benefits">
              <li><Check size={20} color="var(--primary-color)" strokeWidth={3} /> Low Investment</li>
              <li><Check size={20} color="var(--primary-color)" strokeWidth={3} /> High Returns</li>
              <li><Check size={20} color="var(--primary-color)" strokeWidth={3} /> Complete Support</li>
              <li><Check size={20} color="var(--primary-color)" strokeWidth={3} /> Proven Business Model</li>
            </ul>
          </div>
          
          <div className="franchise-right">
            <div className="enquiry-form-card">
              {isSuccess ? (
                <div className="form-success-message" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <CheckCircle size={64} color="var(--primary-color)" style={{ margin: '0 auto 1rem' }} />
                  <h3>Application Received!</h3>
                  <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>Thank you for your interest in franchising with Convenio Mart. Our team will contact you shortly.</p>
                  <button className="btn-primary" onClick={() => setIsSuccess(false)}>
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-card-header" style={{ marginBottom: '2rem', textAlign: 'center'}}>

                    <h3 style={{ fontSize: '1.5rem', color: 'var(--dark-navy)', marginBottom: '0.5rem', }}>Partner Application</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Join the Convenio Mart family. Please fill out the form below to get started.</p>
                  </div>
                  <form className="enquiry-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="fullName">Full Name *</label>
                        <input type="text" id="fullName" name="Full Name" placeholder="John Doe" autoComplete="name" required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="mobileNumber">Mobile Number *</label>
                        <input type="tel" id="mobileNumber" name="Mobile Number" placeholder="+91 98765 43210" autoComplete="tel" required />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="emailAddress">Email Address *</label>
                        <input type="email" id="emailAddress" name="Email Address" placeholder="john@example.com" autoComplete="email" required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="cityOrLocation">City / Location *</label>
                        <input type="text" id="cityOrLocation" name="City or Location" placeholder="Chennai, Adyar" autoComplete="address-level2" required />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="propertyStatus">Property Status *</label>
                        <select id="propertyStatus" name="Property Status" defaultValue="" required>
                          <option value="" disabled>Select Type</option>
                          <option value="owned">Owned</option>
                          <option value="leased">Leased</option>
                          <option value="rented">Rented</option>
                          <option value="looking">Looking for space</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="carpetArea">Carpet Area (sq.ft) *</label>
                        <input type="number" id="carpetArea" name="Carpet Area (sq.ft)" placeholder="e.g. 500" required />
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label htmlFor="message">Message (Optional)</label>
                      <textarea id="message" name="Message" placeholder="Tell us why you want to partner with us..." rows="3" style={{ resize: 'vertical' }}></textarea>
                    </div>
                    
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : (
                        <>
                          Submit Application
                          <Send size={18} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title text-center">How It Works</h2>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon"><ClipboardList size={36} color="var(--primary-color)" /></div>
              <h4>Submit Enquiry</h4>
              <p>Fill out the form above with your details and preferred investment range.</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon"><PhoneCall size={36} color="var(--primary-color)" /></div>
              <h4>Consultation</h4>
              <p>Our franchise expert will contact you to discuss your goals and answer questions.</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon"><MapPin size={36} color="var(--primary-color)" /></div>
              <h4>Site Selection</h4>
              <p>We'll help you finalize the perfect, high-footfall location for your store.</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon"><Rocket size={36} color="var(--primary-color)" /></div>
              <h4>Setup & Launch</h4>
              <p>Complete support from interior design to your grand opening day.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title text-center">What We Offer</h2>
          <p className="text-center" style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto 3rem' }}>
            We provide comprehensive end-to-end support to ensure your franchise operates smoothly and profitably from day one.
          </p>
          <div className="support-grid">
            <div className="support-card">
              <LayoutDashboard size={32} color="var(--primary-color)" />
              <h4>Store Design & Layout</h4>
              <p>Professional interior design, racking, and floor planning for optimal customer flow.</p>
            </div>
            <div className="support-card">
              <Truck size={32} color="var(--primary-color)" />
              <h4>Supply Chain</h4>
              <p>Reliable and continuous supply of high-quality inventory at the best margins.</p>
            </div>
            <div className="support-card">
              <Megaphone size={32} color="var(--primary-color)" />
              <h4>Marketing Support</h4>
              <p>National branding campaigns and targeted local marketing strategies.</p>
            </div>
            <div className="support-card">
              <Users size={32} color="var(--primary-color)" />
              <h4>Staff Training</h4>
              <p>Extensive training on POS systems, inventory management, and customer service.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ChikPuk App Showcase */}
      <AppShowcase />

      {/* FAQ Section */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title text-center">Frequently Asked Questions</h2>
          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${openFaqIndex === index ? 'open' : ''}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-question" 
                  aria-expanded={openFaqIndex === index}
                  aria-controls={`faq-answer-${index}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFaq(index); } }}
                >
                  <h4>{faq.question}</h4>
                  {openFaqIndex === index ? <ChevronUp size={20} color="var(--primary-color)" aria-hidden="true" /> : <ChevronDown size={20} color="var(--text-light)" aria-hidden="true" />}
                </div>
                <div className="faq-answer" id={`faq-answer-${index}`}>
                  <div className="faq-answer-content">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Franchise;
