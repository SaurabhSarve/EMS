import React from "react";
import "../assets/styles/LandingPageStyles/Footer.css";
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-logo">
            {/* <span className="logo-icon">⊟⊟</span> */}
            <img src="logo.png" alt="" className="footer-logo-img" />
          </div>
          <div className="footer-para">
            <p>
              The leading employee management platform for modern enterprises.
              Scalable, secure, and simple to use.
            </p>
            <p></p>
          </div>
          <div className="social-links">
            <a
              href="https://www.linkedin.com/company/graphura-india-private-limited/"
              title="LinkedIn"
            >
              <i class="fa-brands fa-linkedin"></i>
            </a>

            <a href="#" title="Twitter">
              <i className="fa-brands fa-twitter"></i>
            </a>

            <a
              href="https://www.facebook.com/share/19nKAMTopZ/"
              title="Facebook"
            >
              <i class="fa-brands fa-facebook"></i>
            </a>

            <a
              href="https://www.instagram.com/graphura.in?igsh=MXNqNmtidzljNDJlag=="
              title="Instagram"
            >
              <i class="fa-brands fa-instagram"></i>
            </a>
          </div>
        </div>

        {/* <div className="footer-section"></div>
        <div className="footer-section"></div> */}

        <div className="footer-section">
          <div className="quick-links-heading">
            <h4>Platform </h4>
            <span></span>
          </div>
          
          <ul>
            <li>
              <a href="/">Ems Enterprises</a>
            </li>
            <li>
              <a href="#features">Features</a>
            </li>
            {/* <li>
              <a href="#">Integrations</a>
            </li> */}
            <li>
              <a href="#">Pricing</a>
            </li>
            {/* <li>
              <a href="#">API Documentation</a>
            </li> */}
          </ul>
        </div>

        <div className="footer-section">
          <div className="quick-links-heading">
            <h4>Contact Us</h4>
            <span></span>
          </div>
          
          <ul>
            <li>
              <a href="#">
                <i class="fa-solid fa-location-dot"></i>{" "}
                <span style={{fontWeight: "600"}}>Graphura India Private Limited,</span> near RSF, Pataudi,
                Gurgaon, Haryana 122503
              </a>
            </li>
            <li>
              <a href="#">
                <i class="fa-solid fa-phone"></i> 7378021327
              </a>
            </li>
            {/* <li>
              <a href="#">System Status</a>
            </li> */}
            <li>
              <a href="#">
                <i class="fa-solid fa-envelope"></i> official@graphura.in
              </a>
            </li>
            {/* <li>
              <a href="#">Privacy Policy</a>
            </li> */}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 EMS Enterprise Inc. All rights reserved.</p>
        {/* <div className="footer-links">
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Cookie Settings</a>
        </div> */}
      </div>
    </footer>
  );
}
