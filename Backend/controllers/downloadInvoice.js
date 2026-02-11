const https = require("https");
const mongoose = require("mongoose");
const Salary = require("../models/Salary");
const { cloudinary } = require("../config/cloudConfig");

const downloadInvoice = async (req, res) => {
  try {
    const { salaryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(salaryId)) {
      return res.status(400).json({ message: "Invalid salary ID" });
    }

    const salary = await Salary.findById(salaryId);
    if (!salary || !salary.invoice?.invoiceNo) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    console.log(salary.invoice.invoiceNo)

    // ✅ FORCE RAW PDF DELIVERY
    const signedUrl = cloudinary.utils.private_download_url(
      `invoices/${salary.invoice.invoiceNo}`,
      "pdf",
      {
        resource_type: "raw",
        type: "authenticated", // IMPORTANT
      }
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${salary.invoice.invoiceNo}.pdf"`
    );

    https.get(signedUrl, (cloudRes) => {
      // 🚨 SAFETY CHECK
      const contentType = cloudRes.headers["content-type"];

      if (!contentType || !contentType.includes("pdf")) {
        console.error("❌ Not a PDF:", contentType);
        return res.status(500).json({
          message: "Cloudinary did not return a PDF",
        });
      }

      cloudRes.pipe(res);
    }).on("error", (err) => {
      console.error("Stream error:", err.message);
      res.status(500).json({ message: "Failed to stream PDF" });
    });

  } catch (err) {
    console.error("Invoice error:", err.message);
    res.status(500).json({
      message: "Failed to download invoice",
      error: err.message,
    });
  }
};

module.exports = { downloadInvoice };
