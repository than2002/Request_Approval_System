# 📘 Request Approval System — Complete Developer Guide
**Project:** JBM Group T-Code Request Approval System  
**Stack:** MERN (MongoDB + Express + React + Node.js)  
**Last Updated:** April 2026

---

## 📌 Table of Contents
1. [What This Project Does](#1-what-this-project-does)
2. [How to Start the Project](#2-how-to-start-the-project)
3. [Folder Structure Explained](#3-folder-structure-explained)
4. [User Roles & What They Can Do](#4-user-roles--what-they-can-do)
5. [The Approval Workflow — Step by Step](#5-the-approval-workflow--step-by-step)
6. [All API Endpoints](#6-all-api-endpoints)
7. [Database Models Explained](#7-database-models-explained)
8. [Frontend Pages Explained](#8-frontend-pages-explained)
9. [How Authentication Works](#9-how-authentication-works)
10. [How Emails Work](#10-how-emails-work)
11. [Environment Variables (.env)](#11-environment-variables-env)
12. [Common Errors & Fixes](#12-common-errors--fixes)

---

## 1. What This Project Does

This system allows **JBM Group employees** to request access to **SAP T-Codes** (Transaction Codes).

### The Problem it Solves
Before this system, employees had to manually email managers to get T-Code access. There was no tracking, no workflow, and no history of approvals.

### The Solution
A web app where:
- **Employees** submit T-Code access requests online
- The request goes through **3 levels of manager approval** automatically
- Each manager gets an **email notification** with quick approve/reject links
- All approvals and rejections are **tracked with history**
- **Admins** can manage users and assign manager roles

---

## 2. How to Start the Project

You need **2 terminals** — one for backend, one for frontend.

### Terminal 1 — Backend
```bash
cd backend
npm run dev
```
Backend runs on: **http://localhost:5000**

### Terminal 2 — Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on: **http://localhost:5173** (Vite default)

### ⚠️ Important: .env File
The backend needs a `.env` file. Copy from `.env.example`:
```
PORT=5000
MONGO_URI=mongodb+srv://<your-connection-string>
JWT_SECRET=anyRandomLongSecretKey
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@jbmgroup.com
FRONTEND_URL=http://localhost:5173
```

---

## 3. Folder Structure Explained

```
Request_Approval_System/
│
├── backend/                        ← Node.js + Express API Server
│   ├── server.js                   ← Entry point: starts the server, connects MongoDB
│   ├── .env                        ← Secret config (DO NOT commit to git)
│   ├── .env.example                ← Template showing what .env needs
│   ├── package.json                ← Backend dependencies list
│   │
│   ├── scripts/                    ← Utility scripts (run manually when needed)
│   │   ├── create_admin.js         ← Creates admin user in database
│   │   ├── seed_test_users.js      ← Creates test users (manager, approver, etc.)
│   │   ├── check_db.js             ← Checks database connection
│   │   └── test_email.js           ← Tests if email sending works
│   │
│   └── src/
│       ├── models/                 ← MongoDB database schemas
│       │   ├── User.js             ← User data structure
│       │   ├── Request.js          ← T-Code request data structure
│       │   └── Approval.js         ← Approval history tracking
│       │
│       ├── controllers/            ← Business logic (what happens when API is called)
│       │   ├── authController.js   ← Login, Register, Profile
│       │   ├── requestController.js← Create, View, Submit, Delete requests
│       │   └── approvalController.js← Approve, Reject, Dashboard
│       │
│       ├── routes/                 ← URL routing (maps URL to controller)
│       │   ├── auth.js             ← /api/auth/* routes
│       │   ├── requests.js         ← /api/requests/* routes
│       │   └── approvals.js        ← /api/approvals/* routes
│       │
│       ├── middleware/
│       │   └── authmiddleware.js   ← Checks JWT token on protected routes
│       │
│       └── utils/
│           └── emailService.js     ← Sends emails via Nodemailer
│
└── frontend/                       ← React.js Web Application
    ├── vite.config.js              ← Vite build config
    ├── package.json                ← Frontend dependencies
    │
    └── src/
        ├── main.jsx                ← Entry point: renders React app
        ├── App.js                  ← Router: defines all page URLs
        ├── index.css               ← Global styles (dark theme, glass cards)
        │
        ├── api/
        │   └── axios.js            ← Axios config: base URL + auto-attach JWT token
        │
        ├── context/
        │   └── AuthContext.js      ← Global auth state (user, login, logout)
        │
        ├── components/
        │   ├── ProtectedRoute.js   ← Redirects to login if not authenticated
        │   └── RequestDetailsModal.js ← Popup showing request details
        │
        └── pages/
            ├── Login.js            ← Login form
            ├── Register.js         ← Registration form
            ├── Dashboard.js        ← Home after login (stats, recent requests)
            ├── Requests.js         ← User's list of all their requests
            ├── CreateRequest.js    ← Form to create a new T-Code request
            ├── Approvals.js        ← Manager's pending approvals list
            └── AdminPanel.js       ← Admin: manage users, create managers
```

---

## 4. User Roles & What They Can Do

There are **5 roles** in the system:

| Role | Who They Are | What They Can Do |
|------|-------------|-----------------|
| `user` | Regular JBM employee | Create requests, track status |
| `manager` | Line Manager | Approve/Reject at **Level 1** |
| `senior-manager` | Senior Manager | Approve/Reject at **Level 2** |
| `approver` | Final Approver (Director) | Approve/Reject at **Level 3** |
| `admin` | System Administrator | Manage all users, see everything |

### How Roles Are Assigned
- **New registrations** → always get `user` role (cannot change this yourself)
- **Managers/Admins** → must be created by an existing Admin through the Admin Panel
  - Go to: `/admin/users` → Click "Create Manager"
  - Choose role: `manager`, `senior-manager`, `approver`, or `admin`

---

## 5. The Approval Workflow — Step by Step

```
STEP 1: User creates a T-Code Request (status: "draft")
         ↓
STEP 2: User clicks "Submit" (status: "level1_pending")
         → Email sent to Manager (Level 1)
         ↓
STEP 3: Manager (Level 1) approves
         → Status becomes "level2_pending"
         → Email sent to Senior Manager (Level 2)
         ↓
STEP 4: Senior Manager (Level 2) approves
         → Status becomes "level3_pending"
         → Email sent to Final Approver (Level 3)
         ↓
STEP 5: Final Approver (Level 3) approves
         → Status becomes "approved" ✅
         → Email sent to original user (approved!)

❌ If REJECTED at any level:
         → Status becomes "rejected"
         → Email sent to original user (rejected with reason)
         → Process STOPS — does not continue to next level
```

### Status Values in the Database
| Status | Meaning |
|--------|---------|
| `draft` | Created but not submitted yet |
| `level1_pending` | Waiting for Manager (Level 1) |
| `level2_pending` | Waiting for Senior Manager (Level 2) |
| `level3_pending` | Waiting for Final Approver (Level 3) |
| `approved` | Fully approved by all 3 levels  |
| `rejected` | Rejected at some level  |

---

## 6. All API Endpoints

###  Auth Routes — `/api/auth`

| Method | URL | Who Can Access | What It Does |
|--------|-----|----------------|--------------|
| `POST` | `/api/auth/register` | Anyone | Register new user (only @jbmgroup.com emails) |
| `POST` | `/api/auth/login` | Anyone | Login, returns JWT token |
| `POST` | `/api/auth/logout` | Logged-in users | Logout |
| `GET` | `/api/auth/profile` | Logged-in users | Get your own profile |
| `PUT` | `/api/auth/profile` | Logged-in users | Update your profile |
| `POST` | `/api/auth/create-manager` | Admin only | Create manager/approver/admin user |
| `GET` | `/api/auth/users` | Admin only | List all users |
| `DELETE` | `/api/auth/users/:id` | Admin only | Delete a user |

###  Request Routes — `/api/requests`
>  All request routes require login (JWT token)

| Method | URL | What It Does |
|--------|-----|--------------|
| `POST` | `/api/requests` | Create a new T-Code request |
| `GET` | `/api/requests` | Get all YOUR requests |
| `GET` | `/api/requests/:id` | Get single request details |
| `PUT` | `/api/requests/:id` | Edit a request (only if status = draft) |
| `PATCH` | `/api/requests/:id/submit` | Submit draft request for approval |
| `DELETE` | `/api/requests/:id` | Delete a request (only if status = draft) |

###  Approval Routes — `/api/approvals`
>  Approval routes require manager/approver/admin role

| Method | URL | What It Does |
|--------|-----|--------------|
| `GET` | `/api/approvals/pending` | Get requests pending YOUR approval |
| `GET` | `/api/approvals` | Get all approvals (history) |
| `GET` | `/api/approvals/history/:requestId` | Get approval history for one request |
| `POST` | `/api/approvals/:requestId/level/:level/approve` | Approve a request at your level |
| `POST` | `/api/approvals/:requestId/level/:level/reject` | Reject a request at your level |
| `GET` | `/api/approvals/dashboard/stats` | Dashboard stats (pending, approved, rejected counts) |
| `GET` | `/api/approvals/quick-action/:token` | Email quick-action link (no login needed) |

### 🏥 Health Check
| Method | URL | What It Does |
|--------|-----|--------------|
| `GET` | `/api/health` | Check if backend is running |

---

## 7. Database Models Explained

### User Model (`User.js`)
```
Fields:
  name          → Full name (e.g., "Arun Kumar")
  email         → Must be @jbmgroup.com, unique
  password      → Stored as bcrypt hash (never plain text)
  role          → 'user' | 'manager' | 'senior-manager' | 'approver' | 'admin'
  approvalLevel → 1 (manager), 2 (senior-manager), 3 (approver), null (user/admin)
  department    → e.g., "IT", "Finance"
  isActive      → true/false (soft delete)
  createdAt     → Auto timestamp
```
> Password is **automatically hashed** before saving using a pre-save hook.

---

### Request Model (`Request.js`)
```
Fields:
  title                 → Short title of the request
  description           → Detailed description
  requestType           → 'tcode' (SAP T-Code request)
  tcodeName             → The T-Code name (e.g., "VA01")
  tcodeDescription      → What this T-Code does
  businessJustification → Why the user needs this T-Code
  priority              → 'low' | 'medium' | 'high'
  requestedBy           → Link to User who created it
  dueDate               → When access is needed by

  approvalWorkflow:
    level1:
      manager   → Link to User (Manager)
      status    → 'pending' | 'approved' | 'rejected'
      approvedAt→ Date when action was taken
      comments  → Manager's comment
    level2: (same structure)
    level3: (same structure)

  overallStatus → 'draft' | 'level1_pending' | 'level2_pending' | 'level3_pending' | 'approved' | 'rejected'
  rejectionReason → Reason if rejected
  createdAt / updatedAt → Auto timestamps
```

---

### Approval Model (`Approval.js`)
This is the **audit trail** — every approve/reject action is saved here.
```
Fields:
  request       → Link to the Request
  approvalLevel → 1, 2, or 3
  approver      → Link to User who took action
  status        → 'approved' | 'rejected'
  comments      → Comment given
  actionTakenAt → When they approved/rejected
```

---

## 8. Frontend Pages Explained

### `/` → `Login.js`
- Email must end with `@jbmgroup.com`
- Calls `POST /api/auth/login`
- Stores JWT token and user info in `localStorage`
- Redirects to `/dashboard` on success

### `/register` → `Register.js`
- Register new user account
- Email restricted to `@jbmgroup.com`
- Role is always `user` (cannot choose manager role here)
- Calls `POST /api/auth/register`

### `/dashboard` → `Dashboard.js` 
- Shows stats: total requests, pending, approved, rejected
- Shows recent requests list
- Different view for users vs managers (managers see pending approvals)

### `/requests` → `Requests.js`
- Lists all your submitted requests with status badges
- Can click a request to see full details (modal popup)

### `/create-request` → `CreateRequest.js`
- Form to create a new T-Code request
- Fields: Title, T-Code Name, T-Code Description, Business Justification, Priority, Due Date
- Created as `draft` status first
- Separate button to "Submit for Approval" (sends to managers)

### `/approvals` → `Approvals.js`
- Visible to: `manager`, `senior-manager`, `approver`, `admin`
- Shows requests pending YOUR approval level
- Approve or Reject buttons with comment field

### `/admin/users` → `AdminPanel.js`
- Visible to: `admin` only
- List all users in the system
- Create new managers/approvers/admins
- Delete users

---

## 9. How Authentication Works

### Login Process
```
1. User enters email + password → Frontend sends to POST /api/auth/login
2. Backend checks: does email exist? is password correct?
3. If yes → generates a JWT token (expires in 8 hours)
4. Token is stored in localStorage on the browser
5. Every future API call sends this token in the header:
   Authorization: Bearer <token>
6. The authmiddleware.js extracts and verifies the token
7. If valid → attaches user info (id, email, role) to req.user
```

### Where Token Is Attached
In `frontend/src/api/axios.js`:
```javascript
// Automatically adds token to EVERY request
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Protected Routes (Frontend)
The `ProtectedRoute.js` component checks if user is logged in.
If no user in localStorage → redirects to `/` (Login page).

---

## 10. How Emails Work

Emails are sent using **Nodemailer** (`backend/src/utils/emailService.js`).

### When Emails Are Sent

| Event | Who Gets Email |
|-------|---------------|
| Request submitted | Level 1 Manager |
| Level 1 approved | Level 2 Manager |
| Level 2 approved | Level 3 Manager (Approver) |
| Level 3 approved | Original requester (REQUEST APPROVED!) |
| Rejected at any level | Original requester (REQUEST REJECTED) |

### Email Quick Action Links
Each approval email contains **two clickable buttons**:
-  **Approve** — Manager clicks, it approves without logging in
-  **Reject** — Manager clicks, it rejects without logging in

These links work via `/api/approvals/quick-action/:token`  
The token is a **JWT** that contains: requestId, action, level (valid for limited time).

### Email Setup (Gmail)
In your `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  ← Gmail "App Password" (not your real password)
```
> To get App Password: Gmail → Settings → Security → 2FA → App Passwords

---

## 11. Environment Variables (.env)

The backend `.env` file (located at `backend/.env`):

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=make-this-a-long-random-string-like-abc123xyz456

# CORS (Frontend URL)
CORS_ORIGIN=http://localhost:5173

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yourapp@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=noreply@jbmgroup.com

# App URL (used in email links)
FRONTEND_URL=http://localhost:5173
```

>  **Never share or commit `.env` to GitHub** — it contains secrets!

---

## 12. Common Errors & Fixes

###  "MongoDB Error" on startup
**Cause:** MONGO_URI is wrong or MongoDB is down  
**Fix:** Check your `.env` MONGO_URI — make sure the connection string is correct

###  "Authorization token missing" (401 error)
**Cause:** User is not logged in or token expired  
**Fix:** Log in again — tokens expire in 8 hours

### "Access denied. Insufficient permissions" (403 error)
**Cause:** User doesn't have right role (e.g., regular user trying to approve)  
**Fix:** Use an account with `manager`, `senior-manager`, `approver`, or `admin` role

###  "All approval managers must be configured"
**Cause:** No manager, senior-manager, or approver exists in the database  
**Fix:** Go to Admin Panel → Create users with the required roles, OR run:
```bash
node scripts/seed_test_users.js
```

###  Frontend shows blank page
**Cause:** Backend is not running  
**Fix:** Start backend with `npm run dev` in the `backend` folder

### "Only @jbmgroup.com email addresses are authorized"
**Cause:** Trying to register with a non-company email  
**Fix:** Use a `@jbmgroup.com` email address

###  Email not sending
**Cause:** Gmail App Password not set up, or wrong credentials  
**Fix:** 
1. Enable 2FA on Gmail
2. Generate App Password in Gmail Settings
3. Put the App Password in .env EMAIL_PASS

---

##  Quick Reference — Important Files

| File | What to Change If... |
|------|---------------------|
| `backend/.env` | Database URL, JWT secret, email settings |
| `backend/server.js` | Add new route groups |
| `backend/src/models/User.js` | Add new user fields |
| `backend/src/models/Request.js` | Add new request fields |
| `backend/src/controllers/authController.js` | Change login/register logic |
| `backend/src/controllers/requestController.js` | Change request create/submit logic |
| `backend/src/controllers/approvalController.js` | Change approve/reject logic |
| `frontend/src/App.js` | Add new pages/routes |
| `frontend/src/context/AuthContext.js` | Change global auth state |
| `frontend/src/api/axios.js` | Change API base URL |
| `frontend/src/index.css` | Change global style/theme |

---

*This document was generated on April 8, 2026 — covers the full current state of the project after code cleanup and security fixes.*
