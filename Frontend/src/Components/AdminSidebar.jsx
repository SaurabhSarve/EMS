import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    MdDashboard,
    MdPeople,
    MdEventAvailable,
    MdLogout,
    MdMenu,
    MdClose
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
    const roleSpecificItem = isDepartmentHead
        ? { icon: <MdEventAvailable />, label: "Tasks", path: "/admin/employees/tasks" }
        : { icon: <MdPeople />, label: "Departments", path: "/admin/employees/tasks" };

    const menuItems = [
        { icon: <MdDashboard />, label: "Dashboard", path: "/admin/dashboard" },
        { icon: <MdPeople />, label: "Employees", path: "/admin/employees" },
        roleSpecificItem,
        { icon: <MdPeople />, label: "Leaves", path: "/admin/employees/leaves" },
        { icon: <MdPeople />, label: "Payroll", path: "/admin/employees/salary" },
        { icon: <MdPeople />, label: "Profile", path: "/admin/me" },
        { icon: <MdPeople />, label: "Tickets", path: "/admin/tickets" }

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
                    className="fixed top-3 left-4 z-50 w-9 h-9 bg-white text-gray-900 rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-md border border-gray-200 flex items-center justify-center"
                >
                    {isOpen ? <MdClose size={18} /> : <MdMenu size={18} />}
                </button>
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed w-64 min-h-screen bg-gradient-to-b from-slate-50 to-white border-r border-gray-200 text-gray-800 flex flex-col
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
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                <div className="p-4 border-t border-gray-200 space-y-3 bg-gradient-to-b from-gray-50 to-slate-50">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-white font-bold text-sm">{user?.firstName.charAt(0) || "Admin"}</span>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-base font-semibold text-gray-900 truncate">{user?.firstName}</p>
                            <p className="text-sm text-gray-500 font-medium">Super Admin</p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl 
    bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 
    text-white hover:from-indigo-700 hover:via-blue-700 hover:to-sky-600 
    active:scale-[0.97] transition-all duration-200 font-semibold text-base shadow-md hover:shadow-lg"
                    >

                        <MdLogout size={18} />
                        <span>Logout</span>
                    </button>
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
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group relative overflow-hidden
            ${active
                ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-sm"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
    >
        {/* Active indicator bar */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-700 rounded-r-full shadow-md"></div>
        )}

        <div className={`text-lg transition-colors ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}`}>
            {icon}
        </div>
        <span className="text-base font-medium">{label}</span>

        {/* Hover effect */}
        {!active && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        )}
    </button>
);

export default AdminSidebar;