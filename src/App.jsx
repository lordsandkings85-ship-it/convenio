import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Franchise from './pages/Franchise';
import Stores from './pages/Stores';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
import ScrollToTop from './components/ScrollToTop';
import ChatbotWidget from './components/ChatbotWidget';
import AdminView from './components/AdminView';
import { DialogProvider } from './components/Dialog';
import { TemplateProvider } from './context/TemplateContext';

function PublicLayout({ children }) {
  return (
    <div className="app site-content">
      <Header />
      <main className="main-content">{children}</main>
      <Footer />
      {/* AI-powered franchise enquiry chatbot, available site-wide */}
      <ChatbotWidget />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <DialogProvider>
        <TemplateProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Admin / Franchise Leads Dashboard (own layout, no public header/footer) */}
              <Route path="/admin" element={<AdminView />} />

              {/* Public marketing site */}
              <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
              <Route path="/franchise" element={<PublicLayout><Franchise /></PublicLayout>} />
              <Route path="/stores" element={<PublicLayout><Stores /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
              <Route path="/careers" element={<PublicLayout><Careers /></PublicLayout>} />
            </Routes>
          </Router>
        </TemplateProvider>
      </DialogProvider>
    </HelmetProvider>
  );
}

export default App;
