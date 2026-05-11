const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * SMART EMAIL SERVICE
 * - If EMAIL_PASS is set in .env  → uses real Office365 (production)
 * - If EMAIL_PASS is NOT set      → uses Ethereal free test email (testing)
 * Code never needs to change — only .env file changes!
 */

let transporter = null;
let isTestMode = false;

const initTransporter = async () => {
  if (transporter) return transporter;

  // PRODUCTION MODE — real credentials provided in .env
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false }
    });
    console.log(' [EMAIL] Mode: Office365 (Production)');
    return transporter;
  }

  // TESTING MODE — no credentials, auto-create free Ethereal account
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isTestMode = true;
    console.log(' [EMAIL] Mode: Ethereal Test (No password needed)');
    console.log('[EMAIL] View sent emails at: https://ethereal.email/messages');
    return transporter;
  } catch (err) {
    console.error(' [EMAIL] Could not setup email:', err.message);
    return null;
  }
};

const sendEmail = async (to, subject, html) => {
  try {
    const t = await initTransporter();

    if (!t) {
      console.log(` [EMAIL MOCK] To: ${to} | Subject: ${subject}`);
      return;
    }

    const info = await t.sendMail({
      from: process.env.EMAIL_USER || '"JBM Request System" <noreply@jbmgroup.com>',
      to,
      subject,
      html,
    });

    console.log(`[EMAIL] Sent → ${to}`);

    // In test mode, print the preview link so you can view the email in browser
    if (isTestMode) {
      console.log(`[EMAIL] Preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

  } catch (error) {
    console.error(`[EMAIL] Failed to send to ${to}:`, error.message);
  }
};

const generateActionToken = (requestId, managerId, action, level) => {
  return jwt.sign(
    { requestId, managerId, action, level },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ─── Email: New Request → L1 Manager ────────────────────────────────────────
const sendNewRequestEmail = async (manager, request) => {
  const level = 1;
  const approveToken = generateActionToken(request._id.toString(), manager._id.toString(), 'approve', level);
  const rejectToken = generateActionToken(request._id.toString(), manager._id.toString(), 'reject', level);

  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5001';
  const approveUrl = `${baseUrl}/api/approvals/quick-action/${approveToken}`;
  const rejectUrl = `${baseUrl}/api/approvals/quick-action/${rejectToken}`;

  const subject = `[Action Required] New T-Code Request: ${request.title}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#1e293b;padding:20px;text-align:center;">
        <h2 style="color:white;margin:0;">JBM Group — Request Approval</h2>
      </div>
      <div style="padding:30px;">
        <h3>Hello ${manager.name},</h3>
        <p>A new T-Code access request needs your approval <strong>(Level 1)</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;width:40%;">Title</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${request.title}</td>
          </tr>
          <tr>
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">T-Code</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${request.tcodeName || 'N/A'}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">Priority</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${request.priority || 'Medium'}</td>
          </tr>
          <tr>
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">Justification</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${request.businessJustification || 'N/A'}</td>
          </tr>
        </table>
        <p style="text-align:center;margin:30px 0;">
          <a href="${approveUrl}" style="padding:14px 28px;background:#16a34a;color:white;text-decoration:none;border-radius:6px;margin-right:15px;font-weight:bold;">✅ Approve</a>
          <a href="${rejectUrl}"  style="padding:14px 28px;background:#dc2626;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">❌ Reject</a>
        </p>
        <p style="color:#64748b;font-size:13px;text-align:center;">You can also log in to the portal to review in detail.</p>
      </div>
      <div style="background:#f1f5f9;padding:12px;text-align:center;color:#94a3b8;font-size:12px;">JBM Group Internal System</div>
    </div>
  `;
  await sendEmail(manager.email, subject, html);
};

// ─── Email: Elevated to Next Level Manager ───────────────────────────────────
const sendApprovalEmail = async (nextManager, request, level) => {
  const approveToken = generateActionToken(request._id.toString(), nextManager._id.toString(), 'approve', level);
  const rejectToken = generateActionToken(request._id.toString(), nextManager._id.toString(), 'reject', level);

  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5001';
  const approveUrl = `${baseUrl}/api/approvals/quick-action/${approveToken}`;
  const rejectUrl = `${baseUrl}/api/approvals/quick-action/${rejectToken}`;
  const levelLabel = level === 2 ? 'Level 2 — Senior Manager' : 'Level 3 — Final Approver';

  const subject = `[Action Required] Request Elevated to You: ${request.title}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#1e293b;padding:20px;text-align:center;">
        <h2 style="color:white;margin:0;">JBM Group — Request Approval</h2>
      </div>
      <div style="padding:30px;">
        <h3>Hello ${nextManager.name},</h3>
        <p>A request has been approved at the previous level and now requires your action: <strong>${levelLabel}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;width:40%;">Title</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${request.title}</td>
          </tr>
          <tr>
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">T-Code</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${request.tcodeName || 'N/A'}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">Your Level</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${levelLabel}</td>
          </tr>
        </table>
        <p style="text-align:center;margin:30px 0;">
          <a href="${approveUrl}" style="padding:14px 28px;background:#16a34a;color:white;text-decoration:none;border-radius:6px;margin-right:15px;font-weight:bold;">✅ Approve</a>
          <a href="${rejectUrl}"  style="padding:14px 28px;background:#dc2626;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">❌ Reject</a>
        </p>
      </div>
      <div style="background:#f1f5f9;padding:12px;text-align:center;color:#94a3b8;font-size:12px;">JBM Group Internal System</div>
    </div>
  `;
  await sendEmail(nextManager.email, subject, html);
};

// ─── Email: Rejected → Original User ────────────────────────────────────────
const sendRejectionEmail = async (requesterEmail, request) => {
  const subject = `[Update] Request Rejected: ${request.title}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#dc2626;padding:20px;text-align:center;">
        <h2 style="color:white;margin:0;">Request Rejected</h2>
      </div>
      <div style="padding:30px;">
        <p>Your T-Code request has been <strong>rejected</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">Title</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${request.title}</td>
          </tr>
          <tr>
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">Reason</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${request.rejectionReason || 'No reason provided'}</td>
          </tr>
        </table>
        <p style="color:#64748b;font-size:13px;">Log in to the portal for more details.</p>
      </div>
      <div style="background:#f1f5f9;padding:12px;text-align:center;color:#94a3b8;font-size:12px;">JBM Group Internal System</div>
    </div>
  `;
  await sendEmail(requesterEmail, subject, html);
};

// ─── Email: Final Approval → Original User ───────────────────────────────────
const sendFinalApprovalEmail = async (requesterEmail, request) => {
  const subject = `[Approved] Your Request is Fully Approved: ${request.title}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#16a34a;padding:20px;text-align:center;">
        <h2 style="color:white;margin:0;">🎉 Request Fully Approved!</h2>
      </div>
      <div style="padding:30px;">
        <p>Your T-Code request has been <strong>approved by all 3 levels</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">Title</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${request.title}</td>
          </tr>
          <tr>
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">T-Code</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${request.tcodeName || 'N/A'}</td>
          </tr>
          <tr style="background:#f0fdf4;">
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">Status</td>
            <td style="padding:10px;border:1px solid #e2e8f0;color:#16a34a;font-weight:bold;">✅ APPROVED</td>
          </tr>
        </table>
      </div>
      <div style="background:#f1f5f9;padding:12px;text-align:center;color:#94a3b8;font-size:12px;">JBM Group Internal System</div>
    </div>
  `;
  await sendEmail(requesterEmail, subject, html);
};

// ─── Email: Forgot Password → User ──────────────────────────────────────────
const sendForgotPasswordEmail = async (user, resetToken) => {
  const baseUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

  const subject = `Password Reset Request - JBM Request System`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#1e293b;padding:20px;text-align:center;">
        <h2 style="color:white;margin:0;">JBM Group — Password Reset</h2>
      </div>
      <div style="padding:30px;">
        <h3>Hello ${user.name},</h3>
        <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the following button to complete the process:</p>
        <p style="text-align:center;margin:30px 0;">
          <a href="${resetUrl}" style="padding:14px 28px;background:#3b82f6;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      </div>
      <div style="background:#f1f5f9;padding:12px;text-align:center;color:#94a3b8;font-size:12px;">JBM Group Internal System</div>
    </div>
  `;
  await sendEmail(user.email, subject, html);
};

// ─── Email: New User Registered → Admin ──────────────────────────────────────
const sendAdminNewUserEmail = async (adminEmail, newUser) => {
  const subject = `[New User] Registration Pending Review: ${newUser.name}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#1e293b;padding:20px;text-align:center;">
        <h2 style="color:white;margin:0;">New User Registration</h2>
      </div>
      <div style="padding:30px;">
        <p>A new user has registered and is pending your approval.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">Name</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${newUser.name}</td>
          </tr>
          <tr>
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">Email</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${newUser.email}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">Employee Code</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${newUser.employeeCode}</td>
          </tr>
        </table>
        <p style="text-align:center;margin:30px 0;">
          <a href="${process.env.CORS_ORIGIN || 'http://localhost:3000'}/admin/users" style="padding:14px 28px;background:#1d4ed8;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Review User</a>
        </p>
      </div>
      <div style="background:#f1f5f9;padding:12px;text-align:center;color:#94a3b8;font-size:12px;">JBM Group Internal System</div>
    </div>
  `;
  await sendEmail(adminEmail, subject, html);
};

// ─── Email: Account Approved → User ──────────────────────────────────────────
const sendAccountApprovedEmail = async (user) => {
  const subject = `Welcome to JBM Request System — Account Approved`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#16a34a;padding:20px;text-align:center;">
        <h2 style="color:white;margin:0;">Account Approved!</h2>
      </div>
      <div style="padding:30px;">
        <h3>Hello ${user.name},</h3>
        <p>Your corporate account for the <strong>JBM Request Approval System</strong> has been approved by the administrator.</p>
        <p>You can now log in and start creating T-Code requests.</p>
        <p style="text-align:center;margin:30px 0;">
          <a href="${process.env.CORS_ORIGIN || 'http://localhost:3000'}" style="padding:14px 28px;background:#16a34a;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Log In Now</a>
        </p>
      </div>
      <div style="background:#f1f5f9;padding:12px;text-align:center;color:#94a3b8;font-size:12px;">JBM Group Internal System</div>
    </div>
  `;
  await sendEmail(user.email, subject, html);
};

module.exports = {
  sendNewRequestEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendFinalApprovalEmail,
  sendForgotPasswordEmail,
  sendAdminNewUserEmail,
  sendAccountApprovedEmail
};
