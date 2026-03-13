# T-Code Request Approval Workflow Guide

## Overview

This document explains the complete workflow for T-Code (SAP Transaction Code) request approval with 3-level sequential manager approval.

---

## System Participants

### 1. **Regular User**
   - Initiates T-Code access requests
   - Provides business justification
   - Tracks request status
   - Cannot view other users' requests

### 2. **Manager Level 1 (First Approval)**
   - Reviews requests submitted by their team
   - First line of approval
   - Can approve or reject
   - Typically: Direct Manager

### 3. **Manager Level 2 (Second Approval)**
   - Receives requests approved by Level 1
   - Performs secondary review
   - Can approve or reject
   - Typically: Department Manager

### 4. **Manager Level 3 (Final Approval)**
   - Receives requests approved by Level 2
   - Final decision authority
   - Can approve or reject
   - Typically: Executive/Head of Department

### 5. **Admin**
   - Manages users and assign approval levels
   - Can view all requests
   - Generates reports
   - System administration

---

## Workflow States

### Request Status States

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  draft → submitted → level1_pending → level2_pending → level3_pending → approved
│                         │                 │                    │
│                         └─ rejected        └─ rejected         └─ rejected
│
└────────────────────────────────────────────────────────────┘
```

### State Descriptions

| State | Meaning | Who Can Act | Next Action |
|-------|---------|-------------|------------|
| **draft** | Initial creation, not submitted | Requester | Edit or submit |
| **submitted** | Submitted, awaiting Level 1 | System | Assign to Level 1 Manager |
| **level1_pending** | Waiting for Manager 1 approval | Manager 1 | Approve/Reject |
| **level2_pending** | Waiting for Manager 2 approval | Manager 2 | Approve/Reject |
| **level3_pending** | Waiting for Manager 3 approval | Manager 3 | Approve/Reject |
| **approved** | All 3 levels approved | - | T-Code access granted |
| **rejected** | Rejected at any level | Requester | Resubmit new request |

---

## Request Lifecycle Example

### Scenario: Employee requests TCODE_001 access

```
STEP 1: CREATE REQUEST
└─ Employee creates request in draft status
   ├─ Title: "T-Code TCODE_001 Access"
   ├─ T-Code: "TCODE_001"
   ├─ Business Justification: "Need access for daily transaction processing"
   └─ Status: draft

STEP 2: SUBMIT REQUEST
└─ Employee submits request
   ├─ Status changes to: submitted
   └─ System assigns to Level 1 Manager

STEP 3: LEVEL 1 MANAGER REVIEW
└─ Manager 1 (Direct Manager) reviews
   ├─ Checks business justification
   ├─ Verifies department authorization
   ├─ Options: Approve / Reject
   │  
   ├─ If APPROVED:
   │  ├─ Adds optional comment: "Verified with team"
   │  └─ Status changes to: level2_pending + Assigned to Manager 2
   │
   └─ If REJECTED:
      ├─ Provides rejection reason: "Not required for this role"
      └─ Status changes to: rejected (PROCESS ENDS)

STEP 4: LEVEL 2 MANAGER REVIEW
└─ Manager 2 (Department Manager) reviews
   ├─ Checks if T-Code aligns with department policies
   ├─ Verifies budget/resource availability
   ├─ Options: Approve / Reject
   │
   ├─ If APPROVED:
   │  ├─ Adds optional comment: "Budget approved, priority medium"
   │  └─ Status changes to: level3_pending + Assigned to Manager 3
   │
   └─ If REJECTED:
      ├─ Provides rejection reason: "Budget constraints"
      └─ Status changes to: rejected (PROCESS ENDS)

STEP 5: LEVEL 3 MANAGER REVIEW (FINAL)
└─ Manager 3 (Executive/Head) reviews
   ├─ Final authorization check
   ├─ Ensures security/compliance
   ├─ Options: Approve / Reject
   │
   ├─ If APPROVED:
   │  ├─ Adds optional comment: "Executive approval granted"
   │  └─ Status changes to: approved
   │  └─ PROCESS COMPLETE: T-Code access granted to employee
   │
   └─ If REJECTED:
      ├─ Provides rejection reason: "Security policy violation"
      └─ Status changes to: rejected (PROCESS ENDS)
