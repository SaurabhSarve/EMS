const Leave = require('../models/Leave.js');

/**
 * Check if dates overlap
 * @param {Date} startDate1 - Start date of first period
 * @param {Date} endDate1 - End date of first period
 * @param {Date} startDate2 - Start date of second period
 * @param {Date} endDate2 - End date of second period
 * @returns {boolean} - True if dates overlap
 */
const datesOverlap = (startDate1, endDate1, startDate2, endDate2) => {
    const start1 = new Date(startDate1);
    const end1 = new Date(endDate1);
    const start2 = new Date(startDate2);
    const end2 = new Date(endDate2);

    // Set times to start of day for accurate comparison
    start1.setHours(0, 0, 0, 0);
    end1.setHours(23, 59, 59, 999);
    start2.setHours(0, 0, 0, 0);
    end2.setHours(23, 59, 59, 999);

    // Check if dates overlap
    return start1 <= end2 && start2 <= end1;
};

/**
 * Check if user is currently on an active leave
 * @param {string} employeeId - Employee ID
 * @returns {object} - Object with isOnLeave boolean and leaveDetails
 */
const checkIfCurrentlyOnLeave = async (employeeId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeLeave = await Leave.findOne({
            employee: employeeId,
            status: 'approved',
            startDate: { $lte: today },
            endDate: { $gte: today }
        });

        if (activeLeave) {
            return {
                isOnLeave: true,
                leaveDetails: {
                    startDate: activeLeave.startDate,
                    endDate: activeLeave.endDate,
                    leaveType: activeLeave.leaveType
                }
            };
        }

        return {
            isOnLeave: false,
            leaveDetails: null
        };
    } catch (error) {
        console.error('Error checking if user is on leave:', error);
        return {
            isOnLeave: false,
            leaveDetails: null
        };
    }
};

/**
 * Validate leave request for conflicts
 * @param {string} employeeId - Employee ID
 * @param {Date} startDate - Start date of leave
 * @param {Date} endDate - End date of leave
 * @param {string} excludeLeaveId - Leave ID to exclude (for updates)
 * @returns {object} - Validation result with success boolean and message
 */
const validateLeaveRequest = async (employeeId, startDate, endDate, excludeLeaveId = null) => {
    try {
        // First check if user is currently on leave
        const onLeaveCheck = await checkIfCurrentlyOnLeave(employeeId);
        if (onLeaveCheck.isOnLeave) {
            const { startDate: leaveStart, endDate: leaveEnd, leaveType } = onLeaveCheck.leaveDetails;
            return {
                success: false,
                isOnLeave: true,
                message: `You are currently on ${leaveType} leave (${new Date(leaveStart).toLocaleDateString()} to ${new Date(leaveEnd).toLocaleDateString()}). You cannot apply for new leave while on active leave.`
            };
        }

        // Check for pending leave requests
        const pendingLeaves = await Leave.find({
            employee: employeeId,
            status: 'pending',
            ...(excludeLeaveId && { _id: { $ne: excludeLeaveId } })
        });

        if (pendingLeaves.length > 0) {
            return {
                success: false,
                isOnLeave: false,
                message: 'You already have a pending leave request. Please wait for it to be approved or rejected before applying for another leave.'
            };
        }

        // Check for date conflicts with all non-rejected leaves
        const existingLeaves = await Leave.find({
            employee: employeeId,
            status: { $in: ['pending', 'approved'] },
            ...(excludeLeaveId && { _id: { $ne: excludeLeaveId } })
        });

        for (const leave of existingLeaves) {
            if (datesOverlap(startDate, endDate, leave.startDate, leave.endDate)) {
                const status = leave.status === 'approved' ? 'an approved' : 'a';
                return {
                    success: false,
                    isOnLeave: false,
                    message: `Your requested dates clash with ${status} ${leave.status} leave (${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}). Please select different dates.`
                };
            }
        }

        return {
            success: true,
            isOnLeave: false,
            message: 'Leave request is valid'
        };
    } catch (error) {
        console.error('Error validating leave request:', error);
        return {
            success: false,
            isOnLeave: false,
            message: 'Error validating leave request. Please try again.'
        };
    }
};

module.exports = {
    datesOverlap,
    validateLeaveRequest,
    checkIfCurrentlyOnLeave
};
