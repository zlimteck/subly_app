# Development Guide

Guide for setting up Subly for local development.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Database Schema](#database-schema)
- [Development Tips](#development-tips)
- [Testing](#testing)
- [Building for Production](#building-for-production)

## Prerequisites

Ensure you have these installed before starting:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Git**
- **MongoDB** (local or Atlas account)
- **Code Editor** (VS Code recommended)

### Recommended VS Code Extensions

- ESLint
- Prettier
- MongoDB for VS Code
- Docker (if using Docker)
- GitLens

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/zlimteck/subly_app.git
cd subly_app
```

### 2. Install Dependencies

The project uses npm workspaces for monorepo management.

```bash
# Install all dependencies (root, backend, frontend)
npm install
```

This will install dependencies for:
- Root workspace (shared scripts)
- Backend workspace (Express API)
- Frontend workspace (React app)

### 3. Setup MongoDB

**Option A: MongoDB Atlas (Recommended)**

1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create database user
4. Whitelist your IP (0.0.0.0/0 for development)
5. Get connection string

**Option B: Local MongoDB**

```bash
# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:8.0
```

### 4. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Backend Configuration
PORT=5071
NODE_ENV=development

# MongoDB - Use your connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/subly
# Or local: mongodb://localhost:27017/subly

# JWT Secret - Generate a secure random string
JWT_SECRET=your_secure_random_string_here

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5071

# API URL for frontend (Vite)
VITE_API_URL=http://localhost:5071

# Email Service (Optional for development)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Timezone
TZ=Europe/Paris
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
npm run dev
```

This will start:
- **Backend** on http://localhost:5071
- **Frontend** on http://localhost:5173

Or start them separately:

```bash
# Terminal 1 - Backend only
npm run dev:backend

# Terminal 2 - Frontend only
npm run dev:frontend
```

### 6. Generate Invitation Code

```bash
node backend/scripts/generateInvite.js
```

### 7. Create Admin Account

1. Register at http://localhost:5173
2. Use invitation code from step 6
3. Promote to admin:
```bash
node backend/scripts/promoteAdmin.js your-username
```

## Development Workflow

### Hot Reloading

Both frontend and backend support hot reloading:

- **Frontend**: Changes auto-reload in browser (Vite HMR)
- **Backend**: Server restarts on changes (nodemon)

### Making Changes

1. **Create feature branch**
```bash
git checkout -b feature/your-feature
```

2. **Make changes**
- Edit code
- Test locally
- Check console for errors

3. **Commit changes**
```bash
git add .
git commit -m "Add feature description"
```

4. **Push and create PR**
```bash
git push origin feature/your-feature
```

### Frontend Development

Frontend is built with React 18 + Vite.

**Key directories:**
```
frontend/src/
├── components/     # Reusable UI components
├── pages/         # Page components (Login, Dashboard, etc.)
├── context/       # React context (AuthContext)
├── utils/         # Utility functions
└── App.jsx        # Main app component
```

**Styling:**
- CSS modules or inline styles
- Multiple theme support (dark, light, dracula, nord, solarized)
- Responsive design with media queries

**State Management:**
- React Context for auth state
- Local component state with useState
- No external state management library

### Backend Development

Backend is built with Express.js and MongoDB.

**Key directories:**
```
backend/src/
├── models/        # Mongoose schemas
├── routes/        # API route handlers
├── middleware/    # Auth and admin middleware
├── services/      # Business logic (email, push)
├── config/        # Database configuration
├── scripts/       # Utility scripts
└── server.js      # Entry point
```

**API Architecture:**
- RESTful API design
- JWT authentication
- Express middleware for auth/admin
- MongoDB with Mongoose ODM

### Adding New Features

**Frontend Feature:**
1. Create component in `frontend/src/components/`
2. Add route in `App.jsx` (if needed)
3. Update context if needed
4. Style with theme support

**Backend Feature:**
1. Define schema in `backend/src/models/`
2. Create routes in `backend/src/routes/`
3. Add middleware if needed
4. Update API docs

## Project Structure

### Monorepo Layout

```
subly_app/
├── backend/              # Backend Express API
│   ├── src/
│   │   ├── config/      # Database config
│   │   ├── middleware/  # Auth, admin middleware
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Email, push services
│   │   └── server.js    # Entry point
│   ├── scripts/         # Utility scripts
│   └── package.json
├── frontend/            # Frontend React app
│   ├── public/         # Static assets
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── context/    # React context
│   │   ├── pages/      # Page components
│   │   ├── utils/      # Helper functions
│   │   └── App.jsx     # Main component
│   └── package.json
├── docs/               # Documentation
├── .env.example        # Environment template
├── docker-compose.yml  # Docker setup
├── Dockerfile.prod     # Production Docker image
└── package.json        # Root workspace
```

### Tech Stack

**Frontend:**
- React 18
- Vite (build tool)
- React Router 6
- Recharts (data visualization)
- Axios (HTTP client)
- date-fns (date utilities)
- Lucide React (icons)

**Backend:**
- Node.js 18+
- Express 4
- MongoDB 6+
- Mongoose (ODM)
- JWT (authentication)
- bcryptjs (password hashing)
- Resend (email service)
- web-push (push notifications)
- node-cron (scheduled tasks)

**DevOps:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- GitHub Actions (CI/CD)

## Available Scripts

### Root Scripts

```bash
# Start both frontend and backend
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build for production
npm run build

# Run tests (all workspaces)
npm run test

# Docker commands
npm run docker:build
npm run docker:up
npm run docker:down
```

### Backend Scripts

```bash
cd backend

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate invitation code
node scripts/generateInvite.js

# Promote user to admin
node scripts/promoteAdmin.js username

# Generate VAPID keys
node scripts/generateVapidKeys.js
```

### Frontend Scripts

```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Database Schema

### User Model

```javascript
{
  username: String (unique, min: 3)
  email: String (unique)
  password: String (hashed with bcrypt)
  emailVerified: Boolean (default: false)
  emailNotifications: Boolean (default: true)
  pushNotificationsEnabled: Boolean (default: false)
  paymentReminderDays: Number (1, 3, or 7, default: 3)
  language: String ('en' or 'fr', default: 'en')
  currency: String ('EUR' or 'USD', default: 'EUR')
  theme: String ('dark', 'light', 'dracula', 'nord', 'solarized')
  role: String ('user' or 'admin', default: 'user')
  monthlyRevenue: Number (default: 0)
  annualRevenue: Number (default: 0)
  calendarToken: String (unique)
  isDeleted: Boolean (default: false)
  timestamps: true
}
```

### Subscription Model

```javascript
{
  user: ObjectId (ref: User)
  name: String (required)
  amount: Number (required, min: 0)
  billingCycle: String ('monthly' or 'annual')
  category: String
  startDate: Date
  nextBillingDate: Date (required)
  isActive: Boolean (default: true)
  isTrial: Boolean (default: false)
  trialEndDate: Date
  isShared: Boolean (default: false)
  sharedBy: Number (people sharing)
  myRealCost: Number (calculated)
  notes: String
  iconFilename: String
  notificationSent: Boolean (default: false)
  timestamps: true
}
```

### Invitation Model

```javascript
{
  code: String (unique, uppercase)
  createdBy: ObjectId (ref: User)
  isUsed: Boolean (default: false)
  usedBy: ObjectId (ref: User)
  usedAt: Date
  expiresAt: Date
  note: String
  timestamps: true
}
```

### PushSubscription Model

```javascript
{
  user: ObjectId (ref: User)
  endpoint: String (required)
  keys: {
    p256dh: String
    auth: String
  }
  userAgent: String
  isActive: Boolean (default: true)
  timestamps: true
}
```

## Development Tips

### Debug Backend

```javascript
// Add console.log for debugging
console.log('User:', req.user);

// Use node debugger
node --inspect backend/src/server.js

// VS Code debug configuration
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/backend/src/server.js"
}
```

### Debug Frontend

```javascript
// Use React DevTools browser extension
// Add console.log
console.log('State:', state);

// Use debugger
debugger;
```

### MongoDB Operations

```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/subly"

# View users
db.users.find().pretty()

# View subscriptions
db.subscriptions.find().pretty()

# Clear test data
db.users.deleteMany({})
db.subscriptions.deleteMany({})
```

### Testing Email Locally

Use [Mailtrap](https://mailtrap.io) or [MailHog](https://github.com/mailhog/MailHog) for testing emails in development.

### API Testing

Use Postman, Insomnia, or curl:

```bash
# Login
curl -X POST http://localhost:5071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Get subscriptions (with JWT token)
curl http://localhost:5071/api/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Environment-Specific Code

```javascript
// Frontend (Vite)
if (import.meta.env.DEV) {
  console.log('Development mode');
}

// Backend
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode');
}
```

## Testing

### Manual Testing Checklist

- [ ] Registration with invitation code
- [ ] Email verification flow
- [ ] Login/logout
- [ ] Create/edit/delete subscriptions
- [ ] Monthly/annual billing cycles
- [ ] Shared subscriptions calculation
- [ ] Trial subscriptions
- [ ] Calendar export (.ics)
- [ ] Email notifications
- [ ] Push notifications
- [ ] Theme switching
- [ ] Language switching (EN/FR)
- [ ] Currency switching (EUR/USD)
- [ ] Admin panel
- [ ] User management
- [ ] Invitation management

### Unit Testing (TODO)

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Building for Production

### Build Both Frontend and Backend

```bash
npm run build
```

### Build Separately

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Docker Production Build

```bash
# Build image
docker build -f Dockerfile.prod -t subly:prod .

# Run container
docker run -d -p 3000:80 -p 5071:5071 \
  -e MONGODB_URI="your-uri" \
  -e JWT_SECRET="your-secret" \
  subly:prod
```

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :5071
lsof -i :5173

# Kill process
kill -9 PID
```

### MongoDB Connection Failed

- Check MongoDB is running
- Verify connection string in `.env`
- Check IP whitelist (Atlas)
- Ensure network connectivity

### npm install Fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend Can't Connect to Backend

- Check backend is running on port 5071
- Verify `VITE_API_URL` in `.env`
- Check CORS configuration in backend
- Check browser console for errors

## Next Steps

- [Installation Guide](./INSTALLATION.md) - Production installation
- [Docker Guide](./DOCKER.md) - Docker deployment
- [Configuration Reference](./CONFIGURATION.md) - Environment variables
- [API Documentation](./API.md) - API endpoints
