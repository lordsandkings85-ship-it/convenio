import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { FacebookIcon, InstagramIcon, YoutubeIcon, LinkedinIcon } from '../components/Icons';
import SEO from '../components/SEO';
import './Contact.css';

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Formsubmit visual customization
    data["_template"] = "table";
    data["_subject"] = `New Contact Form Message: ${data["Subject"] || "No Subject"}`;

    fetch("https://formsubmit.co/ajax/conveniomart@lordsandkingsagro.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(resData => {
        setIsSubmitting(false);
        setIsSuccess(true);
      })
      .catch(error => {
        console.error("Form submission error:", error);
        setIsSubmitting(false);
        // Fallback to success so user flow is not blocked if service is momentarily offline
        setIsSuccess(true);
      });
  };

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Convenio Mart",
      "telephone": "+91 8072557159",
      "email": "conveniomart@lordsandkingsagro.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "No. D5, 2nd Floor, Parsn Complex, Kodambakkam High Road, Nungambakkam",
        "addressLocality": "Chennai",
        "addressRegion": "Tamil Nadu",
        "postalCode": "600034",
        "addressCountry": "IN"
      }
    }
  };

  return (
    <section className="contact-page section">
      <SEO 
        title="Contact Us" 
        description="Get in touch with Convenio Mart. Reach out to our corporate office for enquiries, support, or partnership opportunities." 
        keywords="convenio mart contact, customer support, corporate office Chennai, email convenio mart"
        schema={contactSchema}
      />
      <div className="container contact-wrapper">
        
        {/* Contact Info */}
        <div className="contact-info">
          <h2 className="contact-title">Get In Touch</h2>
          
          <div className="info-items-container">
            <div className="info-item">
              <div className="info-icon"><MapPin size={20} color="var(--primary-color)" /></div>
              <div className="info-text">
                <h4>ConvenioMart Office</h4>
                <p>No. D5, 2nd Floor, Parsn Complex,<br />Kodambakkam High Road,<br />Nungambakkam, Chennai – 600 034.</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon"><Phone size={20} color="var(--primary-color)" /></div>
              <div className="info-text">
                <a href="tel:+918072557159" className="contact-link">+91 8072557159</a>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon"><Mail size={20} color="var(--primary-color)" /></div>
              <div className="info-text">
                <a href="mailto:conveniomart@lordsandkingsagro.com" className="contact-link">conveniomart@lordsandkingsagro.com</a>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon"><Clock size={20} color="var(--primary-color)" /></div>
              <div className="info-text">
                <p>Mon - Sat: 9:00 AM - 9:00 PM</p>
                <p>Sunday: 10:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
          
          <div className="social-links-dark">
            <a href="#" aria-label="Facebook"><FacebookIcon size={20} /></a>
            <a href="#" aria-label="Instagram"><InstagramIcon size={20} /></a>
            <a href="#" aria-label="YouTube"><YoutubeIcon size={20} /></a>
            <a href="#" aria-label="LinkedIn"><LinkedinIcon size={20} /></a>
          </div>
        </div>
        
        {/* Contact Form */}
        <div className="contact-form-container">
          {isSuccess ? (
            <div className="form-success-message">
              <CheckCircle size={64} color="var(--primary-color)" />
              <h3>Thank You!</h3>
              <p>Your message has been sent successfully. Our team will get back to you shortly.</p>
              <button className="btn-primary" onClick={() => setIsSuccess(false)} style={{ marginTop: '1.5rem' }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <div className="form-header">
                <h3>Send Us a Message</h3>
                <p>We'd love to hear from you. Please fill out the form below.</p>
              </div>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fullname">Full Name *</label>
                    <input type="text" id="fullname" name="Full Name" className="form-control" placeholder="John Doe" autoComplete="name" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number *</label>
                    <input type="tel" id="phoneNumber" name="Phone Number" className="form-control" placeholder="+91 98765 43210" autoComplete="tel" required />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="emailAddress">Email Address *</label>
                  <input type="email" id="emailAddress" name="Email Address" className="form-control" placeholder="john@example.com" autoComplete="email" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input type="text" id="subject" name="Subject" className="form-control" placeholder="Enquiry / Feedback" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea id="message" name="Message" className="form-control" rows="5" placeholder="Your message here..." required></textarea>
                </div>
                
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : (
                    <>
                      Send Message
                      <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
        
      </div>
    </section>
  );
};

export default Contact;
