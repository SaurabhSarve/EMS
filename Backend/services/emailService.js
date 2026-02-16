// emailService.js
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Email configuration
require('dotenv').config();

// Test karo values load ho rahi hain ya nahi
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***loaded***' : 'NOT LOADED');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateTransactionId = () => {
  return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
};




const sendOtp = async (userDetails) => {
  const { user, otp } = userDetails;
  console.log(user);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.personalEmail || user.email,
    subject: 'Password Reset OTP - Graphura HR',
    html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { 
                  font-family: 'Segoe UI', sans-serif; 
                  background-color: #f0f4f8;
                  margin: 0;
                  padding: 20px;
                }
                .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  background-color: white;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.1);
                }
                .header { 
                  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                  color: white; 
                  padding: 40px 30px;
                  text-align: center;
                }
                .logo {
                  font-size: 32px;
                  font-weight: bold;
                  margin-bottom: 10px;
                }
                .content { 
                  padding: 40px 30px;
                }
                .otp-box {
                  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                  border: 3px solid #2563eb;
                  border-radius: 12px;
                  padding: 30px;
                  text-align: center;
                  margin: 30px 0;
                }
                .otp {
                  font-size: 48px;
                  font-weight: bold;
                  color: #2563eb;
                  letter-spacing: 8px;
                  font-family: 'Courier New', monospace;
                }
                .warning {
                  background-color: #fef3c7;
                  border-left: 4px solid #f59e0b;
                  padding: 15px 20px;
                  border-radius: 6px;
                  margin: 25px 0;
                }
                .footer { 
                  background-color: #f8fafc;
                  text-align: center; 
                  padding: 30px;
                  border-top: 1px solid #e2e8f0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">GRAPHURA HR</div>
                  <p>Password Reset Request</p>
                </div>
                
                <div class="content">
                  <h2 style="color: #1e293b;">Hello ${user.firstName || user.name},</h2>
                  <p style="color: #475569;">We received a request to reset your password. Use the OTP below to proceed:</p>
                  
                  <div class="otp-box">
                    <p style="color: #1e40af; font-size: 14px; margin: 0 0 10px 0;">Your OTP Code</p>
                    <div class="otp">${otp}</div>
                  </div>
                  
                  <div class="warning">
                    <p style="color: #92400e; margin: 0;">⚠️ <strong>Important:</strong> This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
                  </div>
                  
                  <p style="color: #64748b; font-size: 14px;">For security reasons, never share this OTP with anyone.</p>
                </div>
                
                <div class="footer">
                  <p style="color: #64748b; font-size: 13px; margin: 5px 0;">© 2025 Graphura HR. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('otp  sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending Otp', error);
    throw error;
  }
}



