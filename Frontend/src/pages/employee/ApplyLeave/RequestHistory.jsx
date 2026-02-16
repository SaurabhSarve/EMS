import { FiMoreVertical } from 'react-icons/fi';
import { HiCalendar, HiHeart, HiUser } from 'react-icons/hi';

const RequestHistory = ({ requestedLeaves = [] }) => {
    console.log("here", requestedLeaves);

    // Icon mapping based on leave type
    const iconMap = {
        annual: {
            icon: <HiCalendar className="text-blue-600" />,
            bg: "bg-blue-50"
        },
        sick: {
            icon: <HiHeart className="text-red-600" />,
            bg: "bg-red-50"
        },
        personal: {
            icon: <HiUser className="text-purple-600" />,
            bg: "bg-purple-50"
        }
    };

    // Status styling
    const statusStyles = {
        pending: "bg-yellow-50 text-yellow-700",
        Pending: "bg-yellow-50 text-yellow-700",
        approved: "bg-green-50 text-green-700",
        Approved: "bg-green-50 text-green-700",
        rejected: "bg-red-50 text-red-700",
        Rejected: "bg-red-50 text-red-700",
        cancelled: "bg-gray-50 text-gray-700",
        Cancelled: "bg-gray-50 text-gray-700"
    };

    // Format date to readable format
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
    };

    // Get year from date
    const getYear = (dateString) => {
        const date = new Date(dateString);
        return date.getFullYear();
    };

    // Capitalize first letter
    const capitalizeFirst = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* HEADER */}
            <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">
                    Request History
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    Your recent leave applications
                </p>
            </div>

            {/* TABLE HEADER */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr_0.5fr] px-6 py-3 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <div>Type & Reason</div>
                <div>Date Range</div>
                <div>Days</div>
                <div>Status</div>
                <div></div>
            </div>

            {/* TABLE BODY */}
            <div className="max-h-[400px] overflow-y-auto">
                {requestedLeaves && requestedLeaves.length > 0 ? (
                    requestedLeaves.map((item, index) => {
                        // Get icon data based on leave type
                        const iconData = iconMap[item.leaveType?.toLowerCase()] || iconMap.personal;

                        return (
                            <div
                                key={item._id || index}
                                className="grid grid-cols-[2fr_2fr_1fr_1.5fr_0.5fr] px-6 py-4 items-center border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                            >
                                {/* TYPE */}
                                <div className="flex items-center gap-3">
                                    {/* <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconData.bg} flex-shrink-0`}
                                    >
                                        {iconData.icon}
                                    </div> */}
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900">
                                            {capitalizeFirst(item.leaveType)} Leave
                                        </p>
                                        <p className="text-sm text-slate-500 truncate">
                                            {item.reason}
                                        </p>
                                    </div>
                                </div>

                                {/* DATE RANGE */}
                                <div>
                                    <p className="font-medium text-slate-800">
                                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {getYear(item.startDate)}
                                    </p>
                                </div>

                                {/* DAYS */}
                                <div className="font-medium text-slate-800">
                                    {item.totalDays} {item.totalDays === 1 ? 'day' : 'days'}
                                </div>

                                {/* STATUS */}
                                <div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-2 ${statusStyles[item.status] || statusStyles.pending}`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-current"></span>
                                        {capitalizeFirst(item.status)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="px-6 py-12 text-center">
                        <p className="text-slate-500 text-sm">No leave requests found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestHistory;