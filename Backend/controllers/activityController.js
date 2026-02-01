// controllers/activityController.js
const Activity = require('../models/Activity');

//   Get recent activities
//   GET /api/activities/recent
//   Admin
exports.getRecentActivities = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const activities = await Activity.find()
            .populate('user', 'firstName lastName profilePhoto')
            .populate('targetUser', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(parseInt(5));

        res.status(200).json({
            success: true,
            count: activities.length,
            activities
        });

    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching activities',
            error: error.message
        });
    }
};



// Create activity log
// POST /api/activities
// Private
exports.createActivity = async (req, res) => {

    try {
        console.log(req.body);
        const activity = await Activity.create(req.body);

        res.status(200).json({
            success: true,
            activity
        });

    } catch (error) {
        console.error('Create activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating activity',
            error: error.message
        });
    }
};

