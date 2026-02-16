import React from "react";
import Navbar from "../../Components/Navbar_";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";

export default function TermsAndCondition() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      {/* Header Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
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
              Terms & Conditions
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
      </header>

      {/* Content */}
      <main className="flex-grow mt-12 px-4 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200">
          {/* Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-t-2xl" />

          <div className="p-6 sm:p-10 md:p-12 space-y-10 text-slate-600 leading-relaxed">
            {sections.map(({ id, title, content }) => (
              <section key={id} className="group scroll-mt-28" id={id}>
                <h2 className="flex items-center gap-3 text-lg md:text-xl font-bold text-slate-900 mb-3">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  {title}
                </h2>

                <div className="pl-4 border-l border-slate-200 group-hover:border-blue-300 transition">
                  {content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ===================== DATA ===================== */

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: (
      <p>
        These Terms & Conditions govern your access to and use of Graphura’s
        website, services, tools, and digital platforms. By accessing or using
        our services, you acknowledge that you have read, understood, and agree
        to be legally bound by these terms.
      </p>
    ),
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    content: (
      <p>
        You must be at least 18 years old and legally capable of entering into a
        binding contract under applicable laws to use our services.
      </p>
    ),
  },
  {
    id: "services",
    title: "3. Services",
    content: (
      <>
        <p>
          Graphura provides digital tools, data services, and technology
          solutions. We reserve the right to modify, suspend, or discontinue any
          service at our discretion.
        </p>
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
          Use of our services must comply with all applicable laws, regulations,
          and internal policies.
        </div>
      </>
    ),
  },
  {
    id: "user-responsibilities",
    title: "4. User Responsibilities",
    content: (
      <ul className="list-disc pl-6 space-y-1 marker:text-blue-600">
        <li>Provide accurate and complete information</li>
        <li>Maintain confidentiality of login credentials</li>
        <li>Use services strictly for lawful purposes</li>
        <li>Avoid misuse, abuse, or unauthorized access</li>
      </ul>
    ),
  },
  {
    id: "intellectual-property",
    title: "5. Intellectual Property",
    content: (
      <p>
        All trademarks, software, designs, and intellectual property are owned
        by Graphura unless otherwise stated. Unauthorized use is strictly
        prohibited.
      </p>
    ),
  },
  {
    id: "client-projects",
    title: "6. Client Projects",
    content: (
      <p>
        Project deliverables, timelines, ownership rights, and obligations will
        be governed by separate written agreements or proposals.
      </p>
    ),
  },
  {
    id: "payments",
    title: "7. Payments & Billing",
    content: (
      <p>
        Fees, payment schedules, and refund policies are communicated prior to
        service activation. Payments are generally non-refundable unless
        explicitly stated otherwise.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "8. Privacy & Cookies",
    content: (
      <p>
        Your use of our services is subject to our Privacy Policy and Cookie
        Policy, which outline how personal data is collected, processed, and
        protected.
      </p>
    ),
  },
  {
    id: "third-party",
    title: "9. Third-Party Links",
    content: (
      <p>
        Our website may contain links to third-party websites. Graphura is not
        responsible for the content, security, or practices of external sites.
      </p>
    ),
  },
  {
    id: "warranty",
    title: "10. Warranties & Disclaimer",
    content: (
      <p>
        Services are provided on an “as is” and “as available” basis without
        warranties of any kind, express or implied.
      </p>
    ),
  },
  {
    id: "liability",
    title: "11. Limitation of Liability",
    content: (
      <p>
        Graphura shall not be liable for any indirect, incidental, or
        consequential damages arising from the use or inability to use our
        services.
      </p>
    ),
  },
  {
    id: "termination",
    title: "12. Termination",
    content: (
      <p>
        We reserve the right to suspend or terminate access to services for
        violations of these terms or misuse of our platform.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "13. Governing Law",
    content: (
      <p>
        These Terms & Conditions are governed by the laws of India. Any disputes
        shall be subject to the jurisdiction of Indian courts.
      </p>
    ),
  },
];
