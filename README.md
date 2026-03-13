# Request Approval System

A full-stack web application built with the **MERN Stack** (MongoDB, Express, React, Node.js) for managing and approving **T-Code Access Requests** with a **3-level sequential manager approval workflow**.

## Tech Stack

- **Frontend**: React.js, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Other**: bcryptjs (password hashing), CORS

## Project Structure

```
Request_Approval_System/
├── backend/
│   ├── models/
│   │   ├── User.js              (User with manager roles and approval levels)
│   │   ├── Request.js           (T-Code request with 3-level approval workflow)
│   │   └── Approval.js          (Approval tracking for each level)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── requests.js
│   │   └── approvals.js
│   ├── controllers/
│   ├── middleware/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

## Workflow Overview

### T-Code Request Approval Process

The system handles T-Code (SAP Transaction Code) access requests with a 3-level sequential approval process:

```
User Creates Request
        ↓
    [LEVEL 1] Manager 1 Reviews & Approves/Rejects
        ↓ (if approved)
    [LEVEL 2] Manager 2 Reviews & Approves/Rejects
        ↓ (if approved)
    [LEVEL 3] Manager 3 Final Approval
        ↓ (if approved)
    Request APPROVED & Access Granted
```

**Key Features:**
- Only moves to next level if current level is approved
- If rejected at any level, process stops
- Each manager can add comments
- Real-time status tracking
- Automatic notifications at each stage

## User Roles

### 1. **User**
   - Create T-Code requests
   - View own request status
   - Provide business justification
   - Upload supporting documents

### 2. **Manager (Level 1, 2, or 3)**
   - View pending requests assigned to them
   - Approve or reject requests with comments
   - Track approval history
   - Filter by department, priority, etc.

### 3. **Admin**
   - Manage users and assign manager roles
   - Assign approval levels to managers
   - View all requests and approvals
   - Generate reports

## Database Models

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'manager' | 'admin',
  approvalLevel: 1 | 2 | 3 (for managers),
  department: String,
  managerId: Reference to User (chain of command),
  isActive: Boolean,
  timestamps
}
```

### Request Schema
```javascript
{
  // Basic Info
  title: String,
  description: String,
  requestType: 'tcode' | 'leave' | 'budget' | 'access' | 'other',
  
  // T-Code Specific
  tcodeName: String,
  tcodeDescription: String,
  businessJustification: String,
  
  // User Info
  requestedBy: Reference to User,
  
  // 3-Level Approval Workflow
  approvalWorkflow: {
    level1: { manager, status, approvedAt, comments },
    level2: { manager, status, approvedAt, comments },
    level3: { manager, status, approvedAt, comments }
  },
  
  // Status
  overallStatus: 'draft' | 'submitted' | 'level1_pending' | 'level2_pending' | 
                 'level3_pending' | 'approved' | 'rejected',
  
  // Other
  priority: 'low' | 'medium' | 'high',
  rejectionReason: String,
  attachments: Array,
  dueDate: Date,
  timestamps
}
```

### Approval Schema (History Tracking)
```javascript
{
  request: Reference to Request,
  approvalLevel: 1 | 2 | 3,
  approver: Reference to User,
  status: 'pending' | 'approved' | 'rejected',
  comments: String,
  assignedAt: Date,
  actionTakenAt: Date,
  viewedAt: Date,
  timestamps
}
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/request-approval-system
   JWT_SECRET=your_super_secret_key_here
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

### Frontend Setup

1. In a new terminal, navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start the React development server:
   ```bash
   npm start
   ```
   The frontend will open on `http://localhost:3000`

## API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

### Requests
- `GET /api/requests` - Get all requests (with filters)
- `GET /api/requests/:id` - Get request details
- `POST /api/requests` - Create a new T-code request
- `PUT /api/requests/:id` - Update a request (only draft status)
- `PATCH /api/requests/:id/submit` - Submit request for approval
- `DELETE /api/requests/:id` - Delete a request (draft only)

### Approvals
- `GET /api/approvals/pending` - Get pending approvals for current manager
- `GET /api/approvals/history` - Get approval history for a request
- `POST /api/approvals/:requestId/level/:level/approve` - Approve at specific level
- `POST /api/approvals/:requestId/level/:level/reject` - Reject at specific level
- `GET /api/approvals/dashboard` - Manager dashboard with stats

### Admin
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update user role/approval level
- `DELETE /api/users/:id` - Deactivate user
- `GET /api/reports/approvals` - Approval reports

## Implementation Roadmap

### Phase 1: Foundation
- [ ] User authentication (JWT)
- [ ] User management (CRUD)
- [ ] Request CRUD operations
- [ ] Database connections and validations

### Phase 2: Approval Workflow
- [ ] Implement 3-level sequential approval logic
- [ ] Approval/Rejection endpoints
- [ ] Auto-update request status based on workflow
- [ ] Approval history tracking

### Phase 3: Frontend
- [ ] User dashboard
- [ ] Request creation form
- [ ] Manager approval dashboard
- [ ] Admin management panel
- [ ] Request tracking and history

### Phase 4: Enhancement
- [ ] Email notifications
- [ ] Pagination and filtering
- [ ] Export to Excel/PDF reports
- [ ] Bulk operations
- [ ] Deployment (AWS/Azure/Heroku)

## Sample Request Lifecycle

```
1. User creates T-Code request for "TCODE_001"
   Status: draft

2. User submits request
   Status: submitted → level1_pending
   Assigned to: Manager 1

3. Manager 1 approves with comment "Verified with team lead"
   Status: level2_pending
   Assigned to: Manager 2

4. Manager 2 approves with comment "Budget approved"
   Status: level3_pending
   Assigned to: Manager 3

5. Manager 3 approves with comment "Executive approval granted"
   Status: approved
   T-Code access granted to user

---

Alternative: Manager 2 rejects
   Request stops at level2
   Status: rejected
   User notified with rejection reason
```

## Next Steps

1. Implement authentication routes and JWT middleware
2. Create request management controllers
3. Write approval workflow logic
4. Build React components (forms, dashboards, approvals)
5. Add form validation and error handling
6. Implement email notification system
7. Create manager and admin dashboards
8. Add filtering, search, and pagination
9. Deploy to production

## License

ISC

## Support

For issues or questions, please create an issue in the repository.

"# Request_Approval_System" 
