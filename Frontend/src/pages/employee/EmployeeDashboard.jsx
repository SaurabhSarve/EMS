import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  FileText,
  Ticket,
  MessageCircle,
  FolderOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
} from "lucide-react";
import EmployeesSidebar from "../../Components/EmployeesSidebar";
import { employeeService } from "../../services/employeeServices";
import { projectService } from "../../services/projectService";
import { capitalize } from "../../utils/helper";
import { BsBuilding, BsChatDots } from "react-icons/bs";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState();
  const [salarydetails, setSalaryDetails] = useState([]);
  const [taskdetails, setTaskDetails] = useState([]);
  const [ticketDetails, setTicketDetails] = useState([]);

  // --- REAL-TIME NOTIFICATION STATE (From HEAD) ---
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [showViewAllProjects, setShowViewAllProjects] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const getCurrentDate = () => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  // --- WEBSOCKET & CHAT LOGIC (From HEAD) ---
  // 1. Initial Fetch
  const fetchUnreadCount = async () => {
    if (!user?._id && !user?.id) return;
    try {
      const id = user._id || user.id;
      const res = await axios.get(
        `http://127.0.0.1:8000/api/chat/unread/total/${id}`,
      );
      setUnreadCount(res.data.count);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. WebSocket Connection
  useEffect(() => {
    fetchUnreadCount();

    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/?token=${token}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Push Notification logic
        if ((data.sender_id && !data.type) || data.type === "chat_message") {
          const myId = user._id || user.id;
          if (data.sender_id !== myId) {
            setUnreadCount((prev) => prev + 1);
          }
        }

        if (data.type === "activity") {
          fetchUnreadCount();
        }
      } catch (e) {
        console.error("WS Error", e);
      }
    };

    return () => {
      if (ws) ws.close();
    };
  }, [user]);

  // --- SIDEBAR LOGIC (Merged) ---
  const openSidebar = () => {
    setSidebarOpen(true);
    setTimeout(() => {
      const wrapper = document.querySelector("div.fixed.inset-y-0.left-0.z-50");
      if (!wrapper) return;
      const aside = wrapper.querySelector("aside");
      if (aside) {
        aside.classList.add("translate-x-0");
        aside.classList.remove("-translate-x-full");
        aside.style.transform = "translateX(0)";
      }
      const innerToggle = wrapper.querySelector("button.fixed.top-4.left-4");
      if (innerToggle) innerToggle.style.display = "none";
    }, 20);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => {
      const wrapper = document.querySelector("div.fixed.inset-y-0.left-0.z-50");
      if (!wrapper) return;
      const aside = wrapper.querySelector("aside");
      if (aside) {
        aside.classList.remove("translate-x-0");
        aside.classList.add("-translate-x-full");
        aside.style.transform = "";
      }
      const innerToggle = wrapper.querySelector("button.fixed.top-4.left-4");
      if (innerToggle) innerToggle.style.display = "";
    }, 20);
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchEmployee();
    fetchProjects();
  }, []);

  const fetchEmployee = async () => {
    try {
      const result = await employeeService.getEmployeedashboardStats();
      if (result && result.success) {
        setMe(result.data.employee);
        setSalaryDetails(result.data.salaryDetails);
        setTaskDetails(result.data.taskDetails);
        setTicketDetails(result.data.ticketDetails);
      }
    } catch (error) {
      console.error("employee dashboard error", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const result = await projectService.getProjectsByEmployee();
      if (result && result.success) {
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects", error);
      setProjects([]);
    }
  };

  // Project handlers
  const handleProjectCardClick = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleViewAllClick = () => {
    setShowViewAllProjects(true);
  };

  const closeAllModals = () => {
    setShowViewAllProjects(false);
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeTasks =
    taskdetails?.filter((t) => t.status !== "completed") || [];
  const upcomingTasks = activeTasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = (due - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  });
  const overdueTasks = activeTasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  });
  const upcomingPercent = activeTasks.length
    ? Math.min(
        100,
        Math.round((upcomingTasks.length / activeTasks.length) * 100),
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100/30 font-sans relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div
          className="absolute w-96 h-96 bg-purple-400/10 rounded-full blur-3xl top-1/3 -right-48 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -bottom-48 left-1/3 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>
      <EmployeesSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-[1112px]:ml-[280px]">
        {/* PROFILE HEADER CARD */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 transform transition-all hover:shadow-blue-500/20 group">
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32 animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/20 rounded-full blur-2xl transform -translate-x-20 translate-y-20 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>

          <div className="relative z-10 px-6 py-4 sm:px-7 sm:py-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Profile Info */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-white/60 rounded-full"></div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg leading-tight">
                    Welcome back, {capitalize(me?.firstName) || "Employee"}{" "}
                    {capitalize(me?.lastName) || ""}
                  </h1>
                </div>
                <p className="text-white/90 text-xs sm:text-sm font-semibold ml-4 opacity-90">
                  {getCurrentDate()}
                </p>
              </div>

              {/* --- CHAT BUTTON --- */}
              <div className="relative">
                <button
                  onClick={() => navigate("/chat")}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition-all border border-white/10 shadow-lg backdrop-blur-md group/btn"
                >
                  <BsChatDots className="text-lg" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-blue-500 shadow-md animate-bounce">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              {/* ----------------------------- */}
            </div>
          </div>
        </div>

        {/* QUICK STATS GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Upcoming Tasks Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1 hover:border-blue-200 cursor-pointer relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-500"></div>
            <div className="p-6 relative">
              <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 group-hover:shadow-lg">
                <svg
                  className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                Due This Week
              </p>
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                  {upcomingTasks.length}
                </h3>
                <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                  {overdueTasks.length} overdue
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 h-2 rounded-full shadow-lg shadow-blue-500/50 transition-all duration-1000 group-hover:shadow-blue-500/70"
                  style={{ width: `${upcomingPercent}%` }}
                />
              </div>
              <p className="text-slate-400 text-xs group-hover:text-slate-600 transition-colors">
                {activeTasks.length} active tasks • {upcomingPercent}% due soon
              </p>
            </div>
          </div>

          {/* My Tickets Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1 hover:border-blue-200 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-500"></div>
            <div className="p-4 relative">
              <div className="absolute top-3 right-3 w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-400 rounded-xl flex items-center justify-center group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 group-hover:shadow-lg">
                <Ticket className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                My Tickets
              </p>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                  {ticketDetails?.length || 0}
                </h3>
                <span className="text-slate-400 text-xs group-hover:text-slate-600 transition-colors">
                  Total Tickets
                </span>
              </div>

              <div className="space-y-1 mt-1">
                {ticketDetails?.length > 0 ? (
                  ticketDetails.slice(0, 3).map((ticket, index) => (
                    <div
                      key={ticket._id || index}
                      className="flex items-center justify-between gap-3 p-1.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:border-indigo-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-700 truncate">
                          {ticket.subject}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap shadow-sm uppercase ${
                          ticket.status === "Open"
                            ? "bg-blue-100 text-blue-700"
                            : ticket.status === "In Progress"
                              ? "bg-amber-100 text-amber-700"
                              : ticket.status === "Resolved"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium italic">
                      No tickets raised yet
                    </p>
                  </div>
                )}
                {ticketDetails?.length > 3 && (
                  <p className="text-[9px] text-slate-400 text-center font-semibold mt-1">
                    + {ticketDetails.length - 3} more tickets
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Total Leave Balance Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1 hover:border-blue-200 cursor-pointer relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-500"></div>
            <div className="p-6 relative">
              <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 group-hover:shadow-lg">
                <svg
                  className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                Leave Balance
              </p>
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                  {(me?.leaveBalance?.annual || 0) +
                    (me?.leaveBalance?.sick || 0) +
                    (me?.leaveBalance?.personal || 0)}
                </h3>
                <span className="text-slate-400 text-sm group-hover:text-slate-600 transition-colors">
                  Days
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-blue-200 hover:scale-110 hover:shadow-md transition-all cursor-pointer">
                  {me?.leaveBalance?.annual || 0} Annual
                </span>
                <span className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-green-200 hover:scale-110 hover:shadow-md transition-all cursor-pointer">
                  {me?.leaveBalance?.sick || 0} Sick
                </span>
                <span className="bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-orange-200 hover:scale-110 hover:shadow-md transition-all cursor-pointer">
                  {me?.leaveBalance?.personal || 0} Personal
                </span>
              </div>
            </div>
          </div>

          {/* Tasks Status Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1 hover:border-blue-200 cursor-pointer relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-500"></div>
            <div className="p-6 relative">
              <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 group-hover:shadow-lg">
                <svg
                  className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                Active Tasks
              </p>
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                  {taskdetails?.filter((t) => t.status !== "completed")
                    .length || 0}
                </h3>
                <span className="text-slate-400 text-sm group-hover:text-slate-600 transition-colors">
                  Pending
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 group-hover:border-amber-100 transition-colors">
                <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                  Completed
                </span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg hover:scale-110 transition-transform group-hover:bg-green-100">
                  {taskdetails?.filter((t) => t.status === "completed")
                    .length || 0}{" "}
                  / {taskdetails?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SALARY + TASKS */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <MyProjects 
            projects={projects} 
            onCardClick={handleProjectCardClick}
            onViewAllClick={handleViewAllClick}
          />
          <MyTasks taskdetails={taskdetails} />
        </section>
      </main>

      {/* MODALS */}
      {showProjectDetails && (
        <ProjectDetailsModal 
          project={selectedProject} 
          onClose={closeAllModals}
        />
      )}
      {showViewAllProjects && (
        <ViewAllProjectsModal 
          projects={projects} 
          onProjectClick={handleProjectCardClick}
          onClose={closeAllModals}
        />
      )}
    </div>
  );
}

/* COMPONENTS */

const MyProjects = ({ projects, onCardClick, onViewAllClick }) => {

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower === "ongoing" || statusLower === "in progress") 
      return { 
        bg: "from-blue-50 to-blue-100", 
        text: "text-blue-700", 
        badge: "bg-blue-100 text-blue-700 border-blue-300",
        icon: "text-blue-600",
        progress: "bg-gradient-to-r from-blue-400 to-blue-600"
      };
    if (statusLower === "completed") 
      return { 
        bg: "from-green-50 to-green-100", 
        text: "text-green-700", 
        badge: "bg-green-100 text-green-700 border-green-300",
        icon: "text-green-600",
        progress: "bg-gradient-to-r from-green-400 to-green-600"
      };
    if (statusLower === "overdue") 
      return { 
        bg: "from-red-50 to-red-100", 
        text: "text-red-700", 
        badge: "bg-red-100 text-red-700 border-red-300",
        icon: "text-red-600",
        progress: "bg-gradient-to-r from-red-400 to-red-600"
      };
    if (statusLower === "pending") 
      return { 
        bg: "from-amber-50 to-amber-100", 
        text: "text-amber-700", 
        badge: "bg-amber-100 text-amber-700 border-amber-300",
        icon: "text-amber-600",
        progress: "bg-gradient-to-r from-amber-400 to-amber-600"
      };
    return { 
      bg: "from-slate-50 to-slate-100", 
      text: "text-slate-700", 
      badge: "bg-slate-100 text-slate-700 border-slate-300",
      icon: "text-slate-600",
      progress: "bg-gradient-to-r from-slate-400 to-slate-600"
    };
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col min-h-[420px] overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6 bg-white border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              My Projects
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {projects?.length || 0} project{(projects?.length || 0) !== 1 ? "s" : ""} assigned
            </p>
          </div>
          {projects?.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {projects?.filter(p => p.status?.toLowerCase() === "completed").length}
              </div>
              <p className="text-xs text-slate-500 font-medium">Completed</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto bg-white">
        {projects && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4">
              <FolderOpen className="h-10 w-10 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No projects assigned</p>
            <p className="text-slate-400 text-xs mt-1">Projects will appear here once assigned</p>
          </div>
        ) : (
          projects?.map((project) => {
            const colors = getStatusColor(project.status);
            const teamCount = project.assignees?.length || project.teamSize || 0;
            const daysLeft = getDaysRemaining(project.dueDate);
            const isOverdue = project.status?.toLowerCase() === "overdue";

            return (
              <div 
                key={project._id || project.id} 
                onClick={() => onCardClick(project)}
                className={`group flex flex-col p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 duration-300 relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-500"></div>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-3 relative">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform text-sm md:text-base leading-tight">
                      {project.name || project.projectName}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                      {project.description || "No description"}
                    </p>
                  </div>
                  <span className="ml-2 px-3 py-1 rounded-lg text-xs font-bold border border-blue-200 text-blue-700 bg-blue-50 whitespace-nowrap group-hover:bg-blue-100 transition-colors">
                    {project.status}
                  </span>
                </div>

                {/* Progress Bar - Real-time from Backend */}

                {/* Info Row 1 - Team & Deadline */}
                <div className="flex gap-2 mb-2 flex-wrap relative">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg group-hover:border-blue-200 transition-colors">
                    <Users size={13} className="text-blue-600" />
                    <span className="text-xs text-slate-700 font-medium">
                      {teamCount} {teamCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                  
                  {daysLeft !== null && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${isOverdue ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 text-blue-600 group-hover:border-blue-200'}`}>
                      <Calendar size={13} className={isOverdue ? "text-red-600" : "text-blue-600"} />
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-700' : 'text-slate-700'}`}>
                        {isOverdue ? `Overdue` : daysLeft === 0 ? 'Due today' : daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                {project.dueDate && (
                  <div className="flex gap-2 text-xs text-slate-600 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg mb-2 items-center group-hover:border-blue-200 transition-colors relative">
                    <Calendar size={14} className="text-blue-600" />
                    <span>
                      Due: {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}

                {/* Lead & Department */}
                {(project.leaderName || project.departmentName) && (
                  <div className="flex gap-3 text-xs text-slate-600 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg flex-wrap items-center group-hover:border-blue-200 transition-colors relative">
                    {project.leaderName && (
                      <span className="flex items-center gap-1.5">
                        <User size={13} className="text-blue-600" />
                        Lead: {project.leaderName}
                      </span>
                    )}
                    {project.departmentName && (
                      <span className="flex items-center gap-1.5">
                        <Building size={13} className="text-blue-600" />
                        {project.departmentName}
                      </span>
                    )}
                  </div>
                )}

                {/* Priority Badge */}
                {project.priority && (
                  <div className="mt-2.5 flex items-center gap-1.5 relative">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border group-hover:scale-105 transition-transform ${
                      project.priority === "High" ? "bg-red-50 text-red-700 border-red-200" :
                      project.priority === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        project.priority === "High" ? "bg-red-600" :
                        project.priority === "Medium" ? "bg-amber-600" :
                        "bg-green-600"
                      }`} />
                      {project.priority} Priority
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-white flex gap-2">
        <button 
          onClick={onViewAllClick}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 py-2 rounded-lg transition-all"
        >
          View All ({projects?.length || 0})
        </button>
      </div>
    </div>
  );
};

const MyTasks = ({ taskdetails }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col min-h-[420px] overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            My Tasks
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Assigned for this week
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : taskdetails && taskdetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              No tasks assigned
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Check back later for updates
            </p>
          </div>
        ) : (
          taskdetails?.map((task) =>
            task.status === "completed" ? (
              <TaskDone key={task._id || task.id} title={task?.taskName} />
            ) : (
              <TaskItem
                key={task._id || task.id}
                title={task?.taskName}
                priority={task?.priority}
                color={
                  task?.priority === "Low"
                    ? "amber"
                    : task?.priority === "High"
                      ? "blue"
                      : "red"
                }
                due={task?.dueDate}
              />
            ),
          )
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 py-2 rounded-lg transition-all">
          View All Tasks ({taskdetails?.length || 0})
        </button>
      </div>
    </div>
  );
};

const TaskItem = ({ title, priority, color, due }) => {
  const colors = {
    red: "text-red-600 bg-gradient-to-r from-red-50 to-red-100 border-red-200",
    amber:
      "text-amber-600 bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200",
    blue: "text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200",
  };

  // Format due date
  const formatDueDate = (dueDate) => {
    if (!dueDate) return "No due date";

    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time parts for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return "Due Today";
    } else if (date.getTime() === tomorrow.getTime()) {
      return "Due Tomorrow";
    } else if (date < today) {
      return "Overdue";
    } else {
      // Format as "Due Oct 27" or "Due Jan 15"
      const options = { month: "short", day: "numeric" };
      return `Due ${date.toLocaleDateString("en-US", options)}`;
    }
  };

  return (
    <div className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
          {title}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${colors[color] || "text-slate-600 bg-slate-50 border-slate-200"}`}
          >
            {priority}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDueDate(due)}
          </span>
        </div>
      </div>
    </div>
  );
};

const TaskDone = ({ title }) => (
  <div className="group flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:shadow-md transition-all cursor-pointer">
    <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg
        className="w-3.5 h-3.5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-green-800 line-through leading-snug">
        {title}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-lg border border-green-300">
          Completed
        </span>
      </div>
    </div>
  </div>
);

const SalaryHistory = ({ salarydetails }) => {
  const [isLoading, setIsLoading] = useState(false);
  const formatINR = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;
  const calcDeduction = (baseSalary, taxApply, deduction) =>
    ((parseFloat(baseSalary) || 0) * (parseFloat(taxApply) || 0)) / 100 +
    (parseFloat(deduction) || 0);

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col hover:shadow-lg transition-shadow min-h-[520px]">
      {/* ================= MOBILE CARD VIEW ================= */}
      <div className="space-y-4 flex-1 min-h-0 overflow-auto max-h-[360px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : salarydetails && salarydetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">
              No salary records found
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Check back later for updates
            </p>
          </div>
        ) : (
          salarydetails?.map((salary) => (
            <MobileSalaryCard
              key={salary._id || salary.id}
              month={salary.month}
              year={new Date().getFullYear()}
              baseSalary={salary.baseSalary}
              taxApply={salary?.taxApply}
              deduction={salary.deductions}
              netSalary={salary.netSalary}
              status={salary.Status}
              formatINR={formatINR}
              calcDeduction={calcDeduction}
            />
          ))
        )}
      </div>
    </div>
  );
};

const MobileSalaryCard = ({
  month,
  year,
  baseSalary,
  taxApply,
  deduction,
  netSalary,
  status,
  formatINR,
  calcDeduction,
}) => {
  const normalizedStatus = (status || "").toLowerCase();

  return (
    <div className="border-2 border-slate-100 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50/50 hover:shadow-md transition-all hover:border-blue-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="font-bold text-slate-900 text-lg">{month}</p>
          <p className="text-xs text-slate-400 font-medium">{year}</p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            normalizedStatus === "paid"
              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-300"
              : normalizedStatus === "processing"
                ? "bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 border border-blue-300"
                : "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-300"
          }`}
        >
          {capitalize(normalizedStatus || "pending")}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm items-center p-2.5 bg-slate-50 rounded-lg">
          <span className="text-slate-600 font-medium">Base Salary</span>
          <span className="font-bold text-slate-900">
            {formatINR(baseSalary)}
          </span>
        </div>

        <div className="flex justify-between text-sm items-center p-2.5 bg-red-50 rounded-lg">
          <span className="text-red-600 font-medium">Deductions</span>
          <span className="font-bold text-red-600">
            - {formatINR(calcDeduction(baseSalary, taxApply, deduction))}
          </span>
        </div>

        <div className="flex justify-between font-semibold items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <span className="text-green-800">Net Pay</span>
          <span className="text-green-700 text-lg">{formatINR(netSalary)}</span>
        </div>
      </div>
    </div>
  );
};

// Project Details Modal
const ProjectDetailsModal = ({ project, onClose }) => {
  if (!project) return null;
  
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const daysLeft = getDaysRemaining(project.dueDate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{project.name || project.projectName}</h2>
            <p className="text-sm text-slate-600 mt-1">{project.description}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-600">Status</label>
              <p className="mt-1 px-3 py-1 inline-block rounded-lg bg-blue-100 text-blue-700 font-medium">
                {project.status}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Priority</label>
              <p className="mt-1 px-3 py-1 inline-block rounded-lg font-medium" style={{
                backgroundColor: project.priority === "High" ? "#fee2e2" : project.priority === "Medium" ? "#fef3c7" : "#dcfce7",
                color: project.priority === "High" ? "#991b1b" : project.priority === "Medium" ? "#92400e" : "#166534"
              }}>
                {project.priority} Priority
              </p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="text-sm font-semibold text-slate-600">Progress</label>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${parseInt(project.progress) || 0}%` }}
                />
              </div>
              <span className="text-sm font-bold text-blue-600">{parseInt(project.progress) || 0}%</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-xs font-semibold text-slate-500 uppercase">Due Date</label>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </p>
              {daysLeft !== null && (
                <p className={`text-xs mt-1 font-semibold ${daysLeft < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                </p>
              )}
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-xs font-semibold text-slate-500 uppercase">Team Size</label>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {project.assignees?.length || project.teamSize || 0} members
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Project Lead</label>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {project.leaderName || 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Department</label>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {project.departmentName || 'N/A'}
              </p>
            </div>
          </div>

          {/* Team Members */}
          {project.assignees && project.assignees.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-slate-600">Team Members</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.assignees.map((member, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    {member.name || `Team Member ${idx + 1}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-700 font-semibold hover:bg-slate-200 rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// View All Projects Modal
const ViewAllProjectsModal = ({ projects, onProjectClick, onClose }) => {
  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower === "ongoing") return "bg-blue-100 text-blue-700";
    if (statusLower === "completed") return "bg-green-100 text-green-700";
    if (statusLower === "overdue") return "bg-red-100 text-red-700";
    if (statusLower === "pending") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">All Projects</h2>
            <p className="text-sm text-slate-600 mt-1">{projects?.length || 0} projects assigned</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Projects List */}
        <div className="p-6">
          {!projects || projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No projects assigned</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div 
                  key={project._id}
                  onClick={() => { onProjectClick(project); onClose(); }}
                  className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">{project.description}</p>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Progress: <strong>{project.progress}%</strong></span>
                    <span>Team: <strong>{project.assignees?.length || project.teamSize || 0}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-700 font-semibold hover:bg-slate-200 rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active }) => (
  <div className={`flex items-center gap-3 px-4 py-3 sm:py-2 rounded-xl cursor-pointer ${active ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/5"}`}>
    {icon}
    {label}
  </div>
);

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm">{children}</div>
);

const Badge = ({ text, color }) => {
  const map = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return <span className={`px-3 py-1 rounded-full ${map[color]}`}>{text}</span>;
};