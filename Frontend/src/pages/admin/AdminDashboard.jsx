import { FaUsers } from "react-icons/fa";
import { MdOutlineVerified } from "react-icons/md";
import { HiOutlineClock } from "react-icons/hi";
import { BsBuilding } from "react-icons/bs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, } from "recharts";
import { FaUserPlus } from "react-icons/fa";
import { MdOutlineApproval } from "react-icons/md";
import { HiCurrencyDollar } from "react-icons/hi";
import { FiSearch, FiBell, FiPlus } from "react-icons/fi";
import AdminSidebar from '../../Components/AdminSidebar';
import { employeeService } from "../../services/employeeServices";
import NotificationSystem from './NotificationSystem';
import {
  HiUser,
  HiUserAdd,
  HiExclamation,
  HiDocumentText,
} from "react-icons/hi";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { capitalize } from "../../utils/helper";
import { leaveService } from "../../services/leaveServive";
import { IoMdPersonAdd } from "react-icons/io";
// Import additional icons for activities
import { AiOutlineFileText, AiOutlineAlert } from "react-icons/ai";
import { BiDollarCircle } from "react-icons/bi";
import { FaUserMinus, FaEdit } from "react-icons/fa";
import { MdCheckCircle, MdCancel } from "react-icons/md";

const data = [
  { week: "Week 1", attendance: 60 },
  { week: "Week 2", attendance: 75 },
  { week: "Week 3", attendance: 55 },
  { week: "Week 4", attendance: 69 },
];

