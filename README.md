# 📚 Lexora Library Management System

A modern, full-stack library management system built with React + Vite frontend and Express.js backend.

## ✨ Features

### ✅ Implemented
- **User Authentication** - Secure login/logout system
- **Role-based Access** - Admin and Librarian roles
- **Session Management** - Persistent login with localStorage
- **Activity Logging** - Track all user actions
- **Responsive UI** - Beautiful gradient design with Tailwind CSS

### 🔄 Coming Soon
- Book management (CRUD operations)
- Student management
- Borrowing and return system
- Fine calculation
- Reports and analytics
- Search functionality

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- WAMP Server (MySQL)
- npm

### Installation

1. **Clone or navigate to project**
```bash
cd c:\wamp64\www\E-Library-System
```

2. **Setup Database**
   - Start WAMP Server
   - Import `database/lexora_db.sql` in phpMyAdmin
   - Database name: `lexora_db`

3. **Install Backend Dependencies**
```bash
cd server
npm install
```

4. **Install Frontend Dependencies**
```bash
cd ../client
npm install
```

5. **Start Backend** (Terminal 1)
```bash
cd server
npm run dev
```

6. **Start Frontend** (Terminal 2)
```bash
cd client
npm run dev
```

7. **Access Application**
   - Open browser: `http://localhost:5173`
   - Login with test credentials

---

## 🔐 Test Credentials

| Username | Password | Role |
|----------|----------|------|
| wilhelm | garcia123 | Admin |
| librarian2026 | nemcolibrarian | Librarian |
| joshua | ponce200410 | Librarian |

---

## 📦 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - UI components
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **CORS** - Cross-origin support
- **dotenv** - Environment config

---

## 📁 Project Structure

```
E-Library-System/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/    # Layout components
│   │   │   ├── pages/     # Page components
│   │   │   └── ui/        # Reusable UI components
│   │   ├── services/
│   │   │   └── api.ts     # API integration
│   │   └── App.tsx        # Main app component
│   └── package.json
│
├── server/                 # Backend (Express.js)
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   │   └── database.js
│   │   ├── controllers/   # Request handlers
│   │   │   └── authController.js
│   │   ├── models/        # Database models
│   │   │   └── User.js
│   │   ├── routes/        # API routes
│   │   │   └── authRoutes.js
│   │   └── server.js      # Main server file
│   ├── .env               # Environment variables
│   └── package.json
│
├── database/               # Database files
│   └── lexora_db.sql
│
├── SETUP_GUIDE.md         # Detailed setup instructions
└── README.md              # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify` - Verify session

### Health Check
- `GET /api/health` - Server health status

---

## 🛠️ Development

### Backend Development
```bash
cd server
npm run dev  # Auto-restart on changes
```

### Frontend Development
```bash
cd client
npm run dev  # Hot reload enabled
```

### Build for Production
```bash
# Frontend
cd client
npm run build

# Backend (no build needed, runs directly)
cd server
npm start
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check if WAMP is running (green icon)
- Verify MySQL credentials in `.env`
- Check if port 5000 is available

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check `API_BASE_URL` in `client/src/services/api.ts`
- Look for CORS errors in browser console

### Login not working
- Verify database connection
- Check user credentials in `users` table
- Look at browser console and network tab

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed troubleshooting.

---

## 📝 Database Schema

### Main Tables
- `users` - System users (admin, librarian)
- `students` - Library members
- `books` - Book catalog
- `transactions` - Borrowing records
- `fines` - Overdue fines
- `activity_logs` - Audit trail

See `database/lexora_db.sql` for complete schema.

---

## 🔒 Security Notes

⚠️ **Current Implementation**
- Plain text passwords (matches existing database)
- localStorage session management
- Basic CORS configuration

🔐 **Production Recommendations**
- Implement bcrypt password hashing
- Use JWT for authentication
- Add HTTPS/SSL
- Implement rate limiting
- Add input validation/sanitization
- Use secure session storage

---

## 🎯 Roadmap

### Phase 1: Foundation ✅
- [x] Database setup
- [x] Backend API structure
- [x] Authentication system
- [x] Frontend UI components

### Phase 2: Core Features (In Progress)
- [ ] Book management (CRUD)
- [ ] Student management
- [ ] Borrowing system
- [ ] Return processing
- [ ] Fine calculation

### Phase 3: Advanced Features
- [ ] Search and filters
- [ ] Reports and analytics
- [ ] Email notifications
- [ ] Barcode scanning
- [ ] Mobile responsive design

### Phase 4: Enhancement
- [ ] JWT authentication
- [ ] Password hashing
- [ ] Role permissions
- [ ] Audit logs viewer
- [ ] Export functionality

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

Developed for Lexora Library System

---

## 📞 Support

For issues or questions:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Review browser console for errors
3. Check server terminal output
4. Verify database connection

---

**Made with ❤️ using React + Express**