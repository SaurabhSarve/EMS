const mongoose = require('mongoose');
const User = require('../models/user');
const Department = require("../models/Department");
const {departmentData} = require("./departmentData");
const {adminData} = require("./adminData.js");
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });


const intializingBase = async() => {
    try{
     console.log(`🔗 Connecting to: ${process.env.MONGODB_URL}`);
        const conn = await mongoose.connect(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/ems_database');
        console.log(`mongodb(database) connected successfully`);

         // Clear existing data
        await User.deleteMany({});
        await Department.deleteMany({});
        // const createdAdmins = [];
        
//        for (const admin of adminData) {
//   const user = new User(admin);
//   const res = await user.save(); 
//   createdAdmins.push(res);
// }

// console.log("admin data inserted succesfully");
        

        // for (let i = 0; i < createdAdmins.length; i++) {
        //     const admin = createdAdmins[i];
        //     const deptName = departmentData[i].name;
        //     const manager = `${createdAdmins[i].firstName} ${createdAdmins[i].lastName}`;
            
        //     await Department.findOneAndUpdate(
        //          manager,
        //         { 
        //             manager: ,
        //             isActive: true 
        // //         }
        // //     );
        // // }
      

        // departmentData.forEach((dep) => {
        //   for (let i = 0; i < createdAdmins.length; i++) {
        //      const manager = `${createdAdmins[i].firstName} ${createdAdmins[i].lastName}`;

        //     if(dep.manager === manager){
        //       dep.manager = createdAdmins[i]._id;
        //     }
        //   }
        // })
        
        await Department.insertMany(departmentData).then(res => {
          console.log("department inserted" , res);
        });




    
    
    
    
    
    
    }catch(err){
            console.log(err);
        }
}




intializingBase();