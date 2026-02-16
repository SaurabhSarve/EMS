const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
// const crypto = require('crypto');

const userSchema = new mongoose.Schema({

    // for admin login activity

    email: {
        type: String,
        required: function () {
            return this.role === 'Admin' || this.role === 'Department Head';
        },
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        sparse: true
    },

    password: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        select: false
    },

    // for employee
    organizationBalance: {
        type: Number,
        default: 5250000
    }
    ,

    employeeId: {
        type: String,
        sparse: true,
        unique: true,
        trim: true
    },

    // info of admin and employees depend on the user role
    firstName: {
        type: String,
        required: true,
        trim: true
    },

    lastName: {
        type: String,

        trim: true
    },

    contactNumber: {
        type: Number,
        required: true
    },

    personalEmail: {
        type: String,
        trim: true,
        required: function () {
            return this.role === 'employee'
        },
    },

    dob: Date,

    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },

    //  employment (naukri) information company mai 
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
    },

    // Leave balance
    leaveBalance: {
        personal: { type: Number, default: 12 },
        sick: { type: Number, default: 10 },
        annual: { type: Number, default: 15 },
    },

    profilePhoto: {
        url: String,
        filename: String,
    },

    position: {
        type: String,
        trim: true,
        default: function () {
            if (this.role == "Admin") {
                return "manager"
            } else {
                return "Department Head"
            }
        }
    },

    joiningDate: {
        type: Date,
        default: Date.now
    },

    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'intern'],
        default: 'full-time'
    },

    address: {
        type: String,
        default: "India"
    },

    baseSalary: {
        type: Number,
        default: 0
    },

    allowances: {
        type: Number,
        default: 0
    },

    deductions: {
        type: Number,
        default: 0
    },

    taxApply: {
        type: Number,
        default: 0
    },

    netSalary: {
        type: Number,
        default: 0
    },

    //    others credentials - system needs
    role: {
        type: String,
        enum: ['Admin', 'employee', 'Department Head'],
        required: true
    },

    reportingManager: {
        type: String,
        default: "not alloted"
    },

    isActive: {
        type: Boolean,
        default: true
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'on leave'],
        default: 'active'
    },

    lastLogin: {
        type: Date
    },
    AccessKey: {
        type: mongoose.Types.ObjectId,
        ref: "Access_Key",
    },


    //  Bank details - for salary processing (when implementing a payment gateway )
    bankDetails: {
        accountHolderName: {
            type: String,
            trim: true
        },
        accountNumber: {
            type: String,
            trim: true
        },
        ifscCode: {
            type: String,
            uppercase: true,
            trim: true
        },
        bankName: {
            type: String,
            trim: true
        },
        branchName: {
            type: String,
            trim: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date
        }
    },

    // mainly for employees
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true   // createdAt and updatedAt
});


userSchema.pre('save', async function (next) {
    try {
        if (this.password) {
            const isAlreadyHashed = this.password.startsWith('$2b$');

            if (!isAlreadyHashed) {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            }
        }

        // Updatiing bankDetails.updatedAt when bank details are modified
        if (this.isModified('bankDetails') && this.bankDetails && this.bankDetails.accountNumber) {
            this.bankDetails.updatedAt = new Date();
        }

        return
    } catch (error) {
        throw err;
    }
});

userSchema.methods.comparePassword = async function (enteredCurrPass) {
    if (!this.password) {
        const userWithPassword = await this.constructor.findById(this._id).select('+password');
        return await bcrypt.compare(enteredCurrPass, userWithPassword.password);
    }
    return await bcrypt.compare(enteredCurrPass, this.password);
};


const User = mongoose.model("User", userSchema);

module.exports = User;