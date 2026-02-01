import React, { useState } from "react";
import "../../assets/styles/LandingPageStyles/LandingPage.css";
import Footer from "../../Components/Footer";
import { Link } from "react-router-dom";
import Navbar_ from "../../Components/Navbar_";

import { Lock, CalendarDays, IndianRupee, TrendingUp } from "lucide-react";

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="home-main">
        <Navbar_ />
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <span className="new-badge">
                🔵 New: AI-Powered Analytics Module
              </span>

              <h1>
                Empowering Enterprise{" "}
                <span className="highlight">Workforce Efficiency</span>
              </h1>

              <p className="hero-description">
                Streamline attendance, payroll, and performance in one secure,
                cloud-based ecosystem designed for modern enterprises.
              </p>

              <div className="hero-buttons">
                <div className="hero-btn">
                  <a href="#" className="btn-secondary get-started-btn">
                    Get Started
                  </a>
                  <a href="#features" className="btn-secondary book-demo-btn">
                    <i class="fa-solid fa-arrow-trend-up"></i> Book Demo
                  </a>
                </div>
              </div>

              <div className="trust-badge">
                <div className="avatars">
                  <span className="avatar">👤</span>
                  <span className="avatar">👤</span>
                  <span className="avatar">👤</span>
                  <span className="count">+2k</span>
                </div>
                <span>Trusted by 500+ Enterprises</span>
              </div>
            </div>

            <div className="hero-image">
              <div className="mock-window">
                <div className="window-header">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="window-content">
                  <div className="chart-placeholder">
                    <div className="bar" style={{ height: "60%" }}></div>
                    <div className="bar" style={{ height: "75%" }}></div>
                    <div className="bar" style={{ height: "65%" }}></div>
                    <div
                      className="bar highlight"
                      style={{ height: "85%" }}
                    ></div>
                    <div className="bar" style={{ height: "70%" }}></div>
                  </div>
                  <div className="payroll-status">
                    <span className="check">✓</span>
                    <span>Payroll Status Processed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section className="features" id="features">
          <div className="features-container">
            <div className="section-header">
              <h2>Enterprise-Grade Management Modules</h2>
              <p>
                Everything you need to manage your workforce effectively,
                securely, and compliantly in a single platform.
              </p>
              <a href="#features" className="view-all">
                View all features <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            <div className="features-grid">
              {[
                {
                  icon: <Lock size={28} strokeWidth={2} />,
                  title: "Secure Login",
                  desc: "Bank-grade security with Multi-factor authentication (MFA) & Single Sign-On (SSO) readiness.",
                },
                {
                  icon: <CalendarDays size={28} strokeWidth={2} />,
                  title: "Attendance Tracking",
                  desc: "Seamless biometric integration with real-time tracking of employee hours and overtime.",
                },
                {
                  icon: <IndianRupee size={28} strokeWidth={2} />,
                  title: "Salary Management",
                  desc: "Automated global payroll processing, tax compliance, and instant payslip generation.",
                },
                {
                  icon: <TrendingUp size={28} strokeWidth={2} />,
                  title: "Performance",
                  desc: "Data-driven KPI tracking, 360-degree feedback loops, and quarterly review cycles.",
                },
              ].map((feature, idx) => (
                <div key={idx} className="feature-card">
                  <div className="feature-icon">
                    <span>{feature.icon}</span>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <h2>Ready to optimize your workforce?</h2>
            <p>
              Join over 500+ enterprises managing their teams with EMS. Start
              your 14-day free trial today.
            </p>

            <div className="cta-buttons">
              <button className="btn-cta-primary">Join Now</button>
              <button className="btn-cta-secondary">Watch videos</button>
            </div>

            <p className="cta-note">No credit card required for trial.</p>
          </div>
        </section>
        <Footer />
      </div>
    </>
  );
}
