const Project = require("../models/Project");
const ProjectUpdate = require("../models/ProjectUpdate");
const User = require("../models/user");
const logActivity = require("../utils/activityLogger");

// Update project progress
const updateProjectProgress = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { progress, comment } = req.body;
    const userId = req.user._id;

    // Validate progress value
    if (progress === undefined || progress === null || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress must be between 0 and 100"
      });
    }

    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Check if user is assigned to project or is the head
    const isAssigned = project.assignees.includes(userId);
    const isHead = project.leader.equals(userId);
    const user = await User.findById(userId);
    const isHeadRole = user.role === 'Department Head' || user.role === 'Admin';

    if (!isAssigned && !isHead && !isHeadRole) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this project's progress"
      });
    }

    // Determine new status based on progress
    let newStatus = project.status;
    if (progress >= 100) {
      newStatus = 'Completed';
    } else if (progress > 0 && project.status === 'Pending') {
      newStatus = 'Ongoing';
    }

    // Create update record
    const updateRecord = await ProjectUpdate.create({
      project: projectId,
      user: userId,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      type: 'progress',
      title: `Updated progress to ${progress}%`,
      content: comment || '',
      progressOld: project.progress,
      progressNew: progress,
      statusOld: project.status,
      statusNew: newStatus
    });

    // Update project
    project.progress = progress;
    project.status = newStatus;
    project.updatedAt = new Date();
    await project.save();

    // Log activity
    await logActivity(
      userId,
      'UPDATE_PROJECT',
      `Updated project progress to ${progress}%`,
      projectId
    );

    res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      data: {
        project,
        update: updateRecord
      }
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      success: false,
      message: "Error updating progress",
      error: error.message
    });
  }
};

// Add comment to project
const addProjectComment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty"
      });
    }

    // Get project and verify access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const isAssigned = project.assignees.includes(userId);
    const isHead = project.leader.equals(userId);
    const user = await User.findById(userId);
    const isHeadRole = user.role === 'Department Head' || user.role === 'Admin';

    if (!isAssigned && !isHead && !isHeadRole) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to comment on this project"
      });
    }

    // Create comment
    const comment = await ProjectUpdate.create({
      project: projectId,
      user: userId,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      type: 'comment',
      title: `${user.firstName} ${user.lastName} commented`,
      content: content.trim()
    });

    // Log activity
    await logActivity(userId, `Commented on project: ${project.name}`, "comment", "Project");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: error.message
    });
  }
};

// Get project updates/comments
const getProjectUpdates = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type = 'all', page = 1, limit = 20 } = req.query;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const filter = { project: projectId };
    if (type && type !== 'all') {
      filter.type = type;
    }

    const skip = (page - 1) * limit;

    const updates = await ProjectUpdate.find(filter)
      .populate('user', 'firstName lastName email employeeId profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProjectUpdate.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        updates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching updates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching updates",
      error: error.message
    });
  }
};

// Get latest project updates (for real-time)
const getProjectLatestUpdates = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { timestamp } = req.query; // timestamp to get updates after

    const filter = { project: projectId };
    if (timestamp) {
      filter.createdAt = { $gt: new Date(parseInt(timestamp)) };
    }

    const updates = await ProjectUpdate.find(filter)
      .populate('user', 'firstName lastName email employeeId profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: updates
    });
  } catch (error) {
    console.error("Error fetching latest updates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching latest updates",
      error: error.message
    });
  }
};

// Like/unlike an update
const toggleUpdateLike = async (req, res) => {
  try {
    const { updateId } = req.params;
    const userId = req.user._id;

    const update = await ProjectUpdate.findById(updateId);
    if (!update) {
      return res.status(404).json({
        success: false,
        message: "Update not found"
      });
    }

    const likeIndex = update.likes.indexOf(userId);
    if (likeIndex > -1) {
      update.likes.splice(likeIndex, 1);
    } else {
      update.likes.push(userId);
    }

    await update.save();

    res.status(200).json({
      success: true,
      message: "Like toggled successfully",
      data: update
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling like",
      error: error.message
    });
  }
};

// Reply to an update
const replyToUpdate = async (req, res) => {
  try {
    const { updateId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply cannot be empty"
      });
    }

    const update = await ProjectUpdate.findById(updateId);
    if (!update) {
      return res.status(404).json({
        success: false,
        message: "Update not found"
      });
    }

    update.replies.push({
      user: userId,
      userName: `${user.firstName} ${user.lastName}`,
      content: content.trim()
    });

    await update.save();

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      data: update
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({
      success: false,
      message: "Error adding reply",
      error: error.message
    });
  }
};

module.exports = {
  updateProjectProgress,
  addProjectComment,
  getProjectUpdates,
  getProjectLatestUpdates,
  toggleUpdateLike,
  replyToUpdate
};