const AdminDashboard = () => {

  const navigate = useNavigate();
  const [stats, setStats] = useState();
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const result = await employeeService.getAdminDashboardStats();
      const activityResult = await employeeService.getRecentActivities();
      console.log(activityResult);
      const NotificationData = await employeeService.getTickets();
      console.log(NotificationData);
      console.log(result);
      
      if (result && result.data) {
        setStats(result.data.stats);
        // Set departments data
        if (result.data.stats.departmentsManager) {
          setDepartments(result.data.stats.departmentsManager);
        }
      }

      // Set activities data
      if (activityResult && activityResult.activities) {
        setActivities(activityResult.activities);
      }
      setLoadingActivities(false);

    } catch (error) {
      console.error("Error:", error);
      setLoadingActivities(false);
    }
  };

  // Helper function to get time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Helper function to get icon based on activity icon name
  const getActivityIcon = (iconName) => {
    const iconMap = {
      'user': <HiUser />,
      'user-plus': <HiUserAdd />,
      'user-minus': <FaUserMinus />,
      'dollar-sign': <HiCurrencyDollar />,
      'edit': <FaEdit />,
      'alert-triangle': <HiExclamation />,
      'file-text': <HiDocumentText />,
      'check-circle': <MdCheckCircle />,
      'x-circle': <MdCancel />,
      'message-square': <AiOutlineFileText />
    };
    return iconMap[iconName] || <HiUser />;
  };

  // Helper function to get icon background color
  const getIconBgColor = (color) => {
    const colorMap = {
      'slate': 'bg-slate-100 text-slate-600',
      'blue': 'bg-blue-100 text-blue-600',
      'green': 'bg-green-100 text-green-600',
      'red': 'bg-red-100 text-red-600',
      'yellow': 'bg-yellow-100 text-yellow-600',
      'orange': 'bg-orange-100 text-orange-600'
    };
    return colorMap[color] || 'bg-slate-100 text-slate-600';
  };

  return (
    <>
      <AdminSidebar />

      <div className="dashboard-wrapper bg-white min-h-screen relative">

        <div className="header-wrapper w-full bg-transparent px-4 sm:px-6 lg:px-10 py-8 border-b border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-2xl shadow-lg border border-white/20 px-5 sm:px-6 py-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-md border border-white/30">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                    Welcome back, {capitalize(stats?.Admin?.firstName)} 👋
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Here's what's happening with your company
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                      Total: {stats?.totalEmployees ?? 0}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                      Present: {stats?.totalEmployees ?? 0}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                      Pending: {stats?.pendingLeaves ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <NotificationSystem />
                <button onClick={() => navigate('/admin/employees/add')}
                  className="hidden sm:flex items-center gap-2 bg-white text-blue-700 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl whitespace-nowrap">
                  <FiPlus className="text-lg" />
                  New Employee
                </button>
                <button onClick={() => navigate('/admin/employees/add')}
                  className="sm:hidden flex items-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-lg">
                  <IoMdPersonAdd className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="content-wrapper px-4 sm:px-6 lg:px-10 pt-8">
          <div className="flex items-start justify-between mb-10">
            <div></div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              icon={<FaUsers className="text-blue-600" />}
              title="Total Employees"
              value={stats?.totalEmployees}
              subText="vs 1,180 last month"
              badgeText="+5.2%"
              badgeColor="bg-green-100 text-green-700"
              gradient="from-blue-50 to-blue-100"
            />
            <StatsCard
              icon={<MdOutlineVerified className="text-green-600" />}
              title="Present Today"
              value={stats?.totalEmployees}
              subText="60 absent (excused)"
              badgeText="95% Rate"
              badgeColor="bg-green-100 text-green-700"
              gradient="from-green-50 to-green-100"
            />
            <StatsCard
              icon={<HiOutlineClock className="text-orange-600" />}
              title="Pending leaves"
              value={stats?.pendingLeaves}
              subText="3 urgent requests"
              badgeText="Action Required"
              badgeColor="bg-orange-100 text-orange-700"
              gradient="from-orange-50 to-orange-100"
            />
            <StatsCard
              icon={<BsBuilding className="text-purple-600" />}
              title="Departments"
              value={stats?.totalDepartments}
              subText="Across 3 locations"
              badgeText="No Change"
              badgeColor="bg-purple-100 text-purple-600"
              gradient="from-purple-50 to-purple-100"
            />
          </div>

 {/* RECENT ACTIVITY AND DEPARTMENTS GRID - UPDATED */}
<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-10">
  {/* RECENT ACTIVITY - Takes 2 columns */}
  <div className="xl:col-span-2">
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-6 shadow-lg border border-blue-100 h-full min-h-[600px] flex flex-col hover:shadow-xl transition-all hover:border-blue-200">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
            <FaUserPlus className="text-white text-lg" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Recent Activity
          </h3>
        </div>
        <button
          onClick={() => navigate("/admin/employees")}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          View All →
        </button>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {loadingActivities ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">No recent activities</p>
          </div>
        ) : (
          activities.slice(0, 5).map((activity) => (
            <ActivityItem
              key={activity._id}
              icon={getActivityIcon(activity.icon)}
              iconBg={getIconBgColor(activity.iconColor)}
              title={activity.title}
              desc={activity.description}
              time={getTimeAgo(activity.createdAt)}
            />
          ))
        )}
      </div>
    </div>
  </div>

  {/* DEPARTMENTS - Takes 1 column */}
  <div className="xl:col-span-1">
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-6 shadow-lg border border-blue-100 h-full min-h-[600px] flex flex-col hover:shadow-xl transition-all hover:border-blue-200">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
            <BsBuilding className="text-white text-lg" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Departments
          </h3>
        </div>
        <button
          onClick={() => navigate("/admin/employees/tasks")}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          View All →
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
        {departments.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">No departments found</p>
          </div>
        ) : (
          departments.map((dept) => (
            <DepartmentCard
              key={dept._id}
              departmentName={dept.name}
              managerName={dept.manager ? dept.manager.firstName : 'Not Allotted'}
            />
          ))
        )}
      </div>
    </div>
  </div>
