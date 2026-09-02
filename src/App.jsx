import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ChatbotWidget from './components/ChatbotWidget';

// Route code-splitting with dynamic imports
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Franchise = lazy(() => import('./pages/Franchise'));
const Stores = lazy(() => import('./pages/Stores'));
const Contact = lazy(() => import('./pages/Contact'));
const Careers = lazy(() => import('./pages/Careers'));

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <div className="app">
          <Header />
          <main className="main-content">
            <Suspense fallback={
              <div className="page-loader">
                <div className="loading-spinner"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/franchise" element={<Franchise />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/careers" element={<Careers />} />
              </Routes>
            </Suspense>
          </main>
          <ChatbotWidget />
          <Footer />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
