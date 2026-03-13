# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Frontend (http://localhost:3000)                  │   │
│  │  ├─ Login/Register Pages                                 │   │
│  │  ├─ Request Creation & Management                        │   │
│  │  ├─ Request Tracking Dashboard                           │   │
│  │  ├─ Manager Approval Queue                               │   │
│  │  ├─ Admin Management Panel                               │   │
│  │  └─ Request Status & History View                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓ (HTTP/REST API)                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Node.js + Express Server (http://localhost:5000)        │   │
│  │                                                          │   │
│  │  Routes:                                                 │   │
│  │  ├─ /api/auth      (Login, Register, Profile)            │   │
│  │  ├─ /api/requests  (CRUD for T-Code requests)            │   │
│  │  └─ /api/approvals (Approval actions & history)          │   │
│  │                                                          │   │
│  │  Middleware:                                             │   │
│  │  ├─ Authentication (JWT verification)                    │   │
│  │  ├─ Authorization (Role-based access)                    │   │
│  │  └─ Error Handling & Validation                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓ (Mongoose ODM)                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  MongoDB Database                                        │   │
│  │                                                          │   │
│  │  Collections:                                            │   │
│  │  ├─ users       (User accounts)                          │   │
│  │  ├─ requests    (T-Code requests with 3-level approval)  │   │
│  │  └─ approvals   (Approval history & tracking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Components Structure
```
App
├── Auth Pages
│   ├── LoginPage
│   ├── RegisterPage
│   └── ProfilePage
├── Request Pages
│   ├── RequestListPage
│   ├── CreateRequestPage
│   ├── RequestDetailPage
│   └── EditRequestPage
├── Approval Pages
│   ├── ApprovalQueuePage
│   ├── ApprovalDetailPage
│   └── ApprovalHistoryPage
├── Admin Pages
│   ├── UserManagementPage
│   ├── RequestReportsPage
│   └── ApprovalAnalyticsPage
└── Layout Components
    ├── Navigation
    ├── Sidebar
    ├── Header
    └── Footer
```

### Backend Components Structure
```
Server (server.js)
├── Routes
│   ├── /api/auth (authRoutes)
│   ├── /api/requests (requestRoutes)
│   └── /api/approvals (approvalRoutes)
├── Controllers
│   ├── authController
│   ├── requestController
│   └── approvalController
├── Models
│   ├── User.js
│   ├── Request.js
│   └── Approval.js
├── Middleware
│   ├── auth.js (JWT verification)
│   └── authorization.js (Role-based access)
└── Utilities
    ├── validators
    └── helpers
```

---

## Data Flow Diagram

### Request Creation & Approval Flow

```
┌──────────────┐
│ User Creates │
│   Request    │
└──────┬───────┘
       │
       ├─ Fill Form (UI Component)
       │  └─ POST /api/requests
       │     └─ requestController.createRequest()
       │        └─ Save to MongoDB (status: "draft")
       │
       └─ Result: Request created with ID
          (Can edit or submit)

┌──────────────┐      ┌──────────────┐
│ User Submits │      │System Assigns │
│  Request     │─────→│ Managers for  │
│ for Approval │      │  3 Levels     │
└──────────────┘      └──────────────┘
       │
       ├─ PATCH /api/requests/:id/submit
       │  └─ requestController.submitRequest()
       │     └─ Update status: "submitted" → "level1_pending"
       │        └─ Assign to Manager 1
       │
       └─ MongoDB: Request status updated
          (Now in Manager 1's queue)

┌────────────────┐     ┌─────────────────────┐
│  Manager 1     │     │  Manager 2          │
│  Reviews (L1)  │────→│  Reviews (L2)       │
│  ✓Approve      │     │  ✓Approve          │
│  ✗Reject       │     │  ✗Reject           │
└────────────────┘     └─────────────────────┘
       │                       │
       ├─ POST /api/approvals/:id/level/1/approve
       │  └─ approvalController.approveRequest()
       │     ├─ Update status: "level1_pending" → "level2_pending"
       │     ├─ Set approvalWorkflow.level1.status = "approved"
       │     ├─ Record in Approval history
       │     └─ Assign to Manager 2
       │
       │                       ├─ POST /api/approvals/:id/level/2/approve
       │                       │  └─ Similar logic
       │                       │     └─ Status: "level3_pending"
       │                       │        Assign to Manager 3
       │
       └─ [If Rejected]        └─ [If Rejected]
          ├─ Status: "rejected"   ├─ Status: "rejected"
          └─ Process ENDS         └─ Process ENDS

┌────────────────┐
│  Manager 3     │
│  Final Review  │
│  ✓Approve      │
│  ✗Reject       │
└────────────────┘
       │
       ├─ POST /api/approvals/:id/level/3/approve
       │  └─ approvalController.approveRequest()
       │     ├─ Update status: "level3_pending" → "approved"
       │     ├─ Set approvalWorkflow.level3.status = "approved"
       │     └─ T-CODE ACCESS GRANTED ✓
       │
       └─ [If Rejected]
          ├─ Status: "rejected"
          └─ Process ENDS

┌────────────────────────┐
│  Request Complete      │
│  Access Granted or     │
│  Resubmit if Rejected  │
└────────────────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────┐
│     User        │         │    Request      │         │  Approval    │
├─────────────────┤         ├─────────────────┤         ├──────────────┤
│ _id             │         │ _id             │◄────────│ request      │
│ name            │         │ title           │         │ approvalLevel│
│ email           │─────┐   │ requestType     │         │ approver     │◄──┐
│ password        │     │   │ tcodeName       │         │ status       │   │
│ role            │     │   │ businessJustin. │         │ comments     │   │
│ approvalLevel   │     │   │ requestedBy ────┼─────┐   │ actionTakenAt│   │
│ department      │     │   │ priority        │     │   └──────────────┘   │
│ isActive        │     │   │ dueDate         │     │                      │
│ managerId ──────┼─────┤   │ attachments     │     │   Referenced from:   │
│ createdAt       │     │   │ overallStatus   │     │   - level1.manager   │
│ updatedAt       │     │   │                 │     │   - level2.manager   │
└─────────────────┘     │   │ approvalWorkflow│     │   - level3.manager   │
                        │   │  ├─level1       │     │                      │
                        │   │  │  ├─manager ──┼─────┼──────────────────┬───┘
                        │   │  │  ├─status    │     │                  │
                        │   │  │  └─approvedAt│     │                  │
                        │   │  ├─level2       │     │                  │
                        │   │  │  ├─manager ──┼─────┘                  │
                        │   │  │  ├─status    │
                        │   │  │  └─approvedAt│
                        │   │  └─level3       │
                        │   │     ├─manager ──┼────────────────────────┘
                        │   │     ├─status    │
                        │   │     └─approvedAt│
                        │   │                 │
                        │   │ createdAt       │
                        │   │ updatedAt       │
                        │   └─────────────────┘
                        │
                        └─ User.requestedBy (One user can have many requests)
```

---

## API Request/Response Flow

### Example: Approve Request at Level 1

```
FRONTEND                          BACKEND                MONGODB
   │                               │                     │
   ├─ POST /api/approvals/         │                      │
   │  {requestId}/level/1/approve  │                      │
   │  {comments: "..."}            │                      │
   │                               │                      │
   │  with JWT Token               │                      │
   │─────────────────────────────→ │                      │
   │                               ├─ Verify JWT         │
   │                               ├─ Check authorization│
   │                               ├─ Get Request        │
   │                               │  from DB            │
   │                               │───────────────────→ │
   │                               │◄───────────────────│
   │                               │  (Request object)  │
   │                               │                    │
   │                               ├─ Validate          │
   │                               ├─ Update request    │
   │                               │  status & fields   │
   │                               │                    │
   │                               ├─ Save to DB        │
   │                               │───────────────────→│
   │                               │                    ├─ Update Request
   │                               │                    │
   │                               │◄───────────────────│
   │                               │  (Updated request) │
   │                               │                    │
   │                               ├─ Create Approval   │
   │                               │  history record    │
   │                               │───────────────────→│
   │                               │                    ├─ Insert Approval
   │                               │◄───────────────────│
   │                               │  (Success)         │
   │                               │                    │
   │◄───────────────────────────── │                    │
   │  200 OK + Updated Request     │                    │
   │                               │                    │
   └─ Display success              │                    │
      Update UI with new status    │                    │
```

---

## Authentication Flow

```
FRONTEND                    BACKEND          DATABASE
   │                         │                 │
   ├─ Enter credentials      │                 │
   ├─ POST /api/auth/login   │                 │
   │  {email, password}      │                 │
   │──────────────────────→  │                 │
   │                         ├─ Find user     │
   │                         │ by email       │
   │                         │────────────→   │
   │                         │◄───────────────│
   │                         │ (User object)│
   │                         │              │
   │                         ├─ Compare     │
   │                         │ password     │
   │                         │ with hash    │
   │                         │              │
   │                         ├─ Generate    │
   │                         │ JWT token    │
   │                         │              │
   │◄─────────────────────│             │
   │ 200 OK + JWT Token   │             │
   │                      │             │
   ├─ Store token in      │             │
   │ localStorage         │             │
   │                      │             │
   └─ All future requests │             │
     include token in     │             │
     Authorization header │             │
                          │             │
   ├─ GET /api/requests   │             │
   │  + Authorization     │             │
   │──────────────────────→│            │
   │                       ├─ Verify JWT│
   │                       ├─ Extract   │
   │                       │ user ID    │
   │                       │            │
   │                       ├─ Get data  │
   │                       │───────────→│
   │◄──────────────────────│            │
   │ 200 OK + Data         │            │
   │                       │            │
```

---

## State Management (Frontend)

```
App Component (Root)
│
├─ Auth Context
│  ├─ currentUser
│  ├─ token
│  ├─ isAuthenticated
│  ├─ login()
│  ├─ logout()
│  └─ register()
│
├─ Request Context
│  ├─ requests[]
│  ├─ currentRequest
│  ├─ createRequest()
│  ├─ updateRequest()
│  ├─ submitRequest()
│  └─ deleteRequest()
│
└─ Approval Context
   ├─ pendingApprovals[]
   ├─ approvalHistory[]
   ├─ approveRequest()
   ├─ rejectRequest()
   └─ getApprovalStats()
```

---

## Security Layers

```
Client (React)
    │
    ├─ HTTPS/TLS encryption
    ├─ JWT token storage (localStorage)
    └─ CSRF tokens
    │
    ↓
Server (Node.js)
    │
    ├─ CORS validation
    ├─ JWT verification
    ├─ Role-based authorization
    ├─ Input validation
    ├─ Rate limiting
    ├─ SQL injection prevention
    └─ Error message sanitization
    │
    ↓
Database (MongoDB)
    │
    ├─ Password hashing (bcrypt)
    ├─ Data encryption
    ├─ Access control
    └─ Audit logging
```

---

## Deployment Architecture (Future)

```
┌────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                             │
│  CDN (Static Files) + Frontend (React)                     │
└────────────────────────────────────────────────────────────┘
                         │ HTTPS
                         ↓
┌────────────────────────────────────────────────────────────┐
│                   API LAYER (Cloud)                        │
│  ├─ Load Balancer                                          │
│  ├─ Backend Server Instances (Node.js + Express)           │
│  ├─ Auto-scaling                                           │
│  ├─ Caching Layer (Redis)                                  │
│  └─ Environment variables & secrets management             │
└────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                           │
│  ├─ MongoDB Atlas (Managed service)                        │
│  ├─ Automated backups                                      │
│  ├─ High availability (Replica sets)                       │
│  └─ Data encryption at rest & in transit                   │
└────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│              MONITORING & LOGGING                          │
│  ├─ Application Insights / Datadog                         │
│  ├─ Error tracking (Sentry)                                │
│  ├─ Log aggregation (CloudWatch, ELK)                      │
│  └─ Performance monitoring                                 │
└────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React.js | User interface |
| | React Router | Navigation & routing |
| | Axios | HTTP client |
| | CSS/Bootstrap | Styling |
| **Backend** | Node.js | Runtime environment |
| | Express.js | Web framework |
| | Mongoose | ODM for MongoDB |
| | JWT | Authentication |
| | bcryptjs | Password hashing |
| **Database** | MongoDB | NoSQL database |
| | MongoDB Atlas (Prod) | Managed database service |
| **DevOps** | Docker | Containerization |
| | Git | Version control |
| | GitHub Actions/Jenkins | CI/CD pipeline |

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalability
- ✅ Security
- ✅ Maintainability
- ✅ Testability
