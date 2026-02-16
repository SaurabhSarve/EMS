import React from "react";
import Navbar from "../../Components/Navbar_.jsx";
import Footer from "../../Components/Footer.jsx";
import { useNavigate } from "react-router-dom";
export default function PrivacyAndPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Navbar />

      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="group inline-flex items-center gap-2
                   rounded-full bg-white/10 backdrop-blur-md
                   px-4 py-2 text-sm font-medium text-white
                   border border-white/20
                   hover:bg-white/20 hover:border-white/40
                   focus:outline-none focus:ring-2 focus:ring-white/40
                   transition-all duration-200"
            >
              <span className="text-lg transition-transform group-hover:-translate-x-0.5">
                ←
              </span>
              Back
            </button>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Privacy Policy
            </h1>

            <div className="mt-6 space-y-1 text-sm md:text-base text-blue-100">
              <p>
                Website:{" "}
                <a
                  href="https://graphura.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-white transition"
                >
                  https://graphura.in
                </a>
              </p>
              <p className="font-medium text-white">
                Graphura India Private Limited
              </p>
              <p>Registered Office: Patudi, Gurugram, Haryana — 122503</p>

              <p
                className="mt-4 inline-block rounded-full bg-white/10 px-4 py-1.5
                      text-xs font-semibold uppercase tracking-wider text-blue-100"
              >
                Effective Date: November 25, 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-grow px-4 py-10 -mt-8 relative z-20">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-10 md:p-12 relative overflow-hidden">
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>

          <div className="space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                1. Introduction
              </h2>
              <p>
                Graphura India Private Limited (“Graphura”, “we”, “our”, “us”)
                respects your privacy and is committed to protecting your
                personal information. This Privacy Policy explains how we
                collect, use, store, and protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                2. Information We Collect
              </h2>
              <p className="mb-2">
                We may collect the following types of information:
              </p>
              <ul className="list-disc pl-6 space-y-1 marker:text-blue-600">
                <li>Personal details (name, email address, phone number)</li>
                <li>Account login credentials</li>
                <li>Payment and billing information</li>
                <li>Usage data, IP address, browser type</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-1 marker:text-blue-600">
                <li>To provide and improve our services</li>
                <li>To verify user identity and prevent fraud</li>
                <li>To communicate updates, support, or offers</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                4. Cookies & Tracking Technologies
              </h2>
              <p>
                We use cookies and similar technologies to improve user
                experience, analyze traffic, and personalize content. You may
                disable cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                5. Data Sharing & Disclosure
              </h2>
              <p className="mb-2">
                We do not sell or rent your personal data. Information may be
                shared only:
              </p>
              <ul className="list-disc pl-6 space-y-1 marker:text-blue-600">
                <li>With trusted service providers</li>
                <li>To comply with legal requirements</li>
                <li>To protect our rights and users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                6. Data Security
              </h2>
              <p>
                We implement industry-standard security measures to protect your
                data. However, no online system is completely secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                7. Data Retention
              </h2>
              <p>
                Your information is retained only as long as necessary to
                fulfill business and legal requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                8. User Rights
              </h2>
              <ul className="list-disc pl-6 space-y-1 marker:text-blue-600">
                <li>Access or update your personal data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                9. Third-Party Links
              </h2>
              <p>
                Our website may contain links to external websites. We are not
                responsible for their privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                10. Children’s Privacy
              </h2>
              <p>
                Our services are not intended for children under 13. We do not
                knowingly collect data from minors.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                11. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. Continued
                use of our services indicates acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                12. Contact Information
              </h2>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="font-semibold text-slate-800">
                  Graphura India Private Limited
                </p>
                <p>Patudi, Gurugram, Haryana — 122503</p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:support@graphura.in"
                    className="text-blue-600 hover:underline"
                  >
                    support@graphura.in
                  </a>
                </p>
                <p>
                  Website:{" "}
                  <a
                    href="https://graphura.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    https://graphura.in
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
