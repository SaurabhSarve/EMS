import React from "react";
import Navbar from "../../components/Navbar_.jsx";
import Footer from "../../components/Footer.jsx";
import { useNavigate } from "react-router-dom";

export default function CookiePolicy() {
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
              Cookie Policy
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
                1. What Are Cookies?
              </h2>
              <p>
                Cookies are small text files stored on your device when you
                visit a website. They help improve user experience by
                remembering preferences and interactions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                2. How We Use Cookies
              </h2>
              <p className="mb-2">Graphura uses cookies to:</p>
              <ul className="list-disc pl-6 space-y-1 marker:text-blue-600">
                <li>Ensure proper website functionality</li>
                <li>Analyze website traffic and performance</li>
                <li>Improve user experience and services</li>
                <li>Remember user preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                3. Types of Cookies We Use
              </h2>
              <ul className="list-disc pl-6 space-y-1 marker:text-blue-600">
                <li>
                  <strong className="text-slate-800">Essential Cookies:</strong>{" "}
                  Required for website operation
                </li>
                <li>
                  <strong className="text-slate-800">
                    Performance Cookies:
                  </strong>{" "}
                  Help analyze user behavior
                </li>
                <li>
                  <strong className="text-slate-800">
                    Functional Cookies:
                  </strong>{" "}
                  Remember preferences
                </li>
                <li>
                  <strong className="text-slate-800">Analytics Cookies:</strong>{" "}
                  Used for statistical insights
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                4. Third-Party Cookies
              </h2>
              <p>
                We may use trusted third-party services (e.g., analytics
                providers) that set cookies to collect usage data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                5. Managing Cookies
              </h2>
              <p>
                You can control or delete cookies through your browser settings.
                Disabling cookies may affect website functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                6. Cookie Duration
              </h2>
              <p>
                Cookies may be session-based (deleted after you close the
                browser) or persistent (stored for a defined period).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                7. Changes to This Cookie Policy
              </h2>
              <p>
                Graphura may update this Cookie Policy periodically. Continued
                use of the website constitutes acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">
                8. Contact Information
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
