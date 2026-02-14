import React, { useState } from "react";
import "../assets/styles/LandingPageStyles/formNav.css";
import logo from "../assets/images/bg removed.png";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* LOGO SECTION */}
        <div className="navbar-logo">
          <a href="/" className="navbar-logo-link">
            <img
              src={logo}
              alt="EMS Logo"
              className="navbar-logo-img"
            />
          </a>
        </div>

        {/* RIGHT SIDE (MOBILE MENU BUTTON) */}
        <div className="navbar-btn-div">
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {/* <i className="fa-solid fa-bars"></i> */}
          </button>
        </div>

      </div>
    </nav>
  );
}
