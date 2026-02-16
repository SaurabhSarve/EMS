

// const mongoose = require("mongoose");


// const attendanceSchema = new mongoose.Schema({
//     employee : {
//         type : mongoose.Schema.Types.ObjectId,
//         ref : "User",
//         required : true
//     },
//     date : {
//         type : Data,
//         required : true
//     },
//     checkIn: {
//     type: Date
//   },
//   checkOut: {
//     type: Date
//   },
//    status : {
//     type : String,
//     enum : ['present' , 'half-day' , 'absent']
//    },
//    workingHours : {
//     type : Number,
//     default : 0
//    }
// }, {
//     timestamps :  true
// })

// attendanceSchema.index({employee :  true ,  date :  1} , {unique :  true});

// attendanceSchema.pre('save' , function(next){
// if(this.checkIn && this.checkOut){
//    const hours = (this.checkOut = this.checkIn) / (1000 * 60 * 60);
//    this.workingHours = Math.round(hours * 100) / 100;  

//    if (hours >= 4) { // If worked 4+ hours, it's a full day
//       this.status = 'present';
//     } else {
//       this.status = 'half-day';
//     }



// }else if (this.checkIn || this.checkOut) {
//     // If only check-in OR only check-out, it's half day
//     this.status = 'half-day';
//   } else {
//     // No check-in and no check-out means absent
//     this.status = 'absent';
//   }
//   next();
// })


// module.exports = mongoose.model('Attendance' , attendanceSchema);