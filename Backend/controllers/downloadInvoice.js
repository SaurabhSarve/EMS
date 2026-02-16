const mongoose = require("mongoose");
const https = require("https");
const Salary = require("../models/Salary");
const supabase = require("../config/supebase.config");

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

    const filePath = `public/${salary.invoice.invoiceNo}.pdf`;

    // ✅ Generate Signed URL (valid for 60 seconds)
    const { data, error } = await supabase.storage
      .from("invoices")
      .createSignedUrl(filePath, 60);

    if (error) {
      console.error("Signed URL error:", error);
      return res.status(500).json({ message: "Failed to generate signed URL" });
    }

    const signedUrl = data.signedUrl;

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${salary.invoice.invoiceNo}.pdf"`
    );

    // Stream file from Supabase
    https.get(signedUrl, (supabaseRes) => {
      const contentType = supabaseRes.headers["content-type"];

      if (!contentType || !contentType.includes("pdf")) {
        console.error("❌ Not a PDF:", contentType);
        return res.status(500).json({
          message: "Supabase did not return a PDF",
        });
      }

      supabaseRes.pipe(res);
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
