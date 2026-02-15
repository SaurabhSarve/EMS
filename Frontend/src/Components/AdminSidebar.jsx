import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    MdDashboard,
    MdGroup,
    MdTaskAlt,
    MdLogout,
    MdMenu,
    MdClose,
    MdAssignment,
    MdWork,
    MdCalendarToday,
    MdAttachMoney,
    MdAccountCircle,
    MdContactSupport,
    MdBusiness,
    MdSettings
} from "react-icons/md";
import { useAuth } from '../context/AuthContext';

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { logout, user } = useAuth();

    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 1120;
            setIsMobile(mobile);
            if (!mobile) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const isDepartmentHead = user?.role === "Department Head";
    const dashboardPath = isDepartmentHead ? "/head/dashboard" : "/admin/dashboard";
    const roleSpecificItem = isDepartmentHead
        ? { icon: <MdTaskAlt />, label: "Tasks", path: "/admin/employees/tasks" }
        : { icon: <MdBusiness />, label: "Departments", path: "/admin/employees/tasks" };
    const projectMenuItem = isDepartmentHead
        ? { icon: <MdWork />, label: "Projects", path: "/head/projects" }
        : { icon: <MdWork />, label: "Projects", path: "/admin/projects" };
    const taskCenterItem = !isDepartmentHead
        ? { icon: <MdAssignment />, label: "TaskCenter", path: "/admin/task-center" }
        : null;
    const leaveMenuItem = { icon: <MdCalendarToday />, label: "Leaves", path: "/admin/employees/leaves" };
    const payrollPath = isDepartmentHead ? "/head/payroll" : "/admin/employees/salary";

    const menuItems = [
        { icon: <MdDashboard />, label: "Dashboard", path: dashboardPath },
        { icon: <MdGroup />, label: "Employees", path: "/admin/employees" },
        ...(projectMenuItem ? [projectMenuItem] : []),
        roleSpecificItem,
        ...(taskCenterItem ? [taskCenterItem] : []),
        leaveMenuItem,
        { icon: <MdAttachMoney />, label: "Payroll", path: payrollPath },
        { icon: <MdAccountCircle />, label: "Profile", path: "/admin/me" },
        { icon: <MdContactSupport />, label: "Tickets", path: "/admin/tickets" },
        ...(user?.role === "Admin"
    ? [{ icon: <MdSettings />, label: "Settings", path: "/admin/settings" }]
    : [])

    ];

    const handleLogout = () => {
        logout();
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Mobile Hamburger Button - Small Size */}
            {isMobile && (
                <button
                        onClick={toggleSidebar}
                        className="fixed top-4 left-4 z-50 w-10 h-10 bg-white/90 text-gray-900 rounded-lg hover:bg-white active:scale-95 transition-all duration-200 shadow-md border border-gray-200 flex items-center justify-center"
                    >
                        {isOpen ? <MdClose size={18} /> : <MdMenu size={18} />}
                    </button>
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 bottom-0 w-64 h-screen bg-gradient-to-b from-slate-50 to-white border-r border-gray-200 text-gray-800 flex flex-col min-h-0
                    transform transition-transform duration-300 ease-in-out z-40
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${!isMobile ? 'lg:translate-x-0' : ''}
                `}
                style={{
                    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)'
                }}
            >
                {/* LOGO - Hidden on mobile */}
                <div className="px-6 py-6 border-b border-gray-200 bg-white">
                    <img
                        src="/logo.png"
                        alt="Company Logo"
                        className="h-16 mx-auto object-contain"
                    />
                </div>

                {/* Mobile Header - Shows only on mobile when sidebar is open */}
                {/* {isMobile && (
                    <div className="px-6 py-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm lg:hidden">
                        <div className="flex items-center justify-between px-5">
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 tracking-tight">EMS Portal</h1>
                                <p className="text-xs text-gray-500 font-medium ">Enterprise Admin</p>
                            </div>
                        </div>
                    </div>
                )} */}

                {/* MENU */}
                <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto min-h-0">
                    {menuItems.map((item, index) => (
                        <MenuItem
                            key={index}
                            icon={item.icon}
                            label={item.label}
                            active={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) setIsOpen(false);
                            }}
                        />
                    ))}
                </nav>

                {/* USER CARD & LOGOUT */}
                <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 rounded-lg p-2 flex-1 min-w-0">
                            <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-700 font-bold text-base">{user?.firstName?.charAt(0) || "A"}</span>
                            </div>
                            <div className="overflow-hidden flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName || "Admin"}</p>
                                <p className="text-xs text-gray-500 font-medium truncate">{user?.role === "Department Head" ? "Department Head" : "Admin"}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            aria-label="Logout"
                            title="Logout"
                            className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150 shadow-sm flex-shrink-0"
                        >
                            <MdLogout size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile when sidebar is open */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* CSS for responsive behavior */}
            <style>{`
                /* On screens 1120px and above, sidebar is always visible */
                @media (min-width: 1120px) {
                    aside {
                        transform: translateX(0) !important;
                    }
                    /* Hide hamburger button on desktop */
                    button.fixed.top-4.left-4 {
                        display: none !important;
                    }
                }
                
                /* On screens below 1120px */
                @media (max-width: 1119px) {
                    aside {
                        transform: translateX(-100%);
                    }
                    aside.translate-x-0 {
                        transform: translateX(0) !important;
                    }
                }

                /* Scrollbar styling for sidebar */
                nav::-webkit-scrollbar {
                    width: 6px;
                }
                
                nav::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                nav::-webkit-scrollbar-thumb {
                    background: #cbd5e0;
                    border-radius: 3px;
                }
                
                nav::-webkit-scrollbar-thumb:hover {
                    background: #a0aec0;
                }
            `}</style>
        </>
    );
};

const MenuItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden
            ${active ? "bg-white text-blue-700 font-semibold shadow-sm" : "text-gray-700 hover:bg-slate-50 hover:text-gray-900"}`}
    >
        {/* Active indicator bar */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-blue-600 to-blue-700 rounded-r-full shadow-md"></div>
        )}

        <div className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
            {icon}
        </div>

        <span className="text-sm font-medium truncate">{label}</span>

        {!active && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        )}
    </button>
);

export default AdminSidebar;