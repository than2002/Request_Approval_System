const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

console.log('--- SMTP Debugger ---');
console.log(`User: ${process.env.EMAIL_USER}`);
console.log(`Pass: ${process.env.EMAIL_PASS ? '******** (Length: ' + process.env.EMAIL_PASS.length + ')' : 'MISSING'}\n`);

transporter.verify((error, success) => {
  if (error) {
    console.error('X Verification Failed!');
    console.error(error);

    if (error.responseCode === 535) {
      console.log('\n--- DIAGNOSIS: 535 AUTHENTICATION FAILED ---');
      console.log('1. Check if EMAIL_PASS in .env is correct.');
      console.log('2. If you have MFA (OTP code on phone), you MUST use an "App Password".');
      console.log('3. Ask IT if "SMTP AUTH" is enabled for your specific account.');
    }
  } else {
    console.log('✓ Server is ready to take our messages!');

    // Attempt a real send
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'SMTP Test - Approval System',
      text: 'If you see this, your Outlook integration is working!'
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('X Send Failed!');
        console.error(error);
      } else {
        console.log('✓ Test email sent successfully: ' + info.response);
      }
    });
  }
});
