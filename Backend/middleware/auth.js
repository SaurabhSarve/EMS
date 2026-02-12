const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { default: status } = require("http-status");



const protect = async (req , res , next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token){
        return res.status(401).json({
            success : false,
            message : 'not authorized to access this route'
        })
    }

    try {
        const decoded = jwt.verify(token , process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.userId).select('-password');

        if(!user){
            return res.status(status.NOT_FOUND).json({
                success : false ,
                message : "user not found"
            })
        }

        if(!user.isActive){
            return res.status(403).json({
                success :  false,
                message : "Account is deactivated"
            });
        }

        req.user = user;
        next();
    }catch(err){
    return res.status(401).json({
        success : false,
        message : "Invalid token or Expire token",
        info : err.name
    })
    }
}

module.exports = {
protect
}
