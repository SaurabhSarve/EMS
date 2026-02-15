const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    employee : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
  taskName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  startDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        // Handle both create and update contexts
        const startDate = this.startDate || (this.getUpdate && this.getUpdate().$set?.startDate);
        if (!startDate) return true; // If no startDate to validate against, skip
        return value >= startDate;
      },
      message: 'Due date must be after or equal to start date'
    }
  },
  description: {
    type: String,
    required: true,
    maxLength: 1000
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'Medium'
  },
  assignmentType: {
    type: String,
    enum: ['single', 'team'],
    default: 'single'
  },
  
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  progressComments: [
    {
      comment: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
      },
      attachmentUrl: {
        type: String,
        trim: true
      },
      attachmentName: {
        type: String,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "User"
  }
});


const Task = mongoose.model("Task" , taskSchema);

module.exports = Task;
