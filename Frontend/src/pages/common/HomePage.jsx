import React, { useState } from "react";
import "../../assets/styles/LandingPageStyles/LandingPage.css";
import Footer from "../../Components/Footer";
import { Link } from "react-router-dom";
import Navbar_ from "../../Components/Navbar_";

import { Lock, CalendarDays, IndianRupee, TrendingUp, Users, Shield, Zap, ArrowRight } from "lucide-react";

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
                  <Link to="/admin-login" className="btn-primary btn-admin">
                    <Lock size={20} />
                    Admin Login
                  </Link>
                  <Link to="/employee-login" className="btn-primary btn-employee">
                    <Users size={20} />
                    Employee Login
                  </Link>
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
                View all features <i className="fa-solid fa-arrow-right"></i>
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
        {/* Statistics Section */}
        <section className="stats-section">
          <div className="stats-container">
            <div className="stat-item">
              <h3>500+</h3>
              <p>Enterprise Clients</p>
            </div>
            <div className="stat-item">
              <h3>2M+</h3>
              <p>Employees Managed</p>
            </div>
            <div className="stat-item">
              <h3>99.9%</h3>
              <p>System Uptime</p>
            </div>
            <div className="stat-item">
              <h3>150+</h3>
              <p>Countries</p>
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <h2>Ready to Transform Your Workforce Management?</h2>
            <p>
              Join leading enterprises that trust EMS to streamline their operations, 
              enhance productivity, and ensure compliance with our comprehensive platform.
            </p>

            <div className="cta-buttons">
              <Link to="/admin-login" className="btn-cta-primary">
                <Lock size={18} />
                Admin Login
              </Link>
              <Link to="/employee-login" className="btn-cta-secondary">
                <Users size={18} />
                Employee Login
              </Link>
            </div>

            <p className="cta-note">Instant access • No credit card required • Enterprise security</p>
          </div>
        </section>
        <Footer />
      </div>
    </>
  );
}