const sendEmployeeRegistrationEmail = async (employeeData) => {
  const { email, employeeId, name } = employeeData;


  const passwordCreationLink = `${process.env.FRONTEND_URL}create-password?employeeId=${encodeURIComponent(employeeId)}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email.trim(),
    subject: 'Welcome to Graphura HR - Create Your Password',
    html: `
<!DOCTYPE html>
<html>
<head>
<style>
body{
  margin:0;
  padding:0;
  background:#eef2f7;
  font-family:Segoe UI, Arial, sans-serif;
}
.wrapper{
  width:100%;
  padding:40px 15px;
}
.container{
  max-width:600px;
  margin:auto;
  background:#ffffff;
  border-radius:18px;
  overflow:hidden;
  box-shadow:0 6px 18px rgba(0,0,0,0.12);
}
.header{
  background:#2563eb;
  color:#ffffff;
  padding:40px 20px;
  text-align:center;
}
.logo{
  font-size:30px;
  font-weight:700;
}
.subtitle{
  font-size:13px;
  opacity:0.9;
}
.content{
  padding:40px 30px;
}
h2{
  margin-top:0;
  color:#1e293b;
}
p{
  color:#475569;
  font-size:15px;
  line-height:1.8;
}
.card{
  background:#f8fafc;
  border-radius:14px;
  padding:22px;
  text-align:center;
  margin:25px 0;
  border:1px solid #e5e7eb;
}
.card-label{
  font-size:12px;
  letter-spacing:1px;
  color:#64748b;
}
.card-value{
  font-size:30px;
  font-weight:700;
  color:#2563eb;
  margin-top:8px;
}
.button-wrap{
  text-align:center;
  margin:35px 0;
}
.footer{
  background:#f8fafc;
  padding:25px;
  text-align:center;
  font-size:12px;
  color:#64748b;
}
.link-box{
  background:#f1f5f9;
  padding:14px;
  border-radius:10px;
  word-break:break-all;
  color:#2563eb;
  font-size:13px;
}
.warn{
  background:#fff7ed;
  border-left:4px solid #fb923c;
  padding:14px;
  border-radius:8px;
  font-size:13px;
  color:#9a3412;
  margin-top:20px;
}
</style>
</head>

<body>
<div class="wrapper">
  <div class="container">

    <!-- Header -->
    <div class="header">
      <div class="logo">GRAPHURA HR</div>
      <div class="subtitle">Human Resource Management System</div>
    </div>

    <!-- Content -->
    <div class="content">
      <h2>Hello ${name} 👋</h2>

      <p>
        Welcome to Graphura HR! Your employee account has been created successfully.
      </p>

      <!-- Employee Card -->
      <div class="card">
        <div class="card-label">EMPLOYEE ID</div>
        <div class="card-value">${employeeId}</div>
      </div>

      <p style="text-align:center;">
        Click the button below to create your password:
      </p>

      <!-- Button -->
      <div class="button-wrap">
        <table align="center" cellpadding="0" cellspacing="0">
          <tr>
            <td bgcolor="#2563eb" style="border-radius:10px;">
              <a href="${passwordCreationLink}"
                 style="
                   display:inline-block;
                   padding:16px 42px;
                   font-size:16px;
                   font-weight:600;
                   color:#ffffff;
                   text-decoration:none;
                   background:#2563eb;
                   border-radius:10px;
                   font-family:Segoe UI, Arial, sans-serif;">
                Create Your Password
              </a>
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;">Or copy and paste link:</p>
      <div class="link-box">${passwordCreationLink}</div>

      <div class="warn">
        This link will expire in 24 hours. If you did not request this email, please ignore it.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      © 2025 Graphura HR. All rights reserved.
    </div>

  </div>
</div>
</body>
</html>
`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Employee registration email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending registration email:', error);
    throw error;
  }
};



// Case 2: Salary Payment Email with PDF
const sendSalaryReceiptEmail = async (salaryData, pdfBuffer) => {
  const { email, employeeName, employeeId, amount, month, year } = salaryData;
  const transactionId = generateTransactionId();

  const mailOptions = {
    from: {
      name: 'Company Payroll',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: `Salary Credited - ${month} ${year}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .amount { font-size: 32px; font-weight: bold; color: #2196F3; margin: 20px 0; }
          .details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Salary Credited</h1>
          </div>
          <div class="content">
            <h2>Dear ${employeeName},</h2>
            <p>Your salary for <strong>${month} ${year}</strong> has been successfully credited to your account.</p>
            
            <div class="amount">₹${amount.toLocaleString('en-IN')}</div>
            
            <div class="details">
              <div class="detail-row">
                <span><strong>Employee ID:</strong></span>
                <span>${employeeId}</span>
              </div>
              <div class="detail-row">
                <span><strong>Transaction ID:</strong></span>
                <span>${transactionId}</span>
              </div>
              <div class="detail-row">
                <span><strong>Payment Month:</strong></span>
                <span>${month} ${year}</span>
              </div>
              <div class="detail-row">
                <span><strong>Date:</strong></span>
                <span>${new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            
            <p>Please find your detailed salary receipt attached as a PDF.</p>
            <p>Keep this receipt for your records.</p>
          </div>
          <div class="footer">
            <p>For any queries, please contact the payroll department.</p>
            <p>&copy; 2025 Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `Salary_Receipt_${employeeId}_${month}_${year}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Salary receipt email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      transactionId: transactionId
    };
  } catch (error) {
    console.error('Error sending salary receipt email:', error);
    throw error;
  }
};



// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmployeeRegistrationEmail,
  sendSalaryReceiptEmail,
  verifyEmailConfig,
  generateTransactionId,
  sendOtp
};