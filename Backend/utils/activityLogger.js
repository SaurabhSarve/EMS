
const Activity = require('../models/Activity');

const activityConfig = {
    payroll_processed: {
        icon: 'dollar-sign',
        iconColor: 'green',
        getTitle: () => 'Payroll System',
        getDescription: (data) => `${data.month} Payroll Processed`
    },
    leave_request: {
    icon: 'user',
    iconColor: 'slate',
    getTitle: (user) => `${user.firstName} ${user.lastName}`,
    getDescription: (data) => {
        // If we have leave type in metadata, use it
        if (data.metadata?.leaveType) {
            const days = data.metadata?.numberOfDays || '';
            const dayText = days ? ` (${days} day${days > 1 ? 's' : ''})` : '';
            return `Applied for ${data.metadata.leaveType}${dayText}`;
        }
        return 'Applied for Sick Leave';
    }
},
    employee_added: {
        icon: 'user-plus',
        iconColor: 'blue',
        getTitle: (user, data) => `New Hire: ${user.firstName} ${user.lastName?.charAt(0)}.`,
        getDescription: (data) => `Added to ${data.department}`
    },
    employee_updated: {
    icon: 'edit',
    iconColor: 'blue',
    getTitle: (user, data) => {
        // If it's activation/deactivation, show the employee name
        if (data.metadata?.action === 'activated' || data.metadata?.action === 'deactivated') {
            return data.metadata.employeeName || `${user?.firstName} ${user?.lastName}`;
        }
        // For regular updates
        return `${user?.firstName} ${user?.lastName}`;
    },
    getDescription: (data) => {
        if (data.metadata?.action === 'activated') {
            return 'Account Activated';
        }
        if (data.metadata?.action === 'deactivated') {
            return 'Account Deactivated';
        }
        // For regular profile updates
        return 'Profile Updated';
    }
},
leave_approved: {
    icon: 'check-circle',
    iconColor: 'green',
    getTitle: (user, data) => {
        // Show the employee's name who got leave approved
        if (data.metadata?.employeeName) {
            return data.metadata.employeeName;
        }
        return `${user?.firstName} ${user?.lastName}`;
    },
    getDescription: (data) => {
        if (data.metadata?.leaveType && data.metadata?.numberOfDays) {
            return `${data.metadata.leaveType} Leave Approved (${data.metadata.numberOfDays} day${data.metadata.numberOfDays > 1 ? 's' : ''})`;
        }
        return 'Leave Request Approved';
    }
},

leave_rejected: {
    icon: 'x-circle',
    iconColor: 'red',
    getTitle: (user, data) => {
        // Show the employee's name who got leave rejected
        if (data.metadata?.employeeName) {
            return data.metadata.employeeName;
        }
        return `${user?.firstName} ${user?.lastName}`;
    },
    getDescription: (data) => {
        if (data.metadata?.leaveType && data.metadata?.numberOfDays) {
            return `${data.metadata.leaveType} Leave Rejected (${data.metadata.numberOfDays} day${data.metadata.numberOfDays > 1 ? 's' : ''})`;
        }
        return 'Leave Request Rejected';
    }
},

employee_deleted: {
    icon: 'user-minus',
    iconColor: 'red',
    getTitle: (user, data) => {
        if (user) {
            return `${user.firstName} ${user.lastName}`;
        }
        return 'Employee';
    },
    getDescription: (data) => {
        const employeeName = data.metadata?.employeeName || 'Employee';
        const department = data.metadata?.department;
        
        if (department) {
            return `Removed ${employeeName} from ${department}`;
        }
        return `Removed ${employeeName} from system`;
    }
},
    system_alert: {
        icon: 'alert-triangle',
        iconColor: 'yellow',
        getTitle: () => 'System Alert',
        getDescription: (data) => data.message || 'Server load peaked 85%'
    },
    policy_update: {
        icon: 'file-text',
        iconColor: 'slate',
        getTitle: () => 'Policy Update',
        getDescription: (data) => data.message || 'Updated WFH policy'
    },
    task_assigned: {
    icon: 'clipboard',
    iconColor: 'blue',
    getTitle: (user) => `${user.firstName} ${user.lastName}`,
    getDescription: (data) => {
        if (data.metadata?.taskName) {
            const priority = data.metadata?.priority ? ` (${data.metadata.priority} priority)` : '';
            return `Assigned task: ${data.metadata.taskName}${priority}`;
        }
        return 'New Task Assigned';
    }
},
};

const logActivity = async (type, userId, data = {}) => {
    try {
        const User = require('../models/user');
        const user = await User.findById(userId).select('firstName lastName');

        if (!user && type !== 'payroll_processed' && type !== 'system_alert' && type !== 'policy_update') {
            return;
        }

        const config = activityConfig[type];
        if (!config) return;

        await Activity.create({
            type,
            title: config.getTitle(user, data),
            description: config.getDescription(data),
            user: userId,
            targetUser: data.targetUserId || null,
            relatedModel: data.relatedModel || null,
            relatedId: data.relatedId || null,
            metadata: data.metadata || {},
            icon: config.icon,
            iconColor: config.iconColor
        });

    } catch (error) {
        console.error('Activity log error:', error);
    }
};

module.exports = logActivity;
