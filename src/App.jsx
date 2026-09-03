import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ChatbotWidget from './components/ChatbotWidget';
import { DialogProvider } from './components/Dialog';
import { TemplateProvider } from './context/TemplateContext';

// Route code-splitting with dynamic imports
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Franchise = lazy(() => import('./pages/Franchise'));
const Stores = lazy(() => import('./pages/Stores'));
const Contact = lazy(() => import('./pages/Contact'));
const Careers = lazy(() => import('./pages/Careers'));
const AdminView = lazy(() => import('./components/AdminView'));

function PublicLayout({ children }) {
  return (
    <div className="app site-content">
      <Header />
      <main className="main-content">{children}</main>
      <ChatbotWidget />
      <Footer />
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
            <Suspense
              fallback={
                <div className="page-loader">
                  <div className="loading-spinner"></div>
                </div>
              }
            >
              <Routes>
                {/* Admin Dashboard (standalone layout, no public header/footer) */}
                <Route path="/admin" element={<AdminView />} />

                {/* Public marketing pages */}
                <Route
                  path="/"
                  element={
                    <PublicLayout>
                      <Home />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <PublicLayout>
                      <About />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/franchise"
                  element={
                    <PublicLayout>
                      <Franchise />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/stores"
                  element={
                    <PublicLayout>
                      <Stores />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <PublicLayout>
                      <Contact />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/careers"
                  element={
                    <PublicLayout>
                      <Careers />
                    </PublicLayout>
                  }
                />
              </Routes>
            </Suspense>
          </Router>
        </TemplateProvider>
      </DialogProvider>
    </HelmetProvider>
  );
}

export default App;
