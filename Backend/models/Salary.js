const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
    employee : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
    },
    employeeId : {
      type : String,
      required : true
    },
    month : {
        type : String,
         default: () => {
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      return monthNames[now.getMonth()];
    }
    },
    baseSalary : {
        type : String,
        required : true

    },
allowances: {
    type: String,
    default: '0'
  },
  deductions: {
    type: String,
    default: '0'
  },
  taxApply : {
type : String,
default : '0'
  },
  netSalary: {
    type: String,
    required: true
  },
  Status : {
    type :String,
enum : ['processing' , 'paid' ,'due'],
default : 'due'
  }
}, {
  timestamps: true
}
)


salarySchema.index({ employee: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Salary', salarySchema);
