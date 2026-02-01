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
    pass: process.env.EMAIL_PASSWORD 
  }
});

const generateTransactionId = () => {
  return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
};




const sendOtp = async(userDetails) => {
const {user , otp} = userDetails; 
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
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f0f4f8;
            margin: 0;
            padding: 0;
          }
          .email-wrapper {
            background-color: #f0f4f8;
            padding: 40px 20px;
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
            letter-spacing: 1px;
          }
          .logo-subtitle {
            font-size: 14px;
            opacity: 0.9;
            font-weight: normal;
          }
          .content { 
            background-color: white;
            padding: 40px 30px;
          }
          .greeting {
            font-size: 24px;
            color: #1e293b;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .message {
            color: #475569;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .id-card {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border: 2px solid #2563eb;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
          }
          .id-label {
            font-size: 14px;
            color: #1e40af;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .employee-id { 
            font-size: 32px; 
            font-weight: bold; 
            color: #2563eb;
            letter-spacing: 2px;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .button { 
            display: inline-block; 
            padding: 16px 40px; 
            background: linear-gradient(135deg, #1b1c1f 0%, #4d556f 100%);
            color: white; 
            text-decoration: none; 
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
          }
          .link-section {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .link-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 10px;
          }
          .link-text {
            word-break: break-all; 
            color: #2563eb;
            font-size: 14px;
            font-family: 'Courier New', monospace;
          }
          .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 25px 0;
          }
          .warning-box p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
          }
          .footer { 
            background-color: #f8fafc;
            text-align: center; 
            padding: 30px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            margin: 5px 0;
            font-size: 13px;
            color: #64748b;
          }
          .footer-company {
            font-weight: 600;
            color: #2563eb;
            margin-top: 15px;
          }
          .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e2e8f0, transparent);
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">GRAPHURA HR</div>
              <div class="logo-subtitle">Human Resource Management System</div>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${name}! 👋</div>
              
              <p class="message">
                Congratulations and welcome to the team! We're excited to have you join us. 
                You have been successfully registered in our HR management system.
              </p>
              
              <div class="id-card">
                <div class="id-label">Your Employee ID</div>
                <div class="employee-id">${employeeId}</div>
              </div>
              
              <div class="divider"></div>
              
              <p class="message">
                To complete your registration and access your account, please create your password 
                by clicking the button below:
              </p>
              
              <div class="button-container">
                <a href="${passwordCreationLink}" class="button">Create Your Password</a>
              </div>
              
              <div class="link-section">
                <div class="link-label">Or copy and paste this link in your browser:</div>
                <div class="link-text">${passwordCreationLink}</div>
              </div>
              
              <div class="warning-box">
                <p>⚠️ <strong>Important:</strong> This activation link will expire in 24 hours for security reasons. 
                Please complete your registration as soon as possible.</p>
              </div>
            </div>
            
            <div class="footer">
              <p>If you did not expect this email or have any questions, please contact our HR department immediately.</p>
              <p class="footer-company">© 2025 Graphura HR. All rights reserved.</p>
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