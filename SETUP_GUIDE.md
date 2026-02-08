# Lexora Library Management System - Authentication Setup

## 🚀 Complete Setup Guide

This guide will help you set up the authentication system for the Lexora Library Management System.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **WAMP Server** (already installed at `c:\wamp64\www\E-Library-System`)
- **MySQL** database running through WAMP

---

## 🗄️ Database Setup

### 1. Start WAMP Server
- Launch WAMP from your Windows start menu
- Ensure the WAMP icon in the system tray is **green** (all services running)

### 2. Import Database
The database should already be set up, but if you need to reimport:
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Create database if it doesn't exist: `lexora_db`
3. Import the SQL file: `database/lexora_db.sql`

### 3. Test Database Connection
Open phpMyAdmin and verify the `users` table exists with these test users:
- **Admin**: username: `wilhelm`, password: `garcia123`
- **Librarian**: username: `librarian2026`, password: `nemcolibrarian`

---

## 🔧 Backend Setup

### 1. Navigate to Server Directory
```bash
cd c:\wamp64\www\E-Library-System\server
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web framework
- `cors` - Enable cross-origin requests
- `mysql2` - MySQL database driver
- `dotenv` - Environment variable management
- `nodemon` - Auto-restart during development

### 3. Configure Environment Variables
The `.env` file is already created with these settings:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=lexora_db
```

**Important**: If your MySQL has a password, update `DB_PASSWORD` in the `.env` file!

### 4. Start the Backend Server
```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server is running on http://localhost:5000
📚 Lexora Library Management System API
```

### 5. Test the API
Open a new terminal and test with curl or your browser:
```bash
# Health check
curl http://localhost:5000/api/health

# Expected response:
# {"status":"OK","message":"Server is running"}
```

---

## 💻 Frontend Setup

### 1. Navigate to Client Directory
Open a **new terminal** window:
```bash
cd c:\wamp64\www\E-Library-System\client
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Frontend Development Server
```bash
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 4. Open the Application
Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🧪 Testing the Login

### Test Credentials

1. **Admin Account**
   - Username: `wilhelm`
   - Password: `garcia123`
   - Role: admin

2. **Librarian Account**
   - Username: `librarian2026`
   - Password: `nemcolibrarian`
   - Role: librarian

3. **Librarian Account 2**
   - Username: `joshua`
   - Password: `ponce200410`
   - Role: librarian

### Expected Login Flow

1. Enter username and password
2. Click "Sign In"
3. If successful:
   - User data is stored in localStorage
   - Redirected to the dashboard
   - User info appears in the layout
4. If failed:
   - Error message appears below the form

---

## 📁 Project Structure

```
E-Library-System/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MySQL connection
│   │   ├── controllers/
│   │   │   └── authController.js    # Login/logout logic
│   │   ├── models/
│   │   │   └── User.js              # User database operations
│   │   ├── routes/
│   │   │   └── authRoutes.js        # Auth API routes
│   │   └── server.js                # Main server file
│   ├── .env                         # Environment variables
│   └── package.json
│
└── client/
    ├── src/
    │   ├── components/
    │   │   └── pages/
    │   │       └── login.tsx        # Login page component
    │   ├── services/
    │   │   └── api.ts               # API service (axios)
    │   └── App.tsx                  # Main app component
    └── package.json
```

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "wilhelm",
  "password": "garcia123"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "user_id": 6,
    "username": "wilhelm",
    "full_name": "WILHELM GABRIEL GARCIA",
    "email": "admin@lexora.com",
    "role": "admin",
    "last_login": "2026-02-08T12:00:00.000Z"
  }
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

#### 2. Logout
```http
POST /auth/logout
Content-Type: application/json

{
  "userId": 6
}
```

#### 3. Verify Session
```http
POST /auth/verify
Content-Type: application/json

{
  "userId": 6
}
```

---

## 🐛 Troubleshooting

### Backend Issues

#### 1. "Database connection failed"
**Solution**:
- Make sure WAMP is running (green icon)
- Check MySQL service is active in WAMP
- Verify database credentials in `.env`
- Test connection in phpMyAdmin

#### 2. "Port 5000 already in use"
**Solution**:
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Or change port in .env file
PORT=5001
```

#### 3. "Cannot find module 'mysql2'"
**Solution**:
```bash
cd server
npm install mysql2
```

### Frontend Issues

#### 1. "Cannot connect to server"
**Solution**:
- Ensure backend is running on port 5000
- Check console for CORS errors
- Verify `API_BASE_URL` in `client/src/services/api.ts`

#### 2. "Module not found: @/components/ui/..."
**Solution**:
```bash
cd client
npm install
```

#### 3. Login button not working
**Solution**:
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab to see if API request is sent
- Verify backend is responding

---

## 🔒 Security Notes

⚠️ **IMPORTANT**: This implementation uses **plain text passwords** for simplicity, matching your existing database.

### For Production, You Should:
1. **Hash passwords** using bcrypt
2. **Implement JWT tokens** for session management
3. **Add HTTPS** encryption
4. **Implement rate limiting** to prevent brute force attacks
5. **Add input validation** and sanitization
6. **Use environment variables** for sensitive data

### Example: Adding Password Hashing (Future Enhancement)
```javascript
// Install bcrypt
npm install bcrypt

// In User model
const bcrypt = require('bcrypt');

// Hash password when creating user
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password during login
const isValid = await bcrypt.compare(password, user.password);
```

---

## 📝 Activity Logging

The system automatically logs:
- ✅ Login attempts (successful)
- ✅ Logout actions
- ✅ IP addresses
- ✅ Timestamps

Check the `activity_logs` table in phpMyAdmin to see login history.

---

## 🎯 Next Steps

Now that authentication is working, you can:
1. ✅ Test login with all three user accounts
2. ✅ Verify session persistence (refresh page)
3. ✅ Test logout functionality
4. 🔄 Add more features:
   - Password reset
   - User profile update
   - Role-based access control
   - Token-based authentication (JWT)

---

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console (F12 → Console)
2. Check the server terminal for errors
3. Verify both servers are running:
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:5173`
4. Check database connection in phpMyAdmin

---

## ✅ Quick Start Checklist

- [ ] WAMP Server is running (green icon)
- [ ] Database `lexora_db` exists
- [ ] Backend dependencies installed (`cd server && npm install`)
- [ ] Frontend dependencies installed (`cd client && npm install`)
- [ ] Backend server running (`cd server && npm run dev`)
- [ ] Frontend server running (`cd client && npm run dev`)
- [ ] Can access login page at `http://localhost:5173`
- [ ] Can login with test credentials
- [ ] User data persists after page refresh

---

**🎉 Congratulations! Your authentication system is now fully functional!**