# Quick Start Guide

Get your T-Code Request Approval System running in under 10 minutes!

## Prerequisites
- Node.js (v14+) installed
- MongoDB running (local or MongoDB Atlas)
- VS Code or any code editor
- Git (optional)

## Step 1: Start MongoDB

### Option A: Local MongoDB
```bash
# Windows
mongod

# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and cluster
3. Get connection string
4. Copy to `.env` file (see Step 4)

---

## Step 2: Setup Backend

### Terminal 1:
```bash
cd backend
npm install
```

Wait for all dependencies to install...

---

## Step 3: Configure Environment Variables

### Create `.env` file in backend folder:

```bash
cp .env.example .env
```

### Edit `.env` with your settings:

```ini
PORT=5000
MONGODB_URI=mongodb://localhost:27017/request-approval-system
JWT_SECRET=your_super_secret_key_change_this
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**For MongoDB Atlas**, replace `MONGODB_URI` with:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/request-approval-system
```

---

## Step 4: Start Backend Server

### Terminal 1 (Backend):
```bash
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected successfully
```

✅ Backend is ready!

---

## Step 5: Setup Frontend

### Terminal 2:
```bash
cd frontend
npm install
```

Wait for all dependencies...

---

## Step 6: Start Frontend

### Terminal 2 (Frontend):
```bash
npm start
```

The app will open automatically on `http://localhost:3000`

You should see:
```
Backend Status: Backend is running
```

✅ Frontend is ready!

---

## Step 7: Verify Connection

### Visit in Browser:
- **Frontend**: http://localhost:3000
- **Backend Health Check**: http://localhost:5000/api/health

Both should be working!

---

## Project Structure Created

```
Request_Approval_System/
├── backend/
│   ├── models/
│   │   ├── User.js              ← User schema with manager levels
│   │   ├── Request.js           ← T-Code request with 3-level approval
│   │   └── Approval.js          ← Approval history tracking
│   ├── routes/
│   │   ├── auth.js              ← Authentication routes
│   │   ├── requests.js          ← Request CRUD routes
│   │   └── approvals.js         ← Approval action routes
│   ├── controllers/
│   │   ├── requestController.js ← Request logic
│   │   └── approvalController.js← Approval logic
│   ├── middleware/
│   │   └── auth.js              ← JWT auth & role authorization
│   ├── server.js                ← Main server file
│   ├── package.json
│   ├── .env.example
│   └── .env                     ← Create this file
│
├── frontend/
│   ├── src/
│   │   ├── components/          ← React components (to build)
│   │   ├── pages/               ← Page components (to build)
│   │   ├── App.js               ← Main app component
│   │   └── index.js             ← Entry point
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── .env.example
│   └── .env                     ← Create this file
│
├── README.md                    ← Project overview
├── WORKFLOW_GUIDE.md            ← Detailed workflow explanation
└── QUICK_START.md               ← This file
```

---

## Next Steps to Implement

### Backend APIs (Priority Order)

1. **Authentication** (Routes: `/api/auth`)
   - [ ] POST `/register` - Create user account
   - [ ] POST `/login` - Login and get JWT token
   - [ ] GET `/profile` - Get current user details

2. **Requests** (Routes: `/api/requests`)
   - [ ] POST `/` - Create new T-Code request
   - [ ] GET `/` - Get user's requests
   - [ ] GET `/:id` - Get request details
   - [ ] PATCH `/:id/submit` - Submit for approval

3. **Approvals** (Routes: `/api/approvals`)
   - [ ] GET `/pending` - Get pending approvals for manager
   - [ ] POST `/:requestId/level/:level/approve` - Approve request
   - [ ] POST `/:requestId/level/:level/reject` - Reject request

### Frontend Components (Priority Order)

1. **Basic Setup**
   - [ ] Setup React Router
   - [ ] Create layout/navigation
   - [ ] Setup axios interceptors for JWT

2. **Authentication** Pages
   - [ ] Login page
   - [ ] Register page
   - [ ] Profile page

3. **Request Management** Pages
   - [ ] Request list page
   - [ ] Create request form
   - [ ] Request detail view
   - [ ] Edit request page

4. **Approval** Pages
   - [ ] Pending approvals dashboard
   - [ ] Approval detail view
   - [ ] Approve/Reject modal/form

5. **Admin** Pages
   - [ ] User management
   - [ ] Reports and analytics

---

## Common Issues & Solutions

### Issue: MongoDB connection fails
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running. Check Step 1.

### Issue: Port 5000 already in use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change PORT in `.env` to 5001 or higher

### Issue: Port 3000 already in use
**Solution**: Run frontend on different port:
```bash
PORT=3001 npm start
```

### Issue: CORS errors
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution**: Check CORS_ORIGIN in backend `.env` matches frontend URL

### Issue: JWT errors
```
Error: Invalid or expired token
```
**Solution**: Make sure JWT_SECRET is set in `.env` and tokens are sent correctly

---

## Useful Commands

### Backend
```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Install new package
npm install package-name
```

### Frontend
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Install new package
npm install package-name
```

---

## Database Setup (Seed Data - Optional)

To test with sample data, run MongoDB commands:

```javascript
// Create sample users
db.users.insertMany([
  {
    name: "John Employee",
    email: "john@company.com",
    password: "hashed_password",  // Use bcrypt in real code
    role: "user",
    department: "IT",
    isActive: true
  },
  {
    name: "Mike Manager1",
    email: "mike@company.com",
    role: "manager",
    approvalLevel: 1,
    department: "IT",
    isActive: true
  },
  {
    name: "Sarah Manager2",
    email: "sarah@company.com",
    role: "manager",
    approvalLevel: 2,
    department: "Management",
    isActive: true
  },
  {
    name: "David Manager3",
    email: "david@company.com",
    role: "manager",
    approvalLevel: 3,
    department: "Executive",
    isActive: true
  }
])
```

---

## Testing the API

### Using Postman or Thunder Client

1. **Login to get JWT token**
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "john@company.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

2. **Use token for other requests**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Change JWT_SECRET to strong random string
- [ ] Use MongoDB Atlas or managed database
- [ ] Setup proper error logging
- [ ] Security: Add rate limiting
- [ ] Security: Add input validation
- [ ] CORS: Restrict to frontend domain only
- [ ] HTTPS: Setup SSL certificates
- [ ] Environment variables in production
- [ ] Database backups setup
- [ ] Error monitoring (Sentry, etc.)
- [ ] Performance monitoring
- [ ] CI/CD pipeline

---

## Support & Documentation

- **Full Workflow Guide**: See `WORKFLOW_GUIDE.md`
- **Project Overview**: See `README.md`
- **Backend Health**: http://localhost:5000/api/health
- **API Documentation**: (To be added)

---

## What's Next?

1. **Implement Authentication**
   - Uncomment routes in `/backend/routes/auth.js`
   - Create controller logic in `/backend/controllers/authController.js`

2. **Build React Components**
   - Create pages in `/frontend/src/pages/`
   - Create reusable components in `/frontend/src/components/`

3. **Connect Frontend to Backend**
   - Setup axios client
   - Create service functions
   - Handle requests and responses

4. **Add Features**
   - Email notifications
   - Real-time status updates
   - Reporting and analytics

---

Happy coding! 

If you run into issues, check the `WORKFLOW_GUIDE.md` for detailed explanations.
