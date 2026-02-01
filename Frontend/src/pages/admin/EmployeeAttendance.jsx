import { useState, useEffect } from "react";
import {
  Bell,
  LayoutDashboard,
  Users,
  Calendar as Cal,
  Briefcase,
  Wallet,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock3,
  Umbrella,
} from "lucide-react";
import AdminSidebar from "../../Components/AdminSidebar";

export default function EmployeeAttendance() {
  const [view, setView] = useState("Daily");
  const [clockedIn, setClockedIn] = useState(true);
  const [now, setNow] = useState(new Date());

  const [currentDate, setCurrentDate] = useState(new Date());
  const [clockInTime] = useState(new Date());
  const [clockOutTime, setClockOutTime] = useState(null);
  const [logs, setLogs] = useState([
    {
      time: new Date().toLocaleString(),
      status: "Punched In",
      location: "Office Network",
      active: true,
    },
  ]);
  const [attendance, setAttendance] = useState({});

  // -------- HELPERS FOR VIEW LOGIC --------
  const getTodayKey = () =>
    new Date().toISOString().split("T")[0];

  const getWeekKeys = (date = new Date()) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay()); // Sunday

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  };


  // live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleClockOut = () => {
    if (!clockedIn) return;

    const out = new Date();
    const todayKey = out.toISOString().split("T")[0];

    const start = clockInTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const end = out.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setClockOutTime(out);
    setClockedIn(false);

    // 🔥 INJECTION POINT → calendar updates here
    setAttendance((prev) => ({
      ...prev,
      [todayKey]: {
        status: "present",
        range: `${start} - ${end}`,
      },
    }));

    setLogs((prev) => [
      { time: out.toLocaleString(), status: "Punched Out", active: false },
      ...prev,
    ]);
  };

  const handleExport = () => {
    // Filter attendance for selected month & year
    const filtered = Object.entries(attendance).filter(([date]) => {
      const d = new Date(date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    if (filtered.length === 0) {
      alert("No attendance data to export for this month.");
      return;
    }

    // CSV Header
    let csv = "Date,Status,Working Hours\n";

    // CSV Rows
    filtered.forEach(([date, data]) => {
      csv += `${date},${data.status},${data.range || ""}\n`;
    });

    // Create downloadable file
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${month + 1}_${year}.csv`;
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const durationMs = (clockOutTime || now) - clockInTime;
  const hours = Math.floor(durationMs / 3600000);
  const minutes = Math.floor((durationMs % 3600000) / 60000);

  return (
    <div className="flex min-h-screen bg-[#f6f8fc] flex-col lg:flex-row">
      {/* SIDEBAR */}

      <aside className="hidden lg:flex w-64 bg-white border-r flex-col">
        <div className="p-6 flex items-center gap-2 font-semibold text-lg">
          <div className="h-8 w-8 bg-slate-900 rounded-lg" /> EMS
        </div>

        <nav className="px-4 space-y-1 text-sm">
          <Menu icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <Menu icon={<Users size={18} />} label="Employees" />
          <Menu active icon={<Cal size={18} />} label="Attendance" />
          <Menu icon={<Briefcase size={18} />} label="Leaves" />
          <Menu icon={<Wallet size={18} />} label="Payroll" />
        </nav>

        <div className="mt-auto p-4">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-orange-300" />
            <div>
              <p className="font-medium">Alex Morgan</p>
              <p className="text-xs text-slate-500">HR Manager</p>
            </div>
          </div>
        </div>
      </aside>
<AdminSidebar />
      {/* MAIN */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Home / HR / <span className="text-slate-900 font-medium">Attendance</span>
            </p>
            <h1 className="text-2xl font-semibold mt-1">Attendance Management</h1>
            <p className="text-sm text-slate-500">
              Manage daily logs, view summaries, and track employee performance.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <input className="px-4 py-2 rounded-xl border bg-white text-sm w-full sm:w-72"
              placeholder="Search employees..."
            />
            <button className="h-10 w-10 rounded-xl border bg-white flex items-center justify-center">
              <Bell size={18} />
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
          <div className="flex gap-3">
            <select className="px-4 py-2 rounded-xl border bg-white text-sm">
              <option>
                {currentDate.toLocaleString("default", { month: "long" })}
              </option>
            </select>
            <select className="px-4 py-2 rounded-xl border bg-white text-sm">
              <option>{year}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white border rounded-xl overflow-hidden">
              {["Daily", "Weekly", "Monthly"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 text-sm ${view === v ? "bg-slate-900 text-white" : ""
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-xl border bg-white text-sm flex items-center gap-2"
            >
              <Download size={16} /> Export
            </button>

            <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">
              + Mark Today
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <Stat
            title="Total Present"
            value="22"
            icon={<CheckCircle2 size={16} className="text-green-600" />}
            iconBg="bg-green-100"
            barColor="bg-green-500"
            footer="▲ +2.5%"
            footerColor="text-green-600"
          />

          <Stat
            title="Total Absent"
            value="1"
            icon={<XCircle size={16} className="text-red-600" />}
            iconBg="bg-red-100"
            barColor="bg-red-500"
            footer="▲ +1"
            footerColor="text-red-600"
          />

          <Stat
            title="Late Arrivals"
            value="3"
            icon={<Clock3 size={16} className="text-yellow-600" />}
            iconBg="bg-yellow-100"
            barColor="bg-yellow-400"
            footer="▼ -10%"
            footerColor="text-green-600"
          />

          <Stat
            title="Leave Balance"
            value={
              <span>
                12 <span className="text-sm text-slate-400">days</span>
              </span>
            }
            icon={<Umbrella size={16} className="text-blue-600" />}
            iconBg="bg-blue-100"
            barColor="bg-blue-500"
            footer="Annual Quota"
            footerColor="text-slate-400"
          />
        </div>

        {/* DAILY VIEW */}
        {view === "Daily" && (
          <div className="bg-white rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold mb-2">Today Summary</h3>

            {attendance[getTodayKey()] ? (
              <>
                <p className="text-sm text-slate-600">
                  Status:{" "}
                  <span className="font-medium text-green-600">
                    {attendance[getTodayKey()].status}
                  </span>
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Working Hours: {attendance[getTodayKey()].range}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">
                No attendance marked today.
              </p>
            )}
          </div>
        )}

        {/* DAILY → CLOCK + RECENT LOGS (HORIZONTAL) */}
        {view === "Daily" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* CLOCK */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6">
              <p className="text-sm">
                {now.toDateString()}
                <span className="ml-2 px-2 py-1 text-xs bg-green-500 rounded-full">Active</span>
              </p>

              <h1 className="text-4xl font-semibold mt-4">
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </h1>

              <p className="text-sm text-slate-300">Standard Shift: 09:00 - 18:00</p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button disabled className="flex-1 bg-slate-700 py-3 rounded-xl text-sm">
                  Clocked In
                </button>
                <button onClick={handleClockOut} className="flex-1 bg-red-500 py-3 rounded-xl text-sm">
                  Clock Out
                </button>
              </div>

              <div className="mt-6">
                <p className="text-sm">Duration</p>
                <p className="text-xs mt-1">{hours}h {minutes}m</p>
              </div>
            </div>

            <RecentLogs logs={logs} />
          </div>
        )}

        {/* WEEKLY VIEW */}
        {view === "Weekly" && (
          <div className="bg-white rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Weekly Attendance</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              {getWeekKeys().map((key, i) => {
                const data = attendance[key];
                return (
                  <div key={i} className="p-3 rounded-xl border text-xs">
                    <p className="font-medium">
                      {new Date(key).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </p>

                    <div
                      className={`mt-2 h-1 rounded-full ${data?.status === "present"
                          ? "bg-green-500"
                          : "bg-slate-200"
                        }`}
                    />

                    <p className="mt-1 text-slate-500">
                      {data ? data.status : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEKLY → CLOCK + RECENT LOGS (HORIZONTAL) */}
        {view === "Weekly" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

            {/* CLOCK */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6">
              <p className="text-sm">
                {now.toDateString()}
                <span className="ml-2 px-2 py-1 text-xs bg-green-500 rounded-full">Active</span>
              </p>

              <h1 className="text-4xl font-semibold mt-4">
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </h1>

              <p className="text-sm text-slate-300">Standard Shift: 09:00 - 18:00</p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button disabled className="flex-1 bg-slate-700 py-3 rounded-xl text-sm">
                  Clocked In
                </button>
                <button onClick={handleClockOut} className="flex-1 bg-red-500 py-3 rounded-xl text-sm">
                  Clock Out
                </button>
              </div>

              <div className="mt-6">
                <p className="text-sm">Duration</p>
                <p className="text-xs mt-1">{hours}h {minutes}m</p>
              </div>
            </div>

            <RecentLogs logs={logs} />
          </div>
        )}

        {/* CALENDAR + CLOCK + RECENT LOGS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          {view === "Monthly" && (
            <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6">

              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">
                  {currentDate.toLocaleString("default", { month: "long" })} {year}
                </h2>
                <div className="flex gap-2">
                  <ChevronLeft
                    size={18}
                    onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  />
                  <ChevronRight
                    size={18}
                    onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  />
                </div>

              </div>

              <div className="grid grid-cols-7 gap-3 text-center text-sm">
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                  <div key={d} className="text-slate-400">{d}</div>
                ))}

                {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => (
                  <div key={i} />
                ))}

                {calendarDays.map((d) => {
                  const dateObj = new Date(year, month, d);
                  const key = dateObj.toISOString().split("T")[0];
                  const data = attendance[key];

                  return (
                    <Day
                      key={d}
                      day={String(d).padStart(2, "0")}
                      status={data?.status}
                      range={data?.range}
                      active={
                        key === new Date().toISOString().split("T")[0]
                      }
                    />
                  );
                })}

              </div>

            </div>
          )}


          {/* RIGHT COLUMN */}
          {view === "Monthly" && (
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* CLOCK */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6">
                <p className="text-sm">
                  {now.toDateString()}
                  <span className="ml-2 px-2 py-1 text-xs bg-green-500 rounded-full">
                    Active
                  </span>
                </p>

                <h1 className="text-4xl font-semibold mt-4">
                  {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </h1>

                <p className="text-sm text-slate-300">
                  Standard Shift: 09:00 - 18:00
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    disabled={clockedIn}
                    className="flex-1 bg-slate-700 py-3 rounded-xl text-sm disabled:opacity-60"
                  >
                    Clocked In
                  </button>

                  <button
                    onClick={handleClockOut}
                    className="flex-1 bg-red-500 py-3 rounded-xl text-sm"
                  >
                    Clock Out
                  </button>
                </div>

                <div className="mt-6">
                  <p className="text-sm">Duration</p>
                  <p className="text-xs mt-1">
                    {hours}h {minutes}m
                  </p>
                </div>
              </div>

              {/* RECENT LOGS */}
              <RecentLogs logs={logs} />

            </div>
          )}

        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Weekly Working Hours" footer="Average: 8h 12m | Goal: 40h">
            <div className="flex items-end gap-4 h-40 overflow-x-auto">
              {[6, 7, 5, 7, 6].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    style={{ height: `${h * 20}px` }}
                    className={`w-12 rounded-xl ${i === 4 ? "bg-slate-900" : "bg-blue-200"}`}
                  />
                  <span className="text-xs">{"MTWTF"[i]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Arrival Time Trends">
            <div className="flex justify-center items-end gap-6 h-40">
              {["on", "on", "late", "on", "early", "early", "on"].map((t, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-full h-32 ${t === "late"
                      ? "bg-yellow-400"
                      : t === "early"
                        ? "bg-green-500"
                        : "bg-slate-200"
                    }`}
                />
              ))}
            </div>
            <div className="flex gap-4 text-xs mt-4">
              <Legend color="bg-green-500" label="Early" />
              <Legend color="bg-slate-300" label="On Time" />
              <Legend color="bg-yellow-400" label="Late" />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function RecentLogs({ logs }) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <h3 className="font-semibold mb-4">Recent Logs</h3>

      <div className="space-y-4">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3">
            <span
              className={`mt-1 h-3 w-3 rounded-full ${log.active ? "bg-green-500" : "bg-slate-300"
                }`}
            />
            <div>
              <p className="text-xs text-slate-400">{log.time}</p>
              <p className="text-sm font-medium">{log.status}</p>
              {log.location && (
                <p className="text-xs text-blue-500">{log.location}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 text-sm border rounded-xl py-2 hover:bg-slate-50">
        View Full History
      </button>
    </div>
  );
}

