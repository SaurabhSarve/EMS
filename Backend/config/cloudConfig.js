
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


const taskAttachmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
        folder: 'task_attachments',
        allowed_formats: ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg", "txt"],
        resource_type: 'auto'
    }
});

const leaveDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
        folder: 'leave_documents',
        allowed_formats: ["pdf", "doc", "docx", "png", "jpg", "jpeg"],
        resource_type: 'auto'
    }
});

module.exports = {
    cloudinary,
    storage,
    taskAttachmentStorage,
    leaveDocumentStorage
}