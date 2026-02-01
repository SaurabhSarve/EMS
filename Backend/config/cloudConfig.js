
const cloudinary = require('cloudinary').v2;
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const dotenv = require("dotenv");
dotenv.config();

cloudinary.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key :process.env.CLOUD_API_KEY,
    api_secret : process.env.CLOUD_API_SECRET,
})


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
        folder: 'employees_Profiles',
        allowed_formats: ["png", "jpg", "jpeg"],
        transformation: [  
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ]
    }
});


module.exports = {
    cloudinary,
    storage
}