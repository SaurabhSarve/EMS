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
        return value >= this.startDate;
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
  
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
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
