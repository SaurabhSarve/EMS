const Project = require("../models/Project");
const User = require("../models/user");
const Department = require("../models/Department");
const ProjectUpdate = require("../models/ProjectUpdate");
const logActivity = require("../utils/activityLogger");

// Get all projects for a department head
const getProjectsByDepartmentHead = async (req, res, next) => {
  try {
    const headId = req.user._id;
    
    // Get the department head's department
    const head = await User.findById(headId).populate("department");
    
    if (!head) {
      return res.status(404).json({
        success: false,
        message: "Department head not found"
      });
    }

    // Admin can access all projects
    if (head.role === 'Admin') {
      const [projects, availableDepartments, departmentEmployees] = await Promise.all([
        Project.find({ archived: false })
          .populate("leader", "firstName lastName email employeeId")
          .populate("assignees", "firstName lastName email employeeId")
          .populate("createdBy", "firstName lastName")
          .populate("department", "name")
          .sort({ createdAt: -1 }),
        Department.find({}).populate("manager", "firstName lastName email"),
        User.find({ role: { $in: ["employee", "Department Head"] } })
          .select("firstName lastName email employeeId role department")
          .populate("department", "name")
      ]);

      return res.status(200).json({
        success: true,
        data: {
          role: req.user.role,
          departmentDetails: null,
          departmentEmployees,
          availableDepartments,
          projects
        }
      });
    }

    // Check if user has Department Head role
    if (head.role !== 'Department Head') {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role is '${head.role}'. Only Department Heads can access projects. Contact admin to change your role.`
      });
    }

    // If department not assigned, return available departments for user to select
    if (!head.department) {
      const availableDepartments = await Department.find({}).populate("manager", "firstName lastName email");
      return res.status(200).json({
        success: true,
        requiresDepartmentSelection: true,
        message: "Please select a department to proceed",
        data: {
          role: req.user.role,
          availableDepartments,
          departmentDetails: null,
          departmentEmployees: [],
          projects: []
        }
      });
    }

    // Get department details
    const departmentDetails = await Department.findById(head.department._id).populate("manager", "firstName lastName email");
    
    // Get all employees in this department
    const departmentEmployees = await User.find({ 
      department: head.department._id,
      role: { $in: ["employee", "Department Head"] }
    })
      .select("firstName lastName email employeeId role department")
      .populate("department", "name");

    // Get all projects for this department
    const projects = await Project.find({ 
      department: head.department._id,
      archived: false
    })
      .populate("leader", "firstName lastName email employeeId")
      .populate("assignees", "firstName lastName email employeeId")
      .populate("createdBy", "firstName lastName")
      .populate("department", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        role: req.user.role,
        departmentDetails,
        departmentEmployees,
        projects
      }
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: error.message
    });
  }
};

// Get all projects assigned to an employee
const getProjectsByEmployee = async (req, res, next) => {
  try {
    const employeeId = req.user._id;

    const projects = await Project.find({
      assignees: employeeId,
      archived: false
    })
      .populate("leader", "firstName lastName email")
      .populate("assignees", "firstName lastName email employeeId")
      .populate("createdBy", "firstName lastName")
      .populate("department", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: error.message
    });
  }
};

// Create a new project
const createProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      department,
      departmentName,
      teamSize,
      leader,
      leaderName,
      assignees,
      dueDate,
      priority,
      progress
    } = req.body;

    // Validation
    if (!name || !description || !department || !leader || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    if (!assignees || assignees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one team member must be assigned"
      });
    }

    // Verify leader is in assignees
    if (!assignees.map(id => id.toString()).includes(leader.toString())) {
      return res.status(400).json({
        success: false,
        message: "Project leader must be part of the team"
      });
    }

    // Create new project
    const newProject = new Project({
      name,
      description,
      department,
      departmentName,
      teamSize: assignees.length,
      leader,
      leaderName,
      assignees,
      dueDate,
      priority: priority || 'Medium',
      progress: progress || 0,
      createdBy: req.user._id
    });

    await newProject.save();

    // Populate references
    await newProject.populate("leader", "firstName lastName email");
    await newProject.populate("assignees", "firstName lastName email employeeId");
    await newProject.populate("createdBy", "firstName lastName");

    // Log activity
    logActivity(req.user._id, `Created project: ${name}`, "create", "Project");

    res.status(201).json({
      success: true,
      data: newProject,
      message: "Project created successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating project",
      error: error.message
    });
  }
};

// Get single project by ID
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate("leader", "firstName lastName email")
      .populate("assignees", "firstName lastName email employeeId")
      .populate("createdBy", "firstName lastName")
      .populate("department", "name");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching project",
      error: error.message
    });
  }
};

// Update project
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      teamSize,
      leader,
      leaderName,
      assignees,
      dueDate,
      priority,
      progress,
      status
    } = req.body;

    // Validation
    if (assignees && assignees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one team member must be assigned"
      });
    }

    if (assignees && leader && !assignees.map(id => id.toString()).includes(leader.toString())) {
      return res.status(400).json({
        success: false,
        message: "Project leader must be part of the team"
      });
    }

    const updateData = {
      name,
      description,
      leader,
      leaderName,
      assignees,
      dueDate,
      priority,
      progress,
      status,
      teamSize: assignees ? assignees.length : teamSize,
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const project = await Project.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("leader", "firstName lastName email")
      .populate("assignees", "firstName lastName email employeeId")
      .populate("createdBy", "firstName lastName");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    logActivity(req.user._id, `Updated project: ${project.name}`, "update", "Project");

    res.status(200).json({
      success: true,
      data: project,
      message: "Project updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating project",
      error: error.message
    });
  }
};

// Archive/Delete project
const archiveProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findByIdAndUpdate(
      id,
      { 
        archived: true,
        status: "Archived",
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate("leader", "firstName lastName email")
      .populate("assignees", "firstName lastName email employeeId");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    logActivity(req.user._id, `Archived project: ${project.name}`, "delete", "Project");

    res.status(200).json({
      success: true,
      data: project,
      message: "Project archived successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error archiving project",
      error: error.message
    });
  }
};

// Unarchive project
const unarchiveProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findByIdAndUpdate(
      id,
      { 
        archived: false,
        status: "Pending",
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate("leader", "firstName lastName email")
      .populate("assignees", "firstName lastName email employeeId");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    logActivity(req.user._id, `Unarchived project: ${project.name}`, "update", "Project");

    res.status(200).json({
      success: true,
      data: project,
      message: "Project unarchived successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error unarchiving project",
      error: error.message
    });
  }
};

// Permanently delete project
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const userRole = req.user?.role;
    if (userRole !== "Admin" && userRole !== "Department Head") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Admins and Department Heads can delete projects."
      });
    }

    if (userRole === "Department Head") {
      const headDepartmentId = req.user?.department?.toString();
      if (!headDepartmentId || project.department.toString() !== headDepartmentId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Department Heads can only delete projects in their department."
        });
      }
    }

    await ProjectUpdate.deleteMany({ project: id });
    await Project.findByIdAndDelete(id);

    logActivity(req.user._id, `Deleted project: ${project.name}`, "delete", "Project");

    res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting project",
      error: error.message
    });
  }
};

// Assign department to current user
const assignDepartmentToHead = async (req, res, next) => {
  try {
    const headId = req.user._id;
    const { departmentId } = req.body;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department ID is required"
      });
    }

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    // Update user's department
    const updatedUser = await User.findByIdAndUpdate(
      headId,
      { department: departmentId },
      { new: true }
    ).populate("department", "name");

    res.status(200).json({
      success: true,
      message: "Department assigned successfully",
      data: updatedUser
    });
  } catch (error) {
    console.error("Error assigning department:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning department",
      error: error.message
    });
  }
};

module.exports = {
  getProjectsByDepartmentHead,
  getProjectsByEmployee,
  createProject,
  getProjectById,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  assignDepartmentToHead
};
