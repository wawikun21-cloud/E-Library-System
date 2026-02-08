# 🚀 Lexora - Quick Reference Cheat Sheet

## 📋 Prerequisites Checklist
```
✅ Node.js installed (v16+)
✅ WAMP Server installed & running (GREEN icon)
✅ Database 'lexora_db' exists in MySQL
```

---

## ⚡ Super Quick Start (3 Steps)

### Step 1: Start WAMP
- Double-click WAMP icon
- Wait for GREEN icon in system tray

### Step 2: Start Backend
```bash
cd c:\wamp64\www\E-Library-System\server
npm install
npm run dev
```
✅ Should see: "Database connected successfully"

### Step 3: Start Frontend (NEW TERMINAL)
```bash
cd c:\wamp64\www\E-Library-System\client
npm install
npm run dev
```
✅ Should see: "Local: http://localhost:5173/"

---

## 🔑 Login Credentials

```
Username: wilhelm
Password: garcia123
Role: Admin
```

```
Username: librarian2026  
Password: nemcolibrarian
Role: Librarian
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| phpMyAdmin | http://localhost/phpmyadmin |

---

## 📁 File Locations

### Backend Files
```
server/
├── src/
│   ├── server.js          ← Main server
│   ├── config/database.js ← MySQL connection
│   ├── controllers/authController.js
│   ├── models/User.js
│   └── routes/authRoutes.js
└── .env                   ← Database config
```

### Frontend Files  
```
client/
└── src/
    ├── services/api.ts    ← API calls
    ├── components/pages/login.tsx
    └── App.tsx
```

---

## 🔧 Common Commands

### Backend
```bash
npm install           # Install dependencies
npm run dev          # Start with auto-reload
npm start            # Start production mode
```

### Frontend
```bash
npm install           # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
```

---

## 🐛 Quick Fixes

### Problem: "Cannot connect to database"
✅ Solution: Check WAMP is GREEN, verify .env file

### Problem: "Port 5000 in use"  
✅ Solution: Change PORT in server/.env to 5001

### Problem: "Cannot connect to server"
✅ Solution: Make sure backend is running (npm run dev)

### Problem: Login doesn't work
✅ Solution: 
1. Check browser console (F12)
2. Verify backend is running
3. Test credentials: wilhelm/garcia123

---

## 📊 Testing Checklist

- [ ] WAMP icon is GREEN
- [ ] Backend running (port 5000)
- [ ] Frontend running (port 5173)
- [ ] Can open http://localhost:5173
- [ ] Login with wilhelm/garcia123 works
- [ ] Dashboard appears after login
- [ ] User info shows in top-right
- [ ] Logout works
- [ ] Page refresh keeps login

---

## 🎯 API Test (Optional)

Test backend is working:
```bash
# In browser or Postman
GET http://localhost:5000/api/health

# Should return:
{"status":"OK","message":"Server is running"}
```

---

## 📞 Emergency Help

1. **Check browser console** (F12 → Console tab)
2. **Check backend terminal** for error messages  
3. **Check WAMP** - must be GREEN
4. **Restart everything**:
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Restart WAMP
   - Start backend again
   - Start frontend again

---

## 🎨 Color Codes

🟢 GREEN = Working perfectly
🟡 YELLOW = Warning, might work
🔴 RED = Error, won't work
⚫ BLACK/OFF = Service not running

**WAMP should be GREEN** ✅

---

## 💾 Database Quick Check

Open phpMyAdmin → lexora_db → users table

Should see:
- wilhelm (admin)
- librarian2026 (librarian)  
- joshua (librarian)

---

## 🔐 Security Info

⚠️ **Current Setup**: Plain text passwords (for development)
🔒 **For Production**: Use bcrypt + JWT tokens

---

**Questions? Check SETUP_GUIDE.md for detailed help!**