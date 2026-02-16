import { MdSecurity, MdEdit } from "react-icons/md";
import { useState, useEffect } from "react";
import axios from "axios";

const SuperAdminPanel = ({ onExit }) => {

    const [admins, setAdmins] = useState([]);
    const [selectedKey, setSelectedKey] = useState(null);

    const [formData, setFormData] = useState({
        superKey: "",          // ✅ using superKey
        roleName: "",
        newSecurityKey: ""
    });

    // 🔥 Fetch Keys
    const apiKeys = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/v1/key/allkey",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                setAdmins(response.data.allkey);
            }
        } catch (err) {
            console.log(err.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        apiKeys();
    }, []);

    // 🔥 Open Form
    const handleOpenForm = (admin) => {
        setSelectedKey(admin);
        setFormData({
            superKey: "",   // ✅ consistent
            roleName: admin.roleName,
            newSecurityKey: ""
        });
    };

    // 🔥 Update Key
    const handleUpdateKey = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.put(
                `http://localhost:5000/api/v1/key/changeKey/${selectedKey._id}`,
                formData,   // superKey will be sent
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                alert("Security Key Updated Successfully");
                setSelectedKey(null);
                apiKeys();
            }
        } catch (error) {
            alert(error.response?.data?.message || "Update Failed");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

            <h2 className="text-2xl font-bold text-red-600 mb-6 flex items-center gap-2">
                <MdSecurity />
                Super Admin Security Panel
            </h2>

            {/* TABLE */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-700 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Key Type</th>
                                <th className="px-6 py-4">Hash Value</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {admins.map((admin) => (
                                <tr key={admin._id}>
                                    <td className="px-6 py-4">
                                        {admin.roleName}
                                    </td>
                                    <td className="px-6 py-4 break-all">
                                        {admin.keyValue}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleOpenForm(admin)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                        >
                                            <MdEdit />
                                            Change Key
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FORM */}
            {selectedKey && (
                <div className="bg-slate-100 p-6 rounded-xl border border-slate-300">
                    <h3 className="text-lg font-bold mb-4 text-slate-700">
                        Change Security Key for: {selectedKey.roleName}
                    </h3>

                    <div className="grid md:grid-cols-3 gap-4">
                        <input
                            type="password"
                            placeholder="Enter Super Admin Key"
                            value={formData.superKey}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    superKey: e.target.value
                                })
                            }
                            className="px-3 py-2 border rounded-lg"
                        />

                        <input
                            type="text"
                            value={formData.roleName}
                            readOnly
                            className="px-3 py-2 border rounded-lg bg-gray-200"
                        />

                        <input
                            type="text"
                            placeholder="Enter New Security Key"
                            value={formData.newSecurityKey}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    newSecurityKey: e.target.value
                                })
                            }
                            className="px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div className="mt-4 flex gap-4">
                        <button
                            onClick={handleUpdateKey}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Update
                        </button>

                        <button
                            onClick={() => setSelectedKey(null)}
                            className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={onExit}
                className="mt-8 px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
            >
                Exit Super Admin Mode
            </button>
        </div>
    );
};

export default SuperAdminPanel;
