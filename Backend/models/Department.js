const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
   name : {
    type : String,
    unique :  true,
    trim : true,
    required : [true ,  "Department name is required"]
   },

   code : {
    type : String,
    unique : true,
    trim : true,
    uppercase : true
   },

   description : {
    type : String,
    trim : true
   } ,

   manager : {
    type : mongoose.Schema.ObjectId,
    ref : 'User'

   } ,

   totalEmployees : {
    type : Number,
    default : 0
   } ,

    budget : {
    type : Number,
    default : 0
   } ,
   isActive : {
    type : Boolean , 
    default : true
   }

} , {
    timestamps : true
});

Department = mongoose.model("Department" , departmentSchema);

module.exports = Department;