```

---

## Key Features

### 1. Sequential Processing
- Each level must approve before moving to next
- No parallel approvals
- Clear chain of command

### 2. Comments at Each Level
- Managers can add feedback
- Comments visible throughout the request
- Helpful for audit trail

### 3. Rejection Stops Process
- Rejection at ANY level ends the workflow
- Requester can submit new request
- Previous request remains in system for history

### 4. Time Tracking
- Timestamps for each action
- Track approval delays
- Generate SLA reports

### 5. Approval History
- Complete audit trail
- Who approved/rejected and when
- All comments preserved
- Reason for rejection

---

## Database Model Details

### Request Document Structure
```javascript
{
  _id: ObjectId,
  
  // Request Info
  title: "T-Code TCODE_001 Access",
  description: "Need daily access for transactions",
  requestType: "tcode",
  tcodeName: "TCODE_001",
  tcodeDescription: "Create Purchase Order",
  businessJustification: "Required for PO creation and management",
  
  // Requester
  requestedBy: {
    _id: ObjectId,
    name: "John Employee",
    email: "john@company.com"
  },
  
  // Approval Workflow - 3 Levels
  approvalWorkflow: {
    level1: {
      manager: ObjectId (Manager 1),
      status: "approved",        // pending|approved|rejected
      approvedAt: 2024-02-26T10:30:00Z,
      comments: "Verified with team"
    },
    level2: {
      manager: ObjectId (Manager 2),
      status: "approved",
      approvedAt: 2024-02-26T11:45:00Z,
      comments: "Budget approved"
    },
    level3: {
      manager: ObjectId (Manager 3),
      status: "pending",
      approvedAt: null,
      comments: null
    }
  },
  
  // Overall Status
  overallStatus: "level3_pending",
  priority: "medium",
  dueDate: 2024-03-10T00:00:00Z,
  attachments: [],
  
  // Timestamps
  createdAt: 2024-02-26T09:15:00Z,
  updatedAt: 2024-02-26T11:45:00Z
}
```

### Approval History Document
```javascript
{
  _id: ObjectId,
  request: ObjectId,           // Reference to Request
  approvalLevel: 1,             // 1, 2, or 3
  approver: ObjectId,          // Manager who acted
  status: "approved",          // pending|approved|rejected
  comments: "Verified with team",
  assignedAt: 2024-02-26T09:30:00Z,
  actionTakenAt: 2024-02-26T10:30:00Z,
  viewedAt: 2024-02-26T09:35:00Z,
  createdAt: 2024-02-26T09:30:00Z
}
```

---

## API Endpoint Usage

### Create Request
```http
POST /api/requests
Authorization: Bearer {token}

Body:
{
  "title": "T-Code TCODE_001 Access",
  "description": "Need daily access",
  "tcodeName": "TCODE_001",
  "tcodeDescription": "Create Purchase Order",
  "businessJustification": "Required for PO creation",
  "priority": "medium",
  "dueDate": "2024-03-10"
}

Response: 201 Created
{
  "message": "Request created successfully",
  "request": { ... }
}
```

### Submit Request
```http
PATCH /api/requests/{requestId}/submit
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Request submitted for approval",
  "request": { overallStatus: "submitted", ... }
}
```

### Approve Request (Manager)
```http
POST /api/approvals/{requestId}/level/{level}/approve
Authorization: Bearer {token}

Body:
{
  "comments": "Verified with team"
}

Response: 200 OK
{
  "message": "Request approved at level 1",
  "request": { ... }
}
```

### Reject Request (Manager)
```http
POST /api/approvals/{requestId}/level/{level}/reject
Authorization: Bearer {token}

Body:
{
  "comments": "Not required for this role"
}

Response: 200 OK
{
  "message": "Request rejected at level 1",
  "request": { overallStatus: "rejected", ... }
}
```

---

## User Interface Flow

### For Requester (Employee)
1. Login
2. Dashboard: View all my requests
3. Create New Request:
   - Fill form with T-Code details
   - Save as draft
   - (Optional) Edit draft
   - Submit for approval
4. Track Status:
   - View request progress
   - See which manager is reviewing
   - View comments at each level
5. Notifications (future):
   - Alerts when request approved
   - Alerts when request rejected

### For Manager (Level 1, 2, or 3)
1. Login
2. Dashboard: View pending approvals for me
3. Open Request:
   - View requester details
   - Review T-Code justification
   - See previous level comments (if any)
4. Action:
   - **Approve**: Add comment, click approve → moves to next level
   - **Reject**: Provide reason, click reject → process ends
5. Notifications (future):
   - New pending request assigned
   - Request status changed

### For Admin
1. Login
2. User Management:
   - Create users
   - Assign roles (user/manager/admin)
   - Set manager approval level (1, 2, or 3)
3. Request Management:
   - View all requests
   - Search/filter
   - Generate reports
4. Approval Tracking:
   - View approval history
   - Monitor bottlenecks
   - Generate compliance reports

---

## Important Considerations

### Security
- JWT authentication on all endpoints
- Role-based access control (RBAC)
- Only assigned managers can approve
- Audit trail for compliance

### Data Integrity
- No skipping levels
- Cannot modify approved requests
- Complete approval history preserved
- Immutable rejection reasons

### Business Logic
- Sequential approval mandatory
- Any level can reject
- Rejection ends process permanently
- Full history for traceability

---

## Future Enhancements

1. **Email Notifications**
   - Request submitted notification
   - Pending approval reminders
   - Approval/rejection notifications

2. **SLA Management**
   - Set approval deadlines
   - Escalation rules
   - Deadline tracking

3. **Reporting**
   - Approval cycle time analytics
   - Bottleneck identification
   - Compliance reports

4. **Bulk Operations**
   - Batch T-Code assignments
   - Multi-request approvals

5. **Integration**
   - SAP integration for T-Code details
   - Directory service integration
   - Email/Slack notifications

---

## Quick Reference

| Question | Answer |
|----------|--------|
| How many approval levels? | 3 (sequential) |
| Can levels be skipped? | No, must be sequential |
| Can requests be edited after submission? | No, only drafts can be edited |
| What if rejected? | Process ends, new request needed |
| Who can see the request? | Requester, assigned managers, admins |
| How long is approval valid? | No expiration (implement as needed) |
| Can requests be cancelled? | Yes, if in draft status |
