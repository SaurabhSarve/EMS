// services/pdfService.js
const PDFDocument = require('pdfkit');

const generateSalaryPDF = (salaryDetails) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('SALARY RECEIPT', { align: 'center' })
         .moveDown();

      // Company details
      doc.fontSize(10)
         .font('Helvetica')
         .text('Your Company Name', { align: 'center' })
         .text('Address Line 1, City, State - PIN', { align: 'center' })
         .moveDown(2);

      // Draw line
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();

      // Employee details
      doc.fontSize(12).font('Helvetica-Bold').text('EMPLOYEE DETAILS', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      const leftColumn = 100;
      const rightColumn = 300;
      let yPos = doc.y;

      doc.text('Employee ID:', 50, yPos);
      doc.text(salaryDetails.employeeId, leftColumn, yPos);
      doc.text('Employee Name:', rightColumn, yPos);
      doc.text(salaryDetails.employeeName, rightColumn + 100, yPos);

      yPos += 20;
      doc.text('Position:', 50, yPos);
      doc.text(salaryDetails.position, leftColumn, yPos);
      doc.text('Department:', rightColumn, yPos);
      doc.text(salaryDetails.department, rightColumn + 100, yPos);

      yPos += 20;
      doc.text('Payment Month:', 50, yPos);
      doc.text(`${salaryDetails.month} ${salaryDetails.year}`, leftColumn, yPos);
      doc.text('Payment Date:', rightColumn, yPos);
      doc.text(salaryDetails.paymentDate, rightColumn + 100, yPos);

      doc.moveDown(2);

      // Draw line
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();

      // Salary breakdown
      doc.fontSize(12).font('Helvetica-Bold').text('SALARY BREAKDOWN', { underline: true });
      doc.moveDown(0.5);

      // Table header
      yPos = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, yPos);
      doc.text('Amount (₹)', 450, yPos, { align: 'right', width: 100 });
      
      yPos += 20;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 10;

      // Table rows
      doc.font('Helvetica');
      const items = [
        { label: 'Basic Salary', amount: salaryDetails.basicSalary },
        { label: 'HRA', amount: salaryDetails.hra },
        { label: 'Other Allowances', amount: salaryDetails.allowances },
      ];

      items.forEach(item => {
        doc.text(item.label, 50, yPos);
        doc.text(item.amount.toFixed(2), 450, yPos, { align: 'right', width: 100 });
        yPos += 20;
      });

      // Gross salary
      yPos += 5;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 10;
      
      const grossSalary = salaryDetails.basicSalary + salaryDetails.hra + salaryDetails.allowances;
      doc.font('Helvetica-Bold');
      doc.text('Gross Salary', 50, yPos);
      doc.text(grossSalary.toFixed(2), 450, yPos, { align: 'right', width: 100 });
      yPos += 25;

      // Deductions
      doc.font('Helvetica');
      doc.text('Deductions', 50, yPos);
      doc.text(salaryDetails.deductions.toFixed(2), 450, yPos, { align: 'right', width: 100 });
      yPos += 20;

      // Net salary
      yPos += 5;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 10;
      
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('NET SALARY', 50, yPos);
      doc.text(salaryDetails.netSalary.toFixed(2), 450, yPos, { align: 'right', width: 100 });
      
      yPos += 5;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();

      doc.moveDown(3);

      // Footer
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .text('This is a computer-generated document and does not require a signature.', 
               { align: 'center' })
         .moveDown()
         .text('For any queries, please contact HR department.', 
               { align: 'center' });

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateSalaryPDF };