import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon, YoutubeIcon, LinkedinIcon } from './Icons';
import Logo from './Logo';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div style={{ marginBottom: '1.5rem' }}>
              <Logo theme="dark" />
            </div>
            <p className="footer-operated-by">
              A unit owned and operated by:<br />
              <strong>LORDS AND KINGS AGRO PVT LTD</strong>
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><FacebookIcon size={20} /></a>
              <a href="#" aria-label="Instagram"><InstagramIcon size={20} /></a>
              <a href="#" aria-label="YouTube"><YoutubeIcon size={20} /></a>
              <a href="#" aria-label="LinkedIn"><LinkedinIcon size={20} /></a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h3>Company</h3>
              <Link to="/about">About Us</Link>
              <Link to="/careers">Careers</Link>
            </div>
            <div className="footer-column">
              <h3>Business</h3>
              <Link to="/franchise">Franchise</Link>
              <Link to="/stores">Our Stores</Link>
            </div>
            <div className="footer-column">
              <h3>Support</h3>
              <Link to="/contact">Contact Us</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 ConvenioMart. All Rights Reserved.</p>
          <p>A UNIT OWNED AND OPERATED BY LORDS AND KINGS AGRO PVT LTD</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
