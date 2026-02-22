import { useState, useEffect } from "react";
import axios from "axios";
import {
    MdSettings,
    MdSecurity,
    MdBlock,
    MdCheckCircle,
    MdModeEdit
} from "react-icons/md";
import AdminSidebar from "../../Components/AdminSidebar";
import StatusChangeModal from "../../Components/admin/StatusChangeModal";
import SuperAdminPanel from "../../Components/SecurityKey";

const Settings = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [showSuperAdminDropdown, setShowSuperAdminDropdown] = useState(false);
    const [superAdminKey, setSuperAdminKey] = useState("");
    const [isSuperAdminVerified, setIsSuperAdminVerified] = useState(false);

    // 🔥 Verify Super Admin Key
    const handleSuperAdminSubmit = async () => {
        try {
            const token = localStorage.getItem("token");

            const apiResponse = await axios.post(
                "/api/v1/key/superAdmin",
                { securityKey: superAdminKey },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (apiResponse.status === 200) {
                setSuperAdminKey("");
                setShowSuperAdminDropdown(false);
                setIsSuperAdminVerified(true);
                console.log(apiResponse.data.message);
            }
        } catch (err) {
            console.log(err.response?.data?.message || err.message);
        }
    };

    // 🔥 Fetch Admins
    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "/api/v1/admin/admins",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setAdmins(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching admins:", err);
            setError("Failed to fetch admins list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleOpenModal = (admin) => {
        setSelectedAdmin(admin);
        setIsModalOpen(true);
    };

    const handleStatusUpdate = () => {
        fetchAdmins();
        setIsModalOpen(false);
    };

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <AdminSidebar />

            <main className="flex-1 lg:ml-64 p-4 lg:p-8">
                <div className="max-w-6xl mx-auto">

                    {/* HEADER */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                                <MdSettings className="text-blue-600" />
                                Admin Settings
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">
                                Manage admin roles and account statuses
                            </p>
                        </div>

                        {/* SUPER ADMIN BUTTON */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setShowSuperAdminDropdown(!showSuperAdminDropdown)
                                }
                                className="bg-red-600 text-white px-5 py-2 rounded-xl font-semibold shadow hover:bg-red-700 transition-all"
                            >
                                Super Admin
                            </button>

                            {showSuperAdminDropdown && (
                                <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                                        Enter Super Admin Key
                                    </h3>

                                    <input
                                        type="password"
                                        value={superAdminKey}
                                        onChange={(e) =>
                                            setSuperAdminKey(e.target.value)
                                        }
                                        placeholder="Enter secret key"
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                                    />

                                    <button
                                        onClick={handleSuperAdminSubmit}
                                        className="mt-3 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-semibold"
                                    >
                                        Verify
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🔥 SINGLE CONTENT SECTION */}
                    {isSuperAdminVerified ? (
                        <SuperAdminPanel
                            onExit={() => setIsSuperAdminVerified(false)}
                        />
                    ) : loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium">
                            {error}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Admin Name</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-center">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {admins.map((admin) => (
                                            <tr
                                                key={admin._id}
                                                className="hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                            {admin.firstName.charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-slate-700">
                                                            {admin.firstName}{" "}
                                                            {admin.lastName}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-slate-600">
                                                    {admin.email}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1 uppercase ${
                                                            admin.status === "active"
                                                                ? "bg-green-100 text-green-700"
                                                                : admin.status === "inactive"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-red-100 text-red-700"
                                                        }`}
                                                    >
                                                        {admin.status === "active" ? (
                                                            <MdCheckCircle />
                                                        ) : (
                                                            <MdBlock />
                                                        )}
                                                        {admin.status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() =>
                                                            handleOpenModal(admin)
                                                        }
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-semibold active:scale-95"
                                                    >
                                                        <MdModeEdit />
                                                        Change Status
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECURITY NOTICE */}
                    {!isSuperAdminVerified && (
                        <div className="mt-8 bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-4 items-start">
                            <MdSecurity className="text-amber-600 text-2xl flex-shrink-0" />
                            <div>
                                <p className="text-amber-800 font-bold">
                                    Security Notice
                                </p>
                                <p className="text-amber-700 text-sm mt-0.5">
                                    Changing another admin's status requires a
                                    super secret security key. This action is logged
                                    and monitored for system integrity.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {selectedAdmin && (
                <StatusChangeModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    admin={selectedAdmin}
                    onSuccess={handleStatusUpdate}
                />
            )}
        </div>
    );
};

export default Settings;
