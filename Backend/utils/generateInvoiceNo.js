const Salary = require("../models/Salary")

const generateInvoiceNo = async () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");

  const count = await Salary.countDocuments({
    "invoice.invoiceNo": { $exists: true }
  });

  const sequence = String(count + 1).padStart(4, "0");

  return `INV-${year}${month}-${sequence}`;
};

module.exports = generateInvoiceNo;
