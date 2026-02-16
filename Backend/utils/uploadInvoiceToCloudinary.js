const fs = require("fs");
const supabase = require("../config/supebase.config");

const uploadInvoiceToSupabase = async (filePath, invoiceNo) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("Invoice PDF file not found");
    }

    const fileBuffer = fs.readFileSync(filePath);

    // ✅ REMOVE public/ folder
    const fileName = `${invoiceNo}.pdf`;

    const { data, error } = await supabase.storage
      .from("invoices")
      .upload(fileName, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("invoices")
      .getPublicUrl(fileName);

    fs.unlinkSync(filePath);

    return publicUrlData.publicUrl;

  } catch (error) {
    console.error("Supabase Invoice Upload Error:", error);
    throw error;
  }
};

module.exports = uploadInvoiceToSupabase;
