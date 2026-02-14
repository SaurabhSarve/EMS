const fs = require("fs");
const { cloudinary } = require("../config/cloudConfig");

const uploadInvoiceToCloudinary = async (filePath, invoiceNo) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("Invoice PDF file not found");
    }

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw",
      format:"pdf",
      folder: "invoices",
      public_id: invoiceNo,
      use_filename: true,
      unique_filename: false,
    });

    // Optional: delete local file
    fs.unlinkSync(filePath);

    return result.secure_url; // ✅ STORE THIS IN DB

  } catch (error) {
    console.error("Cloudinary Invoice Upload Error:", error);
    throw error;
  }
};

module.exports = uploadInvoiceToCloudinary;
