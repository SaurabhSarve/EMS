import { useEffect, useState } from "react";
import EmployeesSidebar from "../../Components/EmployeesSidebar";
import { employeeService } from "../../services/employeeServices";

export default function MyProfile() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const result = await employeeService.getProfile();
            console.log(result);
            if (result.success) {
                setProfileData(result.data);
            }
        } catch (err) {
            console.log("fetch profile err", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <EmployeesSidebar />
                <div className="flex-1 flex items-center justify-center ml-0 lg:ml-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading your profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    // No Data State
    if (!profileData) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <EmployeesSidebar />
                <div className="flex-1 flex items-center justify-center ml-0 lg:ml-64">
                    <div className="text-center p-8 bg-white rounded-xl shadow-sm max-w-md border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Profile Unavailable</h3>
                        <p className="text-gray-600">Unable to load profile information</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <EmployeesSidebar />
            
            <div className="flex-1 w-full ml-0 lg:ml-64">
                <div className="p-6 lg:p-10 max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        {/* <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-600 mt-2">View and manage your personal and professional information</p> */}
                    </div>

                    {/* Profile Header Card */}
                    <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 transform transition-all hover:shadow-blue-500/40 hover:shadow-2xl group mb-8">
                        {/* Animated shimmer effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32 animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-900/20 rounded-full blur-2xl transform -translate-x-20 translate-y-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                        
                        <div className="relative z-10 p-8">
                            <div className="flex flex-col lg:flex-row items-start gap-8">
                                {/* Profile Avatar */}
                                <div className="relative group">
                                    <div className="w-40 h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white ring-4 ring-white/30 transition-all duration-300 group-hover:scale-105">
                                        {profileData.profilePhoto?.url ? (
                                            <img 
                                                src={profileData.profilePhoto.url} 
                                                alt={`${profileData.firstName} ${profileData.lastName}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-5xl font-extrabold">
                                                {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    {/* Online Status */}
                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                        <div className="w-4 h-4 bg-green-400 rounded-full animate-ping absolute"></div>
                                        <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg relative"></div>
                                    </div>
                                </div>
                                
                                {/* Profile Info */}
                                <div className="flex-1 text-left">
                                    <div className="mb-6">
                                        <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
                                            {profileData.firstName} {profileData.lastName}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="flex items-center gap-2 px-5 py-2.5 bg-white/30 backdrop-blur-md border-2 border-white/50 rounded-xl font-bold text-white shadow-xl hover:bg-white/40 transition-all duration-300">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                </svg>
                                                {profileData.position}
                                            </span>
                                            <span className="flex items-center gap-2 px-5 py-2.5 bg-white/30 backdrop-blur-md border-2 border-white/50 rounded-xl font-bold text-white shadow-xl hover:bg-white/40 transition-all duration-300">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                                ID: {profileData.employeeId}
                                            </span>
                                            <span className="px-5 py-2.5 bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-green-300 rounded-xl font-bold text-white shadow-xl hover:scale-105 transition-all duration-300">
                                                ● {profileData.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Stats Bar */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="relative overflow-hidden group h-full">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/20 rounded-xl"></div>
                                            <div className="relative p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/30 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-xl h-full flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-4xl font-extrabold text-white drop-shadow-lg">{profileData.leaveBalance?.annual || 0}</p>
                                                    <span className="text-white/60 text-sm font-semibold">/ 24</span>
                                                </div>
                                                <div className="w-full bg-white/20 rounded-full h-2 mb-3 overflow-hidden">
                                                    <div className="bg-white h-full rounded-full shadow-lg transition-all duration-500" style={{width: `${((profileData.leaveBalance?.annual || 0) / 24) * 100}%`}}></div>
                                                </div>
                                                <p className="text-white font-semibold text-sm mt-auto">Annual Leave</p>
                                            </div>
                                        </div>
                                        <div className="relative overflow-hidden group h-full">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/20 rounded-xl"></div>
                                            <div className="relative p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/30 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-xl h-full flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-4xl font-extrabold text-white drop-shadow-lg">{profileData.leaveBalance?.sick || 0}</p>
                                                    <span className="text-white/60 text-sm font-semibold">/ 15</span>
                                                </div>
                                                <div className="w-full bg-white/20 rounded-full h-2 mb-3 overflow-hidden">
                                                    <div className="bg-white h-full rounded-full shadow-lg transition-all duration-500" style={{width: `${((profileData.leaveBalance?.sick || 0) / 15) * 100}%`}}></div>
                                                </div>
                                                <p className="text-white font-semibold text-sm mt-auto">Sick Leave</p>
                                            </div>
                                        </div>
                                        <div className="relative overflow-hidden group h-full">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/20 rounded-xl"></div>
                                            <div className="relative p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/30 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-xl h-full flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-4xl font-extrabold text-white drop-shadow-lg">{profileData.leaveBalance?.personal || 0}</p>
                                                    <span className="text-white/60 text-sm font-semibold">/ 16</span>
                                                </div>
                                                <div className="w-full bg-white/20 rounded-full h-2 mb-3 overflow-hidden">
                                                    <div className="bg-white h-full rounded-full shadow-lg transition-all duration-500" style={{width: `${((profileData.leaveBalance?.personal || 0) / 16) * 100}%`}}></div>
                                                </div>
                                                <p className="text-white font-semibold text-sm mt-auto">Personal Leave</p>
                                            </div>
                                        </div>
                                        <div className="relative overflow-hidden group h-full">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/30 rounded-xl"></div>
                                            <div className="relative p-6 bg-white/15 backdrop-blur-md rounded-xl border border-white/30 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-xl h-full flex flex-col justify-center">
                                                <p className="text-5xl font-extrabold text-white drop-shadow-2xl mb-3">
                                                    {(profileData.leaveBalance?.annual || 0) + 
                                                     (profileData.leaveBalance?.sick || 0) + 
                                                     (profileData.leaveBalance?.personal || 0)}
                                                </p>
                                                <p className="text-white font-bold text-sm uppercase tracking-wider">Days</p>
                                                <p className="text-white/90 text-xs font-medium mt-1">Total Leave</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Main Info */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Contact Information Card */}
                            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <span className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl shadow-sm">
                                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                        </span>
                                        Contact Information
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Work Email
                                            </label>
                                            <div className="flex items-center p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                </svg>
                                                <span className="text-gray-900 font-medium break-all">{profileData.personalEmail}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Personal Email
                                            </label>
                                            <div className="flex items-center p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                </svg>
                                                <span className="text-gray-900 font-medium break-all">{profileData.personalEmail}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Phone Number
                                            </label>
                                            <div className="flex items-center p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                </svg>
                                                <span className="text-gray-900 font-medium">{profileData.contactNumber || 'Not provided'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Work Location
                                            </label>
                                            <div className="flex items-center p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-gray-900 font-medium">{profileData.address || 'Office'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Details Card */}
                            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-100">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6">
                                    <span className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl shadow-sm">
                                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                                        </svg>
                                    </span>
                                    Employment Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Department
                                            </label>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <p className="text-gray-900 font-semibold">{profileData.department?.name || 'Not assigned'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Date of Joining
                                            </label>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <p className="text-gray-900 font-semibold">{formatDate(profileData.joiningDate)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Reporting Manager
                                            </label>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <p className="text-gray-900 font-semibold">{profileData.reportingManager || 'Not assigned'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Contract Type
                                            </label>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <p className="text-gray-900 font-semibold capitalize">{profileData.jobType}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information Card */}
                            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-100">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6">
                                    <span className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl shadow-sm">
                                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                First Name
                                            </label>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <p className="text-gray-900 font-semibold">{profileData.firstName}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Date of Birth
                                            </label>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <p className="text-gray-900 font-semibold">{formatDate(profileData.dob)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Last Name
                                            </label>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <p className="text-gray-900 font-semibold">{profileData.lastName}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                Gender
                                            </label>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                                <p className="text-gray-900 font-semibold capitalize">{profileData.gender}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Side Cards */}
                        <div className="space-y-8">
                            {/* Account Status Card */}
                            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-xl shadow-xl p-6 text-white">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/80 font-medium">Account Status</p>
                                        <p className="text-3xl font-bold capitalize drop-shadow-lg">{profileData.status}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 border-t border-white/20 pt-4">
                                    <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                        <span className="text-sm text-white/90 font-medium">Active Since</span>
                                        <span className="font-bold text-white">{formatDate(profileData.joiningDate)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                        <span className="text-sm text-white/90 font-medium">Last Login</span>
                                        <span className="font-bold text-white">Today</span>
                                    </div>
                                </div>
                            </div>

                            {/* Department Card */}
                            {profileData.department && (
                                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center shadow-sm">
                                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-xl text-gray-900">Department</h3>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all duration-300">
                                        <p className="text-xl font-bold text-gray-900 mb-2">{profileData.department.name}</p>
                                        <p className="text-sm text-gray-600 leading-relaxed">{profileData.department.description || 'No description available'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}