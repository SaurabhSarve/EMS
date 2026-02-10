const User = require("../models/user");
const jwt = require("jsonwebtoken");
const {status} = require('http-status');
const dotenv = require("dotenv");
const Department = require("../models/Department")

dotenv.config();


const ActivatePaymentMode = async(req,res) => {
    try{
const {secretKey} = req.body;
  if(!secretKey){
    return res.status(400).json({
    success : false,
    message : "Please provide secret key"
  })
  }

  if(secretKey === process.env.SECURE_PAYMENT_KEY){
     return res.status(200).json({
    success : true,
    message : "Activate payment mode"
  })
  }

  
    }catch(err){
 console.log("error activating payment mode" , err);
      res.status(500).json({
            success: false,
            message: 'error activating payment mode'
        });
    }
}

const UpdateBankDetails = async(req,res) => {
   try {
    const {editingEmployeeId , ...bankDetails} = req.body;
    console.log(req.body);
  const updatedUser = await User.findByIdAndUpdate(
    editingEmployeeId,
    bankDetails,
    { new: true }
  );
  if(!updatedUser){
return res.status(400).json({
    success: false,
    message: "error updating bank details"
  });
  }

  return res.status(200).json({
    success: true,
    message: "Updated bank details"
  });
  
} catch (err) {
  return res.status(400).json({
    success: false,
    message: err.message
  });
}
}



module.exports = {
    ActivatePaymentMode,
    UpdateBankDetails,
}