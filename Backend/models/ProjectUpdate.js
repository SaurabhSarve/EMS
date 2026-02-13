const mongoose = require("mongoose");

const projectUpdateSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['employee', 'Department Head', 'Admin'],
    required: true
  },
  type: {
    type: String,
    enum: ['progress', 'comment', 'file', 'status_change', 'reassignment'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  content: {
    type: String,
    maxLength: 2000
  },
  progressOld: {
    type: Number,
    min: 0,
    max: 100
  },
  progressNew: {
    type: Number,
    min: 0,
    max: 100
  },
  statusOld: {
    type: String,
    enum: ['Pending', 'Ongoing', 'Completed', 'Overdue', 'Archived']
  },
  statusNew: {
    type: String,
    enum: ['Pending', 'Ongoing', 'Completed', 'Overdue', 'Archived']
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  attachments: [{
    url: String,
    name: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  replies: [{
    user: mongoose.Schema.Types.ObjectId,
    userName: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
projectUpdateSchema.index({ project: 1, createdAt: -1 });
projectUpdateSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("ProjectUpdate", projectUpdateSchema);
