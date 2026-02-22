import { useState, useEffect, useRef } from "react";
import {
  Lock,
  CalendarDays,
  IndianRupee,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  CheckCircle,
  Globe,
  BarChart3,
  ChevronDown,
  Menu,
  X,
  Star,
  Award,
  Cpu,
  Bell,
  ChevronUp,
  Ticket
} from "lucide-react";

import Footer from "../../Components/Footer";
import Navbar from "../../Components/Navbar_";

/* ══════════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════════ */
function Counter({ end, suffix = "", duration = 2200 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now) => {
            const p = Math.min((now - t0) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 4);
            setCount(Math.floor(ease * end));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ══════════════════════════════════════════
   LIVE DASHBOARD CARD
══════════════════════════════════════════ */
function DashboardCard() {
  const [active, setActive] = useState(4);
  const [notif, setNotif] = useState(false);
  const bars = [58, 72, 64, 88, 76, 82, 69];
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  useEffect(() => {
    const iv = setInterval(() => {
      setActive((p) => (p + 1) % 7);
      setNotif(true);
      setTimeout(() => setNotif(false), 900);
    }, 1400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative">
      <div
        className="absolute -inset-8 rounded-[3rem] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.2) 0%, transparent 70%)",
        }}
      />

      {/* Floating badge top-right */}
      <div
        className={`absolute -top-4 -right-4 z-20 bg-white rounded-2xl px-4 py-2.5 flex items-center gap-2.5 border transition-all duration-300 ${notif ? "scale-110" : "scale-100"}`}
        style={{
          boxShadow: "0 8px 28px rgba(59,130,246,0.15)",
          borderColor: "#bfdbfe",
        }}
      >
        <div className="relative w-2.5 h-2.5">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs font-bold text-slate-700">Payroll Live</span>
      </div>

      {/* Floating badge bottom-left */}
      <div
        className="absolute -bottom-5 -left-5 z-20 rounded-2xl px-4 py-2.5 flex items-center gap-2.5"
        style={{
          background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
          boxShadow: "0 8px 24px rgba(59,130,246,0.4)",
        }}
      >
        <Users size={14} className="text-blue-100" />
        <span className="text-xs font-bold text-white">847 Present Today</span>
      </div>

      {/* Main card */}
      <div
        className="relative rounded-3xl border overflow-hidden w-full max-w-md mx-auto"
        style={{
          background: "white",
          borderColor: "#dbeafe",
          boxShadow:
            "0 24px 60px rgba(59,130,246,0.14), 0 4px 16px rgba(59,130,246,0.08)",
        }}
      >
        {/* Top bar */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#2563eb,#3b82f6)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <span className="text-white font-bold text-sm">EMS Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative cursor-pointer">
              <Bell size={16} className="text-white/80" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-400 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                3
              </span>
            </div>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <span className="text-white text-xs font-bold">A</span>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                label: "Present",
                val: "847",
                color: "#16a34a",
                bg: "#f0fdf4",
                border: "#bbf7d0",
              },
              {
                label: "On Leave",
                val: "23",
                color: "#d97706",
                bg: "#fffbeb",
                border: "#fde68a",
              },
              {
                label: "Remote",
                val: "134",
                color: "#2563eb",
                bg: "#eff6ff",
                border: "#bfdbfe",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-xl p-3 border"
                style={{ background: s.bg, borderColor: s.border }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "#94a3b8" }}
                >
                  {s.label}
                </p>
                <p className="text-lg font-black" style={{ color: s.color }}>
                  {s.val}
                </p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: "linear-gradient(135deg,#f8fbff,#eff6ff)" }}
          >
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold" style={{ color: "#334155" }}>
                Weekly Attendance
              </p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  color: "#2563eb",
                  background: "#eff6ff",
                  borderColor: "#bfdbfe",
                }}
              >
                ● Live
              </span>
            </div>
            <div className="flex items-end gap-2 h-20">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t-lg transition-all duration-700 ease-out"
                    style={{
                      height: `${h}%`,
                      background:
                        i === active
                          ? "linear-gradient(180deg,#3b82f6,#1d4ed8)"
                          : "linear-gradient(180deg,#bfdbfe,#93c5fd)",
                      boxShadow:
                        i === active
                          ? "0 4px 14px rgba(59,130,246,0.5)"
                          : "none",
                    }}
                  />
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: i === active ? "#2563eb" : "#94a3b8" }}
                  >
                    {days[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status rows */}
          <div className="space-y-2">
            {[
              {
                label: "Payroll Processed",
                sub: "₹42.3L disbursed",
                status: "Done",
                ic: "#16a34a",
                bg: "#f0fdf4",
                bd: "#bbf7d0",
                sym: "✓",
              },
              {
                label: "Performance Reviews",
                sub: "Q1 cycle active",
                status: "Active",
                ic: "#2563eb",
                bg: "#eff6ff",
                bd: "#bfdbfe",
                sym: "↻",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white transition-all duration-200 hover:shadow-sm"
                style={{ borderColor: "#f1f5f9" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border"
                    style={{
                      background: item.bg,
                      color: item.ic,
                      borderColor: item.bd,
                    }}
                  >
                    {item.sym}
                  </div>
                  <div>
                    <p
                      className="text-xs font-bold"
                      style={{ color: "#334155" }}
                    >
                      {item.label}
                    </p>
                    <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                      {item.sub}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    color: item.ic,
                    background: item.bg,
                    borderColor: item.bd,
                  }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// feature card with glow and wash hover effect

function FeatureCard({ icon, title, desc, tag, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="relative group bg-white rounded-2xl p-7 border cursor-pointer overflow-hidden"
      style={{
        transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hov ? "translateY(-9px)" : "translateY(0)",
        borderColor: hov ? "#93c5fd" : "#e2e8f0",
        boxShadow: hov
          ? "0 24px 60px rgba(59,130,246,0.16), 0 0 0 1px rgba(147,197,253,0.4)"
          : "0 2px 16px rgba(0,0,0,0.04)",
        animationDelay: `${delay}s`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Wash on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg,rgba(239,246,255,0.95) 0%,rgba(219,234,254,0.7) 100%)",
        }}
      />

      {/* Glow corner */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 blur-2xl pointer-events-none"
        style={{ background: "rgba(59,130,246,0.2)" }}
      />

      {tag && (
        <span
          className="relative z-10 inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4 border"
          style={{
            color: "#2563eb",
            background: "#eff6ff",
            borderColor: "#bfdbfe",
          }}
        >
          {tag}
        </span>
      )}

      <div
        className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-400"
        style={{
          background: hov
            ? "linear-gradient(135deg,#3b82f6,#1d4ed8)"
            : "linear-gradient(135deg,#dbeafe,#bfdbfe)",
          color: hov ? "white" : "#2563eb",
          boxShadow: hov ? "0 8px 24px rgba(59,130,246,0.4)" : "none",
          transform: hov ? "rotate(7deg) scale(1.1)" : "rotate(0) scale(1)",
          transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {icon}
      </div>

      <h3
        className="relative z-10 text-lg font-bold mb-2.5 transition-colors duration-300"
        style={{ color: hov ? "#1d4ed8" : "#0f172a" }}
      >
        {title}
      </h3>
      <p
        className="relative z-10 text-sm leading-relaxed"
        style={{ color: "#64748b" }}
      >
        {desc}
      </p>

      <div
        className="relative z-10 mt-5 flex items-center gap-1.5 text-xs font-bold transition-all duration-300"
        style={{
          color: "#3b82f6",
          opacity: hov ? 1 : 0,
          transform: hov ? "translateY(0)" : "translateY(6px)",
        }}
      >
        Learn more <ArrowRight size={13} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 20);
      setShowTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const features = [
    {
      icon: <Lock size={24} />,
      title: "Secure Authentication",
      desc: "Bank-grade MFA & SSO with zero-trust architecture and granular role-based access controls.",
      tag: "Security",
      delay: 0.05,
    },
    {
      icon: <Ticket size={24} />,
      title: "Smart Support Tickets",
      desc: "Employees can raise support tickets that are first reviewed by their department head and then automatically forwarded to the admin for final action, ensuring transparency and faster resolution.",
      tag: "Core",
      delay: 0.1,
    },
    {
      icon: <IndianRupee size={24} />,
      title: "Payroll Automation",
      desc: "Multi-currency global payroll with full tax compliance, automated deductions and instant payslips.",
      tag: "Finance",
      delay: 0.15,
    },
    {
      icon: <TrendingUp size={24} />,
      title: "Performance KPIs",
      desc: "360° feedback loops, goal tracking, quarterly review cycles and full OKR management suite.",
      tag: "Growth",
      delay: 0.2,
    },
    {
      icon: <Globe size={24} />,
      title: "Global Compliance",
      desc: "Auto-updated tax laws and labor regulations with audit-ready reporting across 150+ countries.",
      tag: "Legal",
      delay: 0.25,
    },
    {
      icon: <Cpu size={24} />,
      title: "AI Analytics",
      desc: "Predictive attrition alerts, intelligent scheduling suggestions and natural language HR queries.",
      tag: "AI",
      delay: 0.3,
    },
  ];

  const tabs = [
    // {
    //   // label: "Attendance",
    //   // icon: <CalendarDays size={15} />,
    //   // title: "Real-Time Attendance Intelligence",
    //   // desc: "Track every check-in with biometric precision. Integrates with face recognition, fingerprint scanners and GPS geofencing — live workforce pulse at all times.",
    //   // points: [
    //   //   "Biometric & GPS geofencing",
    //   //   "Automatic overtime computation",
    //   //   "Shift scheduling engine",
    //   //   "Mobile app check-in",
    //   // ],
    //   metrics: [
    //     { l: "Tracking Accuracy", v: 99 },
    //     { l: "Auto-Processing", v: 97 },
    //     { l: "Mobile Adoption", v: 91 },
    //     { l: "Satisfaction Score", v: 96 },
    //   ],
    // },
    {
      label: "Payroll",
      icon: <IndianRupee size={15} />,
      title: "Zero-Error Payroll Processing",
      desc: "From salary computation to tax filing — fully automated. Handles complex deductions, multi-currency and 150+ country compliance without a single manual step.",
      points: [
        "Multi-currency & multi-country",
        "Tax auto-computation",
        "Instant payslip generation",
        "Direct bank transfer API",
      ],
      metrics: [
        { l: "Error Reduction", v: 99 },
        { l: "Processing Speed", v: 98 },
        { l: "Compliance Score", v: 100 },
        { l: "Cost Reduction", v: 43 },
      ],
    },
    {
      label: "Analytics",
      icon: <BarChart3 size={15} />,
      title: "AI-Driven People Analytics",
      desc: "Go beyond vanity metrics. Our AI surfaces predictive attrition risks, productivity trends and hiring pipeline insights before they become business problems.",
      points: [
        "Predictive attrition alerts",
        "360° performance heatmaps",
        "Headcount forecasting",
        "Real-time custom dashboards",
      ],
      metrics: [
        { l: "Prediction Accuracy", v: 89 },
        { l: "Data Freshness", v: 100 },
        { l: "Insight Coverage", v: 95 },
        { l: "Decision Speed", v: 82 },
      ],
    },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "CHRO",
      company: "TechCorp India",
      text: "EMS transformed how we manage 3,000+ employees. The payroll automation alone saves us 40 hours every month.",
      rating: 5,
      grad: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    },
    {
      name: "Marcus Chen",
      role: "VP Operations",
      company: "GlobalLogic",
      text: "The AI insights caught a potential 15% attrition spike 3 months before it happened. Truly predictive HR technology.",
      rating: 5,
      grad: "linear-gradient(135deg,#60a5fa,#3b82f6)",
    },
    {
      name: "Aisha Patel",
      role: "Head of HR",
      company: "Infosys BPO",
      text: "Seamless rollout across 6 countries. Compliance headaches vanished overnight. Best enterprise HR decision we made.",
      rating: 5,
      grad: "linear-gradient(135deg,#93c5fd,#60a5fa)",
    },
  ];

  return (
    <div>
      <Navbar />
      <div
        className="min-h-screen bg-white overflow-x-hidden"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&display=swap');

        @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeLeft { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeRight{ from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer  { 0%{background-position:-300% center} 100%{background-position:300% center} }
        @keyframes blob     { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-20px,20px) scale(0.97)} }
        @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes pulseRing{ 0%{transform:scale(0.85);opacity:0.9} 100%{transform:scale(1.5);opacity:0} }

        .anim-up    { animation: fadeUp    0.7s ease-out both; }
        .anim-left  { animation: fadeLeft  0.8s ease-out both; }
        .anim-right { animation: fadeRight 0.8s ease-out both; }
        .blob-1     { animation: blob 14s ease-in-out infinite; }
        .blob-2     { animation: blob 18s ease-in-out infinite reverse; }
        .blob-3     { animation: blob 22s ease-in-out infinite 4s; }
        .float-card { animation: floatY 4.5s ease-in-out infinite; }

        .text-shimmer {
          background: linear-gradient(90deg,#1e40af 0%,#2563eb 20%,#3b82f6 35%,#60a5fa 50%,#3b82f6 65%,#2563eb 80%,#1e40af 100%);
          background-size: 300% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 5s linear infinite;
        }

        .nav-ul a { position:relative; }
        .nav-ul a::after {
          content:''; position:absolute; bottom:-3px; left:0;
          width:0; height:2px; border-radius:2px;
          background:linear-gradient(90deg,#2563eb,#60a5fa);
          transition:width .3s ease;
        }
        .nav-ul a:hover::after { width:100%; }

        .btn-shine { position:relative; overflow:hidden; }
        .btn-shine::after {
          content:''; position:absolute; top:0; left:-80%;
          width:50%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
          transform:skewX(-15deg); transition:left .55s ease;
        }
        .btn-shine:hover::after { left:150%; }

        .section-line {
          height:1px;
          background:linear-gradient(90deg,transparent,#bfdbfe 20%,#93c5fd 50%,#bfdbfe 80%,transparent);
        }

        .dot-grid {
          background-image: radial-gradient(circle, rgba(59,130,246,0.3) 1px, transparent 1px);
          background-size: 34px 34px;
        }
      `}</style>

        {/* ━━━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━ */}
        <section
          className="relative min-h-screen flex items-center overflow-hidden"
          style={{
            background:
              "linear-gradient(150deg,#ffffff 0%,#eff6ff 35%,#dbeafe 65%,#bfdbfe 100%)",
          }}
        >
          {/* Animated blobs */}
          <div
            className="blob-1 absolute top-16 left-8 w-80 h-80 rounded-full pointer-events-none blur-3xl"
            style={{
              background:
                "radial-gradient(circle,rgba(59,130,246,0.2) 0%,transparent 70%)",
            }}
          />
          <div
            className="blob-2 absolute bottom-8 right-8 w-96 h-96 rounded-full pointer-events-none blur-3xl"
            style={{
              background:
                "radial-gradient(circle,rgba(147,197,253,0.18) 0%,transparent 70%)",
            }}
          />
          <div
            className="blob-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl"
            style={{
              background:
                "radial-gradient(circle,rgba(96,165,250,0.1) 0%,transparent 65%)",
            }}
          />

          {/* Dot overlay */}
          <div className="dot-grid absolute inset-0 pointer-events-none opacity-25" />

          {/* Diagonal stripes */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg,#2563eb 0,#2563eb 1px,transparent 0,transparent 50%)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="w-full relative z-10 max-w-7xl mx-auto px-2 pt-20 pb-20 grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="w-full anim-left">
              <div
                className="inline-flex items-center gap-2 mb-7 px-4 py-2 rounded-full border"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  borderColor: "#bfdbfe",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inset-0 rounded-full bg-blue-500 opacity-75" />
                  <span className="relative block w-2 h-2 rounded-full bg-blue-600" />
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#1d4ed8" }}
                >
                  New: AI-Powered Analytics Module
                </span>
              </div>

              <h1
                className="text-6xl lg:text-7xl font-black leading-[1.07] mb-6"
                style={{ color: "#0f172a" }}
              >
                Empowering
                <br />
                <span className="text-shimmer">Enterprise</span>
                <br />
                <span style={{ color: "#1d4ed8" }}>Workforce</span>
              </h1>

              <p
                className="text-lg leading-relaxed mb-10 max-w-lg"
                style={{ color: "#475569" }}
              >
                Streamline attendance, payroll, and performance in one secure,
                cloud-based ecosystem designed for modern enterprises that
                demand excellence.
              </p>

              {/* <div className="flex gap-4 mb-12">
              <a href="#admin"
                className="btn-shine group flex items-center gap-3 text-white font-bold px-7 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1.5"
                style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", boxShadow: "0 10px 32px rgba(59,130,246,0.4)" }}>
                <Lock size={18} />
                Admin Login
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
              </a>
              <a
                href="#employee"
                className="group flex items-center gap-3 font-bold px-7 py-4 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-400"
                style={{
                  color: "#2563eb",
                  borderColor: "#bfdbfe",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 16px rgba(59,130,246,0.12)",
                }}
              >
                <Users size={18} />
                Employee Login
              </a>
            </div> */}
              <div className="!w-full flex">
                <div className="flex gap-8 w-full  mb-10">
                  <a
                    href="/admin-login"
                    className="cursor-pointer group flex items-center gap-3 px-4 py-3 font-semibold px-4 py-2 rounded-2xl
                  transition-all duration-300
                  hover:-translate-y-1 hover:scale-[1.03]
                  active:scale-95
                  focus:outline-none focus:ring-4 focus:ring-blue-400/40"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                      color: "#ffffff",
                      boxShadow: "0 10px 30px rgba(59,130,246,0.45)",
                    }}
                  >
                    <Lock size={18} className="text-white/90" />
                    <span className="tracking-wide">Admin Login</span>
                  </a>
                  <a
                    href="/employee-login"
                    className="cursor-pointer group flex items-center gap-3 font-bold px-4 py-3 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-400"
                    style={{
                      color: "#2563eb",
                      borderColor: "#bfdbfe",
                      background: "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 4px 16px rgba(59,130,246,0.12)",
                    }}
                  >
                    <Users size={18} />
                    Employee Login
                  </a>
                </div>
              </div>

              {/* Trust */}
              <div
                className="flex flex-wrap items-center gap-5 text-sm"
                style={{ color: "#64748b" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {["#3b82f6", "#60a5fa", "#93c5fd"].map((c, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-black"
                        style={{
                          background: `linear-gradient(135deg,${c},#1d4ed8)`,
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="font-semibold" style={{ color: "#334155" }}>
                    500+ Enterprises
                  </span>
                </div>
                <div style={{ width: 1, height: 20, background: "#bfdbfe" }} />
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={12}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                  <span className="font-bold ml-1" style={{ color: "#334155" }}>
                    4.9/5
                  </span>
                </div>
                <div style={{ width: 1, height: 20, background: "#bfdbfe" }} />
                <span className="font-semibold" style={{ color: "#334155" }}>
                  2M+ Managed
                </span>
              </div>
            </div>

            {/* Right */}
            <div className="anim-right float-card">
              <DashboardCard />
            </div>
          </div>

          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce"
            style={{ color: "#93c5fd" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Scroll
            </span>
            <ChevronDown size={18} />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━ STATS ━━━━━━━━━━━━━━━━━━ */}
        <section
          className="py-16 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg,#1d4ed8 0%,#2563eb 50%,#3b82f6 100%)",
          }}
        >
          <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                end: 500,
                suffix: "+",
                label: "Enterprise Clients",
                icon: <Award size={20} />,
              },
              {
                end: 2,
                suffix: "M+",
                label: "Employees Managed",
                icon: <Users size={20} />,
              },
              {
                end: 99,
                suffix: ".9%",
                label: "System Uptime",
                icon: <Zap size={20} />,
              },
              {
                end: 150,
                suffix: "+",
                label: "Countries",
                icon: <Globe size={20} />,
              },
            ].map((s, i) => (
              <div key={i} className="text-center group">
                <div
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 mx-auto group-hover:scale-110 transition-transform duration-300"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    color: "#bfdbfe",
                  }}
                >
                  {s.icon}
                </div>
                <div className="text-4xl lg:text-5xl font-black text-white mb-1">
                  <Counter end={s.end} suffix={s.suffix} />
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#bfdbfe" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="section-line" />

        {/* ━━━━━━━━━━━━━━━━━━ FEATURES ━━━━━━━━━━━━━━━━━━ */}
        <section
          id="features"
          className="py-28"
          style={{
            background:
              "linear-gradient(180deg,#ffffff 0%,#f5f9ff 50%,#eff6ff 100%)",
          }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 anim-up">
              <div
                className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full border"
                style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
              >
                <Zap size={14} style={{ color: "#3b82f6" }} />
                <span
                  className="text-sm font-bold"
                  style={{ color: "#1d4ed8" }}
                >
                  Platform Features
                </span>
              </div>
              <h2
                className="text-5xl font-black mb-5"
                style={{ color: "#0f172a" }}
              >
                Everything your enterprise{" "}
                <span className="text-shimmer">needs, unified</span>
              </h2>
              <p
                className="text-lg max-w-2xl mx-auto leading-relaxed"
                style={{ color: "#64748b" }}
              >
                Six enterprise-grade modules working in perfect harmony — from
                first clock-in to final payslip, all powered by AI.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <FeatureCard key={i} {...f} />
              ))}
            </div>
          </div>
        </section>

        <div className="section-line" />

        {/* ━━━━━━━━━━━━━━━━━━ DEEP DIVE TABS ━━━━━━━━━━━━━━━━━━ */}
        <section
          id="analytics"
          className="py-28"
          style={{
            background:
              "linear-gradient(160deg,#eff6ff 0%,#ffffff 40%,#dbeafe 100%)",
          }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14 anim-up">
              <div
                className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full border"
                style={{ background: "#dbeafe", borderColor: "#93c5fd" }}
              >
                <BarChart3 size={14} style={{ color: "#3b82f6" }} />
                <span
                  className="text-sm font-bold"
                  style={{ color: "#1d4ed8" }}
                >
                  Module Deep Dive
                </span>
              </div>
              <h2
                className="text-5xl font-black mb-4"
                style={{ color: "#0f172a" }}
              >
                Go beyond the <span className="text-shimmer">surface</span>
              </h2>
              <p
                className="text-lg max-w-xl mx-auto"
                style={{ color: "#64748b" }}
              >
                Each module is a standalone powerhouse. Together, they're
                unstoppable.
              </p>
            </div>

            {/* Tab bar */}
            <div className="flex justify-center mb-12">
              <div
                className="inline-flex p-1.5 rounded-2xl gap-1 border"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  borderColor: "#bfdbfe",
                  boxShadow: "0 4px 20px rgba(59,130,246,0.1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {tabs.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300"
                    style={
                      activeTab === i
                        ? {
                            background:
                              "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                            color: "white",
                            boxShadow: "0 4px 18px rgba(59,130,246,0.35)",
                          }
                        : { color: "#64748b", background: "transparent" }
                    }
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div key={`t${activeTab}`} className="anim-left">
                <h3
                  className="text-3xl font-black mb-5"
                  style={{ color: "#0f172a" }}
                >
                  {tabs[activeTab].title}
                </h3>
                <p
                  className="text-lg leading-relaxed mb-8"
                  style={{ color: "#475569" }}
                >
                  {tabs[activeTab].desc}
                </p>
                <div className="space-y-3">
                  {tabs[activeTab].points.map((pt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border"
                        style={{
                          background: "#dbeafe",
                          borderColor: "#93c5fd",
                        }}
                      >
                        <CheckCircle size={13} style={{ color: "#3b82f6" }} />
                      </div>
                      <span
                        className="font-semibold text-sm"
                        style={{ color: "#334155" }}
                      >
                        {pt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics panel */}
              <div key={`p${activeTab}`} className="anim-right">
                <div
                  className="relative rounded-3xl p-7 border overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg,#ffffff,#f0f7ff)",
                    borderColor: "#bfdbfe",
                    boxShadow: "0 16px 50px rgba(59,130,246,0.1)",
                  }}
                >
                  <div
                    className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none"
                    style={{ background: "rgba(59,130,246,0.1)" }}
                  />
                  <div
                    className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-2xl pointer-events-none"
                    style={{ background: "rgba(147,197,253,0.12)" }}
                  />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg,#dbeafe,#bfdbfe)",
                          color: "#2563eb",
                        }}
                      >
                        {tabs[activeTab].icon}
                      </div>
                      <span className="font-bold" style={{ color: "#1e40af" }}>
                        {tabs[activeTab].label} Metrics
                      </span>
                      <span
                        className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full border"
                        style={{
                          background: "#dcfce7",
                          color: "#16a34a",
                          borderColor: "#bbf7d0",
                        }}
                      >
                        ● Live
                      </span>
                    </div>

                    <div className="space-y-4">
                      {tabs[activeTab].metrics.map((m, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span
                              className="font-semibold"
                              style={{ color: "#475569" }}
                            >
                              {m.l}
                            </span>
                            <span
                              className="font-black"
                              style={{ color: "#1d4ed8" }}
                            >
                              {m.v}%
                            </span>
                          </div>
                          <div
                            className="h-2.5 rounded-full overflow-hidden"
                            style={{ background: "#e2e8f0" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${m.v}%`,
                                background:
                                  "linear-gradient(90deg,#3b82f6,#60a5fa)",
                                boxShadow: "0 0 8px rgba(59,130,246,0.4)",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      className="mt-6 pt-6 border-t grid grid-cols-2 gap-3"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      {[
                        { label: "Active Users", val: "12,483" },
                        { label: "Avg Response", val: "0.3ms" },
                      ].map((s, i) => (
                        <div
                          key={i}
                          className="rounded-xl p-4 border"
                          style={{
                            background:
                              "linear-gradient(135deg,#f0f7ff,#e0edff)",
                            borderColor: "#bfdbfe",
                          }}
                        >
                          <p
                            className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                            style={{ color: "#94a3b8" }}
                          >
                            {s.label}
                          </p>
                          <p
                            className="text-xl font-black"
                            style={{ color: "#1d4ed8" }}
                          >
                            {s.val}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-line" />

        {/* ━━━━━━━━━━━━━━━━━━ TESTIMONIALS ━━━━━━━━━━━━━━━━━━ */}
        <section
          className="py-28"
          style={{
            background: "linear-gradient(180deg,#ffffff 0%,#f0f7ff 100%)",
          }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14 anim-up">
              <div
                className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full border"
                style={{ background: "#fffbeb", borderColor: "#fde68a" }}
              >
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span
                  className="text-sm font-bold"
                  style={{ color: "#b45309" }}
                >
                  Customer Stories
                </span>
              </div>
              <h2 className="text-5xl font-black" style={{ color: "#0f172a" }}>
                Trusted by{" "}
                <span className="text-shimmer">industry leaders</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-7 border cursor-default transition-all duration-300 hover:-translate-y-2 hover:border-blue-200"
                  style={{
                    borderColor: "#e2e8f0",
                    boxShadow: "0 2px 20px rgba(59,130,246,0.05)",
                  }}
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star
                        key={j}
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p
                    className="text-sm leading-relaxed mb-6 italic"
                    style={{ color: "#475569" }}
                  >
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm"
                      style={{ background: t.grad }}
                    >
                      {t.name[0]}
                    </div>
                    <div>
                      <p
                        className="font-bold text-sm"
                        style={{ color: "#0f172a" }}
                      >
                        {t.name}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        {t.role}, {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-line" />

        <Footer />

        {/* Scroll to top */}
        {showTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
              boxShadow: "0 8px 24px rgba(59,130,246,0.45)",
            }}
          >
            <ChevronUp size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