function Menu({ icon, label, active }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer ${active ? "bg-slate-100 font-medium" : "hover:bg-slate-100"
        }`}
    >
      {icon} {label}
    </div>
  );
}

function Stat({ title, value, icon, iconBg, barColor, footer, footerColor }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-3">
        {value}
      </h2>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: "55%" }} />
      </div>

      {/* Footer */}
      <p className={`text-xs mt-2 font-medium ${footerColor}`}>
        {footer}
      </p>
    </div>
  );
}


function Day({ day, range, status, active }) {
  const bar =
    status === "present"
      ? "bg-green-500"
      : status === "late"
        ? "bg-yellow-400"
        : status === "absent"
          ? "bg-red-500"
          : "bg-blue-500";

  return (
    <div
      className={`h-20 sm:h-24 rounded-xl border p-2 text-left ${active ? "border-slate-900" : "border-slate-200"
        }`}
    >
      <p className="text-sm font-medium">{day}</p>
      {range && <p className="text-xs text-slate-400">{range}</p>}
      {status && (
        <div className="mt-2">
          <div className={`h-1 rounded-full ${bar}`} />
          <p className="text-xs mt-1 text-slate-500">
            {status === "working" ? "Working..." : status}
          </p>
        </div>
      )}
    </div>
  );
}

function Card({ title, footer, children }) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
      {footer && <p className="text-xs text-slate-500 mt-4">{footer}</p>}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
    </div>
  );
}
