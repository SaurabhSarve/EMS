import React from "react";
import { MapPin, Phone, Mail, ArrowUpRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#0a0f1f] via-[#0e1530] to-[#020617] text-slate-300">
      {/* Ambient Glows */}
      <div className="pointer-events-none absolute -top-48 -left-48 w-[520px] h-[520px] bg-cyan-500/20 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-48 w-[520px] h-[520px] bg-violet-600/20 rounded-full blur-[140px]" />

      <div className="relative max-w-[1400px] mx-auto px-6 pt-16 pb-10">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 border-b border-white/10 pb-6">
          {/* Brand */}
          <div>
            <img
              src="Graphura-logo-white.png"
              alt="logo"
              className="w-[190px] mb-6"
            />

            <p className="text-lg leading-relaxed text-slate-400 max-w-md mb-10">
              A{" "}
              <span className="font-semibold text-cyan-400">
                next-gen workflow platform
              </span>{" "}
              designed for admins and employees to collaborate with speed,
              clarity, and enterprise-grade security.
            </p>

            {/* Social Icons */}

            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/share/19nKAMTopZ/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl text-slate-400
               transition-all duration-300 ease-out
               hover:text-blue-500
               hover:scale-110
               hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
              >
                <i className="fa-brands fa-facebook"></i>
              </a>

              <a
                href="https://www.instagram.com/graphura.in?igsh=MXNqNmtidzljNDJlag=="
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl text-slate-400
               transition-all duration-300 ease-out
               hover:text-pink-500
               hover:scale-110
               hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]"
              >
                <i className="fa-brands fa-instagram"></i>
              </a>

              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl text-slate-400
               transition-all duration-300 ease-out
               hover:text-sky-400
               hover:scale-110
               hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
              >
                <i className="fa-brands fa-twitter"></i>
              </a>

              <a
                href="https://www.linkedin.com/company/graphura-india-private-limited/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl text-slate-400
               transition-all duration-300 ease-out
               hover:text-blue-600
               hover:scale-110
               hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.6)]"
              >
                <i className="fa-brands fa-linkedin"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-semibold text-white mb-3">
              Quick Links
            </h4>
            <span className="block w-14 h-[3px] bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full mb-8" />

            <ul className="space-y-5 text-lg">
              {[
                { label: "Admin Login", href: "/admin-login" },
                { label: "Employee Login", href: "/employee-login" },
                // { label: "Admin Login", href: "/register" },
              ].map((link, i) => (
                <li key={i}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2
                      text-slate-400 hover:text-cyan-400 transition-all"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.label}
                    </span>
                    <ArrowUpRight
                      size={16}
                      className="opacity-0 group-hover:opacity-100 transition"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xl font-semibold text-white mb-3">Support</h4>
            <span className="block w-14 h-[3px] bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full mb-8" />

            <ul className="space-y-5 text-lg">
              {[
                {
                  label:
                    "Graphura India Private Limited, Near RSF, Pataudi, Gurgaon, Haryana 122503",
                  href: "https://maps.google.com/?q=Graphura India Private Limited, Gurgaon",
                  icon: <MapPin size={18} />,
                  external: true,
                },
                {
                  label: "7378021327",
                  href: "tel:7378021327",
                  icon: <Phone size={18} />,
                },
                {
                  label: "official@graphura.in",
                  href: "mailto:official@graphura.in",
                  icon: <Mail size={18} />,
                },
              ].map((item, i) => (
                <li key={i}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="group inline-flex items-start gap-3
                   text-slate-400 hover:text-cyan-400
                   transition-all duration-300"
                  >
                    {/* Icon */}
                    <span
                      className="mt-0.5 text-slate-500
                         group-hover:text-cyan-400 transition"
                    >
                      {item.icon}
                    </span>

                    {/* Text */}
                    <span className="leading-relaxed group-hover:translate-x-1 transition-transform">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-400">
          <p className="opacity-90">
            © {new Date().getFullYear()} Graphura India Private Limited . All rights
            reserved.
          </p>

          <div className="flex gap-10">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Cookies", href: "/cookie-policy" },
            ].map((item, i) => (
              <a
                key={i}
                href={item.href}
                className="relative group hover:text-cyan-400 transition"
              >
                {item.label}
                <span
                  className="absolute left-0 -bottom-1 h-[2px] w-0
                  bg-gradient-to-r from-cyan-400 to-violet-500
                  transition-all duration-300 group-hover:w-full"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
