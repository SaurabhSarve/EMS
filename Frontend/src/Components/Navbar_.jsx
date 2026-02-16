import React, { useState, useEffect} from 'react';
import "../assets/styles/LandingPageStyles/Navbar_.css";
import { useNavigate } from "react-router-dom";

const Navbar_ = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('home');
  const [scrolled, setScrolled] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLinkClick = (linkName) => {
    setActiveLink(linkName);
    closeMobileMenu();
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleRegister = () => {
   
      navigate("/register");
    
  }

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className={`animated-navbar ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="animated-navbar-container">
          {/* Logo */}
          <div className="navbar-logo">
            <img src="navbarLogo.png" alt="logo" className='logo'/>
          </div>

          <ul className="animated-navbar-links" role="menubar">
            <li role="none">
              <a
                href="#home"
                role="menuitem"
                className={`animated-nav-link ${activeLink === 'home' ? 'active' : ''}`}
                onClick={() => handleLinkClick('home')}
              >
                Home
                <span className="animated-nav-underline"></span>
              </a>
            </li>
            <li role="none">
              <a
                href="/admin-login"
                role="menuitem"
                className={`animated-nav-link ${activeLink === 'admin' ? 'active' : ''}`}
                onClick={() => handleLinkClick('admin')}
              >
                Admin
                <span className="animated-nav-underline"></span>
              </a>
            </li>
            <li role="none">
              <a
                href="/employee-login"
                role="menuitem"
                className={`animated-nav-link ${activeLink === 'employee' ? 'active' : ''}`}
                onClick={() => handleLinkClick('employee')}
              >
                Employee
                <span className="animated-nav-underline"></span>
              </a>
            </li>
          </ul>

          {/* Desktop Register Button */}
          <div className="animated-navbar-cta">
            <button onClick={handleRegister} className="animated-register-btn" aria-label="Register for an account">
              <span className="btn-text">Admin Register</span>
              <span className="btn-shine"></span>
            </button>
          </div>

          {/* Mobile Hamburger Icon */}
          <button
            className={`animated-hamburger ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="animated-hamburger-line"></span>
            <span className="animated-hamburger-line"></span>
            <span className="animated-hamburger-line"></span>
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div
        className={`animated-mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      ></div>

      {/* Mobile Sidebar Menu */}
      <aside
        className={`animated-mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}
        aria-label="Mobile navigation"
      >
        <div className="animated-mobile-sidebar-header">
          <div className="navbar-logo">
            <img src="logo.png" alt="" className='logo'/>
          </div>
          
          {/* Close Button */}
          <button
            className="animated-close-btn"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <nav className="animated-mobile-nav-links">
          <a
            href="#home"
            className={`animated-mobile-nav-link ${activeLink === 'home' ? 'active' : ''} ${isMobileMenuOpen ? 'stagger-1' : ''}`}
            onClick={() => handleLinkClick('home')}
          >
            {/* <span className="link-icon">🏠</span> */}
            <span>Home</span>
          </a>
          <a
            href="#"
            className={`animated-mobile-nav-link ${activeLink === 'admin' ? 'active' : ''} ${isMobileMenuOpen ? 'stagger-2' : ''}`}
            onClick={() => handleLinkClick('admin')}
          >
            {/* <span className="link-icon">⚡</span> */}
            <span>Admin Login</span>
          </a>
          <a
            href="#"
            className={`animated-mobile-nav-link ${activeLink === 'employee' ? 'active' : ''} ${isMobileMenuOpen ? 'stagger-3' : ''}`}
            onClick={() => handleLinkClick('employee')}
          >
            {/* <span className="link-icon">💬</span> */}
            <span>&gt;Employee Login</span>
          </a>
        </nav>

        <div className={`animated-mobile-sidebar-footer ${isMobileMenuOpen ? 'stagger-4' : ''}`}>
          <button className="animated-mobile-register-btn" onClick={closeMobileMenu}>
            <span>Admin Register</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navbar_;