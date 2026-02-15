const mongoose = require('mongoose');



const leaveSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    leaveType: {
        type: String,
        enum: ['annual', 'sick', 'personal', 'planned_leave', 'unplanned_leave', 'sick_leave', 'planned_leave_48h', 'unplanned_leave_2h', 'sick_leave_4h'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    documentPath: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    totalDays: {
        type: Number
    },
    isHeadRequest: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Calculating total days before saving
leaveSchema.pre('save', function() {
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
return;
});


const Leave = mongoose.model("leave" ,leaveSchema);

module.exports = Leave;