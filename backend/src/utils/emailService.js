const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
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
  }
  return null;
};

const transporter = createTransporter();

const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    // Mock email functionality for local development when credentials are not available
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

const generateActionToken = (requestId, managerId, action, level) => {
  return jwt.sign(
    { requestId, managerId, action, level },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '7d' }
  );
};

const sendNewRequestEmail = async (manager, request) => {
  const approveToken = generateActionToken(request._id.toString(), manager._id.toString(), 'approve', request.approvalWorkflow.level1 ? 1 : null);
  const rejectToken = generateActionToken(request._id.toString(), manager._id.toString(), 'reject', request.approvalWorkflow.level1 ? 1 : null);

  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5001';
  const approveUrl = `${baseUrl}/api/approvals/quick-action/${approveToken}`;
  const rejectUrl = `${baseUrl}/api/approvals/quick-action/${rejectToken}`;

  const subject = `New Request Pending Approval: ${request.title}`;
  const html = `
    <h2>A new request requires your attention</h2>
    <p><strong>Title:</strong> ${request.title}</p>
    <p><strong>Type:</strong> ${request.requestType}</p>
   /* <p><strong>Priority:</strong> ${request.priority}</p> */
    <br/>
    <a href="${approveUrl}" style="padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-right: 15px;">Approve Request</a>
    <a href="${rejectUrl}" style="padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reject Request</a>
    <br/><br/>
    <p>Or log in to the Request Approval System to review in detail.</p>
  `;
  await sendEmail(manager.email, subject, html);
};

const sendApprovalEmail = async (nextManager, request, level) => {
  const approveToken = generateActionToken(request._id.toString(), nextManager._id.toString(), 'approve', level);
  const rejectToken = generateActionToken(request._id.toString(), nextManager._id.toString(), 'reject', level);

  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5001';
  const approveUrl = `${baseUrl}/api/approvals/quick-action/${approveToken}`;
  const rejectUrl = `${baseUrl}/api/approvals/quick-action/${rejectToken}`;

  const subject = `Request Approved & Elevated: ${request.title}`;
  const html = `
    <h2>A request has been approved and moved to your queue</h2>
    <p><strong>Title:</strong> ${request.title}</p>
    <p><strong>Previous Status:</strong> Approved by previous tier</p>
    <br/>
    <a href="${approveUrl}" style="padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-right: 15px;">Approve Request</a>
    <a href="${rejectUrl}" style="padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reject Request</a>
    <br/><br/>
    <p>Or log in to the Request Approval System to process this elevated request.</p>
  `;
  await sendEmail(nextManager.email, subject, html);
};

const sendRejectionEmail = async (requesterEmail, request) => {
  const subject = `Request Rejected: ${request.title}`;
  const html = `
    <h2>Your request has been rejected</h2>
    <p><strong>Title:</strong> ${request.title}</p>
    <p><strong>Reason:</strong> ${request.rejectionReason || 'No reason provided'}</p>
    <p>Please log in to the Request Approval System for more details.</p>
  `;
  await sendEmail(requesterEmail, subject, html);
};

const sendFinalApprovalEmail = async (requesterEmail, request) => {
  const subject = `Request Fully Approved: ${request.title}`;
  const html = `
    <h2>Congratulations, your request has been fully approved</h2>
    <p><strong>Title:</strong> ${request.title}</p>
    <p>This request has passed all levels of the approval workflow.</p>
  `;
  await sendEmail(requesterEmail, subject, html);
};

module.exports = {
  sendNewRequestEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendFinalApprovalEmail,
};