</div>

          {/* QUICK ACTIONS */}
          <div className="mt-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickActionCard
                icon={<FaUserPlus />}
                label="Add Employee"
                iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
                iconColor="text-white"
                link="/admin/employees/add"
              />
              <QuickActionCard
                icon={<MdOutlineApproval />}
                label="Approve Leave"
                iconBg="bg-gradient-to-br from-orange-500 to-orange-600"
                iconColor="text-white"
                link="/admin/employees/leaves"
              />
              <QuickActionCard
                icon={<HiCurrencyDollar />}
                label="Run Payroll"
                iconBg="bg-gradient-to-br from-green-500 to-green-600"
                iconColor="text-white"
                link="/admin/employees/salary"
              />
            </div>
          </div>

          {/* SALARY DISTRIBUTION */}
          <div className="grid grid-cols-1 xl:grid-cols-1 gap-6 mt-10 pb-8">
            <div className="xl:col-span-2">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-6 sm:px-8 py-7 shadow-lg border border-blue-100 hover:shadow-xl transition-all hover:border-blue-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                    <BiDollarCircle className="text-white text-lg" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Salary Distribution
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <div className="grid grid-cols-4 gap-4 sm:gap-8 items-end h-[200px] min-w-[280px]">
                    <SalaryBar label="<30k" fill="35%" />
                    <SalaryBar label="30-50k" fill="55%" />
                    <SalaryBar label="50-80k" fill="85%" active />
                    <SalaryBar label="80k+" fill="45%" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-wrapper {
          margin-left: 0;
          transition: margin-left 0.3s ease-in-out;
          overflow-x: hidden;
          max-width: 100vw;
        }

        .header-wrapper {
          margin-left: 0;
          transition: margin-left 0.3s ease-in-out;
        }

        .content-wrapper {
          margin-left: 0;
          transition: margin-left 0.3s ease-in-out;
        }

        @media (min-width: 1120px) {
          .dashboard-wrapper {
            margin-left: 0; 
          }

          .header-wrapper {
            margin-left: 256px;
            width: calc(100% - 256px);
          }

          .content-wrapper {
            margin-left: 256px; 
            width: calc(100% - 256px);
          }
        }

        @media (max-width: 1119px) {
          .header-wrapper {
            padding-top: 3.5rem; 
          }
        }
      `}</style>
    </>
  );
};

const StatsCard = ({ icon, title, value, subText, badgeText, badgeColor, gradient }) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl px-6 py-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all hover:-translate-y-2 group backdrop-blur-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center text-xl shadow-lg group-hover:shadow-xl transition-shadow backdrop-blur">
          {icon}
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${badgeColor} shadow-md`}>
          {badgeText}
        </span>
      </div>
      <h3 className="text-slate-700 text-xs font-bold uppercase tracking-wider mb-2 opacity-75">{title}</h3>
      <p className="text-slate-900 text-3xl font-black mb-2">{value}</p>
    </div>
  );
};

const ActivityItem = ({ icon, iconBg, title, desc, time }) => {
  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all group border border-blue-100 hover:border-blue-200">
      <div className="flex items-start gap-4 flex-1">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${iconBg} group-hover:shadow-md transition-all`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{desc}</p>
        </div>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap font-semibold flex-shrink-0">{time}</span>
    </div>
  );
};

// NEW COMPONENT - Department Card
const DepartmentCard = ({ departmentName, managerName }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:shadow-md transition-shadow">
          <BsBuilding className="text-white text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{departmentName}</p>
          <p className="text-xs text-slate-600 mt-0.5">
            Manager: <span className={managerName === 'Not Allotted' ? 'text-orange-600 font-semibold' : 'text-slate-700 font-semibold'}>
              {managerName}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

const QuickActionCard = ({ icon, label, iconBg, iconColor, link }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-4 sm:gap-5 bg-white/90 backdrop-blur-sm px-5 sm:px-6 py-5 rounded-2xl border border-blue-100 shadow-md cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group hover:bg-white hover:border-blue-200"
    >
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${iconBg} ${iconColor} text-lg flex-shrink-0 group-hover:shadow-md transition-shadow shadow-sm`}>
        {icon}
      </div>
      <span className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{label}</span>
    </div>
  );
};

const SalaryBar = ({ label, fill, active }) => {
  return (
    <div className="flex flex-col items-center justify-end h-full">
      <div className="w-full h-full bg-blue-100 rounded-t-2xl flex items-end overflow-hidden group hover:shadow-md transition-shadow border border-blue-200">
        <div
          className={`w-full rounded-t-2xl transition-all group-hover:brightness-100 ${active ? "bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 shadow-md" : "bg-gradient-to-t from-blue-500 to-blue-400"}`}
          style={{ height: fill }}
        />
      </div>
      <span className="mt-4 text-sm font-bold text-slate-700">{label}</span>
    </div>
  );
};

export default AdminDashboard;