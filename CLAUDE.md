# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Subly is a subscription expense tracker web application that helps users monitor their monthly and annual subscriptions. The application features a dark terminal-style theme with green text and includes data visualization through charts.

## Tech Stack

**Backend:**
- Node.js with Express
- MongoDB (cloud-based via MongoDB Atlas)
- JWT authentication with bcrypt password hashing
- RESTful API architecture

**Frontend:**
- React with Vite
- React Router for navigation
- Recharts for data visualization
- Axios for API requests
- date-fns for date formatting
- lucide-react for icons

**Deployment:**
- Docker & Docker Compose
- Nginx reverse proxy

## Development Commands

### Initial Setup
```bash
# Install all dependencies (root, backend, frontend)
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env and add your MongoDB URI and JWT secret
```

### Development
```bash
# Run both frontend and backend in dev mode
npm run dev

# Run backend only (on port 5071)
npm run dev:backend

# Run frontend only (on port 5173)
npm run dev:frontend
```

### Production with Docker
```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down

# Or use npm scripts
npm run docker:build
npm run docker:up
npm run docker:down
```

### Single Container Production Build
```bash
# Build production image with environment variables
docker build -f Dockerfile.prod -t subly:prod .

# Run with environment variables
docker run -e MONGODB_URI="your-uri" -e JWT_SECRET="your-secret" -p 3000:80 -p 5071:5071 subly:prod
```

## Architecture

### Monorepo Structure
- **Root**: Workspace manager with shared scripts
- **backend/**: Express API server
- **frontend/**: React SPA

### Backend Architecture
- **server.js**: Entry point, middleware configuration
- **config/db.js**: MongoDB connection handler
- **models/**: Mongoose schemas (User, Subscription)
- **routes/**: API endpoints (auth, subscriptions)
- **middleware/auth.js**: JWT verification middleware

### Frontend Architecture
- **App.jsx**: Main router and authentication wrapper
- **context/AuthContext.jsx**: Global authentication state
- **pages/**: Login, Register, Dashboard
- **components/**: Reusable UI components

### Key Features
1. **Authentication**: JWT-based with bcrypt password hashing (no plaintext passwords in DB)
2. **Subscription Management**: CRUD operations for subscriptions
3. **Billing Cycles**: Supports both monthly and annual subscriptions
4. **Monthly Cost Calculation**: Annual subscriptions are automatically divided by 12 for monthly view
5. **Statistics**: Real-time calculation of total monthly, yearly, and per-category expenses
6. **Data Visualization**: Pie charts (by category) and bar charts (top subscriptions)

### API Endpoints

**Authentication:**
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user (protected)

**Subscriptions:**
- GET `/api/subscriptions` - Get all user subscriptions (protected)
- GET `/api/subscriptions/stats` - Get spending statistics (protected)
- POST `/api/subscriptions` - Create subscription (protected)
- PUT `/api/subscriptions/:id` - Update subscription (protected)
- DELETE `/api/subscriptions/:id` - Delete subscription (protected)

## Theme & Styling

The application uses a custom dark terminal theme:
- Primary background: `#0a0e14`
- Terminal green: `#00ff41`
- Font: JetBrains Mono (monospace)
- Green glow effects on interactive elements
- Terminal-style prompts (`>`, `root@subly:~$`)
- Cursor animation effect

## Environment Variables

Required for backend (.env file):
```
PORT=5071
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secure-random-string
FRONTEND_URL=http://localhost:5173

# Optional - for email notifications
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

## Database Schema

**User:**
- username (string, unique, min 3 chars)
- password (string, hashed, min 6 chars)
- timestamps

**Subscription:**
- user (ref to User)
- name (string)
- amount (number)
- billingCycle (enum: 'monthly' | 'annual')
- category (string)
- startDate (date)
- nextBillingDate (date)
- isActive (boolean)
- notes (string)
- monthlyCost (virtual field - calculated)
- timestamps

## Important Notes

- Passwords are NEVER stored in plaintext - bcrypt hashing is used
- Annual subscriptions show both total annual cost and monthly equivalent
- All protected routes require JWT token in Authorization header
- Frontend uses local storage for token persistence
- MongoDB connection uses cloud MongoDB Atlas (not local)
- Docker setup separates frontend (nginx) and backend (node) services