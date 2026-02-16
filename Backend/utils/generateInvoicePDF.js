const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoicePDF = async (salary, invoiceNo) => {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDate = new Date();

      const dirPath = path.join(__dirname, "../invoices");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }

      const filePath = path.join(dirPath, `${invoiceNo}.pdf`);
      const doc = new PDFDocument({ margin: 50 });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc
        .fontSize(20)
        .text("GRAPHURA HR SOLUTIONS", { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .text("Salary Payment Invoice", { align: "center" })
        .moveDown(1);

      // Invoice Info
      doc
        .fontSize(10)
        .text(`Invoice No: ${invoiceNo}`)
        .text(`Invoice Date: ${invoiceDate.toDateString()}`)
        .moveDown(1);

      // Employee Details
      doc.fontSize(11).text("Employee Details", { underline: true }).moveDown(0.5);

      doc
        .fontSize(10)
        .text(`Name: ${salary.employee.firstName} ${salary.employee.lastName}`)
        .text(`Employee ID: ${salary.employeeId}`)
        .text(`Position: ${salary.employee.position}`)
        .moveDown(1);

      // Salary Breakdown
      doc.fontSize(11).text("Salary Breakdown", { underline: true }).moveDown(0.5);

      const startX = 50;
      const startY = doc.y;

      doc
        .fontSize(10)
        .text("Base Salary", startX, startY)
        .text(`₹ ${Number(salary.baseSalary).toLocaleString()}`, 400, startY, { align: "right" });

      doc
        .text("Allowances", startX, startY + 20)
        .text(`₹ ${Number(salary.allowances).toLocaleString()}`, 400, startY + 20, { align: "right" });

      doc
        .text(`Tax (${salary.taxApply}%)`, startX, startY + 40)
        .text(
          `₹ ${((salary.baseSalary * salary.taxApply) / 100).toFixed(2)}`,
          400,
          startY + 40,
          { align: "right" }
        );

      doc
        .text("Deductions", startX, startY + 60)
        .text(`₹ ${Number(salary.deductions).toLocaleString()}`, 400, startY + 60, {
          align: "right",
        });

      doc.moveDown(4);

      doc
        .fontSize(12)
        .text("Net Salary Paid", { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(14)
        .fillColor("green")
        .text(`₹ ${Number(salary.netSalary).toLocaleString()}`, { align: "right" })
        .fillColor("black")
        .moveDown(2);

      doc
        .fontSize(9)
        .text("This is a system-generated invoice. No signature required.", {
          align: "center",
        });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);

    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoicePDF;
