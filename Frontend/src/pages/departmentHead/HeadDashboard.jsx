import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../Components/AdminSidebar";
import { employeeService } from "../../services/employeeServices";
import { BsChatDots } from "react-icons/bs";
import { 
  FaUsers, 
  FaCheckCircle, 
  FaClock, 
  FaUserClock,
  FaTasks,
  FaChartBar,
  FaArrowUp,
  FaArrowDown,
  FaSync
} from "react-icons/fa";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  PieChart, 
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend
} from "recharts";

const HeadDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [departmentLeaves, setDepartmentLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    onLeave: 0,
    presentToday: 0,
    pendingLeaves: 0,
    tasksPending: 0,
    tasksCompleted: 0
  });

  // --- START: CHAT FUNCTIONALITY ADDITION ---
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  // 1. Fetch Chat Count
  const fetchUnreadCount = async () => {
    if (!user?._id && !user?.id) return;
    try {
      const id = user._id || user.id;
      // Using port 8000 for Django Chat Backend
      const res = await axios.get(`http://127.0.0.1:8000/api/chat/unread/total/${id}`);
      setUnreadCount(res.data.count);
    } catch (e) {
      console.error("Chat Count Error:", e);
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
  // --- END: CHAT FUNCTIONALITY ADDITION ---

  useEffect(() => {
    const fetchDepartmentData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [employeeRes, leaveRes, taskRes] = await Promise.all([
          employeeService.getAllEmployees(),
          employeeService.getLeavesdetails(),
          employeeService.getDepartmentTasks() // Fetch department employee tasks
        ]);

        // Filter employees in the same department as the head
        const headDept = user?.department || user?.departmentId;
        const deptEmpList = (employeeRes?.data || []).filter(emp => 
          emp.department === headDept || emp.department?._id === headDept || emp.departmentId === headDept
        );
        setDepartmentEmployees(deptEmpList);

        // Filter leaves from department employees
        const deptLeaveList = (leaveRes?.data || []).filter(leave => 
          deptEmpList.some(emp => emp._id === leave.employee?._id)
        );
        setDepartmentLeaves(deptLeaveList);

        // Get department employee tasks from the response
        const deptTaskList = taskRes?.data?.departmentTasks || [];
        const formattedTasks = deptTaskList.map((task) => ({
          _id: task._id || task.id,
          taskName: task.taskName || task.title,
          status: task.status || "pending",
          description: task.description || "",
          dueDate: task.dueDate || "",
          createdAt: task.createdAt || task.assignedDate || ""
        }));
        setTasks(formattedTasks);

        // Calculate stats
        const pendingLeaveCount = deptLeaveList.filter(l => l.status === "pending").length;
        const approvedLeaves = deptLeaveList.filter(l => l.status === "approved");
        const onLeaveToday = approvedLeaves.filter(l => {
          const today = new Date();
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          today.setHours(0, 0, 0, 0);
          return today >= start && today <= end;
        }).length;

        const taskPending = formattedTasks.filter(t => t.status !== "completed").length;
        const taskCompleted = formattedTasks.filter(t => t.status === "completed").length;

        setStats({
          totalEmployees: deptEmpList.length,
          onLeave: onLeaveToday,
          presentToday: deptEmpList.length - onLeaveToday,
          pendingLeaves: pendingLeaveCount,
          tasksPending: taskPending,
          tasksCompleted: taskCompleted
        });

        setLoading(false);
        setRefreshing(false);
      } catch (error) {
        console.error("Error fetching department data:", error);
        setLoading(false);
        setRefreshing(false);
      }
    };

    // Fetch data immediately
    fetchDepartmentData();

    // Set up real-time polling - refresh every 15 seconds
    const intervalId = setInterval(fetchDepartmentData, 15000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [user?.department, user?.departmentId]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    setLoading(true);

    try {
      // Fetch all data in parallel
      const [employeeRes, leaveRes, taskRes] = await Promise.all([
        employeeService.getAllEmployees(),
        employeeService.getLeavesdetails(),
        employeeService.getDepartmentTasks() // Fetch department employee tasks
      ]);

      // Filter employees in the same department as the head
      const headDept = user?.department || user?.departmentId;
      const deptEmpList = (employeeRes?.data || []).filter(emp => 
        emp.department === headDept || emp.department?._id === headDept || emp.departmentId === headDept
      );
      setDepartmentEmployees(deptEmpList);

      // Filter leaves from department employees
      const deptLeaveList = (leaveRes?.data || []).filter(leave => 
        deptEmpList.some(emp => emp._id === leave.employee?._id)
      );
      setDepartmentLeaves(deptLeaveList);

      // Get department employee tasks from the response
      const deptTaskList = taskRes?.data?.departmentTasks || [];
      const formattedTasks = deptTaskList.map((task) => ({
        _id: task._id || task.id,
        taskName: task.taskName || task.title,
        status: task.status || "pending",
        description: task.description || "",
        dueDate: task.dueDate || "",
        createdAt: task.createdAt || task.assignedDate || ""
      }));
      setTasks(formattedTasks);

      // Calculate stats
      const pendingLeaveCount = deptLeaveList.filter(l => l.status === "pending").length;
      const approvedLeaves = deptLeaveList.filter(l => l.status === "approved");
      const onLeaveToday = approvedLeaves.filter(l => {
        const today = new Date();
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        today.setHours(0, 0, 0, 0);
        return today >= start && today <= end;
      }).length;

      const taskPending = formattedTasks.filter(t => t.status !== "completed").length;
      const taskCompleted = formattedTasks.filter(t => t.status === "completed").length;

      setStats({
        totalEmployees: deptEmpList.length,
        onLeave: onLeaveToday,
        presentToday: deptEmpList.length - onLeaveToday,
        pendingLeaves: pendingLeaveCount,
        tasksPending: taskPending,
        tasksCompleted: taskCompleted
      });

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error refreshing department data:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const leaveStats = useMemo(() => {
    const statuses = { approved: 0, pending: 0, rejected: 0 };
    departmentLeaves.forEach(l => {
      statuses[l.status] = (statuses[l.status] || 0) + 1;
    });
    return [
      { name: "Approved", value: statuses.approved, fill: "#10b981" },
      { name: "Pending", value: statuses.pending, fill: "#f59e0b" },
      { name: "Rejected", value: statuses.rejected, fill: "#ef4444" }
    ];
  }, [departmentLeaves]);

  const taskStats = useMemo(() => {
    // Calculate average task completion percentage
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const inProgressCount = tasks.filter(t => t.status === "in-progress").length;
    const pendingCount = tasks.filter(t => t.status === "pending").length;
    
    return {
      totalTasks,
      completedTasks,
      completionPercentage,
      inProgress: inProgressCount,
      pending: pendingCount,
      // Data for bar chart
      chartData: [
        { name: "Completed", value: completedTasks, fill: "#10b981" },
        { name: "In Progress", value: inProgressCount, fill: "#3b82f6" },
        { name: "Pending", value: pendingCount, fill: "#f59e0b" }
      ]
    };
  }, [tasks]);

  const StatCard = ({ icon: Icon, title, value, change, bgColor, textColor, lightBg }) => (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className={`text-4xl font-bold ${textColor}`}>{value}</p>
          {change && (
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
              <FaArrowUp className="w-3 h-3" /> {change}% from last month
            </p>
          )}
        </div>
        <div className={`w-16 h-16 rounded-2xl ${lightBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-8 h-8 ${textColor}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 font-medium">Loading department data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      <AdminSidebar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 px-8 py-8 text-white shadow-xl border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>
            
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <p className="text-xs uppercase tracking-widest text-blue-100 font-semibold">Department Head Portal</p>
                </div>
                <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
                <p className="text-blue-100 text-lg">Here's your department's performance overview</p>
              </div>

              {/* ACTION BUTTONS: CHAT & REFRESH */}
              <div className="flex items-center gap-3 ml-4">
                {/* --- CHAT BUTTON --- */}
                <div className="relative">
                  <button 
                    onClick={() => navigate('/chat')}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all border border-white/10 backdrop-blur-md"
                  >
                    <BsChatDots className="w-5 h-5" />
                    <span className="font-bold text-sm">Chat</span>
                  </button>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-blue-500 shadow-md animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg flex items-center gap-2 transition-all"
                >
                  <FaSync className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard 
            icon={FaUsers} 
            title="Team Size" 
            value={stats.totalEmployees}
            textColor="text-blue-600"
            lightBg="bg-blue-50"
          />
          <StatCard 
            icon={FaCheckCircle} 
            title="Present Today" 
            value={stats.presentToday}
            textColor="text-green-600"
            lightBg="bg-green-50"
          />
          <StatCard 
            icon={FaUserClock} 
            title="Currently on Leave" 
            value={stats.onLeave}
            textColor="text-orange-600"
            lightBg="bg-orange-50"
          />
          <StatCard 
            icon={FaClock} 
            title="Pending Approvals" 
            value={stats.pendingLeaves}
            textColor="text-yellow-600"
            lightBg="bg-yellow-50"
          />
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Leave Status Pie Chart */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Leave Distribution</h3>
              <p className="text-sm text-slate-500 mt-1">Status breakdown of team leaves</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={leaveStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leaveStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#f9fafb", 
                    border: "1px solid #e5e7eb", 
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 flex justify-center gap-6">
              {leaveStats.map((stat) => (
                <div key={stat.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.fill }}></div>
                  <span className="text-sm text-slate-600">{stat.name} ({stat.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Progress Overview */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Task Progress</h3>
              <p className="text-sm text-slate-500 mt-1">Overall task status breakdown from all employees</p>
            </div>
            
            {/* Task Bar Chart */}
            {taskStats.totalTasks > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={taskStats.chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#f9fafb", 
                        border: "1px solid #e5e7eb", 
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                      }}
                      formatter={(value) => `${value} task${value !== 1 ? 's' : ''}`}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {taskStats.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Completion Percentage */}
                <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-700">Overall Completion Rate</p>
                    <p className="text-3xl font-bold text-green-600">{taskStats.completionPercentage}%</p>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                      style={{ width: `${taskStats.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaTasks className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No tasks assigned yet</p>
              </div>
            )}

            {/* Task Stats Grid */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">{taskStats.totalTasks}</p>
                <p className="text-xs text-slate-600 mt-2">Total Tasks</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-100">
                <p className="text-2xl font-bold text-green-600">{taskStats.completedTasks}</p>
                <p className="text-xs text-slate-600 mt-2">Completed</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-100">
                <p className="text-2xl font-bold text-orange-600">{taskStats.inProgress}</p>
                <p className="text-xs text-slate-600 mt-2">In Progress</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Members & Recent Leaves */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Employees */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Team Members</h3>
                <p className="text-sm text-slate-500 mt-1">{stats.totalEmployees} members in your department</p>
              </div>
              <button
                onClick={() => navigate('/admin/employees')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
              >
                View All
              </button>
            </div>

            {departmentEmployees.length === 0 ? (
              <div className="text-center py-12">
                <FaUsers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No team members yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {departmentEmployees.slice(0, 5).map((emp) => (
                  <div 
                    key={emp._id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/admin/employees/${emp._id}`)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                        {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-slate-500">{emp.position || "Team Member"}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Active</span>
                    </div>
                  </div>
                ))}
                {departmentEmployees.length > 5 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => navigate('/admin/employees')}
                      className="text-sm text-blue-600 font-semibold hover:text-blue-700"
                    >
                      View {departmentEmployees.length - 5} more team members →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats & Actions */}
          <div className="space-y-6">
            {/* Performance Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-3xl shadow-lg p-8 text-white">
              <h3 className="text-lg font-bold mb-6">Department Health</h3>
              <div className="space-y-4">
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm text-blue-100 mb-1">Attendance Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%
                  </p>
                </div>
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm text-blue-100 mb-1">Task Completion</p>
                  <p className="text-2xl font-bold">
                    {stats.tasksPending + stats.tasksCompleted > 0 
                      ? Math.round((stats.tasksCompleted / (stats.tasksPending + stats.tasksCompleted)) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/admin/employees/leaves')}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-semibold text-blue-600 transition-colors text-left"
                >
                  → Manage Leaves
                </button>
                <button
                  onClick={() => navigate('/head/leaves')}
                  className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg text-sm font-semibold text-green-600 transition-colors text-left"
                >
                  → Apply Leaves
                </button>
                <button
                  onClick={() => navigate('/head/payroll')}
                  className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-semibold text-purple-600 transition-colors text-left"
                >
                  → View Payroll
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HeadDashboard;