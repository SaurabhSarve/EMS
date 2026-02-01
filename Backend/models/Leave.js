const mongoose = require('mongoose');



const leaveSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    leaveType: {
        type: String,
        enum: ['annual', 'sick', 'personal'],
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
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    totalDays: {
        type: Number
